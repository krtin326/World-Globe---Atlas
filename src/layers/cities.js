/**
 * cities.js — 34,027 city markers, and the labels for the ones worth naming.
 *
 * Markers are a single `THREE.Points`: one draw call for the whole planet.
 * Which of them are *visible* is decided per-vertex on the GPU from the camera
 * altitude, so zooming does not touch a buffer or run any JavaScript. Every
 * city carries a threshold altitude derived from its population — Tokyo is
 * visible from orbit, a 15,000-person town only appears once you are close
 * enough for it to be legible.
 *
 * Labels are DOM elements rather than sprites. There are never more than a few
 * dozen on screen, and the browser renders crisp, correctly-kerned,
 * selectable text for free — which canvas-based labels do not.
 */

import * as THREE from 'three';
import { latLonToVec3 } from '../util/geo.js';

const R_CITY = 1.004;

/** Population bounds used to map a city onto the visibility ramp. */
const POP_MIN = 15000;      // the dataset's own cutoff
const POP_MAX = 40000000;   // Tokyo's metro figure, roughly

/** Camera altitude at which the smallest / largest cities appear. */
const ALT_SMALLEST = 0.06;
const ALT_LARGEST = 6.0;

const VERTEX = /* glsl */ `
attribute float aMinAlt;
attribute float aSize;
attribute float aCapital;

uniform float uAltitude;
uniform float uPixelRatio;
uniform float uSizeScale;

varying float vAlpha;
varying float vCapital;

void main() {
  vCapital = aCapital;

  vec4 mv = modelViewMatrix * vec4(position, 1.0);

  // Fade in over a band around the threshold rather than popping.
  vAlpha = smoothstep(aMinAlt * 1.6, aMinAlt * 0.75, uAltitude);

  // Markers grow slightly as you approach, but nowhere near linearly with
  // perspective, or close-up cities would become dinner plates.
  float dist = -mv.z;
  float size = aSize * uSizeScale * uPixelRatio * (1.0 + 0.6 / max(dist, 0.2));

  gl_PointSize = vAlpha > 0.01 ? size : 0.0;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = /* glsl */ `
precision mediump float;

uniform vec3 uColor;
uniform vec3 uCapitalColor;

varying float vAlpha;
varying float vCapital;

void main() {
  if (vAlpha <= 0.01) discard;

  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5) discard;

  // A bright core with a soft halo, so a marker stays readable against both
  // dark ocean and bright desert.
  float core = smoothstep(0.30, 0.10, d);
  float halo = smoothstep(0.50, 0.18, d);

  vec3 color = mix(uColor, uCapitalColor, vCapital);
  float alpha = (core + halo * 0.45) * vAlpha;

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

export class CityLayer {
  /**
   * @param {import('../data/cities.js').CityTable} table
   * @param {HTMLElement} labelContainer
   */
  constructor(table, labelContainer) {
    this.table = table;
    this.labelContainer = labelContainer;
    this.object = new THREE.Group();
    this.object.name = 'cities';

    this.enabled = true;
    this.maxLabels = 44;
    this._labelPool = [];
    this._lastLabelUpdate = 0;
    this._projected = new THREE.Vector3();
    this._camDir = new THREE.Vector3();

    this._buildPoints();
    this._buildHighlight();
  }

