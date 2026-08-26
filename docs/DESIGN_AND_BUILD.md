# World Globe — Design & Build Log

A narrative record of how this project was designed and built across the
session: what was made, in what order, why each decision went the way it did,
and the thematic ensemble that holds the whole thing together.

This is the *story* document. For the day-to-day reference (how to run it, the
file map, the shader maths) see [DOCUMENTATION.md](DOCUMENTATION.md); for
provenance and licensing see [SOURCES.md](SOURCES.md); for a critical look at how
the information was gathered see [SOURCES_AND_ANALYSIS.md](SOURCES_AND_ANALYSIS.md).

---

## 1. What it is

Two things wearing one skin:

1. **A global terrain globe** — NASA satellite imagery on a three.js sphere,
   with sun-responsive relief shading, every country and every first-level
   administrative division on Earth as selectable regions, and a searchable
   gazetteer of **34,027 cities** you can browse down from the whole world to a
   single town.

2. **A city sub-view** — open a city that has a history file (so far, Mumbai)
   and the globe hands off to a rotating 3D city model rendered in a deliberately
   different, loud, "cyber-tech" register: a full-resolution coastline, the 24
   municipal wards, 254 zoom-revealed places, the arterial road and railway
   network, a 65-event sourced timeline across six historical eras, seven
   business dynasties, and a floating panel system you can drag, pin and stack.

Everything runs from static files: **no build step at runtime, no bundler, no
API keys, no network access once built.** Every dependency is vendored.

---

## 2. How the build actually unfolded

The project grew in layers, each one a response to a specific request. That
order matters, because a lot of the architecture exists to make the *next* layer
cheap to add.

| Phase | What was added | The key idea introduced |
|---|---|---|
| 1 | The globe: terrain shader, atmosphere, stars | Re-derive lighting from an elevation map, don't fake it |
| 2 | Country + state boundaries, click-picking | One shared point-in-polygon module for build **and** browser |
| 3 | 34,027-city layer + searchable browse UI | GPU level-of-detail; a virtualised list |
| 4 | Documentation + a real sources audit | Provenance is a first-class deliverable |
| 5 | Licence-compliance pass | Two real breaches found and fixed |
| 6 | The Mumbai city sub-view: coastline + timeline | A second visual register; data-driven per city |
| 7 | 24 BMC ward plates | A licensing decision made explicit (GODL vs CC-BY-SA) |
| 8 | Timeline expanded to six eras | Cross-checked dates; disputed figures flagged |
| 9 | Seven business dynasties (Families tab) | A tabbed side column; map/label state derived, not cached |
| 10 | 254 zoom level-of-detail places | Reveal by rank, not raw score; rectangle label de-overlap |
| 11 | Primary roads + suburban railway | The one OSM/ODbL layer, isolated and toggleable |
| 12 | Zoom-adaptive drag sensitivity | Feel scaled to camera distance |
| 13 | Draggable, multi-instance info panels | A tiny floating-window manager |
| 14 | Data accuracy pass | Fixed the 2006 toll, the rename date, added cinema |
| — | Holographic family member (designed, **not yet built**) | See §9 |

The consistent through-line: **surface every judgement call rather than bury
it.** Where the data is a compromise, the code says so; where a source could be
wrong, the UI flags it.

---

## 3. Architecture — the shape of the code

```
index.html            markup + import map (no bundler)
styles.css            globe interface
styles-city.css       city sub-view (kept separate so its theme can't leak)
src/
  main.js             the only file that knows about both the globe and the panels
  globe/
    scene.js          renderer, camera, OrbitControls, animation loop, camera flights
    earth.js          globe mesh + terrain shader, atmosphere, star field
  layers/
    boundaries.js     country/state borders, hover + selection
    cities.js         34k markers (GPU LOD) + DOM labels
  data/cities.js      CityTable — columnar gazetteer, search, nearest-city
  geo/
    polygon.js        point-in-polygon + spatial index  (shared with build tools)
    tessellate.js     GeoJSON polygons → sphere-hugging triangles + outlines
  city/
    citymap.js        the 3D city model: coastline, wards, POIs, roads, markers
    cityview.js       the sub-view shell: timeline, families, panels, tabs
    panels.js         floating-window manager (drag, pin, stack)
  ui/
    browser.js        left panel drill-down + search
    details.js        globe's right-hand info card
    VirtualList.js    windowed list — 34k rows cost the same as 258
  util/geo.js         lat/lon ↔ scene coordinates, distances, formatting
tools/
  fetch-sources.mjs   download every raw input
  build-textures.mjs  resample imagery
  build-data.mjs      shapefiles → GeoJSON, gazetteer → cities.json
  build-city.mjs      coastline, wards, POIs, roads for one city
  serve.mjs           static dev server
```

Three principles run through it:

- **One-way dependencies.** Layers know nothing about the UI; the UI knows
  nothing about three.js; `main.js` is the single place the two meet. You can
  reason about any layer in isolation.
