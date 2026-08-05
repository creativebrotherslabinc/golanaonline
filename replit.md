# Go Lana – Free Online Tools

A pre-built React SPA for [golana.online](https://golana.online) — a browser-based utility hub with PDF tools, media tools, calculators, everyday utilities, AI mini tools, and developer tools.

## Stack

- React (pre-built, no build step needed)
- Compiled output: `index.html` + `assets/`

## Running the project

```bash
python3 server.py
```

The workflow **Start application** is configured to run this automatically. The app is served at port 5000. `server.py` is a FastAPI + Uvicorn server that handles API routes and falls back to `index.html` for any SPA route, so React Router handles client-side routing correctly.

## Apps

| App | URL | Notes |
|-----|-----|-------|
| FindingMyFood | `/food-finder/` | Standalone food discovery app |
| Resume Genie | `/resume-genie/` | AI resume builder — requires `GROQ_API_KEY` secret |

## Project structure

| Path | Purpose |
|------|---------|
| `index.html` | Main app entry point |
| `assets/` | Compiled JS and CSS bundles |
| `favicon.svg` | Site favicon |
| `404.html` | Custom 404 page |
| `food-finder/` | FindingMyFood standalone app |
| `resume-genie/` | Resume Genie app (frontend + Python backend) |
| `resume-genie/backend/` | FastAPI routes, AI engine, PDF/DOCX generators |
| `lib/` | Source library packages (api-spec, api-zod, db, api-client-react) |
| `artifacts/` | Build artifacts (api-server, mockup-sandbox, tudoin1) |

## Secrets required

| Secret | Used by | Where to get it |
|--------|---------|-----------------|
| `GROQ_API_KEY` | Resume Genie | https://console.groq.com (free) |

## User preferences

_None recorded yet._
