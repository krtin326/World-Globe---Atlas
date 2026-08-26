/* cityview.js — the holographic city sub-view.
 *
 * Selecting a city hands off from the globe to a full-screen "hologram table":
 * a procedural neon city (three.js) that is DIFFERENT for every city — driven
 * by a per-city `holo` spec of named districts, a street grid, water/relief
 * features and signature landmarks (pyramids, towers, a river…). A right-docked
 * console holds the tabbed, deepened dossier and a categorised, filterable
 * timeline.
 *
 * The neon glow comes from additive-blended emissive geometry, NOT a bloom
 * post-processing pass: UnrealBloom does several full-screen blur passes per
 * frame, which stalled the render (multi-second freezes) on weaker GPUs. A
 * plain forward render is cheap and reliable everywhere.
 *
 * The hologram is a stylised abstraction generated in code — not a real map or
 * a photograph — so it carries no geodata or image licence.
 */

import * as THREE from 'three';

const VOID = 0x03050b;
const WATER = new THREE.Color('#2b8fff');
const GREEN = new THREE.Color('#38d17a');
const SNOW  = new THREE.Color('#dfe9ff');

/* ============================ THE HOLOGRAM ============================ */

class HoloScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(VOID, 1);
    // Cap at 1.5 — a plain forward render is cheap, but full-res on a 4K panel
    // is still a lot of fragments for an integrated GPU.
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(VOID, 230, 560);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1200);
    // Camera sits to the right and above, so the city renders on the LEFT of
    // the frame, clear of the right-docked console.
    this.camera.position.set(34, 96, 172);
    this.camera.lookAt(-6, 6, 0);

    this.city = new THREE.Group();
    this.scene.add(this.city);

    this.labelAnchors = [];     // { name, kind, obj }
    this.spin = 0; this.targetSpin = 0; this.autos = true;
    this.dragging = false; this.running = false;

    this._bindDrag();
    this._resize();
    this._onResize = () => this._resize();
    addEventListener('resize', this._onResize);
  }

  /* ---- merged-geometry helpers ---- */
  _boxEdges(a, x, z, w, h, d, y0 = 0) {
    const x0 = x-w/2, x1 = x+w/2, z0 = z-d/2, z1 = z+d/2, y1 = y0+h;
    const c = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    for (const [i,j] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]) a.push(...c[i],...c[j]);
  }
  _boxFaces(a, x, z, w, h, d, y0 = 0) {
    const x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2,y1=y0+h;
    const v={a:[x0,y0,z0],b:[x1,y0,z0],c:[x1,y0,z1],d:[x0,y0,z1],e:[x0,y1,z0],f:[x1,y1,z0],g:[x1,y1,z1],h:[x0,y1,z1]};
    const q=(p,r,s,t)=>{a.push(...p,...r,...s,...p,...s,...t);};
    q(v.e,v.f,v.g,v.h); q(v.a,v.b,v.f,v.e); q(v.b,v.c,v.g,v.f); q(v.c,v.d,v.h,v.g); q(v.d,v.a,v.e,v.h);
  }
  _lines(arr, color, opacity) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  }
  _mesh(arr, color, opacity) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  }
  _polyline(pts, y, color, opacity, close = false) {
    const arr = [];
    for (let i = 0; i < pts.length - 1; i++) arr.push(pts[i][0], y, pts[i][1], pts[i+1][0], y, pts[i+1][1]);
    if (close && pts.length > 2) arr.push(pts[pts.length-1][0], y, pts[pts.length-1][1], pts[0][0], y, pts[0][1]);
    return this._lines(arr, color, opacity);
  }

  /** Build the whole city from a per-city holo spec. */
  setCity(city) {
    this.city.clear();
    this.labelAnchors = [];
    const H = city.holo || {};
    const A = new THREE.Color(city.accent), A2 = new THREE.Color(city.accent2);

    // seeded RNG so a city looks identical each visit
    let seed = 20260101 ^ [...city.id].reduce((a,c)=>a+c.charCodeAt(0),0);
    const rnd = () => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; };

    // --- street grid (bounded) ---
    const streets = [];
    const EXT = 84, STEP = 8;
    for (let g = -EXT; g <= EXT; g += STEP) {
      streets.push(-EXT, 0.02, g, EXT, 0.02, g);
      streets.push(g, 0.02, -EXT, g, 0.02, EXT);
    }
    this.city.add(this._lines(streets, A, 0.07));

    // --- features (water, avenues, relief lines) ---
    for (const f of (H.features || [])) {
      if (f.kind === 'river' || f.kind === 'coast' || f.kind === 'lake') {
        this.city.add(this._polyline(f.pts, 0.15, WATER, 0.9));
        this.city.add(this._polyline(f.pts, 0.05, WATER, 0.25));  // faint doubling = width
      } else if (f.kind === 'avenue') {
        this.city.add(this._polyline(f.pts, 0.2, A2, 0.8));
      }
      if (f.name) this._addLabel(f.name, avg(f.pts)[0], 3, avg(f.pts)[1], 'feature');
    }

    // --- districts ---
    const edges = [], fills = [], spikes = [];
    for (const D of (H.districts || [])) {
      const kind = D.kind || 'mid';
      if (kind === 'green') {
        // park / palace grounds / lake — a translucent green disc, no towers
        const disc = new THREE.Mesh(new THREE.CircleGeometry(D.r, 40),
          new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
        disc.rotation.x = -Math.PI/2; disc.position.set(D.x, 0.1, D.z);
        this.city.add(disc);
        this.city.add(this._polyline(ring(D.x, D.z, D.r, 40), 0.12, GREEN, 0.7, true));
        this._addLabel(D.name, D.x, 5, D.z, 'green');
        continue;
      }
      const n = D.n || 20, hlo = D.hlo ?? 8, hhi = D.hhi ?? 24;
      let maxH = 0;
      for (let i = 0; i < n; i++) {
        const ang = rnd()*Math.PI*2, rr = Math.sqrt(rnd())*D.r;
        const x = D.x + Math.cos(ang)*rr, z = D.z + Math.sin(ang)*rr;
        const w = 2.4 + rnd()*3.2, d = 2.4 + rnd()*3.2;
        const h = hlo + rnd()*(hhi-hlo);
        this._boxEdges(edges, x, z, w, h, d);
        this._boxFaces(fills, x, z, w, h, d);
        if (h > maxH) maxH = h;
      }
      // spikes (minarets / signal towers) sprinkled in
      for (let i = 0; i < (D.spikes||0); i++) {
        const ang = rnd()*Math.PI*2, rr = rnd()*D.r*0.8;
        const x = D.x+Math.cos(ang)*rr, z = D.z+Math.sin(ang)*rr, h = hhi*1.5 + rnd()*8;
        this._boxEdges(spikes, x, z, 1.1, h, 1.1);
        if (h > maxH) maxH = h;
      }
      this._addLabel(D.name, D.x, maxH + 8, D.z, 'district');
    }
    this.city.add(this._lines(edges, A, 0.95));
    this.city.add(this._mesh(fills, A, 0.11));      // brighter fill compensates for no bloom
    if (spikes.length) this.city.add(this._lines(spikes, A2, 0.98));

    // --- signature landmarks ---
    for (const s of (H.specials || [])) this._addSpecial(s, A, A2);

    // --- rising data motes ---
    const P = 240, pos = new Float32Array(P*3);
    for (let i=0;i<P;i++){ const a=rnd()*Math.PI*2, r=rnd()*EXT; pos.set([Math.cos(a)*r, rnd()*70, Math.sin(a)*r], i*3); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos,3));
    this.motes = new THREE.Points(pg, new THREE.PointsMaterial({ color:A, size:0.7, transparent:true, opacity:0.6, blending:THREE.AdditiveBlending, depthWrite:false }));
    this.city.add(this.motes);

    // --- sweeping scan ring ---
    const ring0 = new THREE.Mesh(new THREE.TorusGeometry(EXT*1.05, 0.4, 8, 110),
      new THREE.MeshBasicMaterial({ color:A2, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false }));
    ring0.rotation.x = Math.PI/2; this.scan = ring0; this.city.add(ring0);

    this.spin = 0; this.targetSpin = 0; this.city.rotation.y = 0;
  }

  _addSpecial(s, A, A2) {
    let mesh, edgeColor = A2, y = 0;
    const g = (() => {
      switch (s.kind) {
        case 'pyramid': { const c = new THREE.ConeGeometry(s.size, s.h, 4); y = s.h/2; edgeColor = A; return c; }
        case 'volcano': { const c = new THREE.CylinderGeometry(s.size*0.28, s.size, s.h, 5); y = s.h/2; edgeColor = SNOW; return c; }
        case 'spire':   { const c = new THREE.ConeGeometry(s.size, s.h, 4); y = s.h/2; edgeColor = A2; return c; }
        case 'ring':    { const c = new THREE.CylinderGeometry(s.size, s.size*1.05, s.h, 24, 1, true); y = s.h/2; edgeColor = A2; return c; }
        case 'dome':    { const c = new THREE.SphereGeometry(s.size, 20, 12, 0, Math.PI*2, 0, Math.PI/2); y = s.h; edgeColor = A; return c; }
        default:        { const c = new THREE.BoxGeometry(s.size, s.h, s.size); y = s.h/2; return c; }
      }
    })();
    if (s.kind === 'pyramid' || s.kind === 'spire') g.rotateY(Math.PI/4);
    // faint fill
    const fill = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: edgeColor, transparent:true, opacity:0.2, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
    fill.position.set(s.x, y, s.z);
    // bright wireframe
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: edgeColor, transparent:true, opacity:0.95 }));
    wire.position.set(s.x, y, s.z);
    this.city.add(fill, wire);
    // beacon for tall things
    if (s.kind === 'spire' || s.kind === 'volcano') {
      const b = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 10), new THREE.MeshBasicMaterial({ color: s.kind==='volcano' ? '#ff5a3c' : edgeColor }));
      b.position.set(s.x, s.h + 2, s.z); this.city.add(b);
    }
    if (s.name) this._addLabel(s.name, s.x, s.h + 7, s.z, 'special');
  }

  _addLabel(name, x, y, z, kind) {
    const o = new THREE.Object3D(); o.position.set(x, y, z); this.city.add(o);
    this.labelAnchors.push({ name, kind, obj: o });
  }

  project(obj) {
    const world = obj.getWorldPosition(new THREE.Vector3());
    const front = world.z > -12;
    const v = world.clone().project(this.camera);
    return { x: (v.x*0.5+0.5)*this.w, y: (-v.y*0.5+0.5)*this.h, visible: front && v.z < 1 };
  }

  _bindDrag() {
    const c = this.canvas; let px = 0;
    const down = e => { this.dragging = true; this.autos = false; px = e.clientX; c.setPointerCapture?.(e.pointerId); };
    const move = e => { if (!this.dragging) return; this.targetSpin += (e.clientX - px)*0.006; px = e.clientX; };
    const up = e => { this.dragging = false; c.releasePointerCapture?.(e.pointerId); setTimeout(()=>{ this.autos = true; }, 3000); };
    c.addEventListener('pointerdown', down);
    this._move = move; this._up = up;
    addEventListener('pointermove', move); addEventListener('pointerup', up);
    c.addEventListener('wheel', e => e.preventDefault(), { passive:false });
  }

  _resize() {
    this.w = innerWidth; this.h = innerHeight;
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w/this.h; this.camera.updateProjectionMatrix();
  }

  start(onFrame = () => {}) {
    if (this.running) return; this.running = true;
    let last = performance.now(); let first = true;
    const tick = now => {
      if (!this.running) return;
      const dt = Math.min((now-last)/1000, 0.05); last = now;
      if (this.autos && !this.dragging) this.targetSpin += dt*0.09;
      this.spin += (this.targetSpin - this.spin)*0.08;
      this.city.rotation.y = this.spin;
      if (this.motes) { const p = this.motes.geometry.attributes.position;
        for (let i=0;i<p.count;i++){ let y=p.getY(i)+dt*5; if (y>72) y=0; p.setY(i,y);} p.needsUpdate = true; }
      if (this.scan) { let y = this.scan.position.y + dt*13; if (y>76) y=0; this.scan.position.y = y; this.scan.material.opacity = 0.55*(1-y/76); }
      try { this.renderer.render(this.scene, this.camera); }
      catch (e) { this.running = false; if (this.onError) this.onError(e); return; }
      if (first) { first = false; if (this.onFirstFrame) this.onFirstFrame(); }
      onFrame();
      requestAnimationFrame(tick);
    };
    // Paint the FIRST frame synchronously rather than waiting for rAF. On a
    // backgrounded/throttled/slow tab rAF can be delayed indefinitely, which
    // left the hologram unrendered (a black "not loading" screen). Rendering
    // once immediately guarantees the city appears the instant it is opened;
    // rAF then takes over the animation.
    tick(performance.now());
  }
  stop() { this.running = false; }
  dispose() { this.stop(); removeEventListener('resize', this._onResize); removeEventListener('pointermove', this._move); removeEventListener('pointerup', this._up); }
}

