# Sources & a Retrospective on Gathering Them

Two parts. **Part A** is a single consolidated list of every source the project
draws on. **Part B** is an honest, critical analysis of how the information was
fetched during this build — what went wrong, why, and how the process should
have been run to avoid it.

The exhaustive licence text and per-source detail lives in
[SOURCES.md](SOURCES.md); this document is the *overview plus the post-mortem*.

---

# Part A — Every source, in one place

## A.1 Geographic & imagery data (the machine-readable inputs)

| # | Source | Publisher | Licence | Feeds |
|---|---|---|---|---|
| 1 | Natural Earth 10m Admin-0 / Admin-1 | Natural Earth (NACIS) | Public domain | Country + state borders, country facts |
| 2 | GeoNames `cities15000` + country/admin tables | GeoNames (Unxos GmbH) | **CC BY 4.0** | 34,027 city markers, names, populations |
| 3 | GeoNames `IN.zip` (India dump) | GeoNames | **CC BY 4.0** | 254 Mumbai zoom-in places |
| 4 | Blue Marble Next Generation + Black Marble | NASA Earth Observatory | Public domain (CC0-ish) | Globe day + night textures |
| 5 | GEBCO_08 elevation grid | GEBCO (IHO / IOC-UNESCO) | Public domain | Relief shading + ocean mask |
| 6 | GSHHG 2.3.7 shoreline | P. Wessel (UH) & W. Smith (NOAA) | **LGPL** | Mumbai high-resolution coastline |
| 7 | BMC Ward boundaries (ArcGIS service) | Municipal Corporation of Greater Mumbai | **GODL-India** (by policy) | 24 ward plates |
| 8 | OpenStreetMap (via Overpass API) | OpenStreetMap contributors | **ODbL** | Roads (7,602) + railway (1,007) |

## A.2 Mumbai history & prose sources (the human-readable inputs)

| Source | Publisher | Official? | Feeds |
|---|---|---|---|
| Gazetteer of Greater Bombay — History | Gazetteers Dept, Govt of Maharashtra | Yes | Main narrative, ancient → modern |
| Gazetteer of Bombay City and Island (Edwardes, 1909) | Gazetteers Dept, Govt of Maharashtra | Yes | Islands, reclamation, early admin |
| Elephanta Caves (WHC 244) | UNESCO | Yes | Caves, inscription 1987 |
| Chhatrapati Shivaji Terminus (WHC 945) | UNESCO | Yes | CST, inscription 2004 |
| Victorian Gothic & Art Deco Ensembles (WHC 1480) | UNESCO | Yes | Two expansion waves, 2018 |
| Mumbai City District — History / Demography | District Administration, Govt of Maharashtra | Yes | Rename, Mumbadevi, district population |
| Census of India 2011 | Registrar General & Census Commissioner | Yes | Population figures |
| Encyclopaedia Iranica — Parsi Communities | Columbia University (peer-reviewed) | ~ | Early Zoroastrian migration |
| Tata group — Our Heritage | Tata Sons | Yes (company) | Tata dynasty dates |
| Godrej — Our Story | Godrej | Yes (company) | Godrej dynasty dates |
| Mumbai Legacy Project heritage note | MCGM | Yes | Petit family |
| The Rise and Fall of the Sassoons; encyclopaedia entries | The India Forum / Encyclopedia.com | Secondary | Sassoon family |
| Reliance — history + press | Reliance / press | Secondary | Ambani / Reliance |
| Standard references on Indian cinema & institutions | Britannica etc. | Secondary | Cinema, dabbawalas, Film City |

**In the Mumbai data file: 22 distinct sources — 17 official, 5 secondary.**
Every timeline event and figure names its source on screen with an
**Official / Secondary** badge.

## A.3 Software (ships to the browser or runs at build)

| Library | Licence | Role |
|---|---|---|
| three.js 0.185 | MIT | WebGL rendering (vendored) |
| earcut | ISC | Polygon triangulation (vendored) |
| mapshaper | MPL-2.0 | Shapefile → GeoJSON (build only) |
| sharp | Apache-2.0 | Image resampling (build only) |
| fflate | MIT | Unzipping downloads (build only) |

## A.4 The obligations, in brief

1. **Must credit GeoNames** (CC BY 4.0) — legal requirement.
2. **Must credit MCGM** (GODL-India) — and it is the basis for commercial use.
3. **Must credit OpenStreetMap and honour ODbL share-alike** — attribution, plus
   offering the road-data extract under ODbL if the app is distributed. This is
   the project's one share-alike obligation; it is isolated in a single toggleable
   file. (Full analysis: SOURCES.md §11.)
4. **Should credit NASA, GEBCO, NOAA/GSHHG** — requested, not required (GSHHG's
   LGPL does require it).
5. **Need not credit Natural Earth** — public domain.
6. All of the above required credits are rendered **in the app**, not just here.

---

# Part B — How the information-fetching could have been improved

This is a candid retrospective. The project's *data-handling* was careful — every
figure is sourced, disputes are flagged, licences were audited — but the
*retrieval process itself* made several avoidable errors, and it is worth being
exact about them.

## B.1 What actually went wrong

Five concrete failures happened during this build:

