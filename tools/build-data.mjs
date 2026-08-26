#!/usr/bin/env node
/**
 * build-data.mjs — World Globe data pipeline
 *
 * Turns the raw public-domain / open-licence source downloads in data/raw/
 * into the compact runtime files the web app loads from data/.
 *
 * Pipeline
 *   1. Natural Earth 10m Admin-0  ->  data/countries.geojson   (simplified, trimmed fields)
 *   2. Natural Earth 10m Admin-1  ->  data/states.geojson      (simplified, trimmed fields)
 *   3. GeoNames cities15000       ->  data/cities.json         (columnar, compact)
 *   4. Every city is assigned to its containing Admin-0 and Admin-1 polygon by
 *      point-in-polygon test, so "show me the cities in this state" is exact
 *      rather than a fuzzy code join.
 *   5. data/manifest.json records counts, source versions and build date.
 *
 * Run:  node tools/build-data.mjs
 * See docs/SOURCES.md for provenance and licensing of every input.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Same module the browser uses for click-picking, so a city's build-time
// country and the country you get by clicking that city can never disagree.
import { buildGridIndex } from '../src/geo/polygon.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data', 'raw');
const OUT = path.join(ROOT, 'data');

const log = (...a) => console.log('[build]', ...a);

/* ------------------------------------------------------------------ *
 * 1 + 2.  Shapefile -> simplified GeoJSON via mapshaper
 * ------------------------------------------------------------------ */

function mapshaper(args) {
  const bin = path.join(ROOT, 'node_modules', 'mapshaper', 'bin', 'mapshaper');
  execFileSync(process.execPath, [bin, ...args], { stdio: 'inherit', cwd: ROOT });
}

// Fields worth keeping. Natural Earth ships ~170 columns per record, the vast
// majority of which are per-country "point of view" variants of the same
// attribute (ADM0_A3_IN, FCLASS_RU, ...) encoding how different governments
// depict disputed territory. We keep the default/neutral view — see
// docs/SOURCES.md, "Disputed boundaries".
const ADMIN0_FIELDS = [
  'NAME', 'NAME_LONG', 'FORMAL_EN', 'ADM0_A3', 'ISO_A2', 'ISO_A3',
  'CONTINENT', 'REGION_UN', 'SUBREGION', 'POP_EST', 'POP_YEAR',
  'GDP_MD', 'GDP_YEAR', 'ECONOMY', 'INCOME_GRP', 'TYPE', 'LABEL_X', 'LABEL_Y',
].join(',');

const ADMIN1_FIELDS = [
  'name', 'name_en', 'adm1_code', 'iso_3166_2', 'code_hasc', 'type_en',
  'admin', 'adm0_a3', 'iso_a2', 'region', 'latitude', 'longitude',
].join(',');

function buildBoundaries() {
  log('simplifying Admin-0 (countries)...');
  mapshaper([
    path.join(RAW, 'ne0', 'ne_10m_admin_0_countries.shp'),
    '-filter-fields', ADMIN0_FIELDS,
    '-simplify', '12%', 'keep-shapes', 'weighted',
    '-clean',
    '-o', 'precision=0.0001', 'format=geojson', path.join(OUT, 'countries.geojson'),
  ]);

  log('simplifying Admin-1 (states / provinces)...');
  mapshaper([
    path.join(RAW, 'ne1', 'ne_10m_admin_1_states_provinces.shp'),
    '-filter-fields', ADMIN1_FIELDS,
    '-simplify', '8%', 'keep-shapes', 'weighted',
    '-clean',
    '-o', 'precision=0.0001', 'format=geojson', path.join(OUT, 'states.geojson'),
  ]);
}

/* ------------------------------------------------------------------ *
 * 3 + 4.  GeoNames -> cities.json, joined to the polygons
 * ------------------------------------------------------------------ */

function readTsv(file) {
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('\t'));
}

