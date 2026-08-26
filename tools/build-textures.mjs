#!/usr/bin/env node
/**
 * build-textures.mjs — prepare the globe's image maps.
 *
 * The raw NASA/GEBCO downloads are far larger than a browser should decode
 * (the GEBCO elevation grid is 21600x10800 = 233 megapixels, ~930 MB as RGBA).
 * This step resamples them once, offline, into web-sized maps:
 *
 *   earth_topo_bathy.jpg  ->  earth_day_4k.jpg    colour / terrain
 *   earth_night.jpg       ->  earth_night_2k.jpg  city lights for the dark side
 *   earth_elev_raw.png    ->  earth_elev_2k.jpg   greyscale height, for relief shading
 *                             earth_ocean_2k.jpg  ocean mask, for specular highlight
 *
 * Run:  node tools/build-textures.mjs
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = path.join(ROOT, 'textures');
const log = (...a) => console.log('[tex]', ...a);

sharp.cache(false);
sharp.concurrency(2);

const opts = { limitInputPixels: 300_000_000 };

async function main() {
  // --- colour map -------------------------------------------------------
  log('day map -> 4096x2048');
  await sharp(path.join(T, 'earth_topo_bathy.jpg'), opts)
    .resize(4096, 2048, { fit: 'fill', kernel: 'lanczos3' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(T, 'earth_day_4k.jpg'));

  // --- night lights -----------------------------------------------------
  log('night map -> 2048x1024');
  await sharp(path.join(T, 'earth_night.jpg'), opts)
    .resize(2048, 1024, { fit: 'fill', kernel: 'lanczos3' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(T, 'earth_night_2k.jpg'));

  // --- elevation --------------------------------------------------------
  // Downsample first, then work on the small version: the full grid will not
  // fit comfortably in memory as raw pixels.
  log('elevation -> 2048x1024 (this is the slow one)');
  const elev = sharp(path.join(T, 'earth_elev_raw.png'), opts)
    .resize(2048, 1024, { fit: 'fill', kernel: 'lanczos3' })
    .greyscale();

  const { data, info } = await elev.raw().toBuffer({ resolveWithObject: true });
  log(`resampled to ${info.width}x${info.height}, ${info.channels} channel(s)`);

  // This grid is *land* elevation: sea and everything below it is encoded as
  // exactly 0, land occupies 1..255. Two consequences.
  //
  // First, the raw values are useless as a bump map straight out of the box —
  // most land is low-lying, so ~63% of the image is pure black and almost all
  // the rest is crowded into the bottom of the range. A gamma lift spreads the
  // lowlands back out so that hills read at all. The map is only ever used for
  // relief shading, never for measurement, so trading linearity for legibility
  // is the right call here.
  const GAMMA = 0.55;
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(v / 255, GAMMA));

  const relief = Buffer.alloc(info.width * info.height);
  // Second, ocean = 0 means the land/water split needs no threshold guessing.
  const mask = Buffer.alloc(info.width * info.height);

  for (let i = 0, p = 0; i < data.length; i += info.channels, p++) {
    const v = data[i];
    relief[p] = lut[v];
    mask[p] = v === 0 ? 255 : 0; // white = water (shiny), black = land (matte)
  }

  await sharp(relief, { raw: { width: info.width, height: info.height, channels: 1 } })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(path.join(T, 'earth_elev_2k.jpg'));

  await sharp(mask, { raw: { width: info.width, height: info.height, channels: 1 } })
    .blur(1.2) // soften the coastline so the specular edge is not aliased
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(T, 'earth_ocean_2k.jpg'));

  // --- report -----------------------------------------------------------
  for (const f of ['earth_day_4k.jpg', 'earth_night_2k.jpg', 'earth_elev_2k.jpg', 'earth_ocean_2k.jpg']) {
    log(f, (fs.statSync(path.join(T, f)).size / 1024 / 1024).toFixed(2), 'MB');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
