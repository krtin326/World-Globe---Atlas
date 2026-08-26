#!/usr/bin/env python3
"""
serve.py — a Flask server that makes World Globe reachable from other devices.

`npm run serve` (tools/serve.mjs) is for solo local work. This one binds to
0.0.0.0, so every device on your network — phones, tablets, other laptops —
can open the globe at http://<this-PC's-IP>:8080/ . It serves the same static
files (the app is plain ES modules + fetch, no build step), with the MIME types
those modules need and the same /atlas/ directory-index behaviour.

Run:
    python serve.py                # port 8080, reachable on your LAN
    PORT=5000 python serve.py      # a different port

Then read the URLs it prints. See PUBLIC_ACCESS.md for firewall notes and how
to expose it to the whole internet with a tunnel.

This is a development/serving convenience, not a hardened public web server: it
serves static files read-only, guards against path traversal, and has no login.
The globe app has no accounts; the separate /atlas/ site has its own (client-
side) login gate.
"""

import io
import gzip
import mimetypes
import os
import socket
import sys
from pathlib import Path

try:
    from flask import Flask, Response, abort, request
    from werkzeug.security import safe_join
except ImportError:
    sys.exit(
        "Flask is not installed. Install it with:\n"
        "    pip install flask\n"
        "(or: py -m pip install flask)"
    )

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "8080"))
HOST = os.environ.get("HOST", "0.0.0.0")

# ES modules must arrive as JavaScript, and the coastline files as GeoJSON;
# Python's mimetypes doesn't know .mjs or .geojson out of the box.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("application/geo+json", ".geojson")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("text/markdown", ".md")

# Text-ish types worth gzipping on the way out (the data files are several MB).
COMPRESSIBLE = {
    "text/html", "text/javascript", "text/css", "application/json",
    "application/geo+json", "image/svg+xml", "text/markdown",
}

app = Flask(__name__)


def _resolve(url_path: str) -> Path:
    """Map a request path to a file inside ROOT, or abort. Trailing slash -> that
    folder's index.html; safe_join blocks any ../ escape out of ROOT."""
    if url_path in ("", "/"):
        url_path = "index.html"
    elif url_path.endswith("/"):
        url_path += "index.html"
    joined = safe_join(str(ROOT), url_path)
    if joined is None:
        abort(403)
    path = Path(joined)
    if path.is_dir():                     # a bare folder with no trailing slash
        path = path / "index.html"
    if not path.is_file():
        abort(404)
    return path


@app.route("/", defaults={"url_path": ""})
@app.route("/<path:url_path>")
def serve_file(url_path: str):
    path = _resolve(url_path)
    data = path.read_bytes()
    ctype = mimetypes.guess_type(str(path))[0] or "application/octet-stream"

    headers = {"Cache-Control": "no-cache"}
    base = ctype.split(";")[0]
    accepts = request.headers.get("Accept-Encoding", "")
    if base in COMPRESSIBLE and "gzip" in accepts and len(data) > 1024:
        buf = io.BytesIO()
        with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=6) as gz:
            gz.write(data)
        data = buf.getvalue()
        headers["Content-Encoding"] = "gzip"
        headers["Vary"] = "Accept-Encoding"

    return Response(data, mimetype=ctype, headers=headers)


def _lan_ips():
    """Best-effort list of this machine's LAN addresses to print."""
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))        # no packets sent; just picks the route
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if not ip.startswith("127."):
                ips.add(ip)
    except OSError:
        pass
    return sorted(ips)


def main():
    # Some Windows consoles default to cp1252 and choke on non-ASCII; keep the
    # banner ASCII-only, and nudge stdout to UTF-8 where the runtime allows it.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    bar = "-" * 58
    print(bar)
    print("  World Globe — Flask server")
    print(bar)
    print(f"  Serving: {ROOT}")
    print(f"  On this PC:      http://localhost:{PORT}/")
    for ip in _lan_ips():
        print(f"  On the network:  http://{ip}:{PORT}/   (share this)")
    print(f"  The ATLAS site:  http://localhost:{PORT}/atlas/")
    print(bar)
    print("  Other devices must be on the SAME Wi-Fi/network, and Windows")
    print("  Firewall may prompt the first time — allow Python on private")
    print("  networks. For access from the wider internet, see")
    print("  PUBLIC_ACCESS.md (tunnel with cloudflared / ngrok).")
    print(f"{bar}\n  Ctrl+C to stop.\n")

    # threaded so several devices / the ~9 MB of data files load in parallel.
    app.run(host=HOST, port=PORT, threaded=True, debug=False)


if __name__ == "__main__":
    main()
