/**
 * main.js — application entry point.
 *
 * Loads the four data files, builds the scene and its layers, and connects the
 * globe to the panels. Everything below this file is independent of everything
 * else: the boundary layer knows nothing about the sidebar, the city table
 * knows nothing about three.js. This is the only place that knows about both.
 */

import * as THREE from 'three';
import { GlobeScene } from './globe/scene.js';
import { BoundaryLayer } from './layers/boundaries.js';
import { CityLayer } from './layers/cities.js';
import { CityTable } from './data/cities.js';
import { Browser } from './ui/browser.js';
import { DetailsPanel } from './ui/details.js';
import { CityView } from './city/cityview.js';
import { formatInt, formatLatLon } from './util/geo.js';

const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------------- *
 * Loading
 * ---------------------------------------------------------------- */

const loadingEl = $('loading');
const fillEl = $('loading-fill');
const statusEl = $('loading-status');

let loadStep = 0;
const LOAD_STEPS = 6;
function progress(message) {
  loadStep++;
  fillEl.style.width = `${Math.min(100, (loadStep / LOAD_STEPS) * 100)}%`;
  statusEl.textContent = message;
}

async function fetchJson(url, message) {
  progress(message);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

/* ---------------------------------------------------------------- *
 * Boot
 * ---------------------------------------------------------------- */

async function main() {
  let manifest, countriesGeo, statesGeo, citiesJson, countryInfo, cityHistory;
  try {
    // Sequential rather than parallel: these total ~9 MB and the status line is
    // more useful than the few hundred milliseconds concurrency would save.
    manifest = await fetchJson('data/manifest.json', 'Reading manifest…');
    countriesGeo = await fetchJson('data/countries.geojson', 'Loading country borders…');
    statesGeo = await fetchJson('data/states.geojson', 'Loading states and provinces…');
    citiesJson = await fetchJson('data/cities.json', 'Loading cities…');
    countryInfo = await fetchJson('data/countryinfo.json', 'Loading country details…');
    // Optional: absent index just means no city has a history view yet.
    cityHistory = await fetch('data/cities/index.json')
      .then((r) => (r.ok ? r.json() : { cities: {} }))
      .then((j) => j.cities || {})
      .catch(() => ({}));
  } catch (err) {
    statusEl.innerHTML =
      `Could not load the data files.<br><br>` +
      `<span style="color:#ff8b8b">${err.message}</span><br><br>` +
      `Open this page through a web server (<code>npm run serve</code>) rather ` +
      `than as a <code>file://</code> URL.`;
    console.error(err);
    return;
  }

  progress('Building the globe…');

  const cities = new CityTable(citiesJson);

  // The texture loader reports through the same progress bar, so the bar does
  // not sit at 100% while a 1 MB JPEG is still decoding.
  const manager = new THREE.LoadingManager();
  const scene = new GlobeScene($('globe'), manager);

  const boundaries = scene.add(new BoundaryLayer(countriesGeo, statesGeo));
  const cityLayer = scene.add(new CityLayer(cities, $('labels')));

  manager.onLoad = () => {
    loadingEl.classList.add('done');
    setTimeout(() => { loadingEl.style.display = 'none'; }, 600);
  };
  // If a texture 404s the manager never fires onLoad; do not trap the user
  // behind a loading screen forever.
  manager.onError = (url) => {
    console.error('texture failed:', url);
    loadingEl.classList.add('done');
    setTimeout(() => { loadingEl.style.display = 'none'; }, 600);
  };

  scene.start();

  /* -------------------------------------------------------------- *
   * Selection state
   * -------------------------------------------------------------- */

  const details = new DetailsPanel($('details'), $('details-body'), {
    cities,
    countryInfo,
    cityHistory,
    boundaries,
    onAction: handleAction,
  });

  const browser = new Browser(
    {
      list: $('list'),
      title: $('list-title'),
      count: $('list-count'),
      breadcrumb: $('breadcrumb'),
      search: $('search'),
    },
    { cities, countries: boundaries.countries, states: boundaries.states, countryInfo },
    {
      onCountry: (i) => selectCountry(i, { fly: true }),
      onState: (i) => selectState(i, { fly: true }),
      onCity: (i) => selectCity(i, { fly: true }),
    },
  );

  // Cities with a history file get a sub-view. Which ones have one is decided
  // by whether the fetch succeeds, not by a hard-coded list here — adding a
  // city means adding data files, not editing this.
  const cityView = new CityView($('cityview'), {
    onClose: () => {
      scene.start();
      document.body.classList.remove('cityview-open');
    },
  });

  async function openCityView(cityIndex) {
    const c = cities.get(cityIndex);
    const entry = cityHistory[String(c.id)];
    if (!entry) return false;
    const slug = entry.id;
    document.body.classList.add('cityview-open');
    // Stop the globe first: two WebGL contexts rendering at once for a view
    // only one of which is visible is pure waste.
    scene.stop();
    const ok = await cityView.show(slug);
    if (!ok) {
      scene.start();
      document.body.classList.remove('cityview-open');
    }
    return ok;
  }

  function selectCountry(index, { fly = false } = {}) {
    const f = boundaries.countries[index];
    if (!f) return;
    boundaries.setSelection('country', index);
    cityLayer.selectCity(-1);
    details.showCountry(f, index);
    browser.highlight('country', index);
    if (fly) {
      const p = f.properties;
      // Natural Earth ships a hand-placed label anchor, which sits far better
      // than a bounding-box centre for awkward shapes like Norway or Chile.
      const lat = Number(p.LABEL_Y);
      const lon = Number(p.LABEL_X);
      if (Number.isFinite(lat) && Number.isFinite(lon)) scene.flyTo(lat, lon, 2.2);
    }
  }

  function selectState(index, { fly = false } = {}) {
    const f = boundaries.states[index];
    if (!f) return;
    boundaries.setSelection('state', index);
    cityLayer.selectCity(-1);
    details.showState(f, index);
    browser.highlight('state', index);
    if (fly) {
      const lat = Number(f.properties.latitude);
      const lon = Number(f.properties.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) scene.flyTo(lat, lon, 1.45);
    }
  }

  function selectCity(index, { fly = false } = {}) {
    if (index < 0 || index >= cities.count) return;
    cityLayer.selectCity(index);
    details.showCity(index);
    browser.highlight('city', index);

    // Selecting a city also selects the division containing it, so the map
    // shows where it sits rather than just a lone dot.
    const c = cities.get(index);
    const si = boundaries.states.findIndex((f) => f.properties.adm1_code === c.adm1);
    boundaries.setSelection(si >= 0 ? 'state' : null, si);

    if (fly) scene.flyTo(c.lat, c.lon, 1.16);
  }

  function handleAction(action, data) {
    const i = Number(data.index);
    switch (action) {
      case 'states':          browser.showStates(data.a3); break;
      case 'country-cities':  browser.showCountryCities(data.a3); break;
      case 'state-cities':    browser.showStateCities(data.code); break;
      case 'country':         selectCountry(i, { fly: true }); break;
      case 'state':           selectState(i, { fly: true }); break;
      case 'city':            selectCity(i, { fly: true }); break;
      case 'fly-city': {
        const c = cities.get(i);
        scene.flyTo(c.lat, c.lon, 1.1);
        break;
      }
      case 'city-history': openCityView(i); break;
    }
  }

  /* -------------------------------------------------------------- *
   * Globe interaction
   * -------------------------------------------------------------- */

  const canvas = $('globe');
  const readCoords = $('readout-coords');
  const readPlace = $('readout-place');

  let pointerDown = null;
  let hoverThrottle = 0;

  canvas.addEventListener('pointerdown', (e) => {
    pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!pointerDown) return;
    const moved = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y);
    const held = performance.now() - pointerDown.t;
    pointerDown = null;
    // Distinguish a click from the end of a drag. Rotating the globe should
    // never change the selection.
    if (moved > 5 || held > 400) return;

    const hit = scene.pick(e.clientX, e.clientY);
    if (!hit) { return; }

    // A click near a visible city marker means that city; otherwise it means
    // the region under the cursor.
    //
    // The test that matters is in *pixels*, not kilometres. A generous
    // kilometre radius is only used to gather a candidate — at globe scale it
    // spans over a thousand kilometres, so on its own it would let a click in
    // the middle of the Caribbean select San José. What decides it is whether
    // the click actually landed on the marker as drawn.
    const candidate = cities.nearest(hit.lat, hit.lon, Math.max(50, scene.altitude * 900),
      (i) => cityLayer.isVisibleAt(i, scene.altitude));

    if (candidate) {
      const c = cities.get(candidate.index);
      const at = scene.project(c.lat, c.lon);
      // Markers top out around 9 px across; 20 px gives a comfortable target
      // without swallowing clicks meant for the region underneath.
      if (at && Math.hypot(at.x - e.clientX, at.y - e.clientY) <= 20) {
        selectCity(candidate.index);
        return;
      }
    }

    const loc = boundaries.locate(hit.lat, hit.lon);
    // Below the state fade-in altitude a click means the division; above it,
    // where divisions are not even drawn, it means the country.
    if (loc.state && scene.altitude < 1.35) selectState(loc.stateIndex);
    else if (loc.country) selectCountry(loc.countryIndex);
  });

  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - hoverThrottle < 60) return;
    hoverThrottle = now;

    const hit = scene.pick(e.clientX, e.clientY);
    if (!hit) {
      readCoords.textContent = '—';
      readPlace.textContent = '';
      boundaries.setHover(null, -1);
      return;
    }

    readCoords.textContent = formatLatLon(hit.lat, hit.lon);
    const loc = boundaries.locate(hit.lat, hit.lon);

    const useState = loc.state && scene.altitude < 1.35;
    boundaries.setHover(useState ? 'state' : 'country',
      useState ? loc.stateIndex : loc.countryIndex);

    readPlace.textContent = loc.country
      ? (useState
          ? `${loc.state.properties.name_en || loc.state.properties.name}, ${loc.country.properties.NAME}`
          : loc.country.properties.NAME)
      : 'Ocean';
  });

  canvas.addEventListener('pointerleave', () => boundaries.setHover(null, -1));

  /* -------------------------------------------------------------- *
   * Panels and controls
   * -------------------------------------------------------------- */

  const searchEl = $('search');
  let searchTimer = 0;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    // Debounced: every keystroke otherwise scans 34k strings and rebuilds the
    // list, which is survivable but makes typing feel sticky.
    searchTimer = setTimeout(() => browser.search(searchEl.value), 140);
  });
  searchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { searchEl.value = ''; browser.showCountries(); }
  });

  $('details-close').addEventListener('click', () => {
    details.hide();
    boundaries.setSelection(null, -1);
    cityLayer.selectCity(-1);
  });

  const sidebar = $('sidebar');
  const showBtn = $('sidebar-show');
  const setSidebar = (open) => {
    sidebar.classList.toggle('collapsed', !open);
    document.body.classList.toggle('sidebar-collapsed', !open);
    showBtn.hidden = open;
  };
  $('sidebar-toggle').addEventListener('click', () => setSidebar(false));
  showBtn.addEventListener('click', () => setSidebar(true));

  const controlsToggle = $('controls-toggle');
  const controlsBody = $('controls-body');
  controlsToggle.addEventListener('click', () => {
    const open = controlsToggle.getAttribute('aria-expanded') === 'true';
    controlsToggle.setAttribute('aria-expanded', String(!open));
    controlsBody.hidden = open;
  });

  // Data credits. The toggle expands the detail; the trigger itself is always
  // on screen, because CC BY 4.0 makes the GeoNames credit a licence condition
  // rather than a nicety. Do not make this dismissable.
  const creditsToggle = $('credits-toggle');
  const creditsBody = $('credits-body');
  creditsToggle.addEventListener('click', () => {
    const open = creditsToggle.getAttribute('aria-expanded') === 'true';
    creditsToggle.setAttribute('aria-expanded', String(!open));
    creditsBody.hidden = open;
  });

  $('t-countries').addEventListener('change', (e) => boundaries.setCountriesVisible(e.target.checked));
  $('t-states').addEventListener('change', (e) => boundaries.setStatesVisible(e.target.checked));
  $('t-cities').addEventListener('change', (e) => cityLayer.setEnabled(e.target.checked));
  $('t-sun').addEventListener('change', (e) => { scene.sunFollowsCamera = e.target.checked; });

  $('s-relief').addEventListener('input', (e) => {
    scene.earthMaterial.uniforms.uReliefScale.value = Number(e.target.value);
  });
  $('s-marker').addEventListener('input', (e) => {
    cityLayer.material.uniforms.uSizeScale.value = Number(e.target.value);
  });

  // Keyboard: / focuses search, Escape clears the selection.
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchEl) {
      e.preventDefault();
      setSidebar(true);
      searchEl.focus();
      searchEl.select();
    } else if (e.key === 'Escape' && document.activeElement !== searchEl) {
      details.hide();
      boundaries.setSelection(null, -1);
      cityLayer.selectCity(-1);
    }
  });

  // The hint has done its job once the user has actually moved the globe.
  const hint = $('hint');
  const dismissHint = () => {
    hint.classList.add('hidden');
    canvas.removeEventListener('pointerdown', dismissHint);
    canvas.removeEventListener('wheel', dismissHint);
  };
  canvas.addEventListener('pointerdown', dismissHint, { once: true });
  canvas.addEventListener('wheel', dismissHint, { once: true });
  setTimeout(dismissHint, 12000);

  /* -------------------------------------------------------------- *
   * Footer stats
   * -------------------------------------------------------------- */

  $('stats').textContent =
    `${formatInt(boundaries.countries.length)} countries · ` +
    `${formatInt(boundaries.states.length)} divisions · ` +
    `${formatInt(cities.count)} cities`;
  $('stats').title = `Data built ${new Date(manifest.builtAt).toLocaleDateString()}`;

  // Handy for anyone poking at this from the console.
  window.globe = { scene, boundaries, cityLayer, cities, browser, details, cityView, manifest };
}

main().catch((err) => {
  console.error(err);
  statusEl.textContent = `Failed to start: ${err.message}`;
});
