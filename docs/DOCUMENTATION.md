# World Globe — Documentation

An interactive 3D terrain globe in the browser. It renders NASA satellite
imagery with sun-responsive relief shading, draws every country and every
first-level administrative division on Earth, and carries a searchable gazetteer
of 34,027 cities that can be browsed down from the world to a single town.

Cities with a history file open a sub-view: a rotating 3D model of the city
built from full-resolution coastline data, alongside an interactive timeline in
which every entry cites its source.

No build step, no bundler, no API keys, and no network access at runtime.

| | |
|---|---|
| Countries (Admin-0) | **258** |
| States / provinces (Admin-1) | **4,596** |
| Cities | **34,027** (places of 15,000+; a deeper tier is one flag away) |
| City histories | **1** — Mumbai: 62 events, 7 families, 254 places, 24 wards, roads + rail |
| Runtime dependencies | three.js and earcut, both vendored locally |
| Total payload | ~9.5 MB of data + ~1.3 MB of textures |

---

## 1. Quick start

```bash
npm install          # mapshaper, sharp, three, earcut, fflate (build-time only)
npm run build        # fetch sources, process textures, build data  (~5 min first time)
npm run serve        # http://localhost:8080
```

`npm run build` is the whole pipeline. To run the stages individually:

```bash
npm run fetch            # download raw sources into data/raw/ and textures/
npm run build:textures   # resample NASA/GEBCO imagery to web sizes
npm run build:data       # shapefiles -> GeoJSON, gazetteer -> cities.json
npm run build:city       # high-resolution coastline for the city view
```

The app **must** be served over HTTP. Opening `index.html` as a `file://` URL
fails, because browsers block ES module loading and `fetch()` on that protocol.
The loading screen says so explicitly if it happens.

### Loading a deeper city set

GeoNames publishes the same gazetteer at several population floors. The default
is 15,000. To go deeper:

```bash
npm run fetch -- --cities=cities1000 --force
npm run build:data
```

| Tier | Population floor | Approx. rows | `cities.json` |
|---|---|---|---|
| `cities15000` | 15,000 | 34,000 | 4.3 MB |
| `cities5000` | 5,000 | 55,000 | ~7 MB |
| `cities1000` | 1,000 | 150,000 | ~19 MB |
| `cities500` | 500 | 200,000 | ~26 MB |

Nothing downstream changes — the renderer's level-of-detail logic and the
virtualised list both scale to the larger sets. Above `cities5000` expect the
first page load to get noticeably heavier.

---

## 2. How it is put together

```
index.html          markup, import map
styles.css          globe interface styling
styles-city.css     city sub-view styling, kept separate so it cannot leak
src/
  main.js           entry point; the only file that knows about both the globe and the panels
  globe/
    scene.js        renderer, camera, OrbitControls, animation loop, camera flights
    earth.js        globe mesh + terrain shader, atmosphere shell, star field
  layers/
    boundaries.js   country and state borders, hover and selection highlighting
    cities.js       34k city markers (GPU level-of-detail) and DOM labels
  data/
    cities.js       CityTable — the columnar gazetteer, search, nearest-city lookup
  geo/
    polygon.js      point-in-polygon + spatial index   (shared with the build tools)
    tessellate.js   GeoJSON polygons -> sphere-hugging triangles and outlines
  city/
    cityview.js     the city sub-view: history, timeline, source citations
    citymap.js      rotating 3D city model, bloom, place markers
  ui/
    browser.js      left panel: drill-down navigation and search
    details.js      right panel: information card
    VirtualList.js  windowed list, so 34k rows cost the same as 258
  util/
    geo.js          lat/lon <-> scene coordinates, distances, formatting
tools/
  fetch-sources.mjs downloads every raw input
  build-textures.mjs resamples imagery
  build-data.mjs    builds the runtime data files
  build-city.mjs    clips a high-resolution coastline for one city
  serve.mjs         static file server for development
vendor/             three.js, OrbitControls, Line2, earcut — vendored, not fetched
data/               generated runtime data (+ raw/ sources)
  cities/           per-city history JSON, coastlines, and the index of both
textures/           generated image maps (+ raw downloads)
```

