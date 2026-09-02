#!/usr/bin/env node
/**
 * build-city.mjs — extract a high-resolution coastline for one city.
 *
 * The globe's boundaries come from Natural Earth at 1:10,000,000, which is the
 * right scale for a planet and hopeless for a city: at that generalisation
 * Mumbai is about five vertices and Elephanta Island does not exist at all.
 *
 * So the city view uses GSHHG instead — the shoreline database maintained by
 * Paul Wessel (University of Hawai'i) and Walter H. F. Smith (NOAA), built from
 * the US Defense Mapping Agency's World Vector Shoreline. Full resolution is
 * roughly 100-200 m, which is enough to render Mumbai's peninsula, its creeks,
 * the harbour islands and the reclaimed western shore as recognisable shapes.
 *
 * Run:  node tools/build-city.mjs mumbai
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data', 'raw');
const GSHHG_ZIP = path.join(RAW, 'gshhg', 'gshhg-shp-2.3.7.zip');
const WORK = path.join(RAW, 'gshhg', 'extracted');
const OUT = path.join(ROOT, 'data', 'cities');

const log = (...a) => console.log('[city]', ...a);

/**
 * Cities the view supports. `bbox` is [west, south, east, north] and decides
 * how much context the 3D map shows around the city proper.
 */
const CITIES = {
  mumbai: {
    name: 'Mumbai',
    // Wide enough to include Salsette, Thane creek, the harbour and Elephanta,
    // which is where a large part of the history actually happened.
    bbox: [72.70, 18.83, 73.12, 19.34],
    centre: [72.8777, 19.0760],

    /**
     * Administrative divisions, straight from the corporation that draws them.
     *
     * This is the Municipal Corporation of Greater Mumbai's own public GIS
     * service — the authoritative publisher of its own ward boundaries, not a
     * third-party copy. The service returns GeoJSON in WGS 84 directly when
     * asked, so there is no reprojection step from its native UTM 43N.
     *
     * Licence: the endpoint states none. Data generated with public funds by
     * Indian government agencies falls under GODL-India by default, which
     * permits commercial and non-commercial reuse with attribution and imposes
     * no share-alike. See docs/SOURCES.md §10 for why this source was chosen
     * over the community-compiled alternative, which is CC BY-SA.
     */
    divisions: {
      label: 'BMC wards',
      nameField: 'NAME',
      url: 'https://services8.arcgis.com/r6MmJtuWAzMawmJ8/ArcGIS/rest/services'
         + '/BMC_Ward/FeatureServer/0/query'
         + '?where=1%3D1&outFields=NAME&outSR=4326&f=geojson',
      /**
       * No simplification. mapshaper reports ~106 self-intersections in this
       * layer, and the count barely moves between 80% and 60% retention — they
       * are pre-existing in the published data (adjacent ward polygons that do
       * not quite share their common border), not something simplifying
       * introduces. Since simplifying cannot fix them and can only add more,
       * the full geometry is kept and repaired with -clean instead. 21.6k
       * vertices is 421 KB, loaded only when the city view is opened, and
       * served gzipped.
       */
      simplify: null,
    },

    /**
     * Points of interest, so the map reveals more as you zoom in rather than
     * just scaling up. Sourced from the GeoNames India gazetteer (CC BY 4.0,
     * already credited for the city layer) — its per-country dump carries
     * neighbourhoods, railway stations, campuses, forts, stadiums and hills
     * inside the Mumbai bbox, not only the big cities the global tier holds.
     *
     * Only a curated set of feature codes is kept: the raw bbox is ~40% hotels
     * and restaurants, which would be noise. Each surviving place is scored for
     * importance so the client can fade it in at the right zoom.
     */
    pois: {
      url: 'https://download.geonames.org/export/dump/IN.zip',
      // feature code -> [base importance 0..1, category]. Anything not listed
      // is dropped. Importance sets the zoom at which a place first appears.
      codes: {
        AIRP: [0.95, 'transport'],
        PPLA: [0.80, 'area'], PPLA2: [0.72, 'area'], PPLA3: [0.55, 'area'],
        PPL: [0.52, 'area'], PPLX: [0.5, 'area'], PPLL: [0.36, 'area'],
        PRT: [0.55, 'transport'], HBR: [0.5, 'transport'],
        DCK: [0.4, 'transport'], RSTN: [0.46, 'transport'],
        UNIV: [0.6, 'civic'], ITTR: [0.45, 'civic'], HSP: [0.45, 'civic'],
        GOVL: [0.5, 'civic'], SCH: [0.3, 'civic'],
        TOWR: [0.66, 'landmark'], FT: [0.6, 'landmark'], MNMT: [0.62, 'landmark'],
        PAL: [0.6, 'landmark'], MUS: [0.66, 'landmark'], HSTS: [0.6, 'landmark'],
        STDM: [0.6, 'landmark'], TMPL: [0.4, 'landmark'],
        CH: [0.35, 'landmark'], MSQ: [0.35, 'landmark'],
        ISL: [0.5, 'nature'], HLL: [0.55, 'nature'], MT: [0.5, 'nature'],
        PK: [0.4, 'nature'], PRK: [0.5, 'nature'], BCH: [0.5, 'nature'],
        LK: [0.46, 'water'], ESTY: [0.5, 'water'], STM: [0.45, 'water'],
      },
    },

    /**
     * The arterial road network and the suburban railway — what turns a coast
     * outline into something that reads as a real city map.
     *
     * Source: OpenStreetMap, via the Overpass API. There is no licence-clean
     * government alternative with street-level geometry, so this is the one
     * OSM-derived layer in the project. OSM data is **ODbL** — share-alike on
     * distributed extracts — which is a stricter footing than everything else
     * here; see docs/SOURCES.md §11. Only the primary classes are pulled, not
     * residential streets, both to keep the map legible and to keep the extract
     * small.
     *
     * Main Overpass is frequently overloaded (504s), so several mirrors are
     * tried in turn. The bbox order in the query is Overpass's own
     * (south, west, north, east).
     */
    roads: {
      endpoints: [
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
        'https://overpass-api.de/api/interpreter',
      ],
      query: `[out:json][timeout:90];
        (
          way["highway"~"^(motorway|trunk|primary|secondary)$"](18.83,72.70,19.34,73.12);
          way["railway"="rail"]["service"!~"."](18.83,72.70,19.34,73.12);
        );
        out geom;`,
      // Index -> style class. The client colours and LOD-gates by this.
      classes: ['motorway', 'trunk', 'primary', 'secondary', 'rail'],
    },
  },

  // The four ported cities (Rome, Cairo, Tokyo, Mexico City) take only the
  // GSHHG coastline — no wards/roads/POIs — so each needs just a name, a bbox
  // and a centre. Rome and Tokyo have real shoreline inside the frame; Cairo
  // and Mexico City are inland, so their clip is a solid land plane (noted in
  // each city file's caveats).
  rome: { name: 'Rome', bbox: [12.20, 41.72, 12.66, 42.02], centre: [12.5113, 41.8919] },
  cairo: { name: 'Cairo', bbox: [31.10, 29.92, 31.42, 30.20], centre: [31.2497, 30.0626] },
  tokyo: { name: 'Tokyo', bbox: [139.55, 35.50, 139.92, 35.82], centre: [139.6917, 35.6895] },
  'mexico-city': { name: 'Mexico City', bbox: [-99.30, 19.28, -98.95, 19.58], centre: [-99.1277, 19.4285] },

  // Ten more world cities (coastline only). Coastal frames (London, Istanbul,
  // Athens, New York) get real GSHHG shoreline; inland ones (Paris, Jerusalem,
  // Beijing, Delhi, Baghdad, Moscow) clip to a solid land plane — noted in each
  // city file's caveats.
  london: { name: 'London', bbox: [-0.35, 51.38, 0.15, 51.62], centre: [-0.1257, 51.5085] },
  paris: { name: 'Paris', bbox: [2.18, 48.75, 2.52, 48.94], centre: [2.3488, 48.8534] },
  istanbul: { name: 'Istanbul', bbox: [28.85, 40.95, 29.15, 41.15], centre: [28.9497, 41.0138] },
  athens: { name: 'Athens', bbox: [23.55, 37.87, 23.85, 38.06], centre: [23.7278, 37.9838] },
  jerusalem: { name: 'Jerusalem', bbox: [35.12, 31.70, 35.31, 31.84], centre: [35.2163, 31.769] },
  beijing: { name: 'Beijing', bbox: [116.25, 39.80, 116.55, 40.02], centre: [116.3972, 39.9075] },
  delhi: { name: 'Delhi', bbox: [77.10, 28.50, 77.36, 28.75], centre: [77.2315, 28.652] },
  baghdad: { name: 'Baghdad', bbox: [44.28, 33.24, 44.52, 33.44], centre: [44.4009, 33.3406] },
  moscow: { name: 'Moscow', bbox: [37.45, 55.66, 37.80, 55.84], centre: [37.6178, 55.752] },
  'new-york-city': { name: 'New York City', bbox: [-74.10, 40.55, -73.85, 40.85], centre: [-74.006, 40.7143] },
};

