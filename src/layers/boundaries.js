/**
 * boundaries.js — country and state/province borders, plus selection.
 *
 * Rendering strategy: all 258 country outlines live in ONE merged
 * `LineSegments`, and all 4,596 state outlines in another. That is two draw
 * calls for every border on Earth, instead of 4,854. The cost of merging is
 * that individual features can no longer be styled — so hover and selection are
 * drawn by a third and fourth object that are rebuilt on demand, each holding
 * exactly one feature. Rebuilding one polygon is cheap; re-uploading all of
 * them every frame would not be.
 *
 * State borders fade in with zoom. Showing 4,596 subdivisions on a globe that
 * is 600 pixels across is illegible, so they stay hidden until the camera is
 * close enough for them to mean something.
 */

import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { buildGridIndex } from '../geo/polygon.js';
import { tessellateFeature, outlineFeature, outlineStrips } from '../geo/tessellate.js';

/** Radii, in globe units. Ordered so nothing z-fights with anything else. */
const R_FILL = 1.0016;
const R_STATE = 1.0022;
const R_COUNTRY = 1.0028;
const R_SELECT = 1.0034;

/** Camera altitude (radii above surface) at which state borders start to show. */
const STATE_FADE_IN = 1.35;
const STATE_FADE_FULL = 0.55;

export class BoundaryLayer {
  /**
   * @param {{features: object[]}} countriesGeoJson
   * @param {{features: object[]}} statesGeoJson
   */
  constructor(countriesGeoJson, statesGeoJson) {
    this.countries = countriesGeoJson.features;
    this.states = statesGeoJson.features;

    this.object = new THREE.Group();
    this.object.name = 'boundaries';

    // Spatial indexes for picking. Countries get a coarser grid than states
    // because their bounding boxes are larger and would otherwise be copied
    // into a great many cells.
    this._findCountry = buildGridIndex(this.countries, 2);
    this._findState = buildGridIndex(this.states, 1);

    this._buildBaseLines();
    this._buildDynamicObjects();

    this.hovered = null;   // {kind:'country'|'state', index:number}
    this.selected = null;
    this.showStates = true;
    this._stateOpacity = 0;
  }

  /* ------------------------------------------------------------------ *
   * Static geometry
   * ------------------------------------------------------------------ */

  _buildBaseLines() {
    const countryPositions = [];
    for (const f of this.countries) outlineFeature(f.geometry, R_COUNTRY, countryPositions);

    const countryGeom = new THREE.BufferGeometry();
    countryGeom.setAttribute('position',
      new THREE.Float32BufferAttribute(countryPositions, 3));

    this.countryLines = new THREE.LineSegments(countryGeom, new THREE.LineBasicMaterial({
      color: 0xf2f6ff,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }));
    this.countryLines.renderOrder = 2;
    this.object.add(this.countryLines);

    const statePositions = [];
    for (const f of this.states) outlineFeature(f.geometry, R_STATE, statePositions);

    const stateGeom = new THREE.BufferGeometry();
    stateGeom.setAttribute('position',
      new THREE.Float32BufferAttribute(statePositions, 3));

    this.stateLines = new THREE.LineSegments(stateGeom, new THREE.LineBasicMaterial({
      color: 0x9fc4ef,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }));
    this.stateLines.renderOrder = 1;
    this.object.add(this.stateLines);

    this.vertexCount = {
      country: countryPositions.length / 3,
      state: statePositions.length / 3,
    };
  }

  _buildDynamicObjects() {
    // Translucent patch over the feature under the cursor.
    this.hoverFill = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: 0x7fd4ff,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.hoverFill.renderOrder = 4;
    this.hoverFill.frustumCulled = false;
    this.object.add(this.hoverFill);

    this.selectFill = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: 0xffc75a,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.selectFill.renderOrder = 5;
    this.selectFill.frustumCulled = false;
    this.object.add(this.selectFill);

    // Thick outline for the selected feature. Plain GL lines are locked to one
    // pixel wide on every platform that matters, so this uses the screen-space
    // quad technique from three's Line2.
    this.selectMaterial = new LineMaterial({
      color: 0xffc75a,
      linewidth: 2.2,          // in pixels, thanks to Line2
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      dashed: false,
    });
    this.selectOutlines = new THREE.Group();
    this.selectOutlines.renderOrder = 6;
    this.object.add(this.selectOutlines);
  }

  /* ------------------------------------------------------------------ *
   * Picking
   * ------------------------------------------------------------------ */

