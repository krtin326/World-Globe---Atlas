/**
 * cityview.js — the city sub-view: 3D map on the left, history and timeline on
 * the right.
 *
 * Opens over the globe rather than replacing it, so returning is instant and
 * the globe keeps its state. The globe's render loop is stopped while this is
 * open — two WebGL contexts both running at 60 fps for no reason is the kind of
 * thing that makes a laptop fan audible.
 *
 * Everything shown is driven by `data/cities/<id>.json`. Adding a second city
 * means adding a data file and a coastline; no code here knows anything about
 * Mumbai specifically.
 */

import { CityMap } from './citymap.js';
import { PanelManager } from './panels.js';

const $ = (sel, root = document) => root.querySelector(sel);

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** "-250" reads as nonsense on a timeline; "250 BC" does not. */
function formatYear(event) {
  if (event.yearDisplay) return event.yearDisplay;
  return event.year < 0 ? `${Math.abs(event.year)} BC` : String(event.year);
}

export class CityView {
  /**
   * @param {HTMLElement} root  the overlay element
   * @param {{onClose: Function}} handlers
   */
  constructor(root, handlers = {}) {
    this.root = root;
    this.handlers = handlers;
    this.open = false;
    this.data = null;
    this.map = null;
    this.activeEvent = null;

    this.els = {
      canvas: $('#city-canvas', root),
      title: $('#city-title', root),
      subtitle: $('#city-subtitle', root),
      summary: $('#city-summary', root),
      figures: $('#city-figures', root),
      timeline: $('#city-timeline', root),
      panelsLayer: $('#city-panels', root),
      dock: $('.cv-dock', root),
      eras: $('#city-eras', root),
      label: $('#city-map-label', root),
      status: $('#city-status', root),
      close: $('#city-close', root),
      rotate: $('#city-rotate', root),
      wards: $('#city-wards', root),
      wardLabels: $('#city-ward-labels', root),
      divisions: $('#city-divisions', root),
      divisionsLabel: $('#city-divisions-label', root),
      families: $('#city-families', root),
      tabTimeline: $('#tab-timeline', root),
      tabFamilies: $('#tab-families', root),
      places: $('#city-places', root),
      poiLabels: $('#city-poi-labels', root),
      roads: $('#city-roads', root),
    };
    this._wardLabelPool = [];
    this._poiLabelPool = [];
    this.tab = 'timeline';

    this.els.close.addEventListener('click', () => this.close());
    this.els.rotate.addEventListener('click', () => this._toggleRotate());

    // Escape closes the city view before it closes anything else.
    this._onKey = (e) => {
      if (!this.open) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    };
    window.addEventListener('keydown', this._onKey, true);

    this.els.timeline.addEventListener('click', (e) => {
      const row = e.target.closest('[data-event]');
      if (row) this.selectEvent(Number(row.dataset.event));
    });

    this.els.eras.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-era]');
      if (chip) this.scrollToEra(chip.dataset.era);
    });

    this.els.wards.addEventListener('click', () => this._toggleWards());
    this.els.places.addEventListener('click', () => this._togglePlaces());
    this.els.roads.addEventListener('click', () => this._toggleRoads());

    // Floating-panel manager. The overlay element persists; the panels inside
    // it are created on open and torn down on close.
    this.panels = new PanelManager(this.els.panelsLayer, {
      onPin: (source) => this._pinPanel(source),
    });
    this.els.dock.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-panel]');
      if (btn) this._openPanel(btn.dataset.panel);
    });
    // Live pointer position over the map, for the coordinates panel.
    this._pointer = null;

    this.els.divisions.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-division]');
      if (chip) this.selectDivision(chip.dataset.division);
    });
    // Hovering the list previews the ward on the map without committing to it.
    this.els.divisions.addEventListener('pointerover', (e) => {
      const chip = e.target.closest('[data-division]');
      if (chip) this.map?.focusDivision(chip.dataset.division);
    });
    this.els.divisions.addEventListener('pointerleave', () => {
      this.map?.focusDivision(this.activeDivision || null);
    });

    this.els.tabTimeline.addEventListener('click', () => this._setTab('timeline'));
    this.els.tabFamilies.addEventListener('click', () => this._setTab('families'));

    this.els.families.addEventListener('click', (e) => {
      const card = e.target.closest('[data-family]');
      if (card) this.selectFamily(card.dataset.family);
    });
  }

  /* ------------------------------------------------------------------ *
   * Loading
   * ------------------------------------------------------------------ */

  /**
   * @param {string} id  city id, e.g. 'mumbai'
   * @returns {Promise<boolean>} false if this city has no history file
   */
  async show(id) {
    this.els.status.textContent = 'Loading…';
    this.root.hidden = false;
    // Force a reflow so the opening transition actually runs.
    void this.root.offsetWidth;
    this.root.classList.add('is-open');
    this.open = true;

    let data, land, divisions = null, places = null, roads = null;
    try {
      const [d, l, div, poi, rd] = await Promise.all([
        fetch(`data/cities/${id}.json`).then((r) => { if (!r.ok) throw new Error('no history'); return r.json(); }),
        fetch(`data/cities/${id}-land.geojson`).then((r) => { if (!r.ok) throw new Error('no coastline'); return r.json(); }),
        // Optional: a city without a divisions file simply has no ward layer.
        fetch(`data/cities/${id}-divisions.geojson`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        // Optional: the zoom-in POI layer.
        fetch(`data/cities/${id}-places.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        // Optional: roads + railway.
        fetch(`data/cities/${id}-roads.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      data = d; land = l; divisions = div; places = poi; roads = rd;
    } catch (err) {
      this.close();
      return false;
    }

    this.data = data;
    this._renderText();
    this._renderTimeline();

    this.map = new CityMap(this.els.canvas, data);
    this.map.setLand(land);
    if (divisions) {
      this.map.setDivisions(
        divisions,
        data.divisions?.nameField || 'NAME',
        Object.keys(data.divisions?.names || {}),
      );
    }
    if (roads) this.map.setRoads(roads);
    if (places) this.map.setPois(places);
    this.map.setPlaces(data.places);
    this.map.onFrame = () => {
      this._positionLabel();
      this._positionWardLabels();
      this._positionPoiLabels();
      this._updateCoordsPanel();
    };
    this.map.start();

    // Track the pointer over the map so the coordinates panel can read it.
    this._onPointerMove = (e) => { this._pointer = { x: e.clientX, y: e.clientY }; };
    this._onPointerLeave = () => { this._pointer = null; };
    this.els.canvas.addEventListener('pointermove', this._onPointerMove);
    this.els.canvas.addEventListener('pointerleave', this._onPointerLeave);

    // The live detail panel. Placed low-left, where the fixed card used to sit.
    this._openDetailPanel();

    this._renderDivisions(divisions);
    this._renderFamilies();
    this._setTab('timeline');

    const bits = [`${data.events.length} events`];
    if (data.dynasties?.list?.length) bits.push(`${data.dynasties.list.length} families`);
    if (places) bits.push(`${this.map.stats.pois} places`);
    if (roads) bits.push(`${this.map.stats.roads.toLocaleString()} road/rail ways`);
    if (divisions) bits.push(`${this.map.stats.divisions} ${data.divisions?.label || 'divisions'}`);
    this.els.status.textContent = bits.join(' · ');
    // Toggles only appear for layers that are actually present.
    this.els.places.hidden = !places;
    this.els.roads.hidden = !roads;

    // Open on the oldest event so the timeline reads as a story from the top.
    this.selectEvent(0);
    return true;
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove('is-open');

    // Tear down the floating panels and the pointer tracking immediately — they
    // are DOM, not WebGL, so there is nothing to wait for.
    this.panels?.destroy();
    if (this._onPointerMove) {
      this.els.canvas.removeEventListener('pointermove', this._onPointerMove);
      this.els.canvas.removeEventListener('pointerleave', this._onPointerLeave);
    }
    this._pointer = null;

    // Wait for the transition before tearing down WebGL, or the panel visibly
    // goes blank as it slides away.
    setTimeout(() => {
      if (this.open) return;
      this.root.hidden = true;
      this.map?.dispose();
      this.map = null;
      this.els.label.style.display = 'none';
    }, 320);

    this.handlers.onClose?.();
  }

  /* ------------------------------------------------------------------ *
   * Text panels
   * ------------------------------------------------------------------ */

  _renderText() {
    const d = this.data;

    this.els.title.textContent = d.name;
    // Not every city was renamed (Rome, Cairo). Only lead with the former name
    // when there actually is one, otherwise the subtitle starts at the country.
    const renamedFrom = d.formerName && d.renamed
      ? `${esc(d.formerName)} until ${esc(String(d.renamed).slice(0, 4))} · `
      : '';
    this.els.subtitle.innerHTML =
      `${renamedFrom}${esc(d.country)}` +
      (d.nameLocal ? ` · <span class="city-local">${esc(d.nameLocal)}</span>` : '');

    this.els.summary.textContent = d.summary;

    this.els.figures.innerHTML = d.figures.map((f) => `
      <div class="fig"${f.note ? ` title="${esc(f.label)} — ${esc(f.note)}"` : ''}>
        <div class="fig-value">${esc(f.value)}</div>
        <div class="fig-label">${esc(f.label)}</div>
        ${f.note ? `<div class="fig-note">${esc(f.note)}</div>` : ''}
      </div>
    `).join('');

    this.els.eras.innerHTML = d.eras.map((e) => `
      <button class="era-chip" data-era="${esc(e.id)}" style="--era:${esc(e.color)}">
        ${esc(e.label)}
      </button>
    `).join('');
  }

  _renderTimeline() {
    const d = this.data;
    const eraById = Object.fromEntries(d.eras.map((e) => [e.id, e]));

    this.els.timeline.innerHTML = d.events.map((ev, i) => {
      const era = eraById[ev.era];
      return `
        <button class="tl-row${ev.pivotal ? ' is-pivotal' : ''}" data-event="${i}"
                data-era-id="${esc(ev.era)}" style="--era:${esc(era.color)}">
          <span class="tl-year">${esc(formatYear(ev))}</span>
          <span class="tl-dot"></span>
          <span class="tl-title">${esc(ev.title)}</span>
        </button>
      `;
    }).join('');
  }

  /* ------------------------------------------------------------------ *
   * Selection
   * ------------------------------------------------------------------ */

  selectEvent(index) {
    const ev = this.data.events[index];
    if (!ev) return;
    this.activeEvent = index;

    for (const el of this.els.timeline.children) {
      el.classList.toggle('is-active', Number(el.dataset.event) === index);
    }

    const era = this.data.eras.find((e) => e.id === ev.era);
    const src = this.data.sources[ev.sourceId];
    const place = ev.place ? this.data.places.find((p) => p.id === ev.place) : null;

    const panel = this._detail();
    panel.setTitle(`${formatYear(ev)} · ${ev.title}`);
    panel.setContent(`
      <div class="det-era" style="--era:${esc(era.color)}">${esc(era.label)}</div>
      <div class="det-year">${esc(formatYear(ev))}</div>
      <h3 class="det-title">${esc(ev.title)}</h3>
      <p class="det-body">${esc(ev.body)}</p>
      ${place ? `<div class="det-place">▸ ${esc(place.name)}<span>${esc(place.note)}</span></div>` : ''}
      ${ev.disputed ? `<div class="det-flag">Sources disagree on the figures for this event.</div>` : ''}
      <div class="det-source">
        ${src.official ? '<span class="det-official">Official source</span>' : '<span class="det-unofficial">Secondary source</span>'}
        ${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.title)}</a>`
                  : `<span>${esc(src.title)}</span>`}
        <span class="det-pub">${esc(src.publisher)}</span>
        ${src.note ? `<span class="det-note">${esc(src.note)}</span>` : ''}
      </div>
    `);

    this.map?.focusPlace(ev.place || null);

    const row = this.els.timeline.children[index];
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  scrollToEra(eraId) {
    const first = this.data.events.findIndex((e) => e.era === eraId);
    if (first >= 0) this.selectEvent(first);
  }

  /* ------------------------------------------------------------------ *
   * The floating label over the active marker
   * ------------------------------------------------------------------ */

  /**
   * The place currently worth labelling, derived from whichever tab is active.
   * Deriving it — rather than caching it on every selection — means the two tabs
   * can never leave a stale marker labelled behind the other.
   * @returns {{id:string,name:string}|null}
   */
  _currentPlace() {
    const id = this.tab === 'families'
      ? this.data.dynasties?.list.find((f) => f.id === this.activeFamily)?.place
      : this.data.events[this.activeEvent]?.place;
    if (!id) return null;
    const p = this.data.places.find((x) => x.id === id);
    return p ? { id, name: p.name } : null;
  }

  _positionLabel() {
    const el = this.els.label;
    const place = this._currentPlace();
    if (!place) { el.style.display = 'none'; return; }

    const at = this.map.projectMarker(place.id);
    if (!at) { el.style.display = 'none'; return; }

    const rect = this.els.canvas.getBoundingClientRect();
    el.textContent = place.name;
    el.style.display = 'block';
    el.style.transform = `translate(${Math.round(at.x - rect.left)}px, ${Math.round(at.y - rect.top)}px)`;
  }

  /* ------------------------------------------------------------------ *
   * Administrative divisions
   * ------------------------------------------------------------------ */

  _renderDivisions(divisions) {
    const meta = this.data.divisions;
    const has = !!divisions && !!meta;

    this.els.divisions.hidden = !has;
    this.els.divisionsLabel.hidden = !has;
    this.els.wards.hidden = !has;
    if (!has) return;

    this.els.divisionsLabel.textContent = meta.label;

    // Ordered as the map built them, so the list and the colour ramp agree.
    this.els.divisions.innerHTML = this.map.divisionCodes().map((code) => {
      const node = this.map.divisions.get(code);
      const where = meta.names?.[code] || '';
      return `<button class="div-chip" data-division="${esc(code)}"
                style="--div:#${node.userData.color.getHexString()}"
                title="${esc(code)}${where ? ` — ${esc(where)}` : ''}">
                <span class="div-code">${esc(code)}</span>
                ${where ? `<span class="div-where">${esc(where)}</span>` : ''}
              </button>`;
    }).join('');
  }

  /** Select a ward: highlights it on the map and names it in the list. */
  selectDivision(code) {
    const next = this.activeDivision === code ? null : code;
    this.activeDivision = next;
    this.map?.focusDivision(next);
    for (const el of this.els.divisions.children) {
      el.classList.toggle('is-active', el.dataset.division === next);
    }
  }

  _toggleWards() {
    if (!this.map?.divisions) return;
    const on = !this.map.divisionsVisible;
    this.map.setDivisionsVisible(on);
    this.els.wards.setAttribute('aria-pressed', String(on));
    this.els.wards.textContent = on ? 'Wards: on' : 'Wards: off';
    if (!on) this._clearWardLabels();
  }

  _clearWardLabels() {
    for (const el of this._wardLabelPool) el.style.display = 'none';
  }

  _wardLabel(i) {
    if (!this._wardLabelPool[i]) {
      const el = document.createElement('div');
      el.className = 'ward-label';
      this.els.wardLabels.appendChild(el);
      this._wardLabelPool[i] = el;
    }
    return this._wardLabelPool[i];
  }

  _positionWardLabels() {
    if (!this.map?.divisions || !this.map.divisionsVisible) { this._clearWardLabels(); return; }

    const rect = this.els.canvas.getBoundingClientRect();
    let used = 0;

    for (const code of this.map.divisionCodes()) {
      // With one ward selected the other 23 labels are noise, so drop them.
      if (this.activeDivision && code !== this.activeDivision) continue;

      const at = this.map.projectDivision(code);
      if (!at) continue;

      const x = at.x - rect.left;
      const y = at.y - rect.top;
      if (x < -30 || x > rect.width + 30 || y < -20 || y > rect.height + 20) continue;

      const el = this._wardLabel(used++);
      el.textContent = code;
      el.style.display = 'block';
      el.classList.toggle('is-active', code === this.activeDivision);
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }

    for (let k = used; k < this._wardLabelPool.length; k++) {
      this._wardLabelPool[k].style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------ *
   * Points of interest — the zoom-in labels
   * ------------------------------------------------------------------ */

  _togglePlaces() {
    if (!this.map?.pois) return;
    const on = !this.map.poisVisible;
    this.map.setPoisVisible(on);
    this.els.places.setAttribute('aria-pressed', String(on));
    this.els.places.textContent = on ? 'Places: on' : 'Places: off';
    if (!on) for (const el of this._poiLabelPool) el.style.display = 'none';
  }

  _toggleRoads() {
    if (!this.map?.roadGroup) return;
    const on = !this.map.roadsVisible;
    this.map.setRoadsVisible(on);
    this.els.roads.setAttribute('aria-pressed', String(on));
    this.els.roads.textContent = on ? 'Roads: on' : 'Roads: off';
  }

  _poiLabel(i) {
    if (!this._poiLabelPool[i]) {
      const el = document.createElement('div');
      el.className = 'poi-label';
      this.els.poiLabels.appendChild(el);
      this._poiLabelPool[i] = el;
    }
    return this._poiLabelPool[i];
  }

  /** Cap on labels drawn at once; the dots keep going, only the text is limited. */
  static POI_LABEL_MAX = 40;

  _positionPoiLabels() {
    if (!this.map?.pois) return;

    const candidates = this.map.poiLabelCandidates();
    if (!candidates.length) {
      for (const el of this._poiLabelPool) el.style.display = 'none';
      return;
    }

    // Greedy de-overlap by actual rectangle. Candidates arrive most-important
    // first; each keeps its spot only if its label box clears every box already
    // placed. A grid was cheaper but let labels near a cell boundary graze each
    // other; at 40 labels the rectangle test is trivial and overlaps for real.
    // The box mirrors the CSS: the dot + name extend right from the anchor.
    const CHAR_PX = 5.6;   // ~monospace advance at 9.5px
    const LINE_H = 13;
    const PAD = 3;
    const placed = [];
    let used = 0;

    for (const c of candidates) {
      if (used >= CityView.POI_LABEL_MAX) break;

      const left = c.x - PAD;
      const right = c.x + 8 + c.name.length * CHAR_PX + PAD;
      const top = c.y - LINE_H / 2 - PAD;
      const bottom = c.y + LINE_H / 2 + PAD;

      let clash = false;
      for (const b of placed) {
        if (left < b.right && right > b.left && top < b.bottom && bottom > b.top) {
          clash = true; break;
        }
      }
      if (clash) continue;
      placed.push({ left, right, top, bottom });

      const el = this._poiLabel(used++);
      el.textContent = c.name;
      el.dataset.cat = c.cat;
      el.style.display = 'block';
      el.style.transform = `translate(${Math.round(c.x)}px, ${Math.round(c.y)}px)`;
    }

    for (let k = used; k < this._poiLabelPool.length; k++) {
      this._poiLabelPool[k].style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------ *
   * Families / dynasties
   * ------------------------------------------------------------------ */

  _renderFamilies() {
    const dyn = this.data.dynasties;
    const has = !!dyn?.list?.length;

    this.els.tabFamilies.hidden = !has;
    if (!has) { this.els.families.innerHTML = ''; return; }

    this.els.tabFamilies.textContent = `Families (${dyn.list.length})`;

    const eraColor = (id) => this.data.eras.find((e) => e.id === id)?.color || '#7fd4ff';

    this.els.families.innerHTML = dyn.list.map((f) => {
      const src = this.data.sources[f.sourceId];
      const inds = f.industries.map((i) => `<span class="fam-ind">${esc(i)}</span>`).join('');
      const figs = (f.figures || []).map((p) => `<li>${esc(p)}</li>`).join('');
      return `
        <article class="fam-card" data-family="${esc(f.id)}" style="--era:${esc(eraColor(f.era))}">
          <header class="fam-head">
            <h3 class="fam-name">${esc(f.name)}</h3>
            <span class="fam-community">${esc(f.community)}</span>
          </header>
          <div class="fam-span">${esc(f.span)}</div>
          <div class="fam-inds">${inds}</div>
          <div class="fam-detail">
            <p class="fam-summary">${esc(f.summary)}</p>
            ${figs ? `<ul class="fam-figures">${figs}</ul>` : ''}
            ${f.legacy ? `<p class="fam-legacy"><span>Survives as</span> ${esc(f.legacy)}</p>` : ''}
            <div class="fam-source">
              ${src.official ? '<span class="det-official">Official source</span>'
                             : '<span class="det-unofficial">Secondary source</span>'}
              ${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.title)}</a>`
                        : `<span>${esc(src.title)}</span>`}
              <span class="det-pub">${esc(src.publisher)}</span>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  /** Expand one family card, collapse the rest, and light its place on the map. */
  selectFamily(id) {
    const next = this.activeFamily === id ? null : id;
    this.activeFamily = next;

    for (const el of this.els.families.children) {
      el.classList.toggle('is-open', el.dataset.family === next);
    }

    const fam = this.data.dynasties.list.find((f) => f.id === next);
    // A family's place doubles as an event place, so reuse the same marker
    // highlight the timeline uses — the two views point at the same map. The
    // label follows from the active tab (see _currentPlace), so nothing else
    // needs setting here, and the active event is left untouched so returning
    // to the Timeline tab restores exactly where you were.
    this.map?.focusPlace(fam?.place || null);
  }

  /* ------------------------------------------------------------------ *
   * Tabs
   * ------------------------------------------------------------------ */

  _setTab(tab) {
    this.tab = tab;
    const onTimeline = tab === 'timeline';
    this.els.timeline.hidden = !onTimeline;
    this.els.families.hidden = onTimeline;
    this.els.tabTimeline.classList.toggle('is-active', onTimeline);
    this.els.tabFamilies.classList.toggle('is-active', !onTimeline);
    this.els.tabTimeline.setAttribute('aria-selected', String(onTimeline));
    this.els.tabFamilies.setAttribute('aria-selected', String(!onTimeline));

    // Hand the map's marker highlight to whichever tab is now in front, so the
    // two never fight over it. Timeline follows the active event; Families
    // follows the open card (which may be none).
    if (onTimeline) {
      this.activeFamily = null;
      for (const el of this.els.families.children) el.classList.remove('is-open');
      this.map?.focusPlace(this.data.events[this.activeEvent]?.place || null);
    } else {
      const fam = this.data.dynasties?.list.find((f) => f.id === this.activeFamily);
      this.map?.focusPlace(fam?.place || null);
    }
  }

  /* ------------------------------------------------------------------ *
   * Floating panels
   * ------------------------------------------------------------------ */

  _openDetailPanel() {
    const panel = this.panels.ensure('detail', {
      title: 'Detail', width: 330, pinnable: true, closable: true,
    });
    // Anchor it low-left the first time, roughly where the old fixed card was.
    if (!panel._placed) {
      const h = this.els.panelsLayer.getBoundingClientRect().height;
      panel.moveTo(16, Math.max(16, h - 300));
      panel._placed = true;
    }
    return panel;
  }

  /** The live detail panel, re-created if the user closed it. */
  _detail() {
    return this.panels.isOpen('detail') ? this.panels.singletons.get('detail')
                                        : this._openDetailPanel();
  }

  /** Pin: spawn a frozen copy of a panel's current content, to keep and compare. */
  _pinPanel(source) {
    const copy = this.panels.spawn({
      title: source.title, width: source.el.offsetWidth || 330, closable: true,
    });
    copy.setContent(source.body.innerHTML);
  }

  /** Dock button handler. */
  _openPanel(kind) {
    if (kind === 'detail') { this._detail().toFront(); return; }
    if (kind === 'legend') { this.panels.toggle('legend', { title: 'Legend', width: 220 })?.setContent(this._legendHtml()); return; }
    if (kind === 'notes') {
      const p = this.panels.toggle('notes', { title: 'Notes', width: 260 });
      if (p) p.setContent('<textarea class="cv-notes" placeholder="Jot anything — this is your scratch panel."></textarea>');
      return;
    }
    if (kind === 'coords') {
      const p = this.panels.toggle('coords', { title: 'Coordinates', width: 240 });
      if (p) p.setContent('<div class="cv-coords-body">Move the pointer over the map…</div>');
      return;
    }
  }

  _legendHtml() {
    const cats = { area: 'Neighbourhood', transport: 'Transport', civic: 'Civic',
                   landmark: 'Landmark', nature: 'Nature', water: 'Water' };
    const catRows = Object.entries(cats).map(([c, label]) =>
      `<div class="lg-row"><span class="lg-dot" data-cat="${c}"></span>${esc(label)}</div>`).join('');
    const roads = [['motorway', 'Motorway'], ['trunk', 'Trunk'], ['primary', 'Primary'],
                   ['secondary', 'Secondary'], ['rail', 'Railway']];
    const roadRows = roads.map(([c, label]) =>
      `<div class="lg-row"><span class="lg-line" data-road="${c}"></span>${esc(label)}</div>`).join('');
    const eraRows = this.data.eras.map((e) =>
      `<div class="lg-row"><span class="lg-dot" style="background:${esc(e.color)};box-shadow:0 0 6px ${esc(e.color)}"></span>${esc(e.label)}</div>`).join('');
    return `
      <div class="lg-group"><div class="lg-head">Places</div>${catRows}</div>
      <div class="lg-group"><div class="lg-head">Roads &amp; rail</div>${roadRows}</div>
      <div class="lg-group"><div class="lg-head">Eras</div>${eraRows}</div>`;
  }

  _updateCoordsPanel() {
    if (!this.panels?.isOpen('coords')) return;
    const panel = this.panels.singletons.get('coords');
    const body = panel.body.querySelector('.cv-coords-body') || panel.body;
    if (!this._pointer) { body.innerHTML = 'Move the pointer over the map…'; return; }

    const g = this.map.pickGround(this._pointer.x, this._pointer.y);
    if (!g) { body.innerHTML = 'Off the map.'; return; }

    const ns = g.lat >= 0 ? 'N' : 'S';
    const ew = g.lon >= 0 ? 'E' : 'W';
    body.innerHTML = `
      <div class="cc-line"><span>Lat</span><b>${Math.abs(g.lat).toFixed(4)}° ${ns}</b></div>
      <div class="cc-line"><span>Lon</span><b>${Math.abs(g.lon).toFixed(4)}° ${ew}</b></div>
      ${g.nearest ? `<div class="cc-near">near <b>${esc(g.nearest)}</b>${g.nearKm != null ? ` · ${g.nearKm.toFixed(1)} km` : ''}</div>` : ''}`;
  }

  _toggleRotate() {
    if (!this.map) return;
    this.map.autoRotate = !this.map.autoRotate;
    this.els.rotate.setAttribute('aria-pressed', String(this.map.autoRotate));
    this.els.rotate.textContent = this.map.autoRotate ? 'Rotation: auto' : 'Rotation: manual';
  }
}