The dependency direction is strictly one way: layers know nothing about the UI,
the UI knows nothing about three.js, and `main.js` is the only place the two
meet. `geo/polygon.js` is deliberately shared with the Node build scripts — see
§4.3 for why that matters.

---

## 3. Rendering

### 3.1 The terrain shader

The colour map is NASA's Blue Marble Next Generation with topography and
bathymetry. It already has relief baked into it, but baked relief is lit from a
fixed direction and cannot respond to a moving sun, so it reads as a photograph
pasted onto a ball.

Instead, `earth.js` re-derives a surface normal in the fragment shader by taking
central differences on the GEBCO elevation map, and lights *that*:

```glsl
vec3 east  = normalize(cross(polar, N));
vec3 north = normalize(cross(N, east));
N = normalize(N - uReliefScale * (east * dHdx + north * dHdy));
```

Two details matter here:

- **Latitude correction.** An equirectangular map compresses longitude towards
  the poles, so a fixed texel step covers less ground the further north you go.
  Without dividing the east–west slope by `cos(lat)`, Greenland and Antarctica
  turn into noise.
- **The elevation map is gamma-lifted at build time.** GEBCO encodes ocean as
  exactly 0 and land in 1..255, and most land is low-lying, so the raw image is
  ~63% pure black with everything else crowded into the bottom of the range. A
  `^0.55` lift spreads the lowlands back out. It is used only for shading, never
  for measurement, so trading linearity for legibility is the right call.

The same pass adds night lights on the dark side, a specular highlight masked to
water only, and a Fresnel rim standing in for atmospheric scattering.

> **The ocean glint is deliberately weak.** The globe is a perfect sphere lit by
> a directional source, so even a fairly tight specular lobe spreads into a pale
> blob covering an entire ocean basin. The exponent is 900, and the strength
> drops from `0.22` to `0.03` when "sun follows camera" is on — with the light
> parked next to the eye, `dot(N,H)` stays near 1 across most of the visible
> hemisphere and any appreciable specular washes the oceans out completely.

### 3.2 Borders: two draw calls, not 4,854

All 258 country outlines live in one merged `LineSegments`, and all 4,596 state
outlines in another. Merging costs the ability to style an individual feature,
so hover and selection are drawn by two *separate* objects that are rebuilt on
demand and hold exactly one feature each. Rebuilding one polygon on mouse-move
is cheap; re-uploading all of them would not be.

State borders fade in with zoom (`altitude < 1.35`) because 4,596 subdivisions
on a globe 600 pixels across is illegible.

### 3.3 Filled highlights on a sphere

Turning a country outline into a filled patch has two traps, both handled in
`geo/tessellate.js`:

- **Triangulation is flat.** earcut works in the lon/lat plane, so a large
  triangle becomes a *chord through the planet* once projected — Russia would
  sink through the mantle. Every triangle whose edges exceed ~2° is therefore
  subdivided at the midpoint of its longest edge before projection. Verified:
  Russia's fill has 67,167 vertices, all at radius 1.0016 exactly.
- **The antimeridian.** Countries straddling 180° have vertices at both +179 and
  −179, which are 358° apart on a flat plane and smear the triangulation across
  the whole map. Such rings are "unwrapped" into a continuous run before
  triangulating; the projection uses `sin`/`cos`, which are periodic, so a
  longitude of 190 lands in exactly the right place with no wrapping back.

Outlines need neither fix: each vertex is projected independently, and 179° and
−179° genuinely *are* adjacent points on a sphere.

### 3.4 City level of detail

Every city carries a threshold altitude derived logarithmically from its
population. Visibility is decided **per vertex on the GPU**, so zooming never
touches a buffer or runs any JavaScript:

```glsl
vAlpha = smoothstep(aMinAlt * 1.6, aMinAlt * 0.75, uAltitude);
```

Tokyo is visible from orbit; a 15,000-person town appears only when you are
close enough for it to be legible. National capitals get their own colour and
appear earlier than population alone would justify.

Labels are DOM elements, not sprites — there are never more than ~44 on screen,
and the browser gives crisp, correctly-kerned text for free. They are updated at
20 Hz rather than 60 (DOM writes cost far more than the draw call they annotate)
and de-overlapped by a greedy pass over a coarse screen grid, so labels stop
stacking in dense regions like the Ruhr.

---

## 4. The data pipeline