  /**
   * Resolve a geographic coordinate to the country and state containing it.
   *
   * The tolerance matters. Borders here are simplified to 8–12% of their
   * source detail, which moves a coastline by up to a few kilometres — enough
   * that Manhattan, Reykjavík and most other waterfront cities sit fractionally
   * *outside* their own country's polygon. A strict containment test reports
   * those as ocean, which is both wrong and obviously wrong to anyone looking
   * at the screen. Snapping to the nearest polygon fixes the coastline without
   * letting a click in open water grab a country.
   *
   * The 0.12 deg (~13 km) tolerance was measured, not guessed: 0.06 leaves
   * Reykjavik in the sea, 0.10 is the smallest value that resolves a sample of
   * eight awkward waterfront cities correctly, and every value up to 0.4 still
   * returns open ocean for all ten deep-water probes. The default sits just
   * above what is needed and far below what would start inventing coastline.
   *
   * @returns {{country: object|null, countryIndex: number,
   *            state: object|null, stateIndex: number}}
   */
  locate(lat, lon, snapDeg = 0.12) {
    const ci = this._findCountry(lon, lat, snapDeg);
    const si = this._findState(lon, lat, snapDeg);
    return {
      country: ci >= 0 ? this.countries[ci] : null,
      countryIndex: ci,
      state: si >= 0 ? this.states[si] : null,
      stateIndex: si,
    };
  }

  /* ------------------------------------------------------------------ *
   * Highlighting
   * ------------------------------------------------------------------ */

  _fillFor(feature) {
    // Coarser tessellation for hover than for anything permanent: it changes
    // on nearly every mouse move and only needs to look right, not be exact.
    return tessellateFeature(feature.geometry, R_FILL, 3.0);
  }

  setHover(kind, index) {
    const same = this.hovered && this.hovered.kind === kind && this.hovered.index === index;
    if (same) return;

    if (index < 0 || kind == null) {
      this.hovered = null;
      this.hoverFill.geometry.dispose();
      this.hoverFill.geometry = new THREE.BufferGeometry();
      return;
    }

    const feature = kind === 'state' ? this.states[index] : this.countries[index];
    if (!feature) return;

    this.hovered = { kind, index };
    const positions = this._fillFor(feature);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.hoverFill.geometry.dispose();
    this.hoverFill.geometry = geom;
  }

  setSelection(kind, index) {
    // Clear the previous outline strips first; Line2 geometries hold GPU
    // buffers that will not be collected on their own.
    for (const child of this.selectOutlines.children) {
      child.geometry.dispose();
    }
    this.selectOutlines.clear();

    if (index == null || index < 0 || kind == null) {
      this.selected = null;
      this.selectFill.geometry.dispose();
      this.selectFill.geometry = new THREE.BufferGeometry();
      return;
    }

    const feature = kind === 'state' ? this.states[index] : this.countries[index];
    if (!feature) return;

    this.selected = { kind, index, feature };

    const positions = tessellateFeature(feature.geometry, R_FILL, 2.0);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.selectFill.geometry.dispose();
    this.selectFill.geometry = geom;

    for (const strip of outlineStrips(feature.geometry, R_SELECT)) {
      // Line2 needs at least two points; degenerate rings can slip through
      // simplification.
      if (strip.length < 6) continue;
      const lg = new LineGeometry();
      lg.setPositions(strip);
      const line = new Line2(lg, this.selectMaterial);
      line.computeLineDistances();
      line.frustumCulled = false;
      this.selectOutlines.add(line);
    }
  }

  /* ------------------------------------------------------------------ *
   * Per-frame
   * ------------------------------------------------------------------ */

  update({ altitude, renderer }) {
    // LineMaterial does its widening in screen space, so it has to be told the
    // viewport size or lines come out the wrong thickness after a resize.
    const size = renderer.getSize(new THREE.Vector2());
    this.selectMaterial.resolution.set(size.x, size.y);

    // Ease state borders in as the camera drops towards the surface.
    let target = 0;
    if (this.showStates) {
      const t = (STATE_FADE_IN - altitude) / (STATE_FADE_IN - STATE_FADE_FULL);
      target = Math.max(0, Math.min(1, t));
    }
    this._stateOpacity += (target - this._stateOpacity) * 0.12;
    this.stateLines.material.opacity = this._stateOpacity * 0.5;
    this.stateLines.visible = this._stateOpacity > 0.01;

    // Country borders brighten a little when zoomed out, where they are the
    // only thing giving the globe structure.
    this.countryLines.material.opacity = 0.45 + 0.3 * Math.min(1, altitude / 2);
  }

  setStatesVisible(v) { this.showStates = v; }

  setCountriesVisible(v) { this.countryLines.visible = v; }
}
