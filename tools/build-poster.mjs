#!/usr/bin/env node
/**
 * build-poster.mjs — render a PNG advertising poster for World Globe / ATLAS.
 *
 * Composes a self-contained SVG (starfield, wireframe globe, glowing city dots,
 * wordmark and marketing copy) and rasterises it with sharp (already a project
 * dependency) at 2x for a crisp print-ready PNG. No network, no fonts beyond the
 * system sans-serif.
 *
 * Run:  node tools/build-poster.mjs   ->   poster.png
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1600, H = 2000;
const CX = 800, CY = 890, R = 380;         // globe centre + radius

/* Deterministic RNG so the poster is reproducible. */
let seed = 20260826;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const FONT = "Segoe UI, Arial, Helvetica, sans-serif";
const era = { magenta: '#ff2d78', gold: '#ffc75a', violet: '#a56bff', cyan: '#00e5ff', green: '#3dfa8a' };

const parts = [];
const push = (s) => parts.push(s);

/* ---- defs: gradients ---- */
push(`<defs>
  <radialGradient id="sky" cx="50%" cy="38%" r="75%">
    <stop offset="0" stop-color="#0a1630"/>
    <stop offset="55%" stop-color="#050b1c"/>
    <stop offset="100%" stop-color="#01030a"/>
  </radialGradient>
  <radialGradient id="sphere" cx="38%" cy="34%" r="72%">
    <stop offset="0" stop-color="#12315a"/>
    <stop offset="45%" stop-color="#0a1c3a"/>
    <stop offset="100%" stop-color="#050d1f"/>
  </radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#00e5ff" stop-opacity="0.34"/>
    <stop offset="55%" stop-color="#00e5ff" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7fe9ff"/>
    <stop offset="0.5" stop-color="#00e5ff"/>
    <stop offset="1" stop-color="#ff2d78"/>
  </linearGradient>
  <linearGradient id="word" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="1" stop-color="#cfe6ff"/>
  </linearGradient>
  <clipPath id="globeClip"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
</defs>`);

/* ---- background ---- */
push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);

/* ---- starfield ---- */
for (let i = 0; i < 220; i++) {
  const x = rnd() * W, y = rnd() * H;
  // keep stars off the globe face for contrast
  if (Math.hypot(x - CX, y - CY) < R + 12) continue;
  const rr = rnd() * 1.7 + 0.3;
  const op = (0.25 + rnd() * 0.7).toFixed(2);
  const col = rnd() > 0.88 ? '#ffd9a0' : (rnd() > 0.85 ? '#a9d8ff' : '#ffffff');
  push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}" fill="${col}" opacity="${op}"/>`);
}

/* ---- globe glow ---- */
push(`<circle cx="${CX}" cy="${CY}" r="${R * 1.32}" fill="url(#halo)"/>`);

/* ---- globe body ---- */
push(`<g clip-path="url(#globeClip)">`);
push(`<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#sphere)"/>`);

/* meridians (longitude ovals) */
for (const f of [0.28, 0.55, 0.8, 1]) {
  push(`<ellipse cx="${CX}" cy="${CY}" rx="${(R * f).toFixed(1)}" ry="${R}" fill="none" stroke="#4fd6ff" stroke-opacity="${(0.10 + 0.10 * (1 - f)).toFixed(2)}" stroke-width="1.4"/>`);
}
/* parallels (latitude rings, flattened by perspective) */
for (const o of [-0.7, -0.4, 0, 0.4, 0.7]) {
  const rx = R * Math.sqrt(Math.max(0, 1 - o * o));
  push(`<ellipse cx="${CX}" cy="${(CY + o * R).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${(rx * 0.16).toFixed(1)}" fill="none" stroke="#4fd6ff" stroke-opacity="0.14" stroke-width="1.4"/>`);
}

/* city dots scattered on the face, biased toward centre for a spherical look */
const dots = [];
const palette = Object.values(era);
for (let i = 0; i < 130; i++) {
  const a = rnd() * Math.PI * 2;
  const rr = R * Math.sqrt(rnd()) * 0.96;
  const x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr * 0.98;
  const c = palette[(rnd() * palette.length) | 0];
  const big = rnd() > 0.8;
  dots.push({ x, y, c, big });
  if (big) push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${c}" opacity="0.18"/>`);
  push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${big ? 2.8 : 1.7}" fill="${c}" opacity="${big ? 0.95 : 0.7}"/>`);
}
/* a few network arcs between dots */
for (let i = 0; i < 9; i++) {
  const a = dots[(rnd() * dots.length) | 0], b = dots[(rnd() * dots.length) | 0];
  if (!a || !b || a === b) continue;
  const mx = (a.x + b.x) / 2 + (rnd() - 0.5) * 80;
  const my = (a.y + b.y) / 2 - 40 - rnd() * 60;
  push(`<path d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}" fill="none" stroke="#7fe9ff" stroke-opacity="0.16" stroke-width="1.2"/>`);
}
/* terminator shading — a soft dark crescent on the night side */
push(`<ellipse cx="${CX + R * 0.5}" cy="${CY + R * 0.2}" rx="${R}" ry="${R}" fill="#01030a" opacity="0.30"/>`);
push(`</g>`);