### 4.1 Boundaries

Natural Earth ships ~170 columns per record, most of them per-country "point of
view" variants of the same attribute (`ADM0_A3_IN`, `FCLASS_RU`, …) encoding how
different governments depict disputed territory. The build keeps a handful of
useful fields and the default view — see [SOURCES.md](SOURCES.md) for what that
means politically.

Geometry is simplified with mapshaper using Visvalingam weighted area,
`keep-shapes` on so no island is ever deleted outright:

| Layer | Simplification | Output |
|---|---|---|
| Admin-0 countries | 12% | 1.42 MB |
| Admin-1 states/provinces | 8% | 3.79 MB |

### 4.2 Cities

`cities.json` is **columnar** — one flat array per field, rather than 34,027
objects each repeating the same fourteen key strings. It is smaller over the
wire, parses faster, and makes the common queries array scans. Rows are sorted
by population descending, which several parts of the UI rely on (every "top N"
query is just a prefix).

### 4.3 The spatial join, and why the code is shared

Every city is assigned to its containing country and state polygon by
point-in-polygon test at build time, so "show me the cities in this state" is
exact rather than a fuzzy match on administrative codes.

Critically, `src/geo/polygon.js` is imported by **both** the Node build script
and the browser. If the build used one implementation and click-picking used
another, the app could tell you a city is in one state and then, when you
clicked that same city, tell you it is in a different one. One implementation,
no second opinion.

A uniform lat/lon grid index makes it cheap: without it, placing 34,027 cities
would run point-in-polygon against all 4,596 polygons every time.

### 4.4 Two tolerances, both measured

The simplification in §4.1 moves coastlines by a few kilometres, which puts most
waterfront cities *outside* their own country's polygon. Two different snap
distances handle this:

- **Build-time join: 0.25°** (~25 km). Generous, because it runs once and a
  wrong answer is baked in.
- **Interactive picking: 0.12°** (~13 km). This was measured, not guessed:
  0.06° leaves Reykjavík in the sea; 0.10° is the smallest value that correctly
  resolves a sample of eight awkward waterfront cities (Reykjavík, Manhattan,
  Helsinki, Oslo, Nice, Chennai, Cape Town, San Francisco); and every value
  tried up to 0.4° still returns open ocean for all ten deep-water probes. The
  default sits just above what is needed and far below what would start
  inventing coastline.

### 4.5 Where the join still fails

Of 34,027 cities, **2** cannot be placed in a country and **15** cannot be
placed in a state. Every one is on an island too small to survive
simplification.

Thirteen more — Key West, Tarawa, Adamstown on Pitcairn, the Cocos Islands and
similar — are placed by falling back to GeoNames' own ISO country code. That is
not a fudge: where our own generalisation deleted the coastline, the gazetteer's
country code is straightforwardly better evidence than a geometric test against
a shape we destroyed.