function buildCities() {
  log('reading GeoNames tables...');

  // countryInfo.txt: ISO, ISO3, ISO-Numeric, fips, Country, Capital, Area,
  // Population, Continent, tld, CurrencyCode, ... , geonameid, neighbours
  const countryInfo = new Map();
  for (const r of readTsv(path.join(RAW, 'countryInfo.txt'))) {
    if (r.length < 9) continue;
    countryInfo.set(r[0], {
      iso2: r[0], iso3: r[1], name: r[4], capital: r[5],
      areaKm2: Number(r[6]) || 0, population: Number(r[7]) || 0,
      continent: r[8], currency: r[10] || '', languages: r[15] || '',
    });
  }

  // admin1CodesASCII.txt: "US.CA \t California \t California \t 5332921"
  const admin1Names = new Map();
  for (const r of readTsv(path.join(RAW, 'admin1CodesASCII.txt'))) {
    if (r.length < 2) continue;
    admin1Names.set(r[0], r[1]);
  }

  // admin2Codes.txt: "US.CA.075 \t San Francisco County \t ... \t 5391997"
  const admin2Names = new Map();
  for (const r of readTsv(path.join(RAW, 'admin2Codes.txt'))) {
    if (r.length < 2) continue;
    admin2Names.set(r[0], r[1]);
  }

  log('loading polygons for the spatial join...');
  const countries = JSON.parse(fs.readFileSync(path.join(OUT, 'countries.geojson'), 'utf8')).features;
  const states = JSON.parse(fs.readFileSync(path.join(OUT, 'states.geojson'), 'utf8')).features;
  const findCountry = buildGridIndex(countries, 2);
  const findState = buildGridIndex(states, 1);

  // ISO alpha-2 -> Natural Earth ADM0_A3, used to rescue cities the geometry
  // cannot place (see the fallback below).
  const iso2ToA3 = new Map();
  for (const f of countries) {
    const p = f.properties;
    if (p.ISO_A2 && p.ISO_A2 !== '-99') iso2ToA3.set(p.ISO_A2, p.ADM0_A3);
  }

  // Which GeoNames tier fetch-sources.mjs put on disk. They differ only in the
  // population floor, so everything downstream is identical.
  let tier = 'cities15000';
  try { tier = fs.readFileSync(path.join(RAW, 'cities-tier.txt'), 'utf8').trim() || tier; } catch {}

  log(`parsing ${tier} and assigning each city to a country + state...`);
  const rows = readTsv(path.join(RAW, 'geonames', `${tier}.txt`));

  const cities = [];
  let joinedState = 0, joinedCountry = 0, rescuedCountry = 0;

  for (const r of rows) {
    if (r.length < 19) continue;
    const lat = Number(r[4]);
    const lon = Number(r[5]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const cc = r[8];
    const a1 = r[10];
    const a2 = r[11];

    // ~0.25 deg is about 25 km at the equator: enough to recover a port or
    // island town sitting just off a generalised coastline, tight enough that
    // it can never jump to a genuinely different country.
    const ci = findCountry(lon, lat, 0.25);
    const si = findState(lon, lat, 0.25);
    if (ci >= 0) joinedCountry++;
    if (si >= 0) joinedState++;

    // Roughly twenty small-island settlements — Key West, Tarawa, Adamstown on
    // Pitcairn, the Cocos Islands — sit on landmasses too small to survive
    // simplification, so no polygon contains them at any sane snap distance.
    // For those, GeoNames' own country code is simply better evidence than a
    // geometric test against a coastline we ourselves generalised away.
    const adm0 = ci >= 0 ? countries[ci].properties.ADM0_A3 : (iso2ToA3.get(cc) || '');
    if (ci < 0 && adm0) rescuedCountry++;

    cities.push({
      id: Number(r[0]),
      name: r[1],
      ascii: r[2],
      lat: Math.round(lat * 10000) / 10000,
      lon: Math.round(lon * 10000) / 10000,
      cc,                                   // GeoNames ISO-3166-1 alpha-2
      admin1: a1 ? admin1Names.get(`${cc}.${a1}`) || '' : '',
      admin2: a2 ? admin2Names.get(`${cc}.${a1}.${a2}`) || '' : '',
      pop: Number(r[14]) || 0,
      elev: r[15] !== '' ? Number(r[15]) : (Number(r[16]) || 0),
      tz: r[17],
      fcode: r[7],                          // PPLC = capital, PPLA = admin seat, ...
      // resolved against the rendered polygons, so the map and the list agree
      adm0,
      adm1: si >= 0 ? states[si].properties.adm1_code : '',
    });
  }

  cities.sort((a, b) => b.pop - a.pop);

  // Columnar layout: one array per field instead of 26k objects with repeated
  // key strings. Roughly halves the transferred bytes and parses faster.
  const COLS = ['id', 'name', 'ascii', 'lat', 'lon', 'cc', 'admin1', 'admin2',
                'pop', 'elev', 'tz', 'fcode', 'adm0', 'adm1'];
  const columns = {};
  for (const c of COLS) columns[c] = cities.map((x) => x[c]);

  fs.writeFileSync(path.join(OUT, 'cities.json'),
    JSON.stringify({ format: 'columnar', count: cities.length, columns: COLS, data: columns }));

  fs.writeFileSync(path.join(OUT, 'countryinfo.json'),
    JSON.stringify(Object.fromEntries(countryInfo)));

  // Report the misses as a count, not a percentage: '100.0%' rounded up from
  // 99.96% hides the handful of cities that genuinely failed to join.
  const noCountry = cities.filter((c) => !c.adm0).length;
  const noState = cities.filter((c) => !c.adm1).length;
  log(`cities: ${cities.length}  ` +
      `(${noCountry} without a country, ${noState} without a state; ` +
      `${rescuedCountry} placed by country code rather than geometry)`);

  return {
    cities: cities.length, countries: countries.length, states: states.length,
    countryInfo: countryInfo.size, tier,
  };
}

/* ------------------------------------------------------------------ *
 * 5.  Manifest
 * ------------------------------------------------------------------ */

function writeManifest(counts) {
  const readVersion = (p) => {
    try { return fs.readFileSync(p, 'utf8').trim(); } catch { return 'unknown'; }
  };
  const size = (f) => {
    try { return fs.statSync(path.join(OUT, f)).size; } catch { return 0; }
  };

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    builtAt: new Date().toISOString(),
    counts,
    sources: {
      naturalEarthAdmin0: {
        dataset: 'Natural Earth 10m Cultural — Admin 0 Countries',
        version: readVersion(path.join(RAW, 'ne0', 'ne_10m_admin_0_countries.VERSION.txt')),
        licence: 'Public domain',
      },
      naturalEarthAdmin1: {
        dataset: 'Natural Earth 10m Cultural — Admin 1 States/Provinces',
        version: readVersion(path.join(RAW, 'ne1', 'ne_10m_admin_1_states_provinces.VERSION.txt')),
        licence: 'Public domain',
      },
      geonames: {
        dataset: `GeoNames ${counts.tier} / countryInfo / admin1+admin2 codes`,
        populationFloor: Number(String(counts.tier).replace('cities', '')),
        licence: 'CC BY 4.0',
      },
      nasaTextures: {
        dataset: 'NASA Earth Observatory — Blue Marble Next Generation, Black Marble',
        licence: 'Public domain (NASA media usage guidelines)',
      },
    },
    files: {
      'countries.geojson': size('countries.geojson'),
      'states.geojson': size('states.geojson'),
      'cities.json': size('cities.json'),
      'countryinfo.json': size('countryinfo.json'),
    },
  }, null, 2));
}

/* ------------------------------------------------------------------ */

const only = process.argv[2];
if (only !== '--cities-only') buildBoundaries();
const counts = buildCities();
writeManifest(counts);
log('done ->', OUT);
