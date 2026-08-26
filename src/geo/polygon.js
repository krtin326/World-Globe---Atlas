/**
 * polygon.js — point-in-polygon tests and a spatial index over GeoJSON features.
 *
 * Shared deliberately between two very different callers:
 *   - tools/build-data.mjs, in Node, to assign 34k cities to their country and
 *     state at build time;
 *   - the browser, to resolve a click on the globe to a country and state.
 *
 * Both must agree exactly. If the build says a city is in Nepal but a click on
 * that city's pixel says India, the app contradicts itself — so there is one
 * implementation and no second opinion.
 *
 * All coordinates are [longitude, latitude] in degrees, matching GeoJSON.
 */

/** Ray-casting test against a single linear ring. */
export function ringContains(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** A GeoJSON polygon is [outerRing, ...holeRings]. */
export function polygonContains(poly, x, y) {
  if (!ringContains(poly[0], x, y)) return false;
  for (let i = 1; i < poly.length; i++) {
    if (ringContains(poly[i], x, y)) return false; // fell in a hole
  }
  return true;
}

export function geometryContains(geom, x, y) {
  if (!geom) return false;
  if (geom.type === 'Polygon') return polygonContains(geom.coordinates, x, y);
  if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) if (polygonContains(poly, x, y)) return true;
  }
  return false;
}

export function forEachRing(geom, fn) {
  if (!geom) return;
  if (geom.type === 'Polygon') geom.coordinates.forEach(fn);
  else if (geom.type === 'MultiPolygon') geom.coordinates.forEach((p) => p.forEach(fn));
}

export function bboxOf(geom) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  forEachRing(geom, (ring) => {
    for (const c of ring) {
      if (c[0] < minX) minX = c[0];
      if (c[0] > maxX) maxX = c[0];
      if (c[1] < minY) minY = c[1];
      if (c[1] > maxY) maxY = c[1];
    }
  });
  return [minX, minY, maxX, maxY];
}

function nearestVertexDist2(geom, x, y) {
  let best = Infinity;
  forEachRing(geom, (ring) => {
    for (const c of ring) {
      const dx = c[0] - x, dy = c[1] - y;
      const d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
  });
  return best;
}

/**
 * Uniform lat/lon grid over the features' bounding boxes.
 *
 * A brute-force lookup would run point-in-polygon against all 4,596 admin-1
 * polygons for every query. Bucketing by bounding box cuts that to a handful of
 * candidates, which is what makes both the 34k-city build join and per-frame
 * hover picking cheap enough to be uninteresting.
 *
 * @param {Array<{geometry: object}>} features
 * @param {number} cellSize  grid cell edge in degrees
 */
export function buildGridIndex(features, cellSize = 2) {
  const cells = new Map();
  const key = (cx, cy) => cx * 100000 + cy;
  const boxes = features.map((f) => bboxOf(f.geometry));

  boxes.forEach((b, i) => {
    if (!Number.isFinite(b[0])) return; // feature with empty geometry
    const x0 = Math.floor(b[0] / cellSize), x1 = Math.floor(b[2] / cellSize);
    const y0 = Math.floor(b[1] / cellSize), y1 = Math.floor(b[3] / cellSize);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const k = key(cx, cy);
        let bucket = cells.get(k);
        if (!bucket) cells.set(k, (bucket = []));
        bucket.push(i);
      }
    }
  });

  /**
   * @param {number} lon
   * @param {number} lat
   * @param {number} snapDeg  If the point lands inside no polygon, fall back to
   *   the nearest polygon within this many degrees. Coastal and small-island
   *   settlements routinely sit a few hundred metres outside a *simplified*
   *   coastline; without this they would be orphaned from their own country.
   *   Pass 0 for a strict containment test.
   * @returns {number} feature index, or -1
   */
  return function lookup(lon, lat, snapDeg = 0) {
    const cx = Math.floor(lon / cellSize), cy = Math.floor(lat / cellSize);
    const bucket = cells.get(key(cx, cy));
    if (bucket) {
      for (const i of bucket) {
        const b = boxes[i];
        if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
        if (geometryContains(features[i].geometry, lon, lat)) return i;
      }
    }
    if (snapDeg <= 0) return -1;

    const reach = Math.max(1, Math.ceil(snapDeg / cellSize));
    const max2 = snapDeg * snapDeg;
    let best = -1, bestD = Infinity;
    const seen = new Set();
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dy = -reach; dy <= reach; dy++) {
        const nb = cells.get(key(cx + dx, cy + dy));
        if (!nb) continue;
        for (const i of nb) {
          if (seen.has(i)) continue;
          seen.add(i);
          const b = boxes[i];
          if (lon < b[0] - snapDeg || lon > b[2] + snapDeg ||
              lat < b[1] - snapDeg || lat > b[3] + snapDeg) continue;
          const d = nearestVertexDist2(features[i].geometry, lon, lat);
          if (d < bestD && d <= max2) { bestD = d; best = i; }
        }
      }
    }
    return best;
  };
}