/** GSHHG levels. L1 is the land/ocean boundary; L2 is lakes. */
const LEVELS = [
  { level: 1, label: 'land' },
  { level: 2, label: 'lake' },
];

function extractLayer(level) {
  const base = `GSHHS_f_L${level}`;
  const shp = path.join(WORK, `${base}.shp`);
  if (fs.existsSync(shp)) { log(`already extracted: ${base}`); return shp; }

  log(`extracting ${base} from the GSHHG archive (this takes a moment)...`);
  fs.mkdirSync(WORK, { recursive: true });

  const zip = unzipSync(new Uint8Array(fs.readFileSync(GSHHG_ZIP)), {
    // Only inflate the four files that make up this one layer. The archive
    // holds 402 entries and well over a gigabyte uncompressed.
    filter: (f) => new RegExp(`GSHHS_shp/f/${base}\\.(shp|shx|dbf|prj)$`).test(f.name),
  });

  for (const [name, bytes] of Object.entries(zip)) {
    fs.writeFileSync(path.join(WORK, path.basename(name)), bytes);
  }
  return shp;
}

function mapshaper(args) {
  const bin = path.join(ROOT, 'node_modules', 'mapshaper', 'bin', 'mapshaper');
  execFileSync(process.execPath, [bin, ...args], { stdio: 'inherit', cwd: ROOT });
}

