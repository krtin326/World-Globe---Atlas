/**
 * tessellate.js — turn GeoJSON polygons into geometry that sits on a sphere.
 *
 * Two problems have to be solved before a country outline can become a filled
 * patch on a globe.
 *
 * 1. Triangulation. earcut handles this, but it works in the flat lon/lat
 *    plane, so a triangle spanning a large area is a *chord* through the
 *    planet once projected. Russia would sink through the mantle. Fixed by
 *    subdividing any triangle whose edges are longer than a few degrees before
 *    projecting, so every triangle hugs the surface.
 *
 * 2. The antimeridian. Countries that straddle 180 deg (Russia, Fiji, New
 *    Zealand's outlying islands) have vertices at both +179 and -179. Treated
 *    naively those are 358 degrees apart and the triangulation smears right
 *    across the map. Fixed by "unwrapping" such rings into a continuous
 *    coordinate run before triangulating; the projection uses sin/cos, which
 *    are periodic, so a longitude of 190 lands in exactly the right place
 *    without ever being wrapped back.
 */

import earcut from '../../vendor/earcut.js';
import { latLonToVec3 } from '../util/geo.js';

/** Longitude span above which a ring is assumed to cross the antimeridian. */
const WRAP_THRESHOLD = 180;

/**
 * Shift negative longitudes by +360 so a ring that crosses the antimeridian
 * becomes a continuous run (e.g. 179, -179 becomes 179, 181).
 * Returns a new ring, or the original if no unwrapping is needed.
 */
function unwrapRing(ring) {
  let min = Infinity, max = -Infinity;
  for (const c of ring) {
    if (c[0] < min) min = c[0];
    if (c[0] > max) max = c[0];
  }
  if (max - min <= WRAP_THRESHOLD) return ring;
  return ring.map((c) => (c[0] < 0 ? [c[0] + 360, c[1]] : c));
}

/**
 * Triangulate one GeoJSON polygon ([outer, ...holes]) and project it onto the
 * sphere, subdividing as needed so the surface stays curved.
 *
 * @param {number[][][]} polygon
 * @param {number} radius
 * @param {number} maxEdgeDeg  longest tolerated triangle edge, in degrees
 * @param {number[]} outPositions  appended to, xyz triples
 */
function tessellatePolygon(polygon, radius, maxEdgeDeg, outPositions) {
  // Unwrap consistently across every ring, or the holes will not line up
  // with the outer ring they belong to.
  let needsUnwrap = false;
  for (const ring of polygon) {
    let min = Infinity, max = -Infinity;
    for (const c of ring) {
      if (c[0] < min) min = c[0];
      if (c[0] > max) max = c[0];
    }
    if (max - min > WRAP_THRESHOLD) { needsUnwrap = true; break; }
  }
  const rings = needsUnwrap ? polygon.map(unwrapRing) : polygon;

  // Flatten into earcut's expected form: a flat coordinate array plus the
  // index at which each hole starts.
  const coords = [];
  const holes = [];
  rings.forEach((ring, i) => {
    if (i > 0) holes.push(coords.length / 2);
    for (const c of ring) coords.push(c[0], c[1]);
  });

  const indices = earcut(coords, holes, 2);
  const max2 = maxEdgeDeg * maxEdgeDeg;

  // Explicit stack rather than recursion: a very large polygon can otherwise
  // blow the call stack.
  const stack = [];
  for (let i = 0; i < indices.length; i += 3) {
    stack.push([
      coords[indices[i] * 2], coords[indices[i] * 2 + 1],
      coords[indices[i + 1] * 2], coords[indices[i + 1] * 2 + 1],
      coords[indices[i + 2] * 2], coords[indices[i + 2] * 2 + 1],
    ]);
  }

  const v = { x: 0, y: 0, z: 0 };
  const push = (lon, lat) => {
    latLonToVec3(lat, lon, radius, v);
    outPositions.push(v.x, v.y, v.z);
  };

  let guard = 0;
  while (stack.length) {
    // A malformed ring could in principle subdivide forever; bail out loudly
    // rather than hanging the tab.
    if (++guard > 2_000_000) {
      console.warn('[tessellate] subdivision limit hit, output may be coarse');
      break;
    }

    const t = stack.pop();
    const [ax, ay, bx, by, cx, cy] = t;

    const ab = (ax - bx) ** 2 + (ay - by) ** 2;
    const bc = (bx - cx) ** 2 + (by - cy) ** 2;
    const ca = (cx - ax) ** 2 + (cy - ay) ** 2;
    const longest = Math.max(ab, bc, ca);

    if (longest <= max2) {
      push(ax, ay); push(bx, by); push(cx, cy);
      continue;
    }

    // Split the longest edge at its midpoint into two triangles.
    if (longest === ab) {
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      stack.push([ax, ay, mx, my, cx, cy], [mx, my, bx, by, cx, cy]);
    } else if (longest === bc) {
      const mx = (bx + cx) / 2, my = (by + cy) / 2;
      stack.push([ax, ay, bx, by, mx, my], [ax, ay, mx, my, cx, cy]);
    } else {
      const mx = (cx + ax) / 2, my = (cy + ay) / 2;
      stack.push([ax, ay, bx, by, mx, my], [mx, my, bx, by, cx, cy]);
    }
  }
}