1. **Trusting a search summary as if it were the source.** Web-search results
   return an LLM summary of snippets. Several times that summary was simply
   wrong, and it was taken at face value:
   - It reported Greater Mumbai's population as **9,356,962** — which is only the
     *suburban district part-record*, about three-quarters of the real municipal
     figure of **12,442,373**. The correct number is the sum of two district
     part-records, and the search summary made exactly the mistake the final
     data now warns against.
   - It understated the **2006 train-bombing toll** ("over 180"; the figure is
     ~209). This shipped wrong and was only corrected in a later accuracy pass.
2. **Asserting a precision the sources didn't support.** The Bombay→Mumbai rename
   was recorded as "**4 March 1995**." No source supports that exact date;
   accounts give May, October, or November 1995. A false-precise date is worse
   than an honest "1995," because it looks authoritative.
3. **Believing an aggregator's licence claim.** DataMeet's repository is widely
   quoted as CC BY 4.0. Only by opening the *Mumbai folder's own readme* did the
   real licence surface — **CC BY-SA 2.5 India** (share-alike), which changed the
   whole sourcing decision. A search-level licence claim nearly led to shipping
   share-alike data unknowingly.
4. **Reactive verification.** Some facts were only checked after the user
   questioned them (the population), or in a later sweep. Verification should
   precede display, not follow a challenge.
5. **Fragile transport.** The main Overpass endpoint returned 504s; the
   Maharashtra gazetteer serves an **expired TLS certificate**; UNESCO returned
   403s to the fetcher. Each needed an ad-hoc workaround, and each is a
   reproducibility risk for a future rebuild.

## B.2 The root cause

Almost all of the above trace to **one habit: treating "found" as "verified."**
A search result is a *lead*. It tells you where to look, not what is true. The
moment a lead is copied into the data as fact — without opening the primary
source and reading the actual number in its actual context — every downstream
check inherits the error.

The secondary cause is **quoting a number before defining its unit.** "Mumbai's
population" is not one number; it is at least four (city district, municipal
corporation, urban agglomeration, metropolitan region). Recording a figure before
pinning the boundary is how the 9.4M/12.4M/18.4M confusion happens.

## B.3 How it should have been done

A disciplined retrieval process, in the order it should run:

1. **Search to find, primary source to confirm.** Never let a search summary be
   the citation. Open the publisher's own page or dataset and read the value in
   place. For a census figure that means the Census of India data table, not a
   site that repackages it.
2. **Define the unit before recording the number.** For any ambiguous quantity
   (population, area, casualty toll, "first" claims), write down the exact
   boundary/definition first, then find the figure that matches it. A short
   checklist of ambiguous quantities would have caught the population trap on the
   first pass.
3. **Cross-check anything displayed as fact against ≥2 independent sources.**
   Especially dates, tolls and populations. Where they disagree, record *both*
   and flag it — the data schema already supports this (`disputed: true`), and
   the UI already shows disagreement rather than smoothing it over. The fix is to
   make cross-checking the default, not the exception.
4. **Verify licences from the dataset's own licence file, at fetch time** — not
   from an aggregator, a README one level up, or a search snippet. The DataMeet
   case proves the nested licence can override the headline one.
5. **Capture provenance at the moment of capture.** Store, per datum: the source
   URL, the retrieval date, and the exact quoted value. The project stores a
   `sourceId`; adding `retrievedAt` and the raw quoted string would make every
   number independently auditable later.
6. **Make the build validate the data.** Several integrity checks were run by
   hand (every event has a valid source; every `place` exists; era ranges contain
   their events; the two population part-records sum to the displayed total).
   These should be an automated `check-data` step that fails the build — manual
   validation is exactly what slips when you are moving fast.
7. **Make volatile fetches deterministic.** Overpass output should be snapshotted
   into `data/raw` (it is) with a recorded query and date, and mirrors tried in
   order (they are). Dataset versions should be pinned and written to the manifest
   (they are for the global data). The gap is that a *rebuild months later* may
   get different OSM data with no record of what changed — a hash of each raw
   input in the manifest would close that.
8. **Treat an unverifiable transport as a data-quality caveat, not a blocker.**
   The expired-certificate gazetteer is genuine government content, but the
   connection can't be cryptographically verified. That was documented rather than
   hidden — the right call — but the stronger move is to *also* pull the same fact
   from a second host and confirm they agree, so integrity does not rest on one
   compromised channel.
9. **Distinguish "found," "read," and "cross-checked" as explicit states.** The
   Official / Secondary badge is a coarse proxy for this. A finer model would tag
   each fact with how far it got through verification, and only present the
   fully-checked ones as unqualified fact.

## B.4 What the project already does right (so it is not lost)

To be fair to the process, several of these disciplines *were* applied and should
be kept:

- **Nothing redistributes source data blindly** — everything is fetched from the
  publisher at build time, and versions are recorded in the manifest.
- **Licences were read from the primary terms page** for the eight data sources,
  and two real compliance breaches (missing in-app attribution; stripped vendored
  licence notices) were found and fixed.
- **Disputes are surfaced, not hidden** — the Samyukta Maharashtra toll
  (105/106), the 1944 docks explosion, the 2006 toll and the rename date all
  carry their uncertainty into the UI.
- **The population figure is now reconciled** across the two views that show it,
  with a note explaining why the globe (GeoNames, ~12.69M) and the history panel
  (Census, 12.44M) differ.

## B.5 The single most important change

If only one thing were adopted from this analysis, it would be this:

> **A search result is never a citation. Open the primary source, read the value
> in its own context, confirm the unit, and cross-check it — before it becomes a
> fact on screen.**

Every error in B.1 would have been prevented by that one rule, and none of the
things in B.4 would have been lost.
