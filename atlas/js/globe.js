/* globe.js — a realistic, photographic Earth.
 *
 * Design notes
 * ------------
 * - The camera is FIXED. We spin the Earth group instead of orbiting the
 *   camera. That makes "no zoom" the natural state (there is simply no wheel
 *   handler and no dolly), and it keeps lat/lon -> screen projection simple.
 * - The surface shader blends NASA's Blue Marble day map with the Black Marble
 *   night-lights map across a soft terminator, adds a weak ocean-only specular
 *   glint, and a Fresnel rim. A separate back-lit shell gives the atmosphere.
 * - All imagery is public domain (NASA/GEBCO); three.js is MIT. See credits.
 */

import * as THREE from 'three';

const R = 1;                       // Earth radius in scene units
const SUN = new THREE.Vector3(0.55, 0.35, 0.75).normalize(); // fixed world sun

/** lat/lon (degrees) -> unit vector on the sphere (local Earth space). */
export function latLonToVec3(lat, lon, radius = R) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

export class Globe {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setClearColor(0x02030a, 1);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3.05);

    this.earth = new THREE.Group();
    this.scene.add(this.earth);

    this.anchors = [];         // { lat, lon, obj } marker anchors (rotate w/ Earth)
    this.targetQuat = new THREE.Quaternion();
    this.dragging = false;
    this.userActive = 0;       // timestamp of last user interaction
    this.focused = false;

    this._buildStars();
    this._bindDrag();
    this._resize();
    addEventListener('resize', () => this._resize());
  }

  /** Load textures and build the Earth. Returns a promise. */
  async load(onProgress = () => {}) {
    const loader = new THREE.TextureLoader();
    const load = (url, i, n) => new Promise((res, rej) => {
      loader.load(url, t => { onProgress((i + 1) / n); res(t); }, undefined, rej);
    });
    const base = '../textures/';
    const files = ['earth_day_4k.jpg', 'earth_night_2k.jpg', 'earth_ocean_2k.jpg'];
    const [day, night, ocean] = await Promise.all(files.map((f, i) => load(base + f, i, files.length)));
    for (const t of [day, night, ocean]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; }
    ocean.colorSpace = THREE.NoColorSpace;

    this._buildEarth(day, night, ocean);
    this._buildAtmosphere();
    return true;
  }

  _buildEarth(day, night, ocean) {
    const geo = new THREE.SphereGeometry(R, 96, 64);
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uDay: { value: day }, uNight: { value: night }, uOcean: { value: ocean },
        uSun: { value: SUN.clone() },
      },
      vertexShader: /* glsl */`
        varying vec2 vUv; varying vec3 vNormalW; varying vec3 vViewW;
        void main(){
          vUv = uv;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vViewW = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform sampler2D uDay, uNight, uOcean; uniform vec3 uSun;
        varying vec2 vUv; varying vec3 vNormalW; varying vec3 vViewW;
        void main(){
          vec3 N = normalize(vNormalW);
          vec3 V = normalize(vViewW);
          float sd = dot(N, normalize(uSun));
          float dayAmt = smoothstep(-0.18, 0.28, sd);

          vec3 dayCol = texture2D(uDay, vUv).rgb;
          vec3 nightCol = texture2D(uNight, vUv).rgb * 1.35;
          vec3 col = mix(nightCol, dayCol, dayAmt);

          // Ocean-only specular glint, weak and only on the lit side.
          float water = texture2D(uOcean, vUv).r;
          vec3 H = normalize(normalize(uSun) + V);
          float spec = pow(max(dot(N, H), 0.0), 220.0) * water * dayAmt * 0.35;
          col += vec3(0.7, 0.82, 1.0) * spec;

          // Fresnel rim -> a hint of atmosphere on the limb.
          float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          col += vec3(0.30, 0.55, 0.95) * fres * (0.25 + 0.6 * dayAmt);

          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.globeMesh = new THREE.Mesh(geo, this.mat);
    this.earth.add(this.globeMesh);
  }

  _buildAtmosphere() {
    const geo = new THREE.SphereGeometry(R * 1.035, 96, 64);
    const mat = new THREE.ShaderMaterial({
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      uniforms: { uSun: { value: SUN.clone() } },
      vertexShader: /* glsl */`
        varying vec3 vNormalW; varying vec3 vViewW;
        void main(){
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vViewW = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vNormalW; varying vec3 vViewW; uniform vec3 uSun;
        void main(){
          float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewW)), 0.0), 2.4);
          float lit = smoothstep(-0.4, 0.5, dot(normalize(vNormalW), normalize(uSun)));
          vec3 c = mix(vec3(0.10,0.20,0.42), vec3(0.35,0.62,1.0), lit);
          gl_FragColor = vec4(c * fres, fres);
        }`,
    });
    // Atmosphere is not parented to the spinning Earth (it's symmetric anyway).
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  _buildStars() {
    const n = 1800, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 20);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xbcd2ff, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.85 });
    this.scene.add(new THREE.Points(g, m));
  }

  /** Register a city marker. Returns an anchor id (index). */
  addMarker(lat, lon) {
    const obj = new THREE.Object3D();
    obj.position.copy(latLonToVec3(lat, lon, R * 1.001));
    this.earth.add(obj);
    this.anchors.push({ lat, lon, obj });
    return this.anchors.length - 1;
  }

  /** Rotate the Earth so a lat/lon faces the camera (front & centre). */
  focus(lat, lon) {
    const d = latLonToVec3(lat, lon, 1).normalize();
    const front = new THREE.Vector3(0, 0, 1);
    this.targetQuat.setFromUnitVectors(d, front);
    this.focused = true;
    this.userActive = performance.now();
  }

  /** Project a marker anchor to CSS pixel coords + facing test. */
  project(i) {
    const a = this.anchors[i];
    const world = a.obj.getWorldPosition(new THREE.Vector3());
    const toCam = this.camera.position.clone().sub(world).normalize();
    const normalW = world.clone().normalize();
    const facing = normalW.dot(toCam) > 0.02;           // near hemisphere?
    const p = world.clone().project(this.camera);
    const x = (p.x * 0.5 + 0.5) * this.w;
    const y = (-p.y * 0.5 + 0.5) * this.h;
    return { x, y, visible: facing && p.z < 1 };
  }

  _bindDrag() {
    const c = this.canvas;
    let px = 0, py = 0;
    const yaw = (ang) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), ang); this.targetQuat.premultiply(q); };
    const pitch = (ang) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), ang); this.targetQuat.premultiply(q); };

    const down = (e) => { this.dragging = true; this.focused = false; px = e.clientX; py = e.clientY; this.userActive = performance.now(); c.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
      yaw(dx * 0.005);
      pitch(dy * 0.005 * 0.7);
      this.userActive = performance.now();
    };
    const up = (e) => { this.dragging = false; c.releasePointerCapture?.(e.pointerId); };

    c.addEventListener('pointerdown', down);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    // Explicitly swallow wheel/gesture so there is never any zoom.
    c.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  }

  _resize() {
    this.w = innerWidth; this.h = innerHeight;
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
  }

  /** Start the render loop. onFrame() runs each frame for marker layout.
   *  Guarded against re-entry, and re-usable after stop() (e.g. when the
   *  holographic city view closes and hands control back to the globe). */
  start(onFrame) {
    if (onFrame) this._onFrame = onFrame;
    if (this._running) return;
    this._running = true;
    let last = performance.now();
    const tick = (now) => {
      if (!this._running) return;
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      // Idle auto-rotate: gentle Y spin when the user hasn't touched it.
      const idle = now - this.userActive > 2600;
      if (idle && !this.dragging && !this.focused) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), dt * 0.06);
        this.targetQuat.premultiply(q);
      }
      // Ease current rotation toward target.
      this.earth.quaternion.slerp(this.targetQuat, this.focused ? 0.08 : 0.16);
      this.renderer.render(this.scene, this.camera);
      if (this._onFrame) this._onFrame();
      requestAnimationFrame(tick);
    };
    // Render the first frame synchronously so the globe repaints immediately
    // (e.g. when returning from a city) even if rAF is throttled; the loop
    // then continues via requestAnimationFrame.
    tick(performance.now());
  }

  /** Pause the render loop (start() resumes it). */
  stop() { this._running = false; }
}
