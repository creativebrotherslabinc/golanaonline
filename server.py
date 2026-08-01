#!/usr/bin/env python3
"""SPA-aware static file server with lightweight API proxies for FindingMyFood.

API routes handled here (everything else is served as static files):
  POST /api/overpass          → https://overpass-api.de/api/interpreter
  GET  /api/geocode/reverse   → Nominatim reverse geocoding
  GET  /api/geocode/search    → Nominatim forward geocoding
"""
import json
import os
import urllib.parse
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler

NOMINATIM = 'https://nominatim.openstreetmap.org'
OVERPASS  = 'https://overpass-api.de/api/interpreter'
UA        = 'FindingMyFood/1.0 (golana.online)'


class SPAHandler(SimpleHTTPRequestHandler):

    # ── API routes ────────────────────────────────────────────────────────────

    def do_POST(self):
        if self.path == '/api/overpass':
            self._proxy_overpass()
        else:
            self.send_error(404)

    def do_GET(self):
        p = self.path.split('?')[0]
        if p == '/api/geocode/reverse':
            self._proxy_geocode_reverse()
        elif p == '/api/geocode/search':
            self._proxy_geocode_search()
        else:
            self._serve_static()

    # ── Proxy helpers ─────────────────────────────────────────────────────────

    def _proxy_overpass(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            payload = json.loads(body)
            query   = payload.get('query', '')
            data    = query.encode('utf-8')
            req = urllib.request.Request(
                OVERPASS,
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded',
                         'User-Agent': UA},
                method='POST',
            )
            with urllib.request.urlopen(req, timeout=35) as r:
                result = r.read()
            self._json_response(result)
        except Exception as e:
            self._error_response(502, str(e))

    def _proxy_geocode_reverse(self):
        try:
            qs   = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            lat  = qs.get('lat', [''])[0]
            lon  = qs.get('lon', [''])[0]
            url  = (f'{NOMINATIM}/reverse?format=json'
                    f'&lat={urllib.parse.quote(lat)}&lon={urllib.parse.quote(lon)}')
            req  = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=10) as r:
                result = r.read()
            self._json_response(result)
        except Exception as e:
            self._error_response(502, str(e))

    def _proxy_geocode_search(self):
        try:
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            q  = qs.get('q', [''])[0]
            url = (f'{NOMINATIM}/search?format=json&limit=1'
                   f'&q={urllib.parse.quote(q)}')
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=10) as r:
                result = r.read()
            self._json_response(result)
        except Exception as e:
            self._error_response(502, str(e))

    # ── Response helpers ──────────────────────────────────────────────────────

    def _json_response(self, data: bytes):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def _error_response(self, code: int, msg: str):
        body = json.dumps({'error': msg}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')

    # ── Static file serving ───────────────────────────────────────────────────

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def _serve_static(self):
        path    = self.path.split('?')[0].split('#')[0]
        fs_path = self.translate_path(path)
        if os.path.exists(fs_path) and not os.path.isdir(fs_path):
            return super().do_GET()
        if os.path.isdir(fs_path) and os.path.exists(os.path.join(fs_path, 'index.html')):
            return super().do_GET()
        self.path = '/index.html'
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass  # Suppress access logs for cleaner output


if __name__ == '__main__':
    port   = int(os.environ.get('PORT', 5000))
    server = HTTPServer(('0.0.0.0', port), SPAHandler)
    print(f'Serving on port {port}')
    server.serve_forever()
