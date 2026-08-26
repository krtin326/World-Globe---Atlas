/**
 * details.js — the right-hand information card.
 *
 * Renders whatever is currently selected: a country, a state/province, or a
 * city. Everything shown comes straight from the source datasets; nothing here
 * computes or estimates a figure of its own, so a number on screen can always
 * be traced back to a row in Natural Earth or GeoNames.
 *
 * Where the two sources disagree — they have independent population figures for
 * the same country, gathered at different times — both are shown and labelled,
 * rather than one being silently preferred.
 */

import { formatInt, formatPopulation, formatLatLon, FEATURE_CODES } from '../util/geo.js';

/** "1 city" / "24 cities" — small, but the wrong form reads as sloppy. */
function plural(n, one, many = `${one}s`) {
  return `${formatInt(n)} ${n === 1 ? one : many}`;
}

/** Natural Earth writes an unknown code as the string '-99'. */
const clean = (v) => (v == null || v === '' || v === '-99' || v === -99 ? null : v);

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function rows(pairs) {
  const body = pairs
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join('');
  return body ? `<dl class="d-grid">${body}</dl>` : '';
}

export class DetailsPanel {
  /**
   * @param {HTMLElement} root      the panel element
   * @param {HTMLElement} body      where content is written
   * @param {object} deps
   */
  constructor(root, body, deps) {
    this.root = root;
    this.body = body;
    this.deps = deps; // { cities, countryInfo, boundaries, onNavigate, onFlyTo }

    // One delegated listener for every action button the card can contain.
    this.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, ...data } = btn.dataset;
      this.deps.onAction?.(action, data);
    });
  }

  hide() {
    this.root.hidden = true;
    this.current = null;
  }

  /* ------------------------------------------------------------------ *
   * Countries
   * ------------------------------------------------------------------ */

  showCountry(feature, index) {
    const p = feature.properties;
    const a3 = p.ADM0_A3;
    const info = this.deps.countryInfo[clean(p.ISO_A2)] || null;

    const cityIndices = this.deps.cities.byCountry.get(a3) || [];
    const stateCount = this.deps.boundaries.states
      .reduce((n, f) => n + (f.properties.adm0_a3 === a3 ? 1 : 0), 0);

    const capital = info?.capital;
    const topCities = cityIndices.slice(0, 6);

    this.current = { kind: 'country', index, feature };
    this.root.hidden = false;
    this.body.innerHTML = `
      <div class="d-kicker">Country</div>
      <h2 class="d-title">${esc(p.NAME_LONG || p.NAME)}</h2>
      ${p.FORMAL_EN && p.FORMAL_EN !== p.NAME_LONG
        ? `<div class="d-subtitle">${esc(p.FORMAL_EN)}</div>` : ''}

      ${rows([
        ['ISO 3166-1', [clean(p.ISO_A2), clean(p.ISO_A3)].filter(Boolean).join(' / ') || null],
        ['Continent', clean(p.CONTINENT)],
        ['UN region', clean(p.SUBREGION) || clean(p.REGION_UN)],
        ['Type', clean(p.TYPE)],
        ['Capital', capital],
        ['Area', info?.areaKm2 ? `${formatInt(info.areaKm2)} km²` : null],
        ['Currency', info?.currency],
      ])}

      <div class="d-section-title">Population</div>
      ${rows([
        [`Natural Earth${p.POP_YEAR ? ` (${p.POP_YEAR})` : ''}`,
          p.POP_EST ? formatInt(p.POP_EST) : null],
        ['GeoNames', info?.population ? formatInt(info.population) : null],
        [`GDP${p.GDP_YEAR ? ` (${p.GDP_YEAR})` : ''}`,
          p.GDP_MD ? `US$ ${formatInt(p.GDP_MD)} M` : null],
        ['Income group', clean(p.INCOME_GRP)?.replace(/^\d+\.\s*/, '')],
      ])}

      <div class="d-section-title">In this dataset</div>
      ${rows([
        ['States / provinces', formatInt(stateCount)],
        ['Cities (15k+)', formatInt(cityIndices.length)],
      ])}

      ${topCities.length ? `
        <div class="d-section-title">Largest cities</div>
        <div class="d-chips">
          ${topCities.map((i) => {
            const c = this.deps.cities.get(i);
            return `<button class="chip" data-action="city" data-index="${i}"
                     title="${esc(formatPopulation(c.pop))}">${esc(c.name)}</button>`;
          }).join('')}
        </div>` : ''}

      <div class="d-actions">
        <button class="btn" data-action="states" data-a3="${esc(a3)}">
          Browse ${plural(stateCount, 'state')}
        </button>
        <button class="btn" data-action="country-cities" data-a3="${esc(a3)}">
          Browse ${plural(cityIndices.length, 'city', 'cities')}
        </button>
      </div>
    `;
    this.root.scrollTop = 0;
  }

  /* ------------------------------------------------------------------ *
   * States / provinces
   * ------------------------------------------------------------------ */

  showState(feature, index) {
    const p = feature.properties;
    const cityIndices = this.deps.cities.byState.get(p.adm1_code) || [];
    const country = this.deps.boundaries.countries
      .find((f) => f.properties.ADM0_A3 === p.adm0_a3);

    // Sum of the cities we hold, which is emphatically not the population of
    // the state — it omits everywhere under 15,000 people and all rural areas.
    const cityPop = cityIndices.reduce((n, i) => n + this.deps.cities.col.pop[i], 0);

    this.current = { kind: 'state', index, feature };
    this.root.hidden = false;
    this.body.innerHTML = `
      <div class="d-kicker">${esc(clean(p.type_en) || 'Administrative division')}</div>
      <h2 class="d-title">${esc(p.name_en || p.name)}</h2>
      <div class="d-subtitle">${esc(p.admin)}</div>

      ${rows([
        ['ISO 3166-2', clean(p.iso_3166_2)],
        ['HASC code', clean(p.code_hasc)],
        ['Natural Earth id', p.adm1_code],
        ['Region', clean(p.region)],
      ])}

      <div class="d-section-title">Cities in this division</div>
      ${rows([
        ['Cities (15k+)', formatInt(cityIndices.length)],
        ['Combined city population', cityPop ? formatInt(cityPop) : null],
      ])}

      ${cityIndices.length ? `
        <div class="d-chips">
          ${cityIndices.slice(0, 8).map((i) => {
            const c = this.deps.cities.get(i);
            return `<button class="chip" data-action="city" data-index="${i}">${esc(c.name)}</button>`;
          }).join('')}
        </div>` : '<div class="d-note">No settlement of 15,000 or more people here.</div>'}

      <div class="d-actions">
        <button class="btn" data-action="state-cities" data-code="${esc(p.adm1_code)}">
          Browse all ${plural(cityIndices.length, 'city', 'cities')}
        </button>
        ${country ? `<button class="btn" data-action="country"
          data-index="${this.deps.boundaries.countries.indexOf(country)}">
          Go to ${esc(country.properties.NAME)}</button>` : ''}
      </div>

      <div class="d-note">
        Combined city population counts only places of 15,000 or more that appear
        in this dataset. It is not the population of the division.
      </div>
    `;
    this.root.scrollTop = 0;
  }

  /* ------------------------------------------------------------------ *
   * Cities
   * ------------------------------------------------------------------ */

  showCity(index) {
    const c = this.deps.cities.get(index);
    const info = this.deps.countryInfo[c.cc];

    const state = this.deps.boundaries.states
      .find((f) => f.properties.adm1_code === c.adm1);
    const country = this.deps.boundaries.countries
      .find((f) => f.properties.ADM0_A3 === c.adm0);

    const place = [c.admin2, c.admin1, info?.name || c.cc].filter(Boolean).join(', ');

    // Only offer the history view for cities that actually have one, rather
    // than showing a button that fails when pressed.
    const history = this.deps.cityHistory?.[String(c.id)] || null;

    this.current = { kind: 'city', index };
    this.root.hidden = false;
    this.body.innerHTML = `
      <div class="d-kicker">${esc(FEATURE_CODES[c.fcode] || 'Populated place')}</div>
      <h2 class="d-title">${esc(c.name)}</h2>
      <div class="d-subtitle">${esc(place)}</div>

      ${rows([
        ['Population', formatInt(c.pop)],
        ['Coordinates', formatLatLon(c.lat, c.lon)],
        ['Elevation', c.elev ? `${formatInt(c.elev)} m` : null],
        ['Time zone', c.tz],
        ['GeoNames id', c.id],
      ])}

      ${history ? `
        <button class="btn btn-history" data-action="city-history" data-index="${index}">
          Explore ${esc(history.events)} events of history &rsaquo;
        </button>` : ''}

      <div class="d-actions">
        <button class="btn" data-action="fly-city" data-index="${index}">Fly here</button>
        ${state ? `<button class="btn" data-action="state"
          data-index="${this.deps.boundaries.states.indexOf(state)}">
          ${esc(state.properties.name_en || state.properties.name)}</button>` : ''}
        ${country ? `<button class="btn" data-action="country"
          data-index="${this.deps.boundaries.countries.indexOf(country)}">
          ${esc(country.properties.NAME)}</button>` : ''}
      </div>
    `;
    this.root.scrollTop = 0;
  }
}