/**
 * Build a filled surface patch for one GeoJSON feature.
 * @returns {Float32Array} xyz triples, ready for a BufferAttribute
 */
export function tessellateFeature(geometry, radius = 1.0015, maxEdgeDeg = 2.5) {
  const positions = [];
  if (!geometry) return new Float32Array(0);

  if (geometry.type === 'Polygon') {
    tessellatePolygon(geometry.coordinates, radius, maxEdgeDeg, positions);
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      tessellatePolygon(poly, radius, maxEdgeDeg, positions);
    }
  }
  return new Float32Array(positions);
}

/**
 * Build the outline of one GeoJSON feature as line segment pairs.
 *
 * No unwrapping here, and none needed: each vertex is projected on its own,
 * and 179 deg and -179 deg genuinely are adjacent points on the sphere, so the
 * segment between them comes out the right length automatically.
 *
 * @param {object} geometry
 * @param {number} radius
 * @param {number[]} [out]  appended to, so many features can share one buffer
 */
export function outlineFeature(geometry, radius = 1.0015, out = []) {
  const v = { x: 0, y: 0, z: 0 };

  const addRing = (ring) => {
    if (ring.length < 2) return;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      latLonToVec3(a[1], a[0], radius, v);
      out.push(v.x, v.y, v.z);
      latLonToVec3(b[1], b[0], radius, v);
      out.push(v.x, v.y, v.z);
    }
  };

  if (!geometry) return out;
  if (geometry.type === 'Polygon') geometry.coordinates.forEach(addRing);
  else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly) => poly.forEach(addRing));
  }
  return out;
}

/**
 * Outline as a list of separate polylines, for thick-line rendering where each
 * ring has to be drawn as its own continuous strip.
 * @returns {number[][]} array of flat xyz arrays
 */
export function outlineStrips(geometry, radius = 1.0015) {
  const strips = [];
  const v = { x: 0, y: 0, z: 0 };

  const addRing = (ring) => {
    if (ring.length < 2) return;
    const flat = [];
    for (const c of ring) {
      latLonToVec3(c[1], c[0], radius, v);
      flat.push(v.x, v.y, v.z);
    }
    // Close the loop.
    latLonToVec3(ring[0][1], ring[0][0], radius, v);
    flat.push(v.x, v.y, v.z);
    strips.push(flat);
  };

  if (!geometry) return strips;
  if (geometry.type === 'Polygon') geometry.coordinates.forEach(addRing);
  else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly) => poly.forEach(addRing));
  }
  return strips;
}
