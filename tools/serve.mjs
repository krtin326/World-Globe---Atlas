#!/usr/bin/env node
/**
 * serve.mjs — a static file server for local development.
 *
 * The app is plain ES modules with an import map, so it needs no build step —
 * but it does need to be served over HTTP rather than opened as a file:// URL,
 * because module scripts and fetch() are both blocked on the file protocol.
 *
 * Run:  npm run serve      (then open http://localhost:8080)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

/** Worth compressing; images and archives already are. */
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.geojson', '.svg', '.md']);

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';
  // Directory requests (a trailing slash) serve that folder's index.html,
  // so e.g. /atlas/ resolves to /atlas/index.html.
  else if (urlPath.endsWith('/')) urlPath += 'index.html';

  // Resolve, then confirm the result is still inside ROOT. Without this a
  // request for /../../etc/passwd would escape the served directory.
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== path.join(ROOT, 'index.html')) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // Data and textures are rebuilt rarely but change identity when they do;
      // no-cache means "revalidate", not "do not store", so the 9 MB of data
      // is not refetched on every reload.
      'Cache-Control': 'no-cache',
      'Last-Modified': stat.mtime.toUTCString(),
    };

    if (req.headers['if-modified-since'] &&
        new Date(req.headers['if-modified-since']) >= new Date(stat.mtime.toUTCString())) {
      res.writeHead(304, headers).end();
      return;
    }

    const accepts = req.headers['accept-encoding'] || '';
    const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(accepts);

    if (gzip) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    } else {
      headers['Content-Length'] = stat.size;
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`World Globe → http://localhost:${PORT}`);
  console.log(`serving ${ROOT}`);
});