- **Share the code that must agree.** `geo/polygon.js` is imported by *both* the
  Node build script and the browser. A city's country is assigned at build time
  by the same point-in-polygon routine that resolves a click at run time — so
  the map and the data can never contradict each other. There is one
  implementation and no second opinion.
- **Data-driven, not hard-coded.** Every city feature (history, coastline,
  wards, POIs, roads) is an optional file. A city without a `-divisions.geojson`
  simply shows no ward layer and hides its toggle. Adding a second city is data
  plus a coastline clip — no code changes.

---

## 4. The globe

### 4.1 Terrain that responds to light

The colour map is NASA's Blue Marble Next Generation, which already has relief
baked in — but baked relief is lit from a fixed direction and can't respond to a
moving sun, so it reads as a photo pasted on a ball. Instead the fragment shader
**re-derives a surface normal** from the GEBCO elevation map (central
differences) and lights *that*. Mountains catch the light and cast the right way
as the terminator moves.

Two details earned their keep:
- A `cos(latitude)` correction on the east–west slope, without which Greenland
  and Antarctica dissolve into noise (the equirectangular projection compresses
  longitude toward the poles).
- The elevation map is **gamma-lifted at build time** because GEBCO encodes
  ocean as 0 and most land is low-lying — 63% of the raw image is pure black.
  It's used only for shading, never measurement, so trading linearity for
  legibility is correct.

The ocean glint is deliberately weak and drops further when "sun follows camera"
is on: a perfect sphere lit by a directional source turns any broad specular
lobe into a white blob over a whole ocean basin.

### 4.2 Boundaries: two draw calls, not 4,854

All 258 country outlines live in one merged line object; all 4,596 states in
another. That's two draw calls for every border on Earth. The cost of merging is
that individual features can't be restyled — so hover and selection are drawn by
*separate* objects rebuilt on demand, holding one feature each. Filled highlights
subdivide any triangle longer than ~2° before projecting, so a country patch
hugs the sphere instead of chording through the planet; countries crossing the
antimeridian are "unwrapped" first.

### 4.3 34,027 cities on the GPU

Every city carries a threshold altitude derived logarithmically from its
population; visibility is decided **per-vertex on the GPU**, so zooming never
touches a buffer. Tokyo is visible from orbit, a 15,000-person town only when
you're close enough to read it. Labels are DOM (crisp text, de-overlapped on a
screen grid), updated at 20 Hz because DOM writes cost far more than the draw
call they annotate.

---

## 5. The city sub-view

This is where the project got ambitious. Opening a city stops the globe's render
loop (two WebGL contexts at 60 fps for one visible view makes a laptop fan
audible) and hands to a separate scene.

- **Coastline** — NOAA GSHHG at full resolution. Natural Earth's 1:10m coastline
  reduces Mumbai to ~5 vertices; GSHHG clipped to the city is 2,157 vertices and
  renders the peninsula, creeks and Elephanta properly. It's extruded into a
  slab (earcut top + wall quads) and traced again as an emissive line that bloom
  turns neon.
- **24 BMC wards** — translucent tinted plates, coloured on a cyan→magenta ramp
  in the corporation's own A–T order so the tint is a geographic gradient.
- **254 zoom-revealed places** — neighbourhoods, stations, campuses, forts,
  hills. They **reveal by rank, not raw importance**: the scores bunch near 0.5,
  so mapping them straight to a threshold made the map jump from sparse to
  saturated in one scroll notch. Ranking gives an even fill (1 → 32 → 63 → 90 →
  119 → 153 → 202 → 254 as you zoom in). Labels de-overlap by **rectangle** —
  a grid version let long names (the airport) graze their neighbours.
- **Roads + railway** — the OpenStreetMap arterial network (7,602 ways) and
  suburban railway (1,007 ways), five merged line objects with per-class
  level-of-detail, railway in violet dashes.
- **A 65-event timeline** across six eras (Ancient → Sultanate → Portuguese →
  Company → British Raj → Independent), every entry sourced and badged, disputed
  figures flagged.
- **Seven business dynasties** (Tata, Godrej, Wadia, Petit, Sassoon, Jejeebhoy,
  Ambani) in a Families tab, each expanding to industries, key figures, legacy
  and a source.

### 5.1 Floating panels

The information card started welded to a corner. It's now a small
**floating-window manager** (`panels.js`): the Detail panel follows your
selection and is draggable anywhere (clamped on-screen); a dock opens Legend,
Coordinates (live lat/lon from a ground-plane raycast) and Notes; any panel has
a **pin** that spawns a frozen copy so you can line several up and compare. The
panel overlay is pointer-transparent, so the map underneath stays fully
draggable — only the panels themselves catch the mouse.

---

## 6. The thematic ensemble

The project is built on **one deliberate contrast**: two visual registers that
should feel like two different places.

### 6.1 The globe — cool, quiet, photographic

