# World Globe

An interactive 3D terrain globe in the browser — NASA satellite imagery with
sun-responsive relief shading, every country and every state/province on Earth
as selectable regions, and a searchable list of 34,027 cities.

No build step, no bundler, no API keys, no network access at runtime.

```bash
npm install
npm run build     # fetch sources, process imagery, build data (~5 min first run)
npm run serve     # http://localhost:8080
```

| | |
|---|---|
| Countries | 258 |
| States / provinces | 4,596 |
| Cities | 34,027 (places of 15,000+; deeper tiers supported) |
| City histories | Mumbai — 62 events, 7 families, 254 places, roads + rail, 24 wards |
| | + 14 more: Rome, Cairo, Tokyo, Mexico City, London, Paris, Istanbul, Athens, Jerusalem, Beijing, Delhi, Baghdad, Moscow, New York — timeline + families + map |

**Drag** to rotate · **scroll** to zoom · **click** a region or city to inspect
it · **`/`** to search.

Drill down through **World → country → states → cities**, or search across all
three at once. Search is accent-insensitive: `sao paulo` finds *São Paulo*.

Select **Mumbai** and press *Explore history* for the city sub-view: a rotating
3D model built from full-resolution NOAA coastline data and the corporation's
own 24 ward boundaries, with a 62-event timeline running from the edicts of
Ashoka to Atal Setu — and a Families tab tracing the seven business dynasties
(Tata, Godrej, Wadia, Petit, Sassoon, Jejeebhoy, Ambani) that built Indian
industry. Every entry names the source it came from and flags where accounts
disagree.

**Fourteen more cities** now have the same history view — a full-resolution
GSHHG coastline, an era-banded timeline (22–40 events each), a Families tab of
the dynasties that built them, and map markers for their landmarks:

- **Rome, Cairo, Tokyo, Mexico City** — prose ported from the `atlas/` dossiers
  (`npm run build:atlas-cities`).
- **London, Paris, Istanbul, Athens, Jerusalem, Beijing, Delhi, Baghdad,
  Moscow, New York City** — authored fresh (`npm run build:world-cities`).

Because these timelines are compiled from general references (UNESCO,
national/city portals, Britannica, World History Encyclopedia) rather than
Mumbai's per-event gazetteers, each city file says so in its `caveats`. Coastal
frames get real shoreline; inland cities (Cairo, Paris, Jerusalem, Beijing,
Delhi, Baghdad, Moscow…) clip to a solid land plane, also noted in `caveats`.
After (re)generating a city, run `node tools/build-city.mjs <id>` for its
coastline.

## Sharing it beyond your own PC

`npm run serve` (port 8080) is for solo local work — only this computer can
reach it. To let **other devices** open the globe:

```bash
python serve.py          # binds 0.0.0.0; prints your network URL
```

It reports an address like `http://192.168.1.35:8080/` that any device on the
**same Wi-Fi** can open. For access from the wider internet (via a
cloudflared/ngrok tunnel), firewall notes, and the security caveats, see
**[PUBLIC_ACCESS.md](PUBLIC_ACCESS.md)**. Needs Flask:
`pip install -r requirements.txt`.

---

## Documentation

- **[docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)** — reference: architecture,
  the terrain shader, the data pipeline, performance notes, how to extend it.
- **[docs/DESIGN_AND_BUILD.md](docs/DESIGN_AND_BUILD.md)** — the design & build
  story: how it was made, why each decision went the way it did, and the
  thematic ensemble (the two visual registers) that holds it together.
- **[docs/SOURCES.md](docs/SOURCES.md)** — every data source, its publisher, its
  licence, and what you must do if you publish this.
- **[docs/SOURCES_AND_ANALYSIS.md](docs/SOURCES_AND_ANALYSIS.md)** — a
  consolidated source list plus a candid retrospective on how the information
  was gathered and how the fetching could have been improved.

## Attribution

City data is licensed **CC BY 4.0 and attribution is required**:

> Boundaries: Natural Earth (public domain). Cities: © GeoNames, CC BY 4.0.
> Imagery: NASA Earth Observatory. Elevation: GEBCO (IHO/IOC-UNESCO).
> Coastline: GSHHG (NOAA). Wards: MCGM, GODL-India.
> Roads & rail: © OpenStreetMap contributors, ODbL.

This credit is rendered in the app itself under **Data sources**, bottom right —
that is what actually satisfies CC BY. Keep it if you fork the UI.

The boundaries are simplified for display and reflect one editorial view of
several dozen contested borders. They are not authoritative — see
[SOURCES.md](docs/SOURCES.md) before using them for anything that matters.
