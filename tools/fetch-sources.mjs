#!/usr/bin/env node
/**
 * fetch-sources.mjs — download every raw input into data/raw/ and textures/.
 *
 * Nothing in this repository redistributes source data: this script fetches it
 * from the publisher each time, so what you build is provably what they
 * currently publish. Every URL here is documented in docs/SOURCES.md together
 * with its licence.
 *
 * Run:  npm run fetch
 *       npm run fetch -- --cities=cities1000     (a deeper city set)
 *       npm run fetch -- --force                 (re-download everything)
 *
 * Files already present are skipped unless --force is given.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data', 'raw');
const TEX = path.join(ROOT, 'textures');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const CITIES = (args.find((a) => a.startsWith('--cities=')) || '--cities=cities15000').split('=')[1];

/**
 * GeoNames publishes the same gazetteer at several population floors. The
 * default is the 15,000 tier; the others are strictly supersets and the rest of
 * the pipeline handles any of them unchanged. See docs/SOURCES.md for what each
 * one costs in file size and load time.
 */
const CITY_TIERS = {
  cities500: 'places of 500+ people (~200,000 rows)',
  cities1000: 'places of 1,000+ people (~150,000 rows)',
  cities5000: 'places of 5,000+ people (~55,000 rows)',
  cities15000: 'places of 15,000+ people (~34,000 rows)',
};

if (!CITY_TIERS[CITIES]) {
  console.error(`Unknown city tier "${CITIES}". Choose one of: ${Object.keys(CITY_TIERS).join(', ')}`);
  process.exit(1);
}

const log = (...a) => console.log('[fetch]', ...a);

const DOWNLOADS = [
  // --- boundaries: Natural Earth 10m cultural vectors ---------------------
  {
    url: 'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip',
    unzipTo: path.join(RAW, 'ne0'),
    check: path.join(RAW, 'ne0', 'ne_10m_admin_0_countries.shp'),
  },
  {
    url: 'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip',
    unzipTo: path.join(RAW, 'ne1'),
    check: path.join(RAW, 'ne1', 'ne_10m_admin_1_states_provinces.shp'),
  },

  // --- gazetteer: GeoNames ------------------------------------------------
  {
    url: `https://download.geonames.org/export/dump/${CITIES}.zip`,
    unzipTo: path.join(RAW, 'geonames'),
    check: path.join(RAW, 'geonames', `${CITIES}.txt`),
  },
  { url: 'https://download.geonames.org/export/dump/countryInfo.txt', to: path.join(RAW, 'countryInfo.txt') },
  { url: 'https://download.geonames.org/export/dump/admin1CodesASCII.txt', to: path.join(RAW, 'admin1CodesASCII.txt') },
  { url: 'https://download.geonames.org/export/dump/admin2Codes.txt', to: path.join(RAW, 'admin2Codes.txt') },

  // --- imagery: NASA Earth Observatory + GEBCO ----------------------------
  {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73751/world.topo.bathy.200407.3x5400x2700.jpg',
    to: path.join(TEX, 'earth_topo_bathy.jpg'),
  },
  {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg',
    to: path.join(TEX, 'earth_night.jpg'),
  },
  {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png',
    to: path.join(TEX, 'earth_elev_raw.png'),
  },
];

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

async function download(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true });
  fs.mkdirSync(TEX, { recursive: true });

  log(`city tier: ${CITIES} — ${CITY_TIERS[CITIES]}`);

  for (const item of DOWNLOADS) {
    const target = item.to || item.check;
    if (!FORCE && fs.existsSync(target)) {
      log(`skip  ${path.basename(target)} (already present)`);
      continue;
    }

    const name = item.url.split('/').pop();
    process.stdout.write(`[fetch] get   ${name} ... `);
    const buf = await download(item.url);
    console.log(mb(buf.length));

    if (item.unzipTo) {
      fs.mkdirSync(item.unzipTo, { recursive: true });
      const entries = unzipSync(new Uint8Array(buf));
      for (const [entryName, bytes] of Object.entries(entries)) {
        if (!bytes.length) continue; // directory entry
        // Flatten: these archives are flat anyway, and this also prevents a
        // crafted archive from writing outside the target directory.
        const out = path.join(item.unzipTo, path.basename(entryName));
        fs.writeFileSync(out, bytes);
      }
    } else {
      fs.writeFileSync(item.to, buf);
    }
  }

  // Record which tier is on disk, so build-data.mjs knows what to read without
  // being told again and the manifest can report it accurately.
  fs.writeFileSync(path.join(RAW, 'cities-tier.txt'), CITIES);

  log('done. Next: npm run build:textures && npm run build:data');
}

main().catch((err) => { console.error('[fetch]', err.message); process.exit(1); });