function avg(pts){ let x=0,z=0; for(const p of pts){x+=p[0];z+=p[1];} return [x/pts.length, z/pts.length]; }
function ring(cx,cz,r,seg){ const a=[]; for(let i=0;i<=seg;i++){ const t=i/seg*Math.PI*2; a.push([cx+Math.cos(t)*r, cz+Math.sin(t)*r]); } return a; }

/* ============================ THE HUD ================================= */

const TABS = [
  { id:'overview',  label:'Overview'  },
  { id:'chronicle', label:'Timeline'  },
  { id:'dynasties', label:'Dynasties' },
  { id:'culture',   label:'Culture'   },
  { id:'dossier',   label:'Dossier'   },
];

const TYPE_META = {
  major:    { label:'Major',    color:'#ffd54a' },
  politics: { label:'Politics', color:'#59c2ff' },
  conflict: { label:'Conflict', color:'#ff5d5d' },
  culture:  { label:'Culture',  color:'#8be36b' },
  disaster: { label:'Disaster', color:'#ffa23a' },
  growth:   { label:'Growth',   color:'#c58bff' },
};

let holo = null, root = null, onReturn = null, current = null, clockTimer = null, tlFilter = 'all';

const sec = (c, id) => c.sections.find(s => s.id === id);
const sblock = s => s ? `<div class="cvs"><div class="cvs-h"><span class="ic">${s.icon}</span><span class="slash">//</span>${s.title}</div>${s.html}</div>` : '';

