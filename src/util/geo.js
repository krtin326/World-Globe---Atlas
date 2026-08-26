/**
 * geo.js — conversions between geographic coordinates and scene space.
 *
 * The globe is a unit sphere at the origin. Latitude/longitude are degrees,
 * WGS 84, exactly as they arrive from Natural Earth and GeoNames.
 *
 * The mapping below is the one that lines up with three.js `SphereGeometry`'s
 * default UV layout, so an equirectangular texture (which is what every NASA
 * map we use is) lands on the sphere without any offset fudging. Changing it
 * means re-deriving `vec3ToLatLon` too — they are exact inverses and the
 * picking code depends on that.
 */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/** Mean Earth radius in kilometres (IUGG). Used for real-world distances. */
export const EARTH_RADIUS_KM = 6371.0088;

/**
 * @param {number} lat  degrees, -90 (south) .. +90 (north)
 * @param {number} lon  degrees, -180 (west) .. +180 (east)
 * @param {number} r    distance from the centre; 1 is the globe surface
 * @param {{x:number,y:number,z:number}} [out]  optional target, to avoid allocating
 */
export function latLonToVec3(lat, lon, r = 1, out = { x: 0, y: 0, z: 0 }) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  const sinPhi = Math.sin(phi);
  out.x = -r * sinPhi * Math.cos(theta);
  out.y = r * Math.cos(phi);
  out.z = r * sinPhi * Math.sin(theta);
  return out;
}

/** Exact inverse of {@link latLonToVec3}. Vector need not be normalised. */
export function vec3ToLatLon(v) {
  const r = Math.hypot(v.x, v.y, v.z) || 1;
  const lat = 90 - Math.acos(clamp(v.y / r, -1, 1)) * RAD;
  let lon = Math.atan2(v.z, -v.x) * RAD - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** Great-circle distance in kilometres (haversine). */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * DEG;
  const dLon = (lon2 - lon1) * DEG;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/* ---------------------------------------------------------------- *
 * Formatting
 * ---------------------------------------------------------------- */

export function formatLatLon(lat, lon) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(3)}°${ns}, ${Math.abs(lon).toFixed(3)}°${ew}`;
}

export function formatPopulation(n) {
  if (!n) return 'unknown';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} million`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} thousand`;
  return String(n);
}

export const formatInt = (n) =>
  Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—';

/**
 * Strip accents and lowercase, so a search for "sao paulo" finds "São Paulo"
 * and "zurich" finds "Zürich".
 */
export function normalizeName(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** GeoNames feature codes that appear in the cities dataset. */
export const FEATURE_CODES = {
  PPLC: 'National capital',
  PPLA: 'Regional capital',
  PPLA2: 'Second-order administrative seat',
  PPLA3: 'Third-order administrative seat',
  PPLA4: 'Fourth-order administrative seat',
  PPLA5: 'Fifth-order administrative seat',
  PPL: 'Populated place',
  PPLG: 'Seat of government',
  PPLS: 'Populated places',
  PPLX: 'Section of populated place',
  PPLL: 'Populated locality',
  PPLR: 'Religious populated place',
  PPLF: 'Farm village',
  PPLCH: 'Historical capital',
  STLMT: 'Israeli settlement',
};
