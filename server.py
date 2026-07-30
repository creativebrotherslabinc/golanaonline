#!/usr/bin/env python3
"""Simple SPA-aware static file server.
Serves real files normally; falls back to index.html for any path
that doesn't match a file on disk (so React Router handles routing).
Sends no-cache headers so browsers always fetch the latest files.
"""
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

class SPAHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        # Strip query string for file lookup
        path = self.path.split("?")[0].split("#")[0]
        # Map URL path to filesystem path
        fs_path = self.translate_path(path)
        # If the file exists on disk, serve it normally
        if os.path.exists(fs_path) and not os.path.isdir(fs_path):
            return super().do_GET()
        # If it's a directory with an index.html, serve that
        if os.path.isdir(fs_path) and os.path.exists(os.path.join(fs_path, "index.html")):
            return super().do_GET()
        # Otherwise fall back to root index.html (SPA routing)
        self.path = "/index.html"
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass  # Suppress access logs for cleaner output

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    server = HTTPServer(("0.0.0.0", port), SPAHandler)
    print(f"Serving on port {port}")
    server.serve_forever()