function timelineHTML(city) {
  const counts = { all: city.timeline.length };
  for (const e of city.timeline) counts[e.type] = (counts[e.type]||0) + 1;
  const chips = ['all', ...Object.keys(TYPE_META)].map(f => {
    const meta = f === 'all' ? { label:'All', color:'#cfe0ec' } : TYPE_META[f];
    const c = counts[f] || 0;
    return `<button class="tl-chip${f==='all'?' on':''}" data-f="${f}" ${c===0?'disabled':''}>
      <span class="dot" style="background:${meta.color}"></span>${meta.label}<span class="ct">${c}</span></button>`;
  }).join('');
  const items = city.timeline.map(e => {
    const m = TYPE_META[e.type] || TYPE_META.major;
    return `<li class="tl-item" data-type="${e.type}" style="--tc:${m.color}">
      <span class="yr">${e.yr}</span>
      <div class="ev"><span class="tag">${m.label}</span>${e.text}</div></li>`;
  }).join('');
  return `<div class="cv-tlwrap">
    <div class="tl-filter">${chips}</div>
    <p class="cv-note" style="margin:2px 0 12px">A dense, curated record — every documented turning point across ${city.timeline.length} entries, colour-coded by kind. Filter by category above.</p>
    <ul class="cv-tl">${items}</ul></div>`;
}

