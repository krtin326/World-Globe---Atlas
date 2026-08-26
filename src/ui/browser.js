/**
 * browser.js — the left panel: drill down from the world to a single city.
 *
 * Four modes, one list:
 *   countries -> states of a country -> cities of a state
 *   search    -> a flat, mixed list of matching countries, states and cities
 *
 * Every mode feeds the same VirtualList, so the 34,027-row "all cities in
 * Country X" view costs exactly what the 258-row country list costs.
 */

import { VirtualList } from './VirtualList.js';
import { normalizeName, formatInt } from '../util/geo.js';

const ROW_HEIGHT = 54;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** "1 city" / "24 cities" — getting this wrong is small but reads as sloppy. */
function plural(n, one, many = `${one}s`) {
  return `${formatInt(n)} ${n === 1 ? one : many}`;
}

/** Compact population, e.g. 8.3M / 412k. */
function shortPop(n) {
  if (!n) return '';
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

export class Browser {
  /**
   * @param {object} els  { list, title, count, breadcrumb, search }
   * @param {object} data { cities, countries, states, countryInfo }
   * @param {object} handlers { onCountry, onState, onCity }
   */
  constructor(els, data, handlers) {
    this.els = els;
    this.data = data;
    this.handlers = handlers;

    this.mode = 'countries';
    this.context = {};
    this.selectedKey = null;

    // Precompute the per-country and per-state tallies once. Doing it inside
    // the row renderer would recount on every scroll tick.
    this._stateCount = new Map();
    for (const f of data.states) {
      const k = f.properties.adm0_a3;
      this._stateCount.set(k, (this._stateCount.get(k) || 0) + 1);
    }

    this._countryOrder = data.countries
      .map((f, i) => i)
      .sort((a, b) => data.countries[a].properties.NAME
        .localeCompare(data.countries[b].properties.NAME));

    this._searchKeys = {
      countries: data.countries.map((f) =>
        normalizeName(`${f.properties.NAME} ${f.properties.NAME_LONG || ''} ${f.properties.FORMAL_EN || ''}`)),
      states: data.states.map((f) =>
        normalizeName(`${f.properties.name || ''} ${f.properties.name_en || ''} ${f.properties.admin || ''}`)),
    };

    this.list = new VirtualList(els.list, {
      rowHeight: ROW_HEIGHT,
      render: (i, item, el) => this._renderRow(item, el),
      onSelect: (i, item) => this._select(item),
    });

    this.showCountries();
  }

  /* ------------------------------------------------------------------ *
   * Row rendering
   * ------------------------------------------------------------------ */

  _renderRow(item, el) {
    if (!item) { el.innerHTML = ''; return; }
    el.classList.toggle('selected', item.key === this.selectedKey);

    let name = '', sub = '', metric = '', badge = '', chev = '';

    if (item.kind === 'country') {
      const p = this.data.countries[item.index].properties;
      const a3 = p.ADM0_A3;
      const nStates = this._stateCount.get(a3) || 0;
      const nCities = (this.data.cities.byCountry.get(a3) || []).length;
      name = p.NAME;
      sub = [p.CONTINENT, nStates ? plural(nStates, 'division') : null,
             nCities ? plural(nCities, 'city', 'cities') : null].filter(Boolean).join(' · ');
      metric = shortPop(p.POP_EST);
      chev = '›';
    } else if (item.kind === 'state') {
      const p = this.data.states[item.index].properties;
      const nCities = (this.data.cities.byState.get(p.adm1_code) || []).length;
      name = p.name_en || p.name;
      sub = [p.type_en, this.mode === 'search' ? p.admin : null,
             plural(nCities, 'city', 'cities')].filter(Boolean).join(' · ');
      metric = p.iso_3166_2 && p.iso_3166_2 !== '-99' ? p.iso_3166_2 : '';
      chev = nCities ? '›' : '';
    } else {
      const c = this.data.cities.get(item.index);
      const info = this.data.countryInfo[c.cc];
      name = c.name;
      sub = [c.admin1, info?.name || c.cc].filter(Boolean).join(', ');
      metric = shortPop(c.pop);
      if (c.fcode === 'PPLC') badge = 'Capital';
    }

    el.innerHTML = `
      <div class="row-main">
        <div class="row-name">${esc(name)}</div>
        <div class="row-sub">${esc(sub)}</div>
      </div>
      ${badge ? `<span class="row-badge">${badge}</span>` : ''}
      ${metric ? `<span class="row-metric">${esc(metric)}</span>` : ''}
      ${chev ? `<span class="row-chev">${chev}</span>` : ''}
    `;
  }

  _select(item) {
    if (!item) return;
    if (item.kind === 'country') this.handlers.onCountry(item.index);
    else if (item.kind === 'state') this.handlers.onState(item.index);
    else this.handlers.onCity(item.index);
  }

  /* ------------------------------------------------------------------ *
   * Modes
   * ------------------------------------------------------------------ */

  showCountries() {
    this.mode = 'countries';
    this.context = {};
    const items = this._countryOrder.map((i) => ({ kind: 'country', index: i, key: `c${i}` }));
    this._apply('Countries', items);
  }

  /** @param {string} a3  Natural Earth ADM0_A3 code */
  showStates(a3) {
    const country = this.data.countries.find((f) => f.properties.ADM0_A3 === a3);
    this.mode = 'states';
    this.context = { a3, countryName: country?.properties.NAME || a3 };

    const items = this.data.states
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.properties.adm0_a3 === a3)
      .sort((x, y) => (x.f.properties.name_en || x.f.properties.name || '')
        .localeCompare(y.f.properties.name_en || y.f.properties.name || ''))
      .map(({ i }) => ({ kind: 'state', index: i, key: `s${i}` }));

    this._apply('States / provinces', items);
  }

  /** All cities of a country, population order. */
  showCountryCities(a3) {
    const country = this.data.countries.find((f) => f.properties.ADM0_A3 === a3);
    this.mode = 'cities';
    this.context = { a3, countryName: country?.properties.NAME || a3 };

    const indices = this.data.cities.byCountry.get(a3) || [];
    this._apply('Cities', indices.map((i) => ({ kind: 'city', index: i, key: `p${i}` })));
  }

  /** All cities of one state, population order. */
  showStateCities(adm1Code) {
    const state = this.data.states.find((f) => f.properties.adm1_code === adm1Code);
    this.mode = 'cities';
    this.context = {
      a3: state?.properties.adm0_a3,
      countryName: state?.properties.admin,
      stateName: state?.properties.name_en || state?.properties.name,
      adm1Code,
    };

    const indices = this.data.cities.byState.get(adm1Code) || [];
    this._apply('Cities', indices.map((i) => ({ kind: 'city', index: i, key: `p${i}` })));
  }

  /** Every city on Earth, population order. */
  showAllCities() {
    this.mode = 'cities';
    this.context = { all: true };
    const items = new Array(this.data.cities.count);
    for (let i = 0; i < items.length; i++) items[i] = { kind: 'city', index: i, key: `p${i}` };
    this._apply('All cities', items);
  }

  /* ------------------------------------------------------------------ *
   * Search
   * ------------------------------------------------------------------ */

  search(query) {
    const q = normalizeName(query.trim());
    if (!q) { this.showCountries(); return; }

    this.mode = 'search';
    this.context = { query };

    const items = [];

    // Countries and states first — there are few of them and an exact country
    // name should never be buried under a hundred same-named towns.
    this._searchKeys.countries.forEach((key, i) => {
      if (items.length < 12 && key.includes(q)) {
        items.push({ kind: 'country', index: i, key: `c${i}` });
      }
    });

    let stateHits = 0;
    this._searchKeys.states.forEach((key, i) => {
      if (stateHits < 15 && key.includes(q)) {
        items.push({ kind: 'state', index: i, key: `s${i}` });
        stateHits++;
      }
    });

    for (const i of this.data.cities.search(query, 400)) {
      items.push({ kind: 'city', index: i, key: `p${i}` });
    }

    this._apply(`Results for “${query}”`, items, { empty: 'Nothing found.' });
  }

  /* ------------------------------------------------------------------ *
   * Shared plumbing
   * ------------------------------------------------------------------ */

  _apply(title, items, { empty = 'Nothing here.' } = {}) {
    this.els.title.textContent = title;
    this.els.count.textContent = items.length ? formatInt(items.length) : '';
    this.list.setItems(items);
    this._renderBreadcrumb();

    // The virtual list has no concept of "empty"; show a message over it.
    let msg = this.els.list.querySelector('.vlist-empty');
    if (!items.length) {
      if (!msg) {
        msg = document.createElement('div');
        msg.className = 'vlist-empty';
        this.els.list.appendChild(msg);
      }
      msg.textContent = empty;
    } else if (msg) {
      msg.remove();
    }
  }

  _renderBreadcrumb() {
    const parts = [];
    const crumb = (label, handler) => ({ label, handler });

    if (this.mode === 'search') {
      parts.push(crumb('World', () => this._clearSearch()));
      parts.push(crumb(`“${this.context.query}”`, null));
    } else if (this.mode === 'countries') {
      parts.push(crumb('World', null));
    } else {
      parts.push(crumb('World', () => this.showCountries()));
      if (this.context.all) {
        parts.push(crumb('All cities', null));
      } else {
        const a3 = this.context.a3;
        parts.push(crumb(this.context.countryName, () => this.showStates(a3)));
        if (this.context.stateName) parts.push(crumb(this.context.stateName, null));
        else if (this.mode === 'cities') parts.push(crumb('Cities', null));
      }
    }

    this.els.breadcrumb.innerHTML = '';
    parts.forEach((p, i) => {
      if (i) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '›';
        this.els.breadcrumb.appendChild(sep);
      }
      if (p.handler && i < parts.length - 1) {
        const b = document.createElement('button');
        b.textContent = p.label;
        b.addEventListener('click', p.handler);
        this.els.breadcrumb.appendChild(b);
      } else {
        const s = document.createElement('span');
        s.className = 'current';
        s.textContent = p.label;
        this.els.breadcrumb.appendChild(s);
      }
    });
  }

  _clearSearch() {
    this.els.search.value = '';
    this.showCountries();
  }

  /** Mark a row as selected and scroll it into view if it is in the list. */
  highlight(kind, index) {
    const prefix = kind === 'country' ? 'c' : kind === 'state' ? 's' : 'p';
    this.selectedKey = `${prefix}${index}`;
    const at = this.list.items.findIndex((it) => it.key === this.selectedKey);
    this.list.refresh();
    if (at >= 0) this.list.scrollToIndex(at);
  }
}
