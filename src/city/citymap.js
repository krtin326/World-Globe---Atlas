/**
 * citymap.js — the rotating 3D city model.
 *
 * A separate three.js scene from the globe, with its own renderer and its own
 * loop, because it is a fundamentally different kind of drawing: the globe is a
 * textured sphere seen from space, this is a flat-earth diorama a few tens of
 * kilometres across, lit like a hologram.
 *
 * The landmass comes from GSHHG at full resolution (~2,200 vertices for
 * Mumbai), extruded into a slab: earcut gives the top face, and every ring edge
 * becomes a wall quad down to the water. The coastline is then traced again as
 * an emissive line, which is what bloom picks up and turns into the neon edge.
 *
 * Coordinates are a local tangent-plane projection, not the globe's spherical
 * one — over 40 km the curvature is irrelevant and a flat projection keeps the
 * geometry, the picking and the marker placement trivially consistent.
 */

import * as THREE from 'three';
import earcut from '../../vendor/earcut.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Scene units per degree of latitude. Picked so the city is ~40 units across. */
const SCALE = 90;
/** How thick the land slab is, in scene units. */
const LAND_HEIGHT = 0.85;
/** Ward plates float just clear of the land so their borders never z-fight. */
const DIVISION_HEIGHT = 0.95;

/* -------------------------------------------------------------------------- *
 * Camera control feel
 *
 * Drag sensitivity, in radians of rotation per pixel of pointer movement, at
 * the reference distance below. Roughly half the old fixed rate — the model
 * used to spin about three-quarters of the way round on a single drag across
 * the canvas, which read as twitchy.
 * -------------------------------------------------------------------------- */
const DRAG_YAW = 0.0032;
const DRAG_PITCH = 0.0026;
/** The zoom distance at which DRAG_YAW/PITCH apply unscaled (the default view). */
const DRAG_REF_DISTANCE = 46;
/** Clamp on the zoom-adaptive factor, so neither extreme becomes unusable. */
const DRAG_FACTOR_MIN = 0.35;
const DRAG_FACTOR_MAX = 1.4;
/** Fraction the distance changes per wheel notch. */
const ZOOM_STEP = 0.075;
const ZOOM_MIN = 14;
const ZOOM_MAX = 110;

/* -------------------------------------------------------------------------- *
 * Points of interest (the zoom-in detail)
 *
 * Each place carries an importance in [0,1]; it becomes visible once the camera
 * is at or below `showAt` = ZOOM_MIN + (POI_SHOW_TOP - ZOOM_MIN) * imp^GAMMA.
 * The gamma pushes most places into the close-zoom range, so a handful of major
 * landmarks show when pulled back and the neighbourhoods fill in as you dive —
 * the Google-Maps reveal.
 * -------------------------------------------------------------------------- */
const POI_SHOW_TOP = 105;
const POI_GAMMA = 2.4;
const POI_HEIGHT = 1.05; // sit just above the ward plates
const POI_CAT_COLOR = {
  area: 0x8fd0ff,
  transport: 0xffb457,
  civic: 0x9dff3d,
  landmark: 0xff7ad4,
  nature: 0x5fe0a0,
  water: 0x62a8ff,
};

/* -------------------------------------------------------------------------- *
 * Roads and railway
 *
 * One merged line object per class. Roads warm and pale so they read as a road
 * network over the cool land; the railway is a violet dashed line so it never
 * gets mistaken for a road. `showAt` gives each class a level-of-detail: the
 * arterials and the railway are always drawn, the denser secondary grid only
 * appears once you have zoomed in past the pulled-back view.
 * -------------------------------------------------------------------------- */
const ROAD_HEIGHT = 1.0;   // above the ward plates (0.95), below the POI dots (1.05)
const ROAD_STYLE = {
  //          colour     opacity  showAt(max camera distance visible)
  motorway:  [0xffe8c8, 0.90, 999],
  trunk:     [0xffd9a6, 0.80, 999],
  primary:   [0xf3c489, 0.68, 999],
  secondary: [0xcdb08a, 0.52, 58],
  rail:      [0xc7a2ff, 0.85, 999],
};