- **Palette:** deep space blue-black (`#05070d`), a single cool accent
  (`#7fd4ff`) and a warm one (`#ffc75a`) for capitals/selection. Nothing shouts.
- **Type:** a clean system sans for reading, a monospace only for coordinates.
- **Surfaces:** translucent, blurred panels that float over the planet so the
  Earth stays readable underneath. The globe *is* the document; everything else
  gets out of its way.
- **Motion:** damped orbit, eased camera flights, a slow implied rotation. Calm.

### 6.2 The city view — loud, neon, "cyber-tech"

Selecting a city is meant to feel like stepping through a door into a different
aesthetic. The components of that ensemble:

- **Colour:** a hard cyberpunk triad — neon cyan `#00f0ff`, hot magenta
  `#ff2d78`, acid green `#9dff3d` — over a near-black void, with warm ramps for
  roads and violet for rail.
- **Typography:** monospace *everywhere*, wide letter-spacing, uppercase labels
  — the readout look of a console rather than a document.
- **Chromatic split:** the city title is offset-shadowed magenta-left / cyan-right,
  the cheapest convincing "signal / VHS" cue there is.
- **Scanlines:** a single repeating-gradient overlay with multiply blend — a CRT
  veil over the whole sub-view, pointer-transparent and effectively free.
- **Clipped corners:** panels and buttons use `clip-path` polygons with one
  chamfered corner instead of border-radius, so they read as HUD panels, not web
  buttons.
- **Bloom:** an UnrealBloom pass makes the emissive coastline and markers bleed
  light; the whole model glows like a hologram table rather than a printed map.
- **Glowing marks:** history events are pink light-beams rising off the land;
  the active one pulses; place dots carry a soft additive halo; the railway is a
  dashed violet line so it never reads as a road.
- **Layered depth:** land slab, ward plates, road lines, POI dots and history
  beams each sit at their own height above the surface, so the model has real
  parallax as it rotates rather than being a flat decal.

The two registers never mix: `styles.css` and `styles-city.css` are separate
files precisely so the neon can't leak onto the globe, and the globe's calm
can't dull the city view.

### 6.3 Motion and feedback as theme

- The city model **auto-rotates** slowly (the "specimen on a turntable" feel),
  and dragging is **zoom-adaptive** — gentle when you're close, so precision
  work never feels twitchy.
- Layers **fade in with zoom** rather than popping (state borders on the globe,
  POIs on the city map), which reads as a system resolving detail as you lean in.
- Selection is always echoed in three places at once — the list row, the map
  marker, and the detail panel — so the interface always agrees with itself.

---

## 7. Engineering decisions worth remembering

A handful of choices define the project's character more than any feature:

- **Measured, not guessed, tolerances.** The click-to-select radius, the
  coastal-snap distance for picking, the label de-overlap box — each was tuned
  against real test cases and the numbers are recorded in comments, not left as
  magic constants.
- **Bugs are documented where they were fixed.** The earcut winding flip (which
  made the city land render black), the stale-panel-label trap, the
  render-loop-re-entrancy guard — each carries a comment explaining the symptom,
  because each *looked* like a different kind of bug than it was.
- **Provenance travels with the pixel.** Every timeline event and every figure
  names its source on screen with an Official / Secondary badge, and where
  accounts differ the UI shows the disagreement rather than inventing precision.

---

## 8. Correctness passes

Two accuracy reviews shaped the Mumbai data:

- Verified the shaky facts against multiple sources and **corrected** the 2006
  train-bombing toll (≈209, not "over 180"), dropped a false-precise rename date
  ("4 March 1995" → simply 1995, flagged as disputed), and reconciled the Wadia
  founding year with the gazetteer.
- **Filled real gaps:** the birth of Indian cinema (Raja Harishchandra, Bombay,
  1913), the dabbawalas (1890), and Film City (1977) — because a Mumbai history
  without its film industry is incomplete.
- Reconciled the population figure the globe shows (GeoNames, ~12.69 M) with the
  Census figure the history panel shows (12,442,373) so the two views no longer
  look contradictory. Both are correct; they are different compilers of the same
  city. (See [SOURCES_AND_ANALYSIS.md](SOURCES_AND_ANALYSIS.md) for why this
  number is so easy to get wrong.)

---

## 9. What is designed but not yet built

- **Holographic family member.** The intended behaviour: clicking a family in
  the Families tab replaces the city map with a rotating holographic point-cloud
  bust of a notable member (procedural and licence-clean — no copyrighted
  photos or scans), tinted to the family's era, with a floating info panel of
  their biography. This was designed (a procedural bust point cloud with a
  scanline/flicker shader, driven by a `notable` field per dynasty) but the
  session redirected to documentation before it was coded. The Families tab and
  panel system it would build on are already in place.

---

## 10. In one line

A calm, photographic planet you can read like a map, and a loud, neon city you
can read like a story — sharing one codebase, one data pipeline, and a single
rule: **show the seams, cite the source, and never pretend to a precision the
data doesn't have.**