function tabHTML(city, tab) {
  if (tab === 'overview') {
    const data = city.quickfacts.map(f => `<div class="cell"><div class="k">${f.label}</div><div class="v">${f.value}</div></div>`).join('');
    const dz = (city.holo?.districts || []).map(d => `<span class="cv-chip">${d.name}</span>`).join('');
    const lms = city.landmarks.map(l => `<div class="cv-card"><h4>${l.name}</h4><p>${l.note}</p></div>`).join('');
    return `<div class="cv-data">${data}</div>
      ${sblock(sec(city,'overview'))}${sblock(sec(city,'geography'))}
      ${dz ? `<div class="cvs"><div class="cvs-h"><span class="ic">▚</span><span class="slash">//</span>Districts mapped</div><div class="cv-chips">${dz}</div></div>`:''}
      <div class="cvs"><div class="cvs-h"><span class="ic">◈</span><span class="slash">//</span>Landmarks</div>${lms}</div>`;
  }
  if (tab === 'chronicle') {
    return `${timelineHTML(city)}
      ${sblock(sec(city,'founding'))}${sblock(sec(city,'wars'))}`;
  }
  if (tab === 'dynasties') {
    const fam = city.families.map((f,i) => `<div class="cv-card"><h4>${f.name}</h4><div class="role">${f.role} <span class="idx">· FILE ${String(i+1).padStart(2,'0')}</span></div><p>${f.text}</p></div>`).join('');
    return `<div class="cvs"><div class="cvs-h"><span class="ic">♛</span><span class="slash">//</span>Founding families &amp; dynasties</div>
      <p class="cv-lede">The houses that built the city — and, through it, much of a nation.</p>${fam}</div>`;
  }
  if (tab === 'culture') {
    return `${sblock(sec(city,'culture'))}${sblock(sec(city,'food'))}${sblock(sec(city,'animals'))}${sblock(sec(city,'religion'))}${sblock(sec(city,'language'))}`;
  }
  const figs = city.figures.map(f => `<div class="cv-card"><h4>${f.name}<span class="dates">${f.dates}</span></h4><div class="role">${f.role}</div><p>${f.note}</p></div>`).join('');
  const links = city.links.map(l => `<li><a href="${l.url}" target="_blank" rel="noopener">${l.title}</a><span class="st">${l.type}</span></li>`).join('');
  return `${sblock(sec(city,'resources'))}
    <div class="cvs"><div class="cvs-h"><span class="ic">◉</span><span class="slash">//</span>Personnel</div>${figs}</div>
    <div class="cvs"><div class="cvs-h"><span class="ic">⚿</span><span class="slash">//</span>Sources &amp; further reading</div>
      <p class="cv-note">All prose is original; these credible primary and reference sources let you verify and go deeper.</p>
      <ul class="cv-links">${links}</ul></div>`;
}

