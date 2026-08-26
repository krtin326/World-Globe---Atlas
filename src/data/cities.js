/**
 * cities.js — the city table.
 *
 * Backed by the columnar JSON the build step emits: one flat array per field,
 * rather than 34,027 objects each repeating the same fourteen key strings.
 * That form is smaller over the wire, parses faster, and — because the columns
 * are plain arrays in population order — lets the common queries be array
 * scans rather than object churn.
 *
 * Nothing here allocates a per-city object until something actually asks for
 * one via `get(i)`.
 */

import { normalizeName, distanceKm } from '../util/geo.js';

/**
 * Joins a city's two spellings inside the search key. Written as an escape
 * rather than a literal control character so it survives copy-paste and is
 * visible to anyone reading this file.
 */
const SEP = '';

export class CityTable {
  /** @param {{count:number, columns:string[], data:Record<string,Array>}} json */
  constructor(json) {
    this.count = json.count;
    this.col = json.data;

    // Rows arrive sorted by population, descending. A lot of the UI depends on
    // that (the "top N" queries are just prefixes), so make it explicit rather
    // than assumed.
    this.byPopulation = true;

    // Search key: accent-stripped, lowercased. Built once, ~1.5 MB of strings,
    // and it turns every subsequent search into a plain substring scan.
    this._search = new Array(this.count);
    for (let i = 0; i < this.count; i++) {
      const ascii = this.col.ascii[i];
      const name = this.col.name[i];
      // Both spellings are searchable, joined by a separator that cannot
      // occur in a place name, so the join still reads as a word boundary
      // when ranking matches below.
      this._search[i] = ascii === name
        ? normalizeName(name)
        : normalizeName(name) + SEP + normalizeName(ascii);
    }

    this._byCountry = null;
    this._byState = null;
    this._grid = null;
  }

  /** Materialise one row as an object. */
  get(i) {
    const c = this.col;
    return {
      index: i,
      id: c.id[i],
      name: c.name[i],
      ascii: c.ascii[i],
      lat: c.lat[i],
      lon: c.lon[i],
      cc: c.cc[i],
      admin1: c.admin1[i],
      admin2: c.admin2[i],
      pop: c.pop[i],
      elev: c.elev[i],
      tz: c.tz[i],
      fcode: c.fcode[i],
      adm0: c.adm0[i],
      adm1: c.adm1[i],
    };
  }

  /* ------------------------------------------------------------------ *
   * Grouping
   * ------------------------------------------------------------------ */

  /** @returns {Map<string, number[]>} ADM0_A3 -> row indices, population order */
  get byCountry() {
    if (!this._byCountry) {
      this._byCountry = new Map();
      for (let i = 0; i < this.count; i++) {
        const k = this.col.adm0[i];
        if (!k) continue;
        let a = this._byCountry.get(k);
        if (!a) this._byCountry.set(k, (a = []));
        a.push(i);
      }
    }
    return this._byCountry;
  }

  /** @returns {Map<string, number[]>} adm1_code -> row indices, population order */
  get byState() {
    if (!this._byState) {
      this._byState = new Map();
      for (let i = 0; i < this.count; i++) {
        const k = this.col.adm1[i];
        if (!k) continue;
        let a = this._byState.get(k);
        if (!a) this._byState.set(k, (a = []));
        a.push(i);
      }
    }
    return this._byState;
  }

  /* ------------------------------------------------------------------ *
   * Search
   * ------------------------------------------------------------------ */

  /**
   * Substring search over city names, accent-insensitive.
   * Results keep population order, so the city someone most likely meant when
   * they typed "york" comes first.
   *
   * @param {string} query
   * @param {number} limit
   * @param {(i:number)=>boolean} [filter]  optional extra predicate
   * @returns {number[]} row indices
   */
  search(query, limit = 200, filter = null) {
    const q = normalizeName(query.trim());
    if (!q) return [];

    const exact = [];
    const prefix = [];
    const contains = [];

    for (let i = 0; i < this.count; i++) {
      if (filter && !filter(i)) continue;
      const s = this._search[i];
      const at = s.indexOf(q);
      if (at < 0) continue;

      // Rank by where the match lands, so "york" puts York itself above New
      // York above Yorkton: a whole-name match beats one at the start of any
      // word, which beats one buried mid-word. Within each bucket the rows
      // stay in population order, which is the tiebreak people expect.
      if (s === q || s.startsWith(q + SEP)) exact.push(i);
      else if (at === 0 || s[at - 1] === ' ' || s[at - 1] === SEP) prefix.push(i);
      else contains.push(i);
    }

    return [...exact, ...prefix, ...contains].slice(0, limit);
  }

  /* ------------------------------------------------------------------ *
   * Nearest lookup
   * ------------------------------------------------------------------ */

  _buildGrid() {
    // 1-degree buckets. Cheap to build, and a click only ever has to test the
    // cities in a 3x3 neighbourhood.
    const grid = new Map();
    for (let i = 0; i < this.count; i++) {
      const k = (Math.floor(this.col.lon[i]) + 180) * 1000 + (Math.floor(this.col.lat[i]) + 90);
      let a = grid.get(k);
      if (!a) grid.set(k, (a = []));
      a.push(i);
    }
    this._grid = grid;
  }

  /**
   * Nearest city to a coordinate.
   * @param {number} maxKm  give up beyond this distance
   * @param {(i:number)=>boolean} [visible]  only consider cities passing this
   * @returns {{index:number, km:number}|null}
   */
  nearest(lat, lon, maxKm = 400, visible = null) {
    if (!this._grid) this._buildGrid();

    const cx = Math.floor(lon), cy = Math.floor(lat);
    // One degree of latitude is ~111 km, so widen the search ring to cover
    // maxKm even when it is generous.
    const reach = Math.max(1, Math.ceil(maxKm / 111));

    let best = -1, bestKm = Infinity;
    for (let dx = -reach; dx <= reach; dx++) {
      for (let dy = -reach; dy <= reach; dy++) {
        // Wrap longitude so a click near the antimeridian still sees its
        // neighbours on the other side.
        let gx = cx + dx;
        if (gx < -180) gx += 360;
        if (gx >= 180) gx -= 360;
        const bucket = this._grid.get((gx + 180) * 1000 + (cy + dy + 90));
        if (!bucket) continue;
        for (const i of bucket) {
          if (visible && !visible(i)) continue;
          const km = distanceKm(lat, lon, this.col.lat[i], this.col.lon[i]);
          if (km < bestKm) { bestKm = km; best = i; }
        }
      }
    }

    return best >= 0 && bestKm <= maxKm ? { index: best, km: bestKm } : null;
  }

  /** Row index for a GeoNames id, or -1. */
  indexOfId(id) {
    if (!this._byId) {
      this._byId = new Map();
      for (let i = 0; i < this.count; i++) this._byId.set(this.col.id[i], i);
    }
    return this._byId.has(id) ? this._byId.get(id) : -1;
  }
}
