/* app.js — wires the login gate, the globe, the markers and the dossiers. */

import { Globe } from './globe.js';
import { CITIES } from './cities.js';
import { openCityView } from './cityview.js';
import { verify, register, setSession, getSession, clearSession } from './auth.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

/* ----------------------------- LOGIN GATE ----------------------------- */
const gate = $('#gate');
const app = $('#app');
const form = $('#login-form');
const msg = $('#login-msg');
const btn = $('#login-btn');

function enterApp(user) {
  gate.style.display = 'none';
  app.hidden = false;
  $('#who').textContent = `${user.username} · ${user.role}`;
  startGlobe();
}

function shakeCard() {
  const card = $('.gate-card');
  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 450);
}

function succeed(user, message, panelMsg) {
  panelMsg.textContent = message;
  panelMsg.className = 'gate-msg ok';
  setSession(user);
  setTimeout(() => enterApp(user), 400);
}

// --- Log in / Sign up tab toggle ---
const signupForm = $('#signup-form');
const signupBtn = $('#signup-btn');
const signupMsg = $('#signup-msg');

document.querySelectorAll('.gate-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.mode;
    document.querySelectorAll('.gate-tab').forEach(t => {
      const on = t === tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    form.hidden = mode !== 'login';
    signupForm.hidden = mode !== 'signup';
    msg.textContent = ''; signupMsg.textContent = '';
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  msg.className = 'gate-msg';
  btn.disabled = true;
  const user = await verify($('#u').value, $('#p').value);
  if (user) {
    succeed(user, 'Welcome.', msg);
  } else {
    btn.disabled = false;
    msg.textContent = 'Incorrect username or password.';
    shakeCard();
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  signupMsg.textContent = '';
  signupMsg.className = 'gate-msg';
  const u = $('#su').value, p = $('#sp').value, p2 = $('#sp2').value;
  if (p !== p2) { signupMsg.textContent = 'The two passwords do not match.'; shakeCard(); return; }
  signupBtn.disabled = true;
  try {
    const user = await register(u, p);
    succeed(user, 'Account created — welcome.', signupMsg);
  } catch (err) {
    signupBtn.disabled = false;
    signupMsg.textContent = err.message || 'Could not create the account.';
    shakeCard();
  }
});

$('#logout').addEventListener('click', () => { clearSession(); location.reload(); });

// Resume an existing session (per-tab) without re-typing.
const existing = getSession();
if (existing) enterApp(existing);

/* ------------------------------- GLOBE -------------------------------- */
let globe, started = false;
const markerLayer = $('#marker-layer');
const markerEls = [];    // parallel to CITIES
let activeId = null;

async function startGlobe() {
  if (started) return; started = true;
  globe = new Globe($('#globe'));

  const fill = $('#loading-fill');
  const status = $('#loading-status');
  try {
    await globe.load((p) => { fill.style.width = Math.round(10 + p * 85) + '%'; });
  } catch (err) {
    status.textContent = 'Could not load textures. Serve over HTTP: run "npm run serve" then open /atlas/.';
    console.error(err);
    return;
  }

  // Build markers + rail.
  CITIES.forEach((c, i) => {
    const anchor = globe.addMarker(c.coords[0], c.coords[1]);
    const m = el('button', 'marker' + (c.warm ? ' warm' : ''));
    m.innerHTML = `<span class="marker-dot"></span><span class="marker-label">${c.name}</span>`;
    m.addEventListener('click', () => openCity(c.id));
    markerLayer.appendChild(m);
    markerEls.push({ anchor, node: m });
  });
  buildRail();

  fill.style.width = '100%';
  status.textContent = 'Ready';
  $('#loading').classList.add('done');

  globe.start(layoutMarkers);
  // Start on the globe; the user clicks a city to enter its hologram.
}

function layoutMarkers() {
  for (let i = 0; i < markerEls.length; i++) {
    const { anchor, node } = markerEls[i];
    const { x, y, visible } = globe.project(anchor);
    node.classList.toggle('behind', !visible);
    node.style.left = x + 'px';
    node.style.top = y + 'px';
  }
}

/* -------------------------------- RAIL -------------------------------- */
function buildRail() {
  const list = $('#rail-list');
  list.innerHTML = '';
  CITIES.forEach((c) => {
    const b = el('button', 'rail-city');
    b.dataset.id = c.id;
    b.innerHTML = `<span class="rail-flag">${c.flag}</span>
      <span><span class="rail-name">${c.name}</span><br><span class="rail-sub">${c.country}</span></span>`;
    b.addEventListener('click', () => openCity(c.id));
    list.appendChild(b);
  });
}

function markActiveRail(id) {
  document.querySelectorAll('.rail-city').forEach(n => n.classList.toggle('active', n.dataset.id === id));
}

/* --------------------- CITY (holographic) VIEW ---------------------- */
// Selecting a city hands off from the globe to the full-screen hologram.
// The globe's render loop and its chrome (top bar, rail, markers, credit)
// are hidden while the hologram is up, and restored on return.

function setGlobeChrome(visible) {
  ['.topbar', '#city-rail', '#marker-layer', '.credit'].forEach(sel => {
    const n = document.querySelector(sel);
    if (n) n.style.display = visible ? '' : 'none';
  });
}

function restoreGlobe(c) {
  setGlobeChrome(true);
  markActiveRail(null);
  activeId = null;
  if (c) globe.focus(c.coords[0], c.coords[1]);   // leave the planet looking where we were
  globe.start();             // resume (keeps its stored per-frame marker layout)
}

function openCity(id) {
  const c = CITIES.find(x => x.id === id);
  if (!c) return;
  activeId = id;
  markActiveRail(id);
  globe.stop();              // two WebGL loops at once is wasteful; pause the globe
  setGlobeChrome(false);
  try {
    openCityView(c, () => restoreGlobe(c));   // onReturn — control handed back to the globe
  } catch (err) {
    // Hologram couldn't start (e.g. WebGL context limit) — never leave a blank
    // screen; put the user back on the globe with an explanation.
    console.error('City view failed to open:', err);
    restoreGlobe(null);
    alert('Sorry — the holographic city view could not start on this device.\n\n'
      + ((err && err.message) || err)
      + '\n\nThis usually means the browser ran out of WebGL contexts. Try closing other tabs or reloading.');
  }
}