function bindTimeline() {
  const wrap = root.querySelector('.cv-tlwrap'); if (!wrap) return;
  wrap.querySelectorAll('.tl-chip').forEach(ch => ch.addEventListener('click', () => {
    tlFilter = ch.dataset.f;
    wrap.querySelectorAll('.tl-chip').forEach(c => c.classList.toggle('on', c === ch));
    wrap.querySelectorAll('.tl-item').forEach(li => {
      li.style.display = (tlFilter === 'all' || li.dataset.type === tlFilter) ? '' : 'none';
    });
  }));
}

function renderTab(tab) {
  root.querySelectorAll('.cv-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const panel = root.querySelector('.cv-panel');
  panel.innerHTML = `<div class="cv-content">${tabHTML(current, tab)}</div>`;
  panel.scrollTop = 0;
  if (tab === 'chronicle') { tlFilter = 'all'; bindTimeline(); }
}

function buildShell() {
  root = document.createElement('div');
  root.id = 'cityview'; root.hidden = true;
  root.innerHTML = `
    <canvas id="holo"></canvas>
    <div class="holo-labels"></div>
    <div class="cv-vignette"></div>
    <div class="cv-scanlines"></div>
    <div class="cv-flicker"></div>
    <div class="cv-frame"><i></i></div>

    <div class="cv-stage-title">
      <p class="cv-kicker"><span class="blip"></span> Holographic City Feed · Live</p>
      <h1 class="cv-title"></h1>
      <p class="cv-sub"><span class="native"></span> · <span class="country"></span></p>
      <p class="cv-tag"></p>
    </div>
    <div class="cv-hint">◐ Drag to rotate · Zoom disabled · Labels = districts &amp; landmarks</div>

    <aside class="cv-console">
      <div class="cv-console-top">
        <button class="cv-return">◄ Return to orbit</button>
        <div class="cv-clock"></div>
      </div>
      <div class="cv-readout"></div>
      <div class="cv-tabs">${TABS.map((t,i)=>`<button class="cv-tab" data-tab="${t.id}"><span class="num">${String(i+1).padStart(2,'0')}</span>${t.label}</button>`).join('')}</div>
      <div class="cv-panel"></div>
    </aside>

    <div class="cv-init"><span class="spin"></span>Initialising hologram…</div>
  `;
  document.body.appendChild(root);
  // Creating a second WebGL context can fail on some GPUs/browsers; if it does,
  // tear the shell back down and rethrow so the caller can restore the globe.
  try {
    holo = new HoloScene(root.querySelector('#holo'));
  } catch (e) {
    root.remove(); root = null; holo = null;
    throw e;
  }
  holo.onError = (e) => { console.error('Hologram render error:', e); showFatal(e); };
  root._labels = root.querySelector('.holo-labels');
  root.querySelector('.cv-return').addEventListener('click', () => close());
  root.querySelectorAll('.cv-tab').forEach(b => b.addEventListener('click', () => renderTab(b.dataset.tab)));
}

function showFatal(e) {
  if (!root) return;
  const init = root.querySelector('.cv-init');
  if (init) {
    init.classList.add('err');
    init.innerHTML = `⚠ The holographic view could not render on this device.<br><small>${(e && e.message) || e}</small><br><button class="cv-return" style="margin-top:14px">◄ Return to orbit</button>`;
    init.querySelector('button').addEventListener('click', () => close());
    init.style.display = 'flex';
  }
}

function layoutLabels() {
  if (!current || !root) return;
  const els = root._labelEls || [];
  for (let i = 0; i < els.length; i++) {
    const a = holo.labelAnchors[i]; if (!a) continue;
    const { x, y, visible } = holo.project(a.obj);
    els[i].classList.toggle('behind', !visible);
    els[i].style.left = x + 'px'; els[i].style.top = y + 'px';
  }
}

function startClock() {
  const elc = root.querySelector('.cv-clock');
  const tz = current.stats.find(s => s.k === 'Time zone')?.v || '';
  const tick = () => { elc.innerHTML = `<b>${new Date().toLocaleTimeString('en-GB')}</b> · ${tz} · ${current.coords[0].toFixed(2)}°, ${current.coords[1].toFixed(2)}°`; };
  tick(); clearInterval(clockTimer); clockTimer = setInterval(tick, 1000);
}

export function openCityView(city, onRet) {
  if (!root) buildShell();       // may throw if WebGL is unavailable
  current = city; onReturn = onRet;

  const init = root.querySelector('.cv-init');
  init.className = 'cv-init'; init.innerHTML = '<span class="spin"></span>Initialising hologram…'; init.style.display = 'flex';
  holo.onFirstFrame = () => { init.style.display = 'none'; };

  root.style.setProperty('--acc', city.accent);
  root.style.setProperty('--acc2', city.accent2);

  root.querySelector('.cv-title').textContent = city.name;
  root.querySelector('.native').textContent = city.native;
  root.querySelector('.country').textContent = city.country;
  root.querySelector('.cv-tag').textContent = city.tagline;

  root.querySelector('.cv-readout').innerHTML = city.stats.map(s =>
    `<div class="ro"><div class="k">${s.k}</div><div class="v">${s.v}</div></div>`).join('');

  holo.setCity(city);

  // build a DOM label per hologram anchor (districts, landmarks, features)
  root._labels.innerHTML = holo.labelAnchors.map(a =>
    `<div class="holo-label k-${a.kind}"><div class="pin"></div><div class="txt">${a.name}</div></div>`).join('');
  root._labelEls = [...root._labels.querySelectorAll('.holo-label')];

  renderTab('overview');
  startClock();

  root.hidden = false; root.classList.remove('closing');
  holo.start(layoutLabels);
}

function close() {
  if (!root) return;
  root.classList.add('closing');
  holo.stop();
  clearInterval(clockTimer);
  setTimeout(() => { root.hidden = true; root.classList.remove('closing'); if (onReturn) onReturn(); }, 300);
}

export function closeCityView() { close(); }