  _buildPoints() {
    const n = this.table.count;
    const col = this.table.col;

    const positions = new Float32Array(n * 3);
    const minAlt = new Float32Array(n);
    const sizes = new Float32Array(n);
    const capital = new Float32Array(n);

    // Precomputed here so the render loop never touches it again.
    this.minAltArray = minAlt;

    const logMin = Math.log(POP_MIN);
    const logSpan = Math.log(POP_MAX) - logMin;
    const altRatio = ALT_LARGEST / ALT_SMALLEST;

    const v = { x: 0, y: 0, z: 0 };

    for (let i = 0; i < n; i++) {
      latLonToVec3(col.lat[i], col.lon[i], R_CITY, v);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;

      // Population spans three and a half orders of magnitude, so the ramp is
      // logarithmic. Anything at or below the dataset floor sits at t = 0.
      const pop = Math.max(col.pop[i], POP_MIN);
      const t = Math.min(1, (Math.log(pop) - logMin) / logSpan);

      minAlt[i] = ALT_SMALLEST * Math.pow(altRatio, t);
      sizes[i] = 2.0 + t * 7.0;

      // National capitals get their own colour and are always worth showing a
      // little earlier than population alone would suggest.
      const isCapital = col.fcode[i] === 'PPLC';
      capital[i] = isCapital ? 1 : 0;
      if (isCapital) minAlt[i] = Math.max(minAlt[i], ALT_LARGEST * 0.5);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aMinAlt', new THREE.BufferAttribute(minAlt, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aCapital', new THREE.BufferAttribute(capital, 1));
    // The globe is a unit sphere at the origin and every point sits just above
    // it, so the bounding sphere is known exactly — skip the O(n) computation.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), R_CITY + 0.01);

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uAltitude: { value: 2 },
        uPixelRatio: { value: 1 },
        uSizeScale: { value: 1 },
        uColor: { value: new THREE.Color(0xfff3d0) },
        uCapitalColor: { value: new THREE.Color(0xffd166) },
      },
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.renderOrder = 7;
    this.object.add(this.points);
  }

  /** Ring drawn around the currently selected city. */
  _buildHighlight() {
    const geometry = new THREE.RingGeometry(0.012, 0.017, 40);
    this.highlight = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
      // Depth-tested, so a selection on the far side of the globe is hidden by
      // the planet instead of floating in front of it.
      depthTest: true,
    }));
    this.highlight.visible = false;
    this.highlight.renderOrder = 9;
    this.object.add(this.highlight);
  }

  /* ------------------------------------------------------------------ *
   * Selection
   * ------------------------------------------------------------------ */

  /** @param {number} index row index, or -1 to clear */
  selectCity(index) {
    this.selectedIndex = index;
    if (index < 0) {
      this.highlight.visible = false;
      return;
    }
    const col = this.table.col;
    const p = latLonToVec3(col.lat[index], col.lon[index], R_CITY + 0.002);
    this.highlight.position.set(p.x, p.y, p.z);
    // Lay the ring flat against the surface.
    this.highlight.lookAt(0, 0, 0);
    this.highlight.visible = true;
  }

  /** Is this city currently drawn, at the present camera altitude? */
  isVisibleAt(index, altitude) {
    return altitude < this.minAltArray[index] * 1.6;
  }

  setEnabled(v) {
    this.enabled = v;
    this.points.visible = v;
    if (!v) this._clearLabels();
  }

  /* ------------------------------------------------------------------ *
   * Labels
   * ------------------------------------------------------------------ */

  _label(i) {
    if (!this._labelPool[i]) {
      const el = document.createElement('div');
      el.className = 'city-label';
      this.labelContainer.appendChild(el);
      this._labelPool[i] = el;
    }
    return this._labelPool[i];
  }

  _clearLabels() {
    for (const el of this._labelPool) el.style.display = 'none';
  }

  _updateLabels(camera, altitude, renderer) {
    const size = renderer.getSize(new THREE.Vector2());
    const col = this.table.col;

    camera.getWorldDirection(this._camDir);
    const camPos = camera.position;

    // Rows are in population order, so the most label-worthy cities are always
    // near the front. Scanning a prefix rather than all 34k keeps this cheap;
    // the cut-off scales with zoom because close in, the big cities are mostly
    // off-screen and the interesting ones are further down the list.
    const scan = altitude > 1.5 ? 400 : altitude > 0.5 ? 3000 : 14000;
    const limit = Math.min(scan, this.table.count);

    const candidates = [];
    for (let i = 0; i < limit; i++) {
      if (altitude >= this.minAltArray[i] * 0.9) continue;

      const p = latLonToVec3(col.lat[i], col.lon[i], R_CITY);

      // Horizon test. For a sphere centred on the origin, a surface point P is
      // visible from C exactly when dot(P, C) >= r^2 — everything else is over
      // the curve and hidden by the planet itself.
      if (p.x * camPos.x + p.y * camPos.y + p.z * camPos.z < R_CITY * R_CITY) continue;

      this._projected.set(p.x, p.y, p.z).project(camera);
      if (this._projected.z > 1) continue;

      const x = (this._projected.x * 0.5 + 0.5) * size.x;
      const y = (-this._projected.y * 0.5 + 0.5) * size.y;
      if (x < -40 || x > size.x + 40 || y < -20 || y > size.y + 20) continue;

      candidates.push({ i, x, y, pop: col.pop[i] });
      if (candidates.length > 300) break;
    }

    candidates.sort((a, b) => b.pop - a.pop);

    // Greedy de-overlap on a coarse screen grid: the first (largest) city to
    // claim a cell keeps it. Cheap, stable, and good enough that labels stop
    // stacking on top of each other in dense regions like the Ruhr.
    const CELL = 72;
    const taken = new Set();
    let used = 0;

    for (const c of candidates) {
      if (used >= this.maxLabels) break;
      const key = `${Math.round(c.x / CELL)}:${Math.round(c.y / (CELL * 0.45))}`;
      if (taken.has(key)) continue;
      taken.add(key);

      const el = this._label(used++);
      el.textContent = col.name[c.i];
      el.style.display = 'block';
      el.style.transform = `translate(${Math.round(c.x)}px, ${Math.round(c.y)}px)`;
      el.classList.toggle('is-capital', col.fcode[c.i] === 'PPLC');
      el.dataset.index = String(c.i);
    }

    for (let k = used; k < this._labelPool.length; k++) {
      this._labelPool[k].style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------ *
   * Per-frame
   * ------------------------------------------------------------------ */

  update({ camera, altitude, now, renderer }) {
    if (!this.enabled) return;

    this.material.uniforms.uAltitude.value = altitude;
    this.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();

    // Labels are DOM writes, which are far more expensive than the draw call
    // they annotate. 20 Hz is indistinguishable from 60 for text that is
    // tracking a slow camera.
    if (now - this._lastLabelUpdate > 50) {
      this._lastLabelUpdate = now;
      this._updateLabels(camera, altitude, renderer);
    }

    if (this.highlight.visible) {
      // Keep the selection ring a constant size on screen rather than letting
      // it shrink to nothing when zoomed out.
      const d = camera.position.distanceTo(this.highlight.position);
      this.highlight.scale.setScalar(Math.max(0.35, d * 0.55));
    }
  }
}