const COLORS = {
  land: 0x11263f,
  landTop: 0x1d4468,
  coast: 0x00f0ff,
  grid: 0xff2d78,
  water: 0x03070f,
  marker: 0xff2d78,
  markerActive: 0x9dff3d,
};

/**
 * Mean of a flat xyz triangle-soup, used to anchor a division's label. Not the
 * true polygon centroid, but for a compact ward it lands inside the shape,
 * which is all a label needs.
 */
function centroidOf(positions) {
  if (!positions.length) return null;
  let x = 0, y = 0, z = 0;
  const n = positions.length / 3;
  for (let i = 0; i < positions.length; i += 3) {
    x += positions[i]; y += positions[i + 1]; z += positions[i + 2];
  }
  return new THREE.Vector3(x / n, y / n, z / n);
}

export class CityMap {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{centre:[number,number]}} city  city descriptor from mumbai.json
   */
  constructor(canvas, city) {
    this.canvas = canvas;
    this.city = city;
    this.centre = city.centre;
    this.markers = new Map();
    this.autoRotate = true;
    this.rotationSpeed = 0.055;
    this._running = false;
    this._t = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setClearColor(0x02040a, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x02040a, 0.012);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.5, 500);

    // The whole model lives under one pivot, so "rotate 360 degrees" is a
    // single rotation on the group rather than an orbiting camera. It keeps the
    // lighting stable and makes the marker screen-projection maths simple.
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this.orbit = { angle: 0.6, elevation: 0.72, distance: 46 };

    this._buildLights();
    this._buildWater();
    this._setupComposer();
    this._bindPointer();

    this.resize();
    // A window listener is not enough: the canvas also changes size when the
    // layout reflows at a breakpoint or the panel opens, neither of which fires
    // a window resize. Observing the element itself catches every case.
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(canvas);
  }

  /* ------------------------------------------------------------------ *
   * Projection
   * ------------------------------------------------------------------ */

  /**
   * Local tangent-plane projection. Longitude is compressed by cos(latitude)
   * so the city keeps its true proportions instead of being stretched
   * east-west, which is what a raw lon/lat plot would do at 19 degrees north.
   */
  project(lon, lat) {
    const [cLon, cLat] = this.centre;
    const k = Math.cos(cLat * Math.PI / 180);
    return {
      x: (lon - cLon) * k * SCALE,
      z: -(lat - cLat) * SCALE,
    };
  }

  /* ------------------------------------------------------------------ *
   * Scene furniture
   * ------------------------------------------------------------------ */

  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0x4a6c99, 1.6));

    const key = new THREE.DirectionalLight(0x66ccff, 1.5);
    key.position.set(20, 30, 10);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xff2d78, 0.9);
    rim.position.set(-18, 8, -14);
    this.scene.add(rim);
  }

  _buildWater() {
    // Grid plane standing in for the sea. The grid is the strongest single cue
    // that this is a readout rather than a photograph.
    const grid = new THREE.GridHelper(160, 64, COLORS.grid, 0x1b2740);
    grid.position.y = -0.02;
    grid.material.transparent = true;
    grid.material.opacity = 0.24;
    grid.material.depthWrite = false;
    this.pivot.add(grid);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshBasicMaterial({ color: COLORS.water }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.06;
    this.pivot.add(plane);
  }

  _setupComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Bloom is what makes emissive edges read as neon rather than as bright
    // lines. Threshold is low because almost nothing in the scene is bright —
    // only the coastline and the markers are meant to bleed.
    // Strength was pulled back once the ward layer landed: 24 translucent
    // plates plus a cluster of markers around Fort pushed enough light into
    // the bloom to wash the whole model out.
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.45, 0.22);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  /* ------------------------------------------------------------------ *
   * Land
   * ------------------------------------------------------------------ */

  /** @param {object} geojson  GeometryCollection or FeatureCollection from GSHHG */
  setLand(geojson) {
    const parts = geojson.geometries || (geojson.features || []).map((f) => f.geometry);

    const topPositions = [];
    const wallPositions = [];
    const edgePositions = [];

    for (const geom of parts) {
      const polys = geom.type === 'Polygon' ? [geom.coordinates]
        : geom.type === 'MultiPolygon' ? geom.coordinates : [];
      for (const poly of polys) this._addPolygon(poly, topPositions, wallPositions, edgePositions);
    }

    // --- top faces ---
    const topGeom = new THREE.BufferGeometry();
    topGeom.setAttribute('position', new THREE.Float32BufferAttribute(topPositions, 3));
    topGeom.computeVertexNormals();

    // Bright enough to read as a surface. At the first pass the land was so
    // dark that only the coastline was visible and the city looked like a wire
    // outline floating in space — striking, but you could not see the shape of
    // the land itself, which is the thing being shown.
    this.landTop = new THREE.Mesh(topGeom, new THREE.MeshStandardMaterial({
      color: COLORS.landTop,
      roughness: 0.62,
      metalness: 0.3,
      emissive: 0x0e2c4a,
      emissiveIntensity: 1.0,
    }));
    this.pivot.add(this.landTop);

    // --- walls ---
    const wallGeom = new THREE.BufferGeometry();
    wallGeom.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
    wallGeom.computeVertexNormals();

    this.landWall = new THREE.Mesh(wallGeom, new THREE.MeshStandardMaterial({
      color: COLORS.land,
      roughness: 0.85,
      metalness: 0.15,
      emissive: 0x081a2e,
      emissiveIntensity: 0.7,
      side: THREE.DoubleSide,
    }));
    this.pivot.add(this.landWall);

    // --- glowing coastline ---
    const edgeGeom = new THREE.BufferGeometry();
    edgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));

    this.coastline = new THREE.LineSegments(edgeGeom, new THREE.LineBasicMaterial({
      color: COLORS.coast,
      transparent: true,
      opacity: 0.95,
    }));
    this.pivot.add(this.coastline);

    this.stats = {
      vertices: topPositions.length / 3,
      coastSegments: edgePositions.length / 6,
    };
  }

  /* ------------------------------------------------------------------ *
   * Administrative divisions
   * ------------------------------------------------------------------ */

  /**
   * Ward plates, drawn as translucent tinted slabs just above the land with a
   * bright border on top.
   *
   * Each ward is a separate mesh rather than one merged buffer, because the
   * whole point of the layer is to pick out one division at a time — merging
   * would cost exactly the ability the layer exists to provide. Twenty-four
   * draw calls is nothing.
   *
   * @param {object} geojson  FeatureCollection of division polygons
   * @param {string} nameField  property holding the division's code
   */
  setDivisions(geojson, nameField = 'NAME', order = null) {
    let features = geojson.features || [];
    this.divisions = new Map();

    // The service returns wards in OBJECTID order, which is arbitrary. Sorting
    // into the corporation's own A–T sequence — which runs roughly south to
    // north — makes the list scannable and, because the colour ramp follows
    // the same index, turns the tint into a geographic gradient rather than
    // noise. Anything not in the supplied order goes to the end.
    if (order?.length) {
      const rank = new Map(order.map((code, i) => [code, i]));
      features = [...features].sort((a, b) =>
        (rank.get(a.properties?.[nameField]) ?? 1e6) -
        (rank.get(b.properties?.[nameField]) ?? 1e6));
    }

    const group = new THREE.Group();
    group.name = 'divisions';
    this.divisionGroup = group;
    this.pivot.add(group);

    features.forEach((feature, i) => {
      const code = feature.properties?.[nameField] ?? String(i);
      const polys = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates]
        : feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [];

      const top = [];
      const wall = [];
      const edge = [];
      for (const poly of polys) {
        this._addPolygon(poly, top, wall, edge, DIVISION_HEIGHT);
      }

      // Hue walks the cyan-to-magenta ramp so neighbours are distinguishable
      // without needing 24 hand-picked colours.
      const hue = 0.5 + (i / features.length) * 0.42;
      const color = new THREE.Color().setHSL(hue % 1, 0.85, 0.55);

      const fillGeom = new THREE.BufferGeometry();
      fillGeom.setAttribute('position', new THREE.Float32BufferAttribute(top, 3));
      fillGeom.computeVertexNormals();

      const fill = new THREE.Mesh(fillGeom, new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      }));

      const edgeGeom = new THREE.BufferGeometry();
      edgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(edge, 3));
      const border = new THREE.LineSegments(edgeGeom, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }));

      const node = new THREE.Group();
      node.add(fill, border);
      node.userData = { code, fill, border, color, centroid: centroidOf(top) };
      group.add(node);

      this.divisions.set(code, node);
    });

    this.divisionsVisible = true;
    this.stats.divisions = features.length;
  }

  setDivisionsVisible(v) {
    this.divisionsVisible = v;
    if (this.divisionGroup) this.divisionGroup.visible = v;
  }

  /** Highlight one division and mute the rest. Pass null to clear. */
  focusDivision(code) {
    this.activeDivision = code;
    if (!this.divisions) return;
    for (const [key, node] of this.divisions) {
      const active = key === code;
      const any = code != null;
      node.userData.fill.material.opacity = active ? 0.40 : (any ? 0.04 : 0.12);
      node.userData.border.material.opacity = active ? 1 : (any ? 0.22 : 0.75);
      node.userData.active = active;
    }
  }

  /** Screen position of a division's centroid, for HTML labels. */
  projectDivision(code) {
    const node = this.divisions?.get(code);
    if (!node?.userData.centroid) return null;
    const v = node.userData.centroid.clone();
    this.pivot.localToWorld(v);
    const camDir = v.clone().sub(this.camera.position);
    v.project(this.camera);
    if (v.z > 1) return null;
    const r = this.canvas.getBoundingClientRect();
    return {
      x: r.left + (v.x * 0.5 + 0.5) * r.width,
      y: r.top + (-v.y * 0.5 + 0.5) * r.height,
      depth: v.z,
    };
  }

  /** Every division code, in the order they were added. */
  divisionCodes() {
    return this.divisions ? [...this.divisions.keys()] : [];
  }

  /* ------------------------------------------------------------------ *
   * Points of interest
   * ------------------------------------------------------------------ */

  /** @param {{places:Array<{name,lat,lon,cat,imp}>}} json */
  setPois(json) {
    // Rank, not raw importance, decides the reveal. The importance scores are
    // bunched (most Mumbai localities land near 0.5), so mapping them straight
    // to a zoom threshold made almost everything appear in one narrow band —
    // the map went from sparse to saturated in a single scroll notch. Spreading
    // by rank guarantees each zoom step reveals a roughly equal batch, which is
    // the gradual Google-Maps fill-in.
    const places = (json.places || []).slice().sort((a, b) => b.imp - a.imp);
    const N = Math.max(1, places.length - 1);
    this.pois = [];

    const positions = new Float32Array(places.length * 3);
    const colors = new Float32Array(places.length * 3);
    const showAt = new Float32Array(places.length);
    const sizes = new Float32Array(places.length);

    const col = new THREE.Color();
    places.forEach((p, i) => {
      const { x, z } = this.project(p.lon, p.lat);
      positions[i * 3] = x;
      positions[i * 3 + 1] = POI_HEIGHT;
      positions[i * 3 + 2] = z;

      // rank 0 (most important) -> visible even pulled right back; last rank ->
      // only at the closest zoom. The gamma weights the bulk toward close-in.
      const frac = 1 - i / N;
      const at = ZOOM_MIN + (POI_SHOW_TOP - ZOOM_MIN) * Math.pow(frac, POI_GAMMA);
      showAt[i] = at;
      sizes[i] = 2.2 + p.imp * 4.0;

      col.setHex(POI_CAT_COLOR[p.cat] || 0x8fd0ff);
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;

      this.pois.push({ name: p.name, cat: p.cat, imp: p.imp, showAt: at,
                       pos: new THREE.Vector3(x, POI_HEIGHT, z) });
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aShowAt', new THREE.BufferAttribute(showAt, 1));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    this.poiMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      uniforms: { uDistance: { value: this.orbit.distance }, uPixelRatio: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aShowAt;
        attribute float aSize;
        uniform float uDistance;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          // Fade in over a short band as the camera crosses the threshold,
          // rather than popping the dot on.
          vAlpha = smoothstep(aShowAt + 6.0, aShowAt - 2.0, uDistance);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = vAlpha > 0.01 ? aSize * uPixelRatio : 0.0;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          if (vAlpha <= 0.01) discard;
          vec2 d = gl_PointCoord - 0.5;
          float r = length(d);
          if (r > 0.5) discard;
          float a = smoothstep(0.5, 0.15, r) * vAlpha;
          gl_FragColor = vec4(vColor, a);
        }`,
    });

    this.poiPoints = new THREE.Points(geom, this.poiMaterial);
    this.poiPoints.renderOrder = 6; // above wards, below the history beams
    this.poiPoints.frustumCulled = false;
    this.pivot.add(this.poiPoints);

    this.poisVisible = true;
    this.stats.pois = places.length;
  }

  setPoisVisible(v) {
    this.poisVisible = v;
    if (this.poiPoints) this.poiPoints.visible = v;
  }

  /**
   * POIs currently worth labelling: those revealed at the present zoom, on the
   * near face of the model, projected to canvas pixels and sorted by importance.
   * The caller (cityview) does the screen-space de-overlap and the DOM.
   * @returns {Array<{name,x,y,cat,imp}>}
   */
  poiLabelCandidates() {
    if (!this.pois || !this.poisVisible) return [];
    const dist = this.orbit.distance;
    const rect = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector3();
    const out = [];

    for (const p of this.pois) {
      if (dist > p.showAt) continue;

      // World position (the pivot rotates, so go through its matrix). The model
      // is a flat diorama, so points are essentially never occluded by it — no
      // far-side cull is needed, unlike the globe.
      v.copy(p.pos);
      this.pivot.localToWorld(v);
      v.project(this.camera);
      if (v.z > 1) continue;
      const x = (v.x * 0.5 + 0.5) * rect.width;
      const y = (-v.y * 0.5 + 0.5) * rect.height;
      if (x < -40 || x > rect.width + 40 || y < -20 || y > rect.height + 20) continue;

      out.push({ name: p.name, x, y, cat: p.cat, imp: p.imp });
    }

    out.sort((a, b) => b.imp - a.imp);
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Roads and railway
   * ------------------------------------------------------------------ */

  /** @param {{classes:string[], lines:Array<{c:number,p:number[]}>}} json */
  setRoads(json) {
    const classNames = json.classes || [];
    // Collect segment endpoints per class, then one merged line object each.
    const perClass = classNames.map(() => []);

    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 0 };
    for (const line of json.lines || []) {
      const seg = perClass[line.c];
      if (!seg) continue;
      const p = line.p;
      for (let i = 0; i + 3 < p.length; i += 2) {
        const p0 = this.project(p[i], p[i + 1]);
        const p1 = this.project(p[i + 2], p[i + 3]);
        seg.push(p0.x, ROAD_HEIGHT, p0.z, p1.x, ROAD_HEIGHT, p1.z);
      }
    }

    this.roadGroup = new THREE.Group();
    this.roadGroup.name = 'roads';
    this.roadLayers = [];

    classNames.forEach((name, ci) => {
      const positions = perClass[ci];
      if (!positions.length) return;
      const style = ROAD_STYLE[name] || [0xffffff, 0.6, 999];
      const [color, opacity, showAt] = style;

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      const isRail = name === 'rail';
      const material = isRail
        ? new THREE.LineDashedMaterial({
            color, transparent: true, opacity, depthWrite: false,
            dashSize: 0.28, gapSize: 0.2,
          })
        : new THREE.LineBasicMaterial({
            color, transparent: true, opacity, depthWrite: false,
          });

      const lines = new THREE.LineSegments(geom, material);
      if (isRail) lines.computeLineDistances();
      lines.renderOrder = 5; // above wards, below POI dots and history beams
      this.roadGroup.add(lines);
      this.roadLayers.push({ name, object: lines, showAt });
    });

    this.pivot.add(this.roadGroup);
    this.roadsVisible = true;
    this.stats.roads = (json.lines || []).length;
  }

  setRoadsVisible(v) {
    this.roadsVisible = v;
    if (this.roadGroup) this.roadGroup.visible = v;
  }

  /* ------------------------------------------------------------------ *
   * Ground picking (for the coordinates panel)
   * ------------------------------------------------------------------ */

  /**
   * Convert a pointer position to a geographic coordinate on the model's
   * ground plane. The pivot never rotates (the camera orbits instead), so scene
   * space and the projection are the same frame and the inverse is direct.
   * @returns {{lat:number, lon:number, nearest:string|null, nearKm:number|null}|null}
   */
  pickGround(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    this._ray = this._ray || new THREE.Raycaster();
    this._ndc = this._ndc || new THREE.Vector2();
    this._ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this._ray.setFromCamera(this._ndc, this.camera);

    this._groundPlane = this._groundPlane
      || new THREE.Plane(new THREE.Vector3(0, 1, 0), -LAND_HEIGHT);
    const hit = new THREE.Vector3();
    if (!this._ray.ray.intersectPlane(this._groundPlane, hit)) return null;

    const [cLon, cLat] = this.centre;
    const k = Math.cos(cLat * Math.PI / 180);
    const lon = cLon + hit.x / (k * SCALE);
    const lat = cLat - hit.z / SCALE;

    // Nearest POI, for a little "you are near…" context.
    let nearest = null;
    let best = Infinity;
    if (this.pois) {
      for (const p of this.pois) {
        const dx = p.pos.x - hit.x;
        const dz = p.pos.z - hit.z;
        const d = dx * dx + dz * dz;
        if (d < best) { best = d; nearest = p.name; }
      }
    }
    const nearKm = nearest ? (Math.sqrt(best) / SCALE) * 111 : null;
    return { lat, lon, nearest, nearKm };
  }

  _addPolygon(poly, top, wall, edge, height = LAND_HEIGHT) {
    // earcut wants a flat coordinate array plus hole start indices.
    const coords = [];
    const holes = [];
    const projected = [];

    poly.forEach((ring, i) => {
      if (i > 0) holes.push(coords.length / 2);
      const pr = ring.map(([lon, lat]) => this.project(lon, lat));
      projected.push(pr);
      for (const p of pr) coords.push(p.x, p.z);
    });

    const indices = earcut(coords, holes, 2);

    // Wind the top faces backwards on purpose. earcut returns triangles wound
    // counter-clockwise in its own XY plane, but we map its Y onto the scene's
    // Z — a handedness flip, which turns them clockwise and leaves every
    // computed normal pointing at the sea floor. The land then catches no light
    // from above and renders as a black hole inside a glowing outline.
    for (let i = 0; i < indices.length; i += 3) {
      for (const j of [indices[i + 2], indices[i + 1], indices[i]]) {
        const k = j * 2;
        top.push(coords[k], height, coords[k + 1]);
      }
    }

    // Walls and the top edge, ring by ring.
    for (const ring of projected) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];

        // Two triangles per edge, from the waterline up to the slab top.
        wall.push(a.x, 0, a.z, b.x, 0, b.z, b.x, height, b.z);
        wall.push(a.x, 0, a.z, b.x, height, b.z, a.x, height, a.z);

        edge.push(a.x, height + 0.012, a.z, b.x, height + 0.012, b.z);
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * Place markers
   * ------------------------------------------------------------------ */

  /** @param {Array<{id:string,name:string,lat:number,lon:number}>} places */
  setPlaces(places) {
    this.placeList = places;
    const group = new THREE.Group();
    this.markerGroup = group;
    this.pivot.add(group);

    for (const place of places) {
      const { x, z } = this.project(place.lon, place.lat);

      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 3.4, 8, 1, true),
        new THREE.MeshBasicMaterial({
          color: COLORS.marker,
          transparent: true,
          opacity: 0.38,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      beam.position.set(x, LAND_HEIGHT + 1.7, z);

      const cap = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2),
        new THREE.MeshBasicMaterial({ color: COLORS.marker }),
      );
      cap.position.set(x, LAND_HEIGHT + 3.4, z);

      const node = new THREE.Group();
      node.add(beam, cap);
      node.userData = { place, beam, cap, base: new THREE.Vector3(x, LAND_HEIGHT, z) };
      group.add(node);

      this.markers.set(place.id, node);
    }
  }

  /** Highlight one place and dim the rest. Pass null to clear. */
  focusPlace(id) {
    this.activePlace = id;
    for (const [key, node] of this.markers) {
      const on = id == null || key === id;
      const color = key === id ? COLORS.markerActive : COLORS.marker;
      node.userData.beam.material.color.setHex(color);
      node.userData.cap.material.color.setHex(color);
      node.userData.beam.material.opacity = on ? (key === id ? 0.85 : 0.5) : 0.12;
      node.userData.cap.material.opacity = on ? 1 : 0.2;
      node.userData.cap.material.transparent = true;
      node.userData.active = key === id;
    }
  }

  /** Screen position of a marker, for HTML labels. null if behind the camera. */
  projectMarker(id) {
    const node = this.markers.get(id);
    if (!node) return null;
    const v = node.userData.base.clone();
    v.y += 3.6;
    this.pivot.localToWorld(v);
    v.project(this.camera);
    if (v.z > 1) return null;
    const r = this.canvas.getBoundingClientRect();
    return {
      x: r.left + (v.x * 0.5 + 0.5) * r.width,
      y: r.top + (-v.y * 0.5 + 0.5) * r.height,
    };
  }

  /* ------------------------------------------------------------------ *
   * Interaction
   * ------------------------------------------------------------------ */

  _bindPointer() {
    let dragging = false;
    let last = null;

    const down = (e) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      this.autoRotate = false;
      this.canvas.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;

      // Scale sensitivity with zoom. A perspective camera at distance D sees a
      // vertical slice of the model about 2*D*tan(fov/2) tall, so the same
      // angular nudge sweeps a surface point across more screen pixels the
      // closer you are. Making the per-pixel rotation proportional to D keeps a
      // drag feeling the same whether you are pulled back or right down on the
      // coastline — gentler when zoomed in, which is where precision matters.
      const factor = Math.min(DRAG_FACTOR_MAX, Math.max(DRAG_FACTOR_MIN,
        this.orbit.distance / DRAG_REF_DISTANCE));

      this.orbit.angle -= (e.clientX - last.x) * DRAG_YAW * factor;
      this.orbit.elevation = Math.max(0.12, Math.min(1.45,
        this.orbit.elevation + (e.clientY - last.y) * DRAG_PITCH * factor));
      last = { x: e.clientX, y: e.clientY };
    };
    const up = (e) => {
      dragging = false;
      this.canvas.releasePointerCapture?.(e.pointerId);
    };

    this.canvas.addEventListener('pointerdown', down);
    this.canvas.addEventListener('pointermove', move);
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.orbit.distance = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX,
        this.orbit.distance * (1 + Math.sign(e.deltaY) * ZOOM_STEP)));
    }, { passive: false });
  }

  /* ------------------------------------------------------------------ *
   * Loop
   * ------------------------------------------------------------------ */

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    if (w === this._lastW && h === this._lastH) return;
    this._lastW = w; this._lastH = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this._running) return;
    this._running = true;
    let prev = performance.now();

    const tick = () => {
      if (!this._running) return;
      this._frame = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      this._t += dt;

      if (this.autoRotate) this.orbit.angle += this.rotationSpeed * dt;

      const { angle, elevation, distance } = this.orbit;
      this.camera.position.set(
        Math.sin(angle) * Math.cos(elevation) * distance,
        Math.sin(elevation) * distance,
        Math.cos(angle) * Math.cos(elevation) * distance,
      );
      this.camera.lookAt(0, 0, 0);

      // Reveal POIs for the current zoom. One uniform update, no per-point JS.
      if (this.poiMaterial) {
        this.poiMaterial.uniforms.uDistance.value = distance;
        this.poiMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
      }

      // Road level-of-detail: hide a class once the camera is further out than
      // its threshold, so the dense secondary grid does not clutter the
      // pulled-back view.
      if (this.roadsVisible && this.roadLayers) {
        for (const layer of this.roadLayers) layer.object.visible = distance <= layer.showAt;
      }

      // Markers pulse, and the active one pulses harder — the eye finds it
      // without needing a label.
      for (const node of this.markers.values()) {
        const k = node.userData.active ? 1 : 0.4;
        const s = 1 + Math.sin(this._t * 3 + node.userData.base.x) * 0.18 * k;
        node.userData.cap.scale.setScalar(s);
        node.userData.cap.rotation.y += dt * 1.2;
      }

      this.onFrame?.();
      this.composer.render();
    };
    tick();
  }

  stop() {
    this._running = false;
    if (this._frame) cancelAnimationFrame(this._frame);
  }

  dispose() {
    this.stop();
    this._ro?.disconnect();
    this.scene.traverse((o) => {
      o.geometry?.dispose?.();
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material?.dispose?.();
    });
    this.composer.dispose?.();
    this.renderer.dispose();
  }
}
