#!/usr/bin/env python3
"""SPA-aware server with API proxies and Resume Genie backend.

API routes handled:
  POST /api/overpass                     → https://overpass-api.de/api/interpreter
  GET  /api/geocode/reverse              → Nominatim reverse geocoding
  GET  /api/geocode/search               → Nominatim forward geocoding
  GET  /resume-genie/api/healthz         → Resume Genie health check
  POST /resume-genie/api/generate        → AI resume generation
  POST /resume-genie/api/generate-multi  → Multi-target resume generation
"""

import io
import json
import os
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse

# Add resume-genie/ to sys.path so we can import its backend package
sys.path.insert(0, str(Path(__file__).parent / "resume-genie"))
from backend.ai_engine import generate_resume_content
from backend.pdf_generator import generate_pdf
from backend.docx_generator import generate_docx

NOMINATIM = "https://nominatim.openstreetmap.org"
OVERPASS  = "https://overpass-api.de/api/interpreter"
UA        = "FindingMyFood/1.0 (golana.online)"
ROOT      = Path(__file__).parent

app = FastAPI(title="Go LANA")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── No-cache middleware ───────────────────────────────────────────────

@app.middleware("http")
async def no_cache(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# ── Existing proxy routes ─────────────────────────────────────────────

@app.post("/api/overpass")
async def proxy_overpass(request: Request):
    body = await request.body()
    try:
        payload = json.loads(body)
        query   = payload.get("query", "")
        data    = query.encode("utf-8")
        req = urllib.request.Request(
            OVERPASS,
            data=data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": UA,
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=35) as r:
            result = r.read()
        return Response(content=result, media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/geocode/reverse")
async def proxy_geocode_reverse(request: Request):
    qs  = urllib.parse.parse_qs(urllib.parse.urlparse(str(request.url)).query)
    lat = qs.get("lat", [""])[0]
    lon = qs.get("lon", [""])[0]
    try:
        url = (
            f"{NOMINATIM}/reverse?format=json"
            f"&lat={urllib.parse.quote(lat)}&lon={urllib.parse.quote(lon)}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=10) as r:
            result = r.read()
        return Response(content=result, media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/geocode/search")
async def proxy_geocode_search(request: Request):
    qs = urllib.parse.parse_qs(urllib.parse.urlparse(str(request.url)).query)
    q  = qs.get("q", [""])[0]
    try:
        url = f"{NOMINATIM}/search?format=json&limit=1&q={urllib.parse.quote(q)}"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=10) as r:
            result = r.read()
        return Response(content=result, media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── Resume Genie API ──────────────────────────────────────────────────

def _check_groq():
    if not os.environ.get("GROQ_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail=(
                "GROQ_API_KEY is not configured. "
                "Add it in the Replit Secrets tab to enable resume generation."
            ),
        )


def _build_file(content: dict, file_type: str):
    if file_type == "pdf":
        return generate_pdf(content), "application/pdf", "pdf"
    mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return generate_docx(content), mime, "docx"


@app.get("/resume-genie/api/healthz")
def rg_health():
    return {"status": "ok", "groq_configured": bool(os.environ.get("GROQ_API_KEY"))}


@app.post("/resume-genie/api/generate")
async def rg_generate(
    career_history:  str = Form(...),
    job_description: str = Form(...),
    file_type:       str = Form(default="pdf"),
):
    _check_groq()
    if not career_history.strip() or not job_description.strip():
        raise HTTPException(status_code=400, detail="Both fields are required.")
    try:
        content = generate_resume_content(career_history, job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")
    try:
        file_bytes, media_type, ext = _build_file(content, file_type)
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename=resume.{ext}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document generation failed: {e}")


@app.post("/resume-genie/api/generate-multi")
async def rg_generate_multi(
    career_history:   str = Form(...),
    job_descriptions: str = Form(...),
    file_type:        str = Form(default="pdf"),
):
    _check_groq()
    if not career_history.strip():
        raise HTTPException(status_code=400, detail="Career history is required.")
    try:
        descriptions = json.loads(job_descriptions)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job_descriptions format.")
    descriptions = [d.strip() for d in descriptions if d.strip()]
    if not descriptions:
        raise HTTPException(status_code=400, detail="At least one job description required.")
    if len(descriptions) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 job descriptions allowed.")

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for idx, job_desc in enumerate(descriptions, start=1):
            try:
                content = generate_resume_content(career_history, job_desc)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"AI failed for target {idx}: {e}")
            file_bytes, _, ext = _build_file(content, file_type)
            zf.writestr(f"Resume_Target_{idx}.{ext}", file_bytes)

    zip_buf.seek(0)
    return StreamingResponse(
        zip_buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=Tailored_Resumes.zip"},
    )


# ── Static file serving with SPA fallback ────────────────────────────

_ROOT_RESOLVED = ROOT.resolve()

# File types that must never be served regardless of where they live.
# Includes Python source, shell scripts, config, lock files, TypeScript source,
# security-sensitive files, and dotfiles (handled separately below).
_BLOCKED_SUFFIXES = frozenset({
    ".py", ".pyc", ".pyo", ".pyd",   # Python
    ".sh", ".bash", ".zsh",           # Shell
    ".toml", ".cfg", ".ini", ".env",  # Config
    ".lock",                          # Lock files
    ".ts", ".tsx", ".mts",            # TypeScript source
    ".key", ".pem", ".cert", ".crt",  # Credentials / TLS
    ".sql",                           # Database scripts
})


def _safe_static_path(relative: str) -> Path | None:
    """Resolve *relative* under ROOT and return it only when ALL conditions hold:

    1. The resolved path stays inside ROOT (no traversal out of ROOT).
    2. No path component is a hidden file/dir (starts with '.').
    3. The file's suffix is not in the server-side / sensitive blocklist.

    Returns None and the caller must serve 404 on failure.
    """
    try:
        candidate = (_ROOT_RESOLVED / relative).resolve()
        # 1. Containment check — raises ValueError if outside ROOT
        candidate.relative_to(_ROOT_RESOLVED)
    except (ValueError, Exception):
        return None

    # 2. Hidden-file/directory check (e.g. .env, .git, .agents)
    try:
        rel_parts = candidate.relative_to(_ROOT_RESOLVED).parts
    except ValueError:
        return None
    if any(part.startswith(".") for part in rel_parts):
        return None

    # 3. Blocked suffix check (server-side code, config, credentials, …)
    if candidate.suffix.lower() in _BLOCKED_SUFFIXES:
        return None

    return candidate


@app.get("/")
async def serve_root():
    return FileResponse(ROOT / "index.html")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    from fastapi.responses import PlainTextResponse

    safe = _safe_static_path(full_path)
    if safe is None:
        # Traversal attempt, blocked suffix, or hidden file — return 404
        return PlainTextResponse("Not found", status_code=404)

    # Exact file match
    if safe.is_file():
        return FileResponse(safe)
    # Directory with index.html (e.g. /food-finder/, /resume-genie/)
    index_path = safe / "index.html"
    if index_path.is_file() and _safe_static_path(
        str((safe / "index.html").relative_to(_ROOT_RESOLVED))
    ):
        return FileResponse(index_path)
    # SPA fallback → main app index
    return FileResponse(ROOT / "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Serving on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