The two that remain unplaced are instructive. **Magong** is in Taiwan, which
Natural Earth records with `ISO_A2 = -99`, so there is no code to fall back on;
that is a political-neutrality decision in the source data, not a bug here. See
[SOURCES.md §Disputed boundaries](SOURCES.md#disputed-boundaries-and-what-this-project-does-about-them).

---

## 5. Using the interface

| Action | Result |
|---|---|
| Drag | Rotate |
| Scroll / pinch | Zoom |
| Click a region | Select the state (zoomed in) or country (zoomed out) |
| Click a city marker | Select that city (within 20 px of the drawn marker) |
| `/` | Focus the search box |
| `Esc` | Clear the selection |

The left panel drills down: **World → country → states → cities**, with a
breadcrumb back up. Search matches cities, countries and states at once, is
accent-insensitive (`sao paulo` finds *São Paulo*, `zurich` finds *Zürich*), and
ranks a whole-name match above a match at the start of a word above one buried
mid-word — so searching `york` returns York itself before New York before
Yorkton.

Whether a click means "this city" or "this region" is decided in **pixels, not
kilometres**: a click within 20 px of a marker as drawn selects that city,
anything else falls through to the region underneath. Judging it by ground
distance instead would, at globe scale, let a click in the middle of the
Caribbean select San José 500 km away.

The right panel shows details of whatever is selected. Where Natural Earth and
GeoNames give different population figures for the same country, **both are
shown and labelled** rather than one being silently preferred.

Layer controls (bottom right) toggle each border level, city markers, and
"sun follows camera", plus sliders for relief strength and marker size.

---

## 6. The city view

Selecting a city that has a history file adds an **Explore history** button to its
card. That opens a sub-view over the globe: a rotating 3D model of the city on
one side, its history and an interactive timeline on the other.

Mumbai is the first city built out — 62 events across six eras, from the edicts
of Ashoka to the opening of Atal Setu in 2024, every one carrying its own
citation, plus the corporation's 24 administrative wards and a Families tab
covering the seven business dynasties that built Indian industry.

### 6.1 Which cities have one

`data/cities/index.json` maps GeoNames ids to city slugs. The button only
appears for cities listed there, so it is never offered and then broken. Adding
a city is three steps and no code:

```bash
# 1. add a bbox, centre and (optionally) a divisions endpoint to CITIES
#    in tools/build-city.mjs, then:
npm run build:city -- lisbon
# 2. write data/cities/lisbon.json  (same shape as mumbai.json)
# 3. add the GeoNames id to data/cities/index.json
```

The divisions layer is optional: a city whose build produces no
`<id>-divisions.geojson` simply loads without it, and the ward toggle hides
itself.

### 6.2 The 3D model

The coastline is **GSHHG at full resolution** — see [SOURCES.md §9](SOURCES.md).
Natural Earth's 1:10m data, which the globe uses, reduces Mumbai to about five
vertices and drops Elephanta Island entirely. GSHHG clipped to the city bbox is
2,157 vertices and 42 KB, so there is no reason to simplify it at all.

Geometry is built the same way as the globe's country fills — earcut for the top
face, a quad per ring edge for the walls — but on a **local tangent plane**
rather than a sphere. Over 40 km the curvature is irrelevant, and a flat
projection keeps the geometry, the marker placement and the screen projection
trivially consistent. Longitude is scaled by cos(latitude) so the city keeps its
true proportions instead of being stretched east–west.

> **A bug worth recording.** earcut returns triangles wound counter-clockwise in
> its own XY plane. This code maps earcut's Y onto the scene's Z — a handedness
> flip — which turns every triangle clockwise and leaves the computed normals
> pointing at the sea floor. The land caught no light from above and rendered as
> a black void inside a glowing outline. The top faces are therefore emitted in
> reverse index order. If you ever port this projection, check the winding
> first: the symptom looks like a lighting problem and is not one.

The coastline is traced a second time as an emissive line, which is what the
bloom pass turns into the neon edge. Bloom threshold is low (0.18) because
almost nothing in the scene is bright — only the coastline and the markers are
meant to bleed.

### 6.3 Administrative divisions

Mumbai's 24 BMC wards are drawn as translucent tinted plates just above the land
slab, each with a bright border. Every ward is its own mesh rather than one
merged buffer: the whole point of the layer is picking out one division at a
time, and merging would cost exactly the ability the layer exists to provide.
Twenty-four draw calls is nothing.

The colour ramp walks cyan to magenta across the wards **in the corporation's
own A–T order**, which runs roughly south to north — so the tint is a geographic
gradient rather than noise, and the chip list beside the map reads in the same
order. The API returns them in arbitrary OBJECTID order, so the build passes the
intended sequence through from the data file.

Hovering a chip previews that ward on the map; clicking pins it and mutes the
other 23, and the floating code labels collapse to just the selected one.

The boundaries come from **MCGM's own GIS service** rather than the widely-cited
community copy, which is CC BY-**SA**. See [SOURCES.md §10](SOURCES.md) — the
short version is that ShareAlike would oblige you to publish your processed ward
data under a licence a competitor could take, and GODL-India, which covers the
corporation's own publication, does not.

> The published geometry contains ~106 self-intersections between adjacent
> wards. The count barely moves between simplification levels, which is how you
> can tell they are in the source rather than introduced by processing. The
> build therefore applies **no** simplification and repairs with `-clean`
> instead — simplifying could not fix them and would only add more.

### 6.4 Zoom detail: points of interest

At first the map only scaled when you zoomed — a bigger version of the same
outline. It now fills in with places the way a real map does: pull back and you
see the airport and a few major suburbs; dive in and neighbourhoods, railway
stations, campuses, forts, stadiums and hills appear.

The data is **254 curated points** from the GeoNames India gazetteer clipped to
the Mumbai bbox (see [SOURCES.md §10](SOURCES.md)). The raw bbox is ~45% hotels
and restaurants, so the build keeps only a chosen set of feature codes and
scores each survivor for importance.

Two mechanisms make the reveal feel right:

- **Reveal by rank, not by raw score.** Each place is visible once the camera is
  at or below a threshold distance derived from its *rank*, not its importance
  value directly. The scores are bunched — most Mumbai localities land near 0.5
  — so mapping them straight to a threshold made the map jump from sparse to
  saturated in a single scroll notch. Ranking spreads the reveal evenly: the
  count climbs 1 → 32 → 63 → 90 → 119 → 153 → 202 → 254 as you zoom in. A gamma
  weights the bulk toward close zoom, so the pulled-back view stays legible.
  Visibility itself is a single shader uniform (`uDistance`) tested per point on
  the GPU — zooming touches no JavaScript and no buffers.

- **Labels de-overlap by rectangle.** The dots are cheap, but their names would
  stack in dense areas, so at most 40 labels draw at once, chosen greedily in
  importance order: a label keeps its spot only if its box clears every box
  already placed. An earlier grid version let labels near a cell boundary graze
  each other; the rectangle test removes overlaps entirely (verified zero at
  every zoom) and is trivial at 40 labels. Category tints the label — a station
  reads differently from a neighbourhood or a landmark — without needing a
  legend.

A **Places** toggle in the header turns the whole layer off, like Wards.

### 6.5 Roads and railway

The arterial roads and the suburban railway are what finally make the map read
as a real city rather than a decorated coastline. They come from **OpenStreetMap**
via the Overpass API — 7,602 road ways (motorway, trunk, primary, secondary)
and 1,007 railway ways, ~66k vertices, clipped to the Mumbai bbox.

Rendering is five merged `LineSegments`, one per class — roads in a warm pale
ramp (motorway brightest, secondary dimmest) so they read as a road network over
the cool land, and the railway as a **violet dashed** line so it is never
mistaken for a road. Each class has a level-of-detail threshold: the arterials
and the railway are always drawn; the dense secondary grid only appears once you
zoom in past the pulled-back view, exactly as roads behave on a real map. A
**Roads** toggle turns the layer off.

> **This is the project's one licensing compromise, made deliberately.** There
> is no government or permissively-licensed source of street-level road and rail
> geometry — OSM is the only option, and it is **ODbL** (share-alike on the data
> extract, not on the app or the rendered image). It was added at the user's
> explicit request, knowing the trade. The layer is isolated in a single file
> (`mumbai-roads.json`) behind the toggle precisely so it can be removed cleanly
> if the share-alike obligation is unwanted. The full analysis — including how to
> keep it while staying commercial — is in [SOURCES.md §11](SOURCES.md).

### 6.6 Families

The side column carries two tabs — **Timeline** and **Families** — rather than
stacking them, because a 62-row timeline and a seven-card family list competing
for the same vertical space left both too short.

The Families tab traces the business dynasties that built the city and, through
it, much of Indian industry: the Parsi houses (Tata, Godrej, Wadia, Jejeebhoy,
Petit), the Baghdadi Jewish Sassoons, and — for the modern period — the Ambanis.
Each card lists the industries that family founded (shipbuilding, cotton mills,
steel, hydroelectric power, hospitality, aviation, software, consumer goods,
petrochemicals), expands to a sourced summary and its surviving legacy, and — if
the family has a landmark in the dataset — lights that point on the map. The Taj
for the Tatas, the Sassoon Docks for the Sassoons, Vikhroli for the Godrejs.

The label over the map is **derived from the active tab**, not cached on each
selection: `_currentPlace()` reads the open family on the Families tab and the
selected event on the Timeline tab. That is deliberate — an earlier version
cached the place on every click and left a stale marker labelled behind the
other tab. Returning to the Timeline restores exactly the event you left.

The families are data, not code: they live in the `dynasties` block of
`mumbai.json`, and a city without that block simply shows no Families tab.

### 6.7 Performance

The globe's render loop **stops** while the city view is open, and restarts on
close. Two WebGL contexts running at 60 fps when only one is visible is the kind
of thing that makes a laptop fan audible.

`GlobeScene.start()` is guarded against re-entry for the same reason — without
it, every visit to a city and back would schedule an additional animation loop,
and the globe's render rate would double each time.

### 6.8 Sourcing, on screen

Every timeline entry names its source in the detail card, with a link and a
badge marking it **Official source** or **Secondary source**. Where accounts
disagree — the Samyukta Maharashtra death toll is 105 in some and 106 in others
— the entry is flagged rather than being given a false precision.

This is deliberate. A history panel that presents dates without provenance is
indistinguishable from one that made them up.

---

## 7. Performance notes

- **Draw calls:** two for all borders, one for all 34,027 cities, one for the
  globe, one each for atmosphere and stars.
- **Device pixel ratio is capped at 2.** A 3× display at full resolution costs
  9× the fragments for a difference almost nobody can see.
- **Bounding spheres are set by hand** where they are known analytically (the
  city point cloud), skipping an O(n) computation over 34k points.
- **The city search key is precomputed once** at load — ~1.5 MB of normalised
  strings that turn every subsequent search into a plain substring scan.
- `VirtualList` keeps ~30 rows in the DOM regardless of list length. Verified:
  the 34,027-row "all cities" view renders 22 row elements.

The one operation that is *not* fast is building the 34,027-item array for the
"all cities" list (~1 s). It is a deliberate trade: doing it lazily would
complicate every consumer of `VirtualList` to save a second on a view most
people never open.

---

## 8. Extending it

**Add a data layer.** Implement `{ object: THREE.Object3D, update(ctx) }` and
pass it to `scene.add()`. `ctx` carries `camera`, `altitude`, `dt`, `now` and
`renderer`, which is everything a layer needs for its own level-of-detail work.

**Change the imagery.** Drop replacements into `textures/` and adjust
`createEarth()`. Any equirectangular (plate carrée) map works. If you change the
elevation map's dimensions, update `uElevTexel`.

**Query the data from the console.** `window.globe` exposes `scene`,
`boundaries`, `cityLayer`, `cities`, `browser`, `details` and `manifest`:

```js
globe.cities.search('kyoto')                  // -> row indices
globe.cities.get(1234)                        // -> a city object
globe.boundaries.locate(48.8566, 2.3522)      // -> { country, state, ... }
globe.cities.byState.get('USA-3521')          // -> row indices in that state
globe.scene.flyTo(35.6762, 139.6503, 1.2)     // fly to Tokyo
```

---

## 9. Known limitations

- **"All cities" means places of 15,000 or more.** That is 34,027 settlements,
  not every named place on Earth. §1 explains how to go down to 500.
- **Borders are simplified** to 8–12% of source detail. Excellent at globe
  scale; visibly generalised if you zoom all the way in. Reduce the
  simplification in `build-data.mjs` and accept larger files if you need more.
- **A state's "combined city population" is not its population.** It sums only
  the places in this dataset, omitting everywhere below the population floor and
  all rural areas. The interface says so on the card itself.
- **Boundaries are not neutral, because no boundary dataset is.** See
  [SOURCES.md](SOURCES.md).
- **Elevation shading is relief, not measurement.** The gamma lift in §3.1 makes
  the map non-linear by design.
- **Requires WebGL2** and roughly 200 MB of GPU memory for the texture set.

---

## 10. Troubleshooting

| Symptom | Cause |
|---|---|
| Loading screen stuck; console shows `file://` errors | Serve over HTTP: `npm run serve` |
| "Could not load the data files" | `npm run build:data` has not been run |
| Globe is black but the panels work | Textures missing — `npm run fetch && npm run build:textures` |
| `Named export not found` from a build script | `package.json` needs `"type": "module"` |
| Terrain looks flat | Relief slider is at 0, or `earth_elev_2k.jpg` is missing |

---

## 11. Licence and attribution

The code here is yours to do as you like with. **The data is not automatically
so** — GeoNames requires attribution under CC BY 4.0, and the NASA and GEBCO
imagery carries requested (not required) citation. Every obligation is set out
in **[SOURCES.md](SOURCES.md)**, which is the authoritative document for
provenance and licensing. Read it before publishing this anywhere public.