async function build(key) {
  const city = CITIES[key];
  if (!city) {
    console.error(`Unknown city "${key}". Known: ${Object.keys(CITIES).join(', ')}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const [w, s, e, n] = city.bbox;

  for (const { level, label } of LEVELS) {
    const shp = extractLayer(level);
    const out = path.join(OUT, `${key}-${label}.geojson`);

    log(`clipping ${label} to ${city.name}...`);
    mapshaper([
      shp,
      '-clip', `bbox=${w},${s},${e},${n}`,
      // No simplification. Clipped to one city, full-resolution GSHHG is about
      // 2,200 vertices and 42 KB - small enough that throwing detail away would
      // buy nothing, and this geometry is the centrepiece of the view.
      '-filter-fields',
      '-o', 'precision=0.00001', 'format=geojson', out,
    ]);

    // Not every layer exists everywhere: there are no GSHHG lakes inside the
    // Mumbai bbox, and an empty GeometryCollection would only make the client
    // handle a case that never carries anything.
    const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
    const parts = parsed.geometries || parsed.features || [];
    if (!parts.length) {
      fs.unlinkSync(out);
      log(`  -> no ${label} features here, skipped`);
      continue;
    }

    let vertices = 0;
    for (const g of parts) {
      const geom = g.geometry || g;
      const polys = geom.type === 'Polygon' ? [geom.coordinates]
        : geom.type === 'MultiPolygon' ? geom.coordinates : [];
      for (const poly of polys) for (const ring of poly) vertices += ring.length;
    }

    const size = fs.statSync(out).size;
    log(`  -> ${path.basename(out)} ${(size / 1024).toFixed(0)} KB, ` +
        `${parts.length} parts, ${vertices} vertices`);
  }

  if (city.divisions) await buildDivisions(key, city);
  if (city.pois) await buildPois(key, city);
  if (city.roads) await buildRoads(key, city);

  log('done');
}

/**
 * Build the road + railway layer from OpenStreetMap via Overpass.
 *
 * Output is a compact list of polylines, each tagged with a class index. The
 * geometry is OSM's own — no simplification — because road shape is exactly
 * what makes the map recognisable, and the whole extract is small enough
 * (~66k vertices) that thinning it would save little.
 */
async function buildRoads(key, city) {
  const rawJson = path.join(RAW, `${key}-osm-roads.json`);
  const out = path.join(OUT, `${key}-roads.json`);
  const cfg = city.roads;

  if (!fs.existsSync(rawJson)) {
    let data = null;
    for (const ep of cfg.endpoints) {
      try {
        log(`querying Overpass at ${new URL(ep).host}...`);
        const res = await fetch(ep, { method: 'POST', body: cfg.query });
        if (!res.ok) { log(`  ${res.status}, trying next mirror`); continue; }
        const text = await res.text();
        if (text[0] !== '{') { log('  non-JSON response, trying next mirror'); continue; }
        data = text;
        break;
      } catch (err) {
        log(`  ${err.message}, trying next mirror`);
      }
    }
    if (!data) throw new Error('roads: every Overpass mirror failed');
    fs.writeFileSync(rawJson, data);
  } else {
    log(`already fetched: ${path.basename(rawJson)}`);
  }

  const osm = JSON.parse(fs.readFileSync(rawJson, 'utf8'));
  const classIndex = new Map(cfg.classes.map((c, i) => [c, i]));

  const lines = [];
  let vertices = 0;
  const perClass = new Array(cfg.classes.length).fill(0);

  for (const el of osm.elements || []) {
    if (el.type !== 'way' || !el.geometry) continue;
    const t = el.tags || {};
    const cls = t.railway ? 'rail' : t.highway;
    const ci = classIndex.get(cls);
    if (ci === undefined) continue;

    // Flat [lon,lat,lon,lat,...], rounded to ~1 m.
    const p = [];
    for (const g of el.geometry) {
      p.push(Math.round(g.lon * 1e5) / 1e5, Math.round(g.lat * 1e5) / 1e5);
    }
    if (p.length < 4) continue; // need at least two points
    lines.push({ c: ci, p });
    vertices += el.geometry.length;
    perClass[ci]++;
  }

  fs.writeFileSync(out, JSON.stringify({ classes: cfg.classes, count: lines.length, lines }));

  const summary = cfg.classes.map((c, i) => `${perClass[i]} ${c}`).join(', ');
  log(`  -> ${path.basename(out)} ${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB, ` +
      `${lines.length} ways, ${vertices} vertices (${summary})`);
}

/**
 * Build the points-of-interest layer from the GeoNames per-country dump.
 *
 * Output is compact: name, position, category and a single importance value in
 * [0,1]. The client turns importance into a reveal distance, so all the zoom
 * tuning lives in one place (citymap.js) rather than being baked in here.
 */
async function buildPois(key, city) {
  const [w, s, e, n] = city.bbox;
  const rawZip = path.join(RAW, `${key}-poi-source.zip`);
  const rawTxt = path.join(RAW, `${key}-poi-source.txt`);
  const out = path.join(OUT, `${key}-places.json`);

  if (!fs.existsSync(rawTxt)) {
    log('fetching GeoNames gazetteer for POIs...');
    const res = await fetch(city.pois.url);
    if (!res.ok) throw new Error(`pois: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(rawZip, buf);
    const entries = unzipSync(new Uint8Array(buf));
    const txt = Object.entries(entries).find(([nm]) => /\.txt$/.test(nm) && !/readme/i.test(nm));
    if (!txt) throw new Error('pois: no .txt in archive');
    fs.writeFileSync(rawTxt, Buffer.from(txt[1]));
    log(`  extracted ${(txt[1].length / 1048576).toFixed(0)} MB gazetteer`);
  } else {
    log(`already fetched: ${path.basename(rawTxt)}`);
  }

  const codes = city.pois.codes;
  const rows = fs.readFileSync(rawTxt, 'utf8').split('\n');

  // Keep the best-scored entry per name, so duplicate gazetteer rows for the
  // same place (an area and its administrative point, say) collapse to one dot.
  const byName = new Map();
  for (const line of rows) {
    if (!line) continue;
    const f = line.split('\t');
    const lat = Number(f[4]); const lon = Number(f[5]);
    if (!(lat >= s && lat <= n && lon >= w && lon <= e)) continue;

    const spec = codes[f[7]];
    if (!spec) continue;

    const [base, cat] = spec;
    const pop = Number(f[14]) || 0;
    // A populated place with real population is worth surfacing earlier; the
    // bonus is deliberately small because most Mumbai localities record pop 0.
    const importance = Math.min(1, base + (pop > 0 ? Math.min(0.22, Math.log10(pop) / 34) : 0));

    const name = f[1];
    const prev = byName.get(name);
    if (!prev || importance > prev.imp) {
      byName.set(name, {
        name,
        lat: Math.round(lat * 100000) / 100000,
        lon: Math.round(lon * 100000) / 100000,
        cat,
        imp: Math.round(importance * 1000) / 1000,
      });
    }
  }

  const places = [...byName.values()].sort((a, b) => b.imp - a.imp);
  fs.writeFileSync(out, JSON.stringify({ count: places.length, places }));

  const byCat = places.reduce((a, p) => { a[p.cat] = (a[p.cat] || 0) + 1; return a; }, {});
  log(`  -> ${path.basename(out)} ${(fs.statSync(out).size / 1024).toFixed(0)} KB, ` +
      `${places.length} places (${Object.entries(byCat).map(([k, v]) => `${v} ${k}`).join(', ')})`);
}

/**
 * Fetch and process administrative divisions for a city.
 * Kept separate from the coastline path because it comes over HTTP from a live
 * service rather than out of a downloaded archive.
 */
async function buildDivisions(key, city) {
  const d = city.divisions;
  const raw = path.join(RAW, `${key}-divisions.geojson`);
  const out = path.join(OUT, `${key}-divisions.geojson`);

  if (!fs.existsSync(raw)) {
    log(`fetching ${d.label} from the publisher...`);
    const res = await fetch(d.url);
    if (!res.ok) throw new Error(`divisions: HTTP ${res.status}`);
    const text = await res.text();
    const parsed = JSON.parse(text);
    if (!parsed.features?.length) throw new Error('divisions: empty response');
    fs.writeFileSync(raw, text);
    log(`  got ${parsed.features.length} divisions`);
  } else {
    log(`already fetched: ${path.basename(raw)}`);
  }

  mapshaper([
    raw,
    ...(d.simplify ? ['-simplify', d.simplify, 'keep-shapes', 'weighted'] : []),
    // Repairs the overlaps and slivers described above.
    '-clean', 'gap-fill-area=0',
    '-filter-fields', d.nameField,
    '-o', 'precision=0.00001', 'format=geojson', out,
  ]);

  const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
  const feats = parsed.features || parsed.geometries || [];
  let vertices = 0;
  for (const f of feats) {
    const g = f.geometry || f;
    const polys = g.type === 'Polygon' ? [g.coordinates]
      : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) for (const ring of poly) vertices += ring.length;
  }
  log(`  -> ${path.basename(out)} ${(fs.statSync(out).size / 1024).toFixed(0)} KB, ` +
      `${feats.length} divisions, ${vertices} vertices`);
}

build(process.argv[2] || 'mumbai').catch((err) => { console.error('[city]', err.message); process.exit(1); });