/* bright rim */
push(`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="url(#rim)" stroke-width="3"/>`);
push(`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#00e5ff" stroke-opacity="0.25" stroke-width="10"/>`);

/* ---- helper for centred text ---- */
const text = (x, y, s, { size = 40, weight = 400, fill = '#eaf3ff', ls = 0, anchor = 'middle', op = 1, family = FONT } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" letter-spacing="${ls}" opacity="${op}">${s}</text>`;

/* ---- kicker + wordmark (top) ---- */
push(text(CX, 150, 'INTERACTIVE&#160;&#160;3D&#160;&#160;ATLAS&#160;OF&#160;EARTH', { size: 30, weight: 600, fill: '#7fd4ff', ls: 10 }));
push(text(CX, 300, 'WORLD GLOBE', { size: 138, weight: 800, fill: 'url(#word)', ls: 2 }));
push(text(CX, 372, '&#183;&#160;&#160;A T L A S&#160;&#160;&#183;', { size: 46, weight: 700, fill: era.gold, ls: 6 }));

/* ---- tagline + verbs (below globe) ---- */
push(text(CX, 1372, 'Spin the Earth. Then walk its cities through time.', { size: 47, weight: 500, fill: '#eaf3ff' }));
push(text(CX, 1440, 'THINK&#160;&#160;&#183;&#160;&#160;EXPLORE&#160;&#160;&#183;&#160;&#160;LEARN&#160;&#160;&#183;&#160;&#160;DISCOVER', { size: 27, weight: 700, fill: era.gold, ls: 8 }));

/* ---- featured city chips ---- */
const cities = [
  ['Mumbai', era.magenta], ['Rome', era.gold], ['Cairo', era.violet],
  ['Tokyo', era.cyan], ['Mexico City', era.green],
];
const chipY = 1520, chipH = 60;
const chipW = (n) => 62 + n.length * 20;
const gap = 26;
let totalW = cities.reduce((a, [n]) => a + chipW(n), 0) + gap * (cities.length - 1);
let cx0 = CX - totalW / 2;
for (const [name, col] of cities) {
  const w = chipW(name);
  push(`<rect x="${cx0.toFixed(1)}" y="${chipY}" rx="${chipH / 2}" width="${w.toFixed(1)}" height="${chipH}" fill="#0b1730" stroke="${col}" stroke-opacity="0.55" stroke-width="1.5"/>`);
  push(`<circle cx="${(cx0 + 30).toFixed(1)}" cy="${chipY + chipH / 2}" r="8" fill="${col}"/>`);
  push(`<circle cx="${(cx0 + 30).toFixed(1)}" cy="${chipY + chipH / 2}" r="14" fill="${col}" opacity="0.18"/>`);
  push(text(cx0 + 48, chipY + chipH / 2 + 9, name, { size: 27, weight: 600, fill: '#eaf3ff', anchor: 'start' }));
  cx0 += w + gap;
}
push(text(CX, chipY - 26, 'FIVE CITIES, EXPLORED IN DEPTH — TIMELINE, DYNASTIES &amp; LIVING MAP', { size: 22, weight: 600, fill: '#8aa6c8', ls: 4 }));

/* ---- stats row ---- */
const stats = [['258', 'Countries'], ['4,596', 'States &amp; regions'], ['34,027', 'Cities'], ['5', 'Deep city histories']];
const statY = 1700;
const colW = W / stats.length;
stats.forEach(([n, l], i) => {
  const x = colW * i + colW / 2;
  push(text(x, statY, n, { size: 62, weight: 800, fill: '#ffffff' }));
  push(text(x, statY + 42, l, { size: 24, weight: 500, fill: '#8aa6c8', ls: 1 }));
  if (i) push(`<line x1="${(colW * i).toFixed(1)}" y1="${statY - 44}" x2="${(colW * i).toFixed(1)}" y2="${statY + 26}" stroke="#22345a" stroke-width="1.5"/>`);
});

/* ---- CTA pill + URL ---- */
const pillW = 520, pillH = 84, pillX = CX - pillW / 2, pillY = 1810;
push(`<rect x="${pillX}" y="${pillY}" rx="${pillH / 2}" width="${pillW}" height="${pillH}" fill="${era.gold}"/>`);
push(`<rect x="${pillX}" y="${pillY}" rx="${pillH / 2}" width="${pillW}" height="${pillH}" fill="none" stroke="#fff3d6" stroke-opacity="0.5" stroke-width="1.5"/>`);
push(text(CX, pillY + pillH / 2 + 12, 'Explore the globe  →', { size: 36, weight: 800, fill: '#0a1220' }));
push(text(CX, pillY + pillH + 54, 'krtin326.github.io/World-Globe---Atlas', { size: 26, weight: 600, fill: '#7fd4ff', ls: 1, family: "Consolas, 'Courier New', monospace" }));

/* ---- footer credit ---- */
push(text(CX, 1980, 'Built with NASA imagery &#183; GeoNames &#183; Natural Earth &#183; GSHHG &#183; OpenStreetMap', { size: 20, weight: 500, fill: '#5f7a90', ls: 1 }));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;

const out = path.join(ROOT, 'poster.png');
await sharp(Buffer.from(svg), { density: 144 }).png().toFile(out);
const m = await sharp(out).metadata();
console.log(`wrote poster.png — ${m.width}x${m.height}`);
