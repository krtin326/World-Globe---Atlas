/**
 * scene.js — renderer, camera, controls and the animation loop.
 *
 * Owns everything that is about *viewing* the globe rather than about what is
 * drawn on it. Layers (boundaries, cities) are added from outside via `add()`
 * and get a per-frame callback so they can do their own level-of-detail work.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { latLonToVec3, vec3ToLatLon, clamp } from '../util/geo.js';
import {
  createEarth, createAtmosphere, createStars,
  SPECULAR_FIXED_SUN, SPECULAR_FOLLOW_SUN,
} from './earth.js';

/** Camera distance from the centre, in globe radii. 1.0 is the surface. */
export const MIN_DISTANCE = 1.06;
export const MAX_DISTANCE = 6.0;

export class GlobeScene {
  constructor(canvas, manager) {
    this.canvas = canvas;
    this.layers = [];
    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._clock = new THREE.Clock();
    this._flight = null;
    this._projected = new THREE.Vector3();

    /* --- renderer ----------------------------------------------------- */
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x05070d, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    /* --- scene -------------------------------------------------------- */
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.01, 500);
    this.camera.position.set(0, 0.9, 2.9);

    const { mesh: earth, material: earthMaterial } = createEarth(manager);
    this.earth = earth;
    this.earthMaterial = earthMaterial;
    this.scene.add(earth);

    const { mesh: atmosphere, material: atmoMaterial } = createAtmosphere();
    this.atmosphere = atmosphere;
    this.atmoMaterial = atmoMaterial;
    this.scene.add(atmosphere);

    const { points: stars, material: starMaterial } = createStars();
    this.starMaterial = starMaterial;
    this.scene.add(stars);

    /* --- controls ----------------------------------------------------- */
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = 0.42;
    this.controls.enablePan = false;
    this.controls.minDistance = MIN_DISTANCE;
    this.controls.maxDistance = MAX_DISTANCE;
    this.controls.zoomSpeed = 0.75;

    // Any manual input cancels an in-flight camera animation, so the user is
    // never fighting the camera for control.
    this.controls.addEventListener('start', () => { this._flight = null; });

    /* --- sun ---------------------------------------------------------- */
    // Direction the sunlight comes *from*, in world space.
    this.sunDirection = new THREE.Vector3(1, 0.25, 0.6).normalize();
    this._sunFollowsCamera = false;
    this._sunView = new THREE.Vector3();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * When true the sun tracks the camera, so whatever you have navigated to is
   * always lit. It is the more useful mode for reading a map and the less
   * realistic one — and it makes the ocean glint physically meaningless, so
   * that gets turned down at the same time.
   */
  set sunFollowsCamera(v) {
    this._sunFollowsCamera = v;
    this.earthMaterial.uniforms.uSpecStrength.value =
      v ? SPECULAR_FOLLOW_SUN : SPECULAR_FIXED_SUN;
  }

  get sunFollowsCamera() { return this._sunFollowsCamera; }

  /** @param {{update?: (ctx: object) => void}} layer */
  add(layer) {
    this.layers.push(layer);
    if (layer.object) this.scene.add(layer.object);
    return layer;
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    // Cap the device pixel ratio: a 3x retina display at full resolution costs
    // 9x the fragments for a difference almost nobody can see.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.starMaterial.uniforms.uPixelRatio.value = dpr;
  }

  /* ------------------------------------------------------------------ *
   * Picking
   * ------------------------------------------------------------------ */

  /**
   * Convert a pointer position to a point on the globe.
   * @returns {{lat:number, lon:number, point:THREE.Vector3}|null} null if the
   *   pointer is off the planet (over space).
   */
  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this._pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._pointer, this.camera);
    const hits = this._raycaster.intersectObject(this.earth, false);
    if (!hits.length) return null;
    const point = hits[0].point;
    // The globe never rotates in world space, so object space and world space
    // agree and the point can be converted directly.
    const { lat, lon } = vec3ToLatLon(point);
    return { lat, lon, point };
  }

  /**
   * Project a geographic coordinate to canvas pixels.
   * @returns {{x:number, y:number}|null} null when the point is over the
   *   horizon, i.e. on the far side of the planet.
   */
  project(lat, lon, radius = 1.004) {
    const p = latLonToVec3(lat, lon, radius);
    const cam = this.camera.position;
    // Horizon test: a surface point P on a sphere centred at the origin is
    // visible from C exactly when dot(P, C) >= r^2.
    if (p.x * cam.x + p.y * cam.y + p.z * cam.z < radius * radius) return null;

    this._projected.set(p.x, p.y, p.z).project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + (this._projected.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-this._projected.y * 0.5 + 0.5) * rect.height,
    };
  }

  /** Current camera altitude above the surface, in globe radii. */
  get altitude() {
    return this.camera.position.length() - 1;
  }

  /* ------------------------------------------------------------------ *
   * Camera flights
   * ------------------------------------------------------------------ */

  /**
   * Animate the camera to look straight down at a coordinate.
   * @param {number} lat
   * @param {number} lon
   * @param {number} [distance]  target distance from centre; defaults to keeping the current one
   * @param {number} [ms]
   */
  flyTo(lat, lon, distance, ms = 900) {
    const from = this.camera.position.clone();
    const targetDist = clamp(
      distance ?? from.length(),
      MIN_DISTANCE + 0.001,
      MAX_DISTANCE - 0.001,
    );
    const t = latLonToVec3(lat, lon, targetDist);
    const to = new THREE.Vector3(t.x, t.y, t.z);

    this._flight = { from, to, start: performance.now(), ms };
  }

  _updateFlight(now) {
    const f = this._flight;
    if (!f) return;
    const k = Math.min(1, (now - f.start) / f.ms);
    // Ease in-out cubic.
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

    // Interpolate along the arc rather than through the planet: slerp the
    // direction, lerp the radius separately.
    const dir = f.from.clone().normalize().lerp(f.to.clone().normalize(), e).normalize();
    const radius = f.from.length() + (f.to.length() - f.from.length()) * e;
    this.camera.position.copy(dir.multiplyScalar(radius));
    this.controls.update();

    if (k >= 1) this._flight = null;
  }

  /* ------------------------------------------------------------------ *
   * Loop
   * ------------------------------------------------------------------ */

  start() {
    // Guard against re-entry. The city sub-view stops the globe on open and
    // starts it again on close; without this, a second loop would be scheduled
    // every time and the render rate would double with each visit.
    if (this._running) return;
    this._running = true;

    const tick = () => {
      if (!this._running) return;
      this._frame = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = this._clock.getDelta();

      this._updateFlight(now);
      this.controls.update();

      // Keeping the sun near the camera means whatever you have navigated to is
      // always lit; the fixed sun is more realistic but leaves half the data in
      // the dark, which is annoying when you are trying to read a map.
      if (this._sunFollowsCamera) {
        this.sunDirection.copy(this.camera.position).normalize()
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.35);
      }

      // Shaders want the sun in view space.
      this._sunView.copy(this.sunDirection)
        .transformDirection(this.camera.matrixWorldInverse);
      this.earthMaterial.uniforms.uSunDir.value.copy(this._sunView);
      this.atmoMaterial.uniforms.uSunDir.value.copy(this._sunView);

      const ctx = {
        camera: this.camera,
        altitude: this.altitude,
        dt,
        now,
        renderer: this.renderer,
      };
      for (const layer of this.layers) layer.update?.(ctx);

      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  stop() {
    this._running = false;
    if (this._frame) cancelAnimationFrame(this._frame);
  }

  get running() { return !!this._running; }
}
