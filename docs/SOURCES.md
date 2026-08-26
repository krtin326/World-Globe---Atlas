# Sources

Every byte of geographic and image data in this project, where it came from, who
publishes it, what it is licensed under, and what you are obliged to do if you
publish something built on it.

**Nothing in this repository redistributes source data.** `npm run fetch`
downloads each input from its publisher at build time, so what you build is
provably what they currently publish.

> ### Verification status — 22 July 2026
>
> Every URL below was requested and returned HTTP 200. Every licence claim was
> read back from the publisher's own terms page, not from memory or a summary.
> Two compliance gaps were found in the process and have been fixed; both are
> recorded in [§7](#7-compliance-what-was-wrong-and-what-was-fixed).
>
> Two URLs had moved since first writing and are corrected here. One source —
> the Maharashtra Gazetteers Department — is served with an **expired TLS
> certificate**; see the note in [§8](#8-mumbai-city-history-sources).

---

## An honest note on "government sources"

The brief for this project asked for credible sources, government websites in
particular. That deserves a straight answer rather than a reassuring one.

Two of the four inputs — **NASA** and **GEBCO** — are exactly that: a national
space agency and a programme of two intergovernmental bodies.

The other two are not. **Natural Earth** and **GeoNames** are open compilations
maintained outside government. But they are not amateur scrapes either: both are
built *from* official national mapping agencies, gazetteers and statistical
offices, and both are the standard reference datasets in professional
cartography and GIS. Natural Earth is supported by the North American
Cartographic Information Society and is what most published thematic world maps
are drawn from; GeoNames aggregates the US National Geospatial-Intelligence
Agency's GNS, the USGS Geographic Names Information System, Ordnance Survey and
others.

The genuinely authoritative alternatives exist and are listed in
[§5](#5-more-authoritative-alternatives). They were not used because each is
either enormous, split across ~200 separate national downloads, or licensed in
ways that would prevent a project like this from being freely shared. The
compilations are the right engineering choice here — but they *are*
compilations, and you should know that before citing a figure from this app in
anything that matters.

---

## 1. Administrative boundaries — Natural Earth

**Used for:** every country outline, every state/province/region outline, and
the attribute data behind the country and division information cards.

| | |
|---|---|
| Publisher | Natural Earth (supported by the North American Cartographic Information Society) |
| Home | https://www.naturalearthdata.com/ |
| Terms | https://www.naturalearthdata.com/about/terms-of-use/ |
| Version used | **5.1.1** |
| Licence | **Public domain** |
| Attribution | **Not required.** The terms state plainly: *"All versions of Natural Earth raster + vector map data found on this website are in the public domain"* and *"Crediting the authors is unnecessary."* |

### Datasets

| File | Contents | Rows |
|---|---|---|
| [`ne_10m_admin_0_countries.zip`](https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip) | Countries and dependencies, 1:10m | 258 |
| [`ne_10m_admin_1_states_provinces.zip`](https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip) | First-level administrative divisions, 1:10m | 4,596 |

### What Natural Earth is built from

Natural Earth's own documentation credits, among others, the **US Geological
Survey**, the **US National Geospatial-Intelligence Agency**, **Statistics
Canada**, and a range of national mapping agencies and census bureaux. The
population and economic attributes (`POP_EST`, `GDP_MD`) are compiled from
national statistical offices, the **CIA World Factbook**, and **World Bank**
figures — with the year each was gathered stored alongside it, which is why the
information card shows `Natural Earth (2019)` rather than an undated number.

### Disputed boundaries, and what this project does about them

There is no politically neutral map of the world, and Natural Earth does not
pretend otherwise. The shapefiles carry roughly 170 columns per record, a large
share of which are *point of view* variants — `ADM0_A3_IN`, `ADM0_A3_PK`,
`ADM0_A3_CN`, `FCLASS_RU` and so on — each encoding how a particular government
depicts contested territory.

**This project keeps the default view and discards the variants.** That is a
choice, made for simplicity, and it is not a claim that the default is correct.
Concretely, it means this globe takes a specific position on Kashmir, Crimea,
the West Bank, Western Sahara, Taiwan and several dozen other disputes, and
someone somewhere will consider each of those positions wrong.

One consequence is visible in the data itself: Natural Earth records **Taiwan
with `ISO_A2 = -99`** rather than `TW`. That is why the city of Magong is the
one settlement in the dataset that cannot be resolved to a country code — not a
bug in the pipeline, but a political decision in the source surfacing downstream.

If you need a different editorial line, the point-of-view columns are still in
`data/raw/` and `ADMIN0_FIELDS` in `tools/build-data.mjs` is where you would
select them.

---

## 2. Cities and place names — GeoNames

**Used for:** the entire city list, city coordinates, populations, elevations,
time zones, feature classes, and the country/region reference tables.

| | |
|---|---|
| Publisher | GeoNames (Unxos GmbH, Switzerland) |
| Home | https://www.geonames.org/ |
| About / licence | https://www.geonames.org/about.html |
| Downloads | https://download.geonames.org/export/dump/ |
| Licence | **Creative Commons Attribution 4.0** — https://creativecommons.org/licenses/by/4.0/ |
| Attribution | **Required.** This is the one obligation in this project that is not optional. |

> ### Attribution is mandatory
>
> CC BY 4.0 requires you to credit the source. If you publish anything built on
> this, include a visible credit such as:
>
> > City data © [GeoNames](https://www.geonames.org/), licensed under
> > [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

### Datasets

| File | Contents |
|---|---|
| [`cities15000.zip`](https://download.geonames.org/export/dump/cities15000.zip) | All places with population ≥ 15,000 — **34,027 rows** |
| [`countryInfo.txt`](https://download.geonames.org/export/dump/countryInfo.txt) | ISO codes, capitals, areas, populations, currencies — 252 rows |
| [`admin1CodesASCII.txt`](https://download.geonames.org/export/dump/admin1CodesASCII.txt) | Names for first-level division codes |
| [`admin2Codes.txt`](https://download.geonames.org/export/dump/admin2Codes.txt) | Names for second-level division codes |

Deeper tiers (`cities5000`, `cities1000`, `cities500`) are supported by the
pipeline — see DOCUMENTATION.md §1.

### What GeoNames is built from

GeoNames aggregates official gazetteers rather than generating its own names.
Its principal sources are government bodies:

| Source | Publisher | Coverage |
|---|---|---|
| [GNS](https://geonames.nga.mil/) | **US National Geospatial-Intelligence Agency** / US Board on Geographic Names | Names outside the United States |
| [GNIS](https://www.usgs.gov/us-board-on-geographic-names) | **US Geological Survey** / US Board on Geographic Names | United States |
| [Ordnance Survey Open Data](https://www.ordnancesurvey.co.uk/products/os-open-names) | **Ordnance Survey** (UK) | United Kingdom |
| GeoBase | **Natural Resources Canada** | Canada |
| GTOPO30 | **USGS** | Elevation (`dem` field) |

Population figures come from national census and statistical agencies, and are
therefore **of differing vintages between countries** — a point worth
remembering before comparing two countries' city populations directly.

### Known caveats

- **"All cities" means places of 15,000+.** 34,027 settlements is not every
  named place on Earth.
- **City populations are administrative, not metropolitan.** GeoNames records
  New York City at 8.8 million (the city), not ~20 million (the metro area).
  Comparing cities across countries compares differently-drawn boundaries.
- **Some entries are city districts.** Tokyo's wards appear as separate rows, so
  the nearest place to central Tokyo may resolve to a ward rather than to
  "Tokyo".
- **Coordinates are point centroids**, not city extents.

---

## 3. Surface imagery — NASA

**Used for:** the globe's colour map and the night-lights map.

| | |
|---|---|
| Publisher | **NASA** — Earth Observatory / Goddard Space Flight Center |
| Use policy | https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance |
| Licence | Public domain; most NASA-led mission data is **CC0** |
| Attribution | **Requested, not required.** NASA asks to be acknowledged as the source. |

> NASA's policy: *"NASA ESDIS content used in a factual manner that does not
> suggest or imply endorsement may be used without explicit permission. NASA
> should be acknowledged as the source of the material."*
>
> You must not imply NASA endorsement, or claim copyright over NASA material.

| Image | Product | Resolution |
|---|---|---|
| [`world.topo.bathy.200407.3x5400x2700.jpg`](https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73751/world.topo.bathy.200407.3x5400x2700.jpg) | Blue Marble Next Generation, July 2004, with topography and bathymetry | 5400 × 2700 → resampled to 4096 × 2048 |
| [`dnb_land_ocean_ice.2012.3600x1800.jpg`](https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg) | Black Marble / *Earth at Night* 2012, Suomi NPP VIIRS day-night band | 3600 × 1800 → resampled to 2048 × 1024 |

Blue Marble Next Generation is derived from **MODIS** aboard NASA's *Terra*
satellite. Note it depicts **July 2004** — a real month, so the snow line and
vegetation are July's, not today's.

---

## 4. Elevation and bathymetry — GEBCO

**Used for:** the relief shading normal map and the land/ocean mask that
restricts the specular highlight to water.

| | |
|---|---|
| Publisher | **GEBCO** — General Bathymetric Chart of the Oceans |
| Governance | Jointly by the **International Hydrographic Organization (IHO)** and the **Intergovernmental Oceanographic Commission (IOC) of UNESCO** |
| Home | https://www.gebco.net/ |
| Licence | **Public domain** — *"The GEBCO Grid is placed in the public domain and may be used free of charge."* |
| Attribution | Requested for publications. |

| Image | Product |
|---|---|
| [`gebco_08_rev_elev_21600x10800.png`](https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png) | GEBCO_08 land elevation grid, distributed via NASA Earth Observatory — 21600 × 10800, resampled here to 2048 × 1024 |

If you use GEBCO data in a publication, the current recommended citation is:

> GEBCO Bathymetric Compilation Group (2026). *The GEBCO_2026 Grid — a
> continuous terrain model for oceans and land at 15 arc-second intervals.*
> doi:[10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa](https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa)

**This project uses the older GEBCO_08 revision**, because NASA distributes it
as a ready-made equirectangular image. The current GEBCO_2026 grid is
substantially better and is available directly from GEBCO if you need accuracy
rather than a shading map.

---

## 5. More authoritative alternatives

If this were feeding something where the boundary line itself carries legal or
analytical weight, these are the datasets to reach for instead. Each is more
authoritative than what is used here, and each is more work.

| Dataset | Publisher | Why you would use it | Why not here |
|---|---|---|---|
| [GADM](https://gadm.org/) | University of California, Davis | Administrative areas to level 5, far more detailed | Non-commercial licence only |
| [Eurostat GISCO / NUTS](https://ec.europa.eu/eurostat/web/gisco) | **European Commission** | The legal reference for EU statistical regions | Europe only |
| [US Census TIGER/Line](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) | **US Census Bureau** | Legally authoritative US boundaries | United States only |
| [Survey of India](https://surveyofindia.gov.in/) | **Government of India** | India's official boundaries | India only; restricted licensing |
| [UN Geospatial (UNGIS)](https://www.un.org/geospatial/) | **United Nations** | The UN's own world map | Coarse; restrictive terms |
| [OpenStreetMap](https://www.openstreetmap.org/) | OSM Foundation | Vastly more detail, continuously updated | ODbL share-alike; needs heavy processing |
| [GEBCO_2026 grid](https://www.gebco.net/data-products/gridded-bathymetry-data) | **IHO / IOC-UNESCO** | Current, far higher resolution | Multi-GB NetCDF, not a web texture |
| [WorldPop](https://www.worldpop.org/) | University of Southampton | Modelled gridded population | Modelled estimates, not counts |

---

## 6. Software

| Library | Licence | Use |
|---|---|---|
| [three.js](https://threejs.org/) 0.185.1 | MIT | WebGL rendering (vendored in `vendor/`) |
| [earcut](https://github.com/mapbox/earcut) | ISC | Polygon triangulation (vendored) |
| [mapshaper](https://github.com/mbloch/mapshaper) | MPL 2.0 | Shapefile → GeoJSON, simplification (build-time only) |
| [sharp](https://sharp.pixelplumbing.com/) | Apache 2.0 | Image resampling (build-time only) |
| [fflate](https://github.com/101arrowz/fflate) | MIT | Unzipping downloads (build-time only) |

Only three.js and earcut ship to the browser. The rest never leave the build.

---

## 7. Compliance: what was wrong, and what was fixed

A verification pass on 22 July 2026 checked every URL and read every licence
back from the publisher. Two genuine problems turned up. Both are fixed; both
are recorded here, because "we checked and found nothing" would have been a less
useful statement than what actually happened.

### 7.1 The application displayed no attribution — FIXED

Every mention of GeoNames, Natural Earth, NASA and GEBCO lived in source-code
comments or as the label of a data field. None of it was a *credit*, and none of
it was visible to anybody actually using the app.

CC BY 4.0 requires attribution "in any reasonable manner" for public use. Code
comments are not that. As it stood, publishing the app would have been a licence
breach.

**Fix:** a permanent "Data sources" control in the lower-right corner of the
globe view, expanding to the full credit line with links to each publisher and
to the CC BY 4.0 deed. It is deliberately not dismissable, and the markup
carries a comment explaining why, so that a future tidy-up does not quietly
delete it.

### 7.2 Vendored libraries carried no licence notice — FIXED

`vendor/` contains nine files copied out of npm packages. Two of them
(`three.module.js`, `three.core.js`) shipped with an SPDX header. The other
seven — earcut, and the six three.js addon files — had none:

```
vendor/earcut.js
vendor/jsm/controls/OrbitControls.js
vendor/jsm/lines/Line2.js
vendor/jsm/lines/LineGeometry.js
vendor/jsm/lines/LineMaterial.js
vendor/jsm/lines/LineSegments2.js
vendor/jsm/lines/LineSegmentsGeometry.js
```

Both the MIT and the ISC licence require the copyright notice and permission
text to be retained "in all copies or substantial portions of the Software".
Vendoring a file into a repository is a copy. Stripped of their notices, those
files were being redistributed in breach of the very licences that permit
redistribution.

This is an easy mistake to make: copying a source file out of `node_modules`
leaves the licence behind in a sibling `LICENSE` file that nothing points at.

**Fix:** an SPDX header on each file naming the copyright holder and licence,
plus the complete licence texts at `vendor/LICENSE.three.txt` and
`vendor/LICENSE.earcut.txt`. Verified: all nine vendored files now carry a
notice.

### 7.3 Things that were already fine

- No source data is redistributed — everything is fetched from the publisher at
  build time, so no question of re-licensing arises.
- Natural Earth is public domain and explicitly waives attribution.
- NASA and GEBCO ask for credit but do not require it; both are credited anyway.
- Build-only dependencies (mapshaper MPL-2.0, sharp Apache-2.0, fflate MIT)
  never reach the browser, so their terms attach to the build environment rather
  than to anything you publish.

### 7.4 What would still need attention

- **If you add OpenStreetMap data**, ODbL brings share-alike obligations on
  derived databases that none of the current sources impose. Do not mix it in
  casually.
- **If you swap the imagery for anything from Google, Mapbox, Esri or Bing**,
  none of the above applies — those are licensed products whose terms generally
  forbid exactly this kind of reuse.
- **The NASA insignia and logo are separately restricted** and are not used
  here. Permission to use NASA imagery is not permission to use NASA branding.

---

## 8. Mumbai city history sources

Sources for the city history feature. These support prose and dates rather than
geometry, so the standard is citability rather than licensing — but the same
preference for official publishers applies.

| Source | Publisher | Used for |
|---|---|---|
| [Gazetteer of Greater Bombay](https://gazetteers.maharashtra.gov.in/cultural.maharashtra.gov.in/english/gazetteer/greater_bombay/history.html) | **Gazetteers Department, Government of Maharashtra** | The main historical narrative: ancient, mediaeval, Portuguese, British and modern periods |
| [Gazetteer of Bombay City and Island](https://gazetteers.maharashtra.gov.in/cultural.maharashtra.gov.in/english/gazetteer/Bombay%20City/volume_1/index.html) (S. M. Edwardes, 1909) | **Gazetteers Department, Government of Maharashtra** | Primary-source detail on the islands, reclamation and early administration |
| [Elephanta Caves](https://whc.unesco.org/en/list/244/) | **UNESCO World Heritage Centre** | Inscribed 1987; caves dated mid-5th to 6th century AD, occupation from the 2nd century BC |
| [Chhatrapati Shivaji Terminus](https://whc.unesco.org/en/list/945/) | **UNESCO World Heritage Centre** | Inscribed 2004; built from 1878 over ten years, architect F. W. Stevens |
| [Victorian Gothic and Art Deco Ensembles](https://whc.unesco.org/en/list/1480/) | **UNESCO World Heritage Centre** | Inscribed 2018; the two expansion waves and the Oval Maidan ensemble |
| [Mumbai City District — History](https://mumbaicity.gov.in/en/history/) | **District Administration, Government of Maharashtra** | Renaming to Mumbai (1995); Mumbadevi and Koli origin of the name |
| [District demography](https://mumbaicity.gov.in/en/about-district/demography/) | **District Administration, Government of Maharashtra** | Mumbai City district population, 2011 Census |
| [Census of India](https://censusindia.gov.in/) | **Office of the Registrar General & Census Commissioner, India** | Population figures |
| [Encyclopaedia Iranica — Parsi Communities](https://www.iranicaonline.org/articles/parsi-communities-i-early-history/) | Columbia University (peer-reviewed) | Early Zoroastrian migration to Gujarat |

### Points of interest (the zoom-in detail)

The city map reveals neighbourhoods, railway stations, campuses, forts, stadiums
and hills as you zoom in. These come from the **GeoNames India gazetteer**
(`IN.zip`), the same publisher and licence (**CC BY 4.0**) already credited for
the globe's city layer — its per-country dump carries far more than the global
15,000-plus tier does. Only a curated set of feature codes is kept (the raw
Mumbai bbox is ~45% hotels and restaurants, which would be noise), filtered to
the city bounding box and scored for importance so the client can fade each in
at the right zoom. No share-alike obligation attaches. Credited in the city view
alongside the coastline and ward sources.

### Business families (the Families tab)

The dynasty entries mix official company histories with scholarly secondary
accounts, and each card names which it is on screen (**Official source** /
**Secondary source**).

| Source | Publisher | Used for |
|---|---|---|
| [Tata group — Our Heritage](https://www.tata.com/about-us/tata-group-our-heritage/Our-Timeline) | **Tata Sons** (official) | Tata dates: 1868 founding, Empress Mills 1874, Taj 1903, Tata Steel 1907, Tata Power 1910, IISc 1909, Tata Airlines 1932 |
| [Godrej — Our Story](https://www.godrejcp.com/know-us/our-story) | **Godrej** (official) | Godrej: 1897 lock works, springless lock (1907), vegetable-oil soap, later engineering/aerospace |
| [Mumbai Legacy Project heritage note](https://www.mcgm.gov.in/irj/go/km/docs/documents/D%20Ward/Heritage-Sites/Heritage-12.pdf) | **MCGM** (official) | Petit family: Oriental Spinning & Weaving Mill (1855), first Petit baronet (1890) |
| Gazetteer of Greater Bombay (as above) | **Govt of Maharashtra** (official) | Wadia shipbuilding (1736) and Bombay Dyeing; Jejeebhoy's China trade and philanthropy |
| [The Rise and Fall of the Sassoons](https://www.theindiaforum.in/history/rise-and-fall-sassoons) + encyclopaedia entries | The India Forum / Encyclopedia.com (secondary) | Sassoon arrival 1832, mills, Sassoon Docks 1872–75 |
| [Reliance — history](https://www.ril.com/OurCompany/History.aspx) + press | Reliance / press (secondary) | Ambani/Reliance: 1966 founding, Vimal polyester, 1977 share issue, petrochemicals |

> **Company histories are not neutral.** Where a family's own firm is the
> source, the card marks it *Official source* — meaning the publisher is
> authoritative on the dates, not that the account is disinterested. Founding
> years and product firsts are well documented; the framing ("the family that
> industrialised India") is the app's, drawn from the record but not a neutral
> fact.

### Caveats worth knowing

**The gazetteer's TLS certificate is expired.** `gazetteers.maharashtra.gov.in`
presents a certificate that both browsers and `curl` reject
(`SEC_E_CERT_EXPIRED`). The content is genuine government gazetteer material and
matches the printed editions, but the connection cannot be cryptographically
verified, and a browser will show a full-page warning before letting you through.
That is a server misconfiguration on the state government's side rather than
evidence of tampering — but it is stated here instead of glossed over, because
"official source" and "verified connection" are not the same claim.

**The Greater Bombay gazetteer was published in 1986** and its narrative
effectively stops there. Everything later — the 1992–93 riots, the 1993
bombings, the 1995 renaming, 2005, 2006, 2008 — rests on other sources, and each
timeline entry carries its own citation.

**Population figures are easy to get wrong,** because "Mumbai" names at least
four different areas. The 2011 Census records Greater Mumbai (M Corp) as two
*part* records split across two districts:

| Unit | 2011 population |
|---|---|
| Mumbai City district | 3,085,411 |
| Mumbai Suburban district | 9,356,962 |
| **Greater Mumbai (M Corp)** — the sum of the two | **12,442,373** |
| Greater Mumbai Urban Agglomeration | ~18.4 million |

Several secondary sites quote the suburban part-figure of 9,356,962 as the
population of Greater Mumbai. It is not; it is about three-quarters of it. The
figure used here is the sum, cross-checked against the official district
demography page, which independently gives the Mumbai City district figure of
3,085,411.

**Where sources disagree, the timeline says so.** The Samyukta Maharashtra
movement's death toll is given as 105 in some accounts and 106 in others, and the
Hutatma Chowk memorial itself carries 106 names. Both figures are shown rather
than a false precision.

---

## 9. Coastline for the city view — NOAA GSHHG

**Used for:** the high-resolution shoreline in the 3D city view. Natural Earth's
1:10m coastline reduces Mumbai to a handful of vertices — fine on a globe,
useless at city scale.

| | |
|---|---|
| Dataset | GSHHG — Global Self-consistent, Hierarchical, High-resolution Geography |
| Authors | Paul Wessel (University of Hawai'i) and Walter H. F. Smith (**NOAA**) |
| Distribution | https://www.soest.hawaii.edu/pwessel/gshhg/ , co-hosted by **NOAA NCEI** |
| Version | 2.3.7 |
| Licence | **LGPL** — free to use and redistribute, with attribution |

Built from the World Vector Shoreline (**US Defense Mapping Agency**, now NGA),
the CIA World Data Bank II, and the Atlas of the Biosphere. Full resolution is
roughly 100–200 m, which renders Mumbai's peninsula, its creeks and Elephanta
Island properly.

---

## 10. Administrative divisions — MCGM

**Used for:** the 24 ward plates in Mumbai's 3D city view.

| | |
|---|---|
| Publisher | **Municipal Corporation of Greater Mumbai** (MCGM / BMC) |
| Service | `services8.arcgis.com/r6MmJtuWAzMawmJ8/.../BMC_Ward/FeatureServer/0` |
| Contents | 24 ward polygons, codes A through T |
| Native CRS | UTM zone 43N (EPSG:32643); requested as WGS 84 |
| Licence | **Not stated on the endpoint.** See below. |

This is the corporation's own GIS service — the body that draws the ward
boundaries publishing them itself, rather than a third-party copy. The service
returns GeoJSON in WGS 84 on request, so there is no reprojection step.

### Why this source and not the obvious alternative

The widely-cited alternative is the [DataMeet municipal
repository](https://github.com/datameet/Municipal_Spatial_Data), which carries
the same wards compiled from MCGM maps. It was **not** used, and the reason is
worth recording because the summaries you find online get it wrong.

DataMeet's top-level documentation is often quoted as CC BY 4.0. Mumbai's own
`Readme.md` inside that repository says something different:

> The dataset is created by the Pune chapter of the DataMeet Trust, Bangalore,
> India, and is shared under Creative Commons Attribution-**ShareAlike** 2.5
> India.

ShareAlike is viral. Any ward layer derived from it would itself have to be
published under CC BY-SA 2.5 India. That is perfectly usable for a personal
project, and genuinely problematic for a commercial one: it would oblige you to
release your processed boundary data under a licence that lets a competitor take
it. Since this project is intended to be sellable, that obligation is the wrong
trade.

### The licence position of the source actually used

The MCGM endpoint states no licence at all, which is not the same as granting
one. The applicable default is the **Government Open Data License – India
(GODL)**, which under the National Data Sharing and Accessibility Policy covers
"shareable non-sensitive data ... generated using public funds by various
agencies of the Government of India". Its terms, verified against the published
licence:

- **Commercial use: permitted** — "a worldwide, royalty-free, non-exclusive
  license to use, adapt, publish ... for all lawful commercial and
  non-commercial purposes".
- **Attribution: mandatory** — the provider, source and licence must be
  published.
- **ShareAlike: none.** Derivative works need not be released under the same
  terms.

Ward boundaries drawn by a municipal corporation with public money, published on
that corporation's own public service, sit squarely inside that description.

> **Be clear-eyed about this.** GODL applying here is an inference from national
> policy, not a statement printed on the endpoint. It is the strongest position
> available short of asking, and it is the position most consistent with the
> data's nature and publisher — but if you are taking this to market, write to
> MCGM and get the grant in writing. That costs one email and removes the only
> real ambiguity left in this project.

### Data quality

mapshaper reports roughly 106 self-intersections in the published geometry —
adjacent wards whose shared borders do not quite coincide. The count barely
changes between simplification levels, confirming they are present in the source
rather than introduced downstream. The build repairs them with `-clean` and
applies no simplification. Treat the rendered ward edges as indicative, not
survey-accurate.

---

## 11. Roads and railway — OpenStreetMap

**Used for:** the arterial road network and the suburban railway lines in the 3D
city view — the layer that turns a coast outline into a recognisable city.

| | |
|---|---|
| Publisher | **OpenStreetMap** contributors |
| Source | Overpass API (mirrors: kumi.systems, private.coffee, overpass-api.de) |
| Contents | 7,602 road ways (motorway / trunk / primary / secondary) + 1,007 railway ways |
| Licence | **Open Database Licence (ODbL) 1.0** — https://opendatacommons.org/licenses/odbl/ |
| Attribution | **Mandatory:** "© OpenStreetMap contributors". Credited in the city view. |

### This is the one share-alike source in the project — read this before shipping

Every other source here is either public domain, permissively licensed
(attribution only), or — in the case of the wards — deliberately chosen to
*avoid* share-alike. OSM is different, and it was used with eyes open because
there is **no licence-clean source of street-level road and rail geometry**: no
government open-data portal publishes Mumbai's road network at this detail, and
Natural Earth's roads are 1:10m (a handful of lines for the whole city). OSM is
the only option that makes this layer possible at all.

What ODbL actually requires, applied to this project:

- **Attribution** to "OpenStreetMap contributors" wherever the data is shown.
  This is in the city view's credit line. Non-negotiable.
- **Share-alike, but only on the *database*.** ODbL draws a line between a
  *Produced Work* (something rendered *from* the data — a map image, the pixels
  on screen) and a *Derivative Database* (the road data itself). A Produced Work
  carries only the attribution requirement. Share-alike bites when you publicly
  distribute the *database* or a derivative of it.
- **This app ships `mumbai-roads.json` to the browser.** That file is a
  derivative database. So if you distribute the app publicly, that road extract
  must be offered under ODbL — a competitor may take *that file*. Your own
  application code, the history, the other layers, and the rendered look are
  **not** affected; ODbL does not reach into them.

### What this means for a sellable product

It is workable — a great many commercial products build on OSM — but it is a
real obligation, and it is the opposite of the call made for the ward data. Your
options, cleanest first:

1. **Ship it and comply.** Keep the attribution, and make the
   `mumbai-roads.json` extract available under ODbL (a link on a page satisfies
   it). Your app stays proprietary; only that one data file is shared-alike.
2. **Render roads server-side into the coastline/relief as image tiles** before
   shipping, so the client receives a *Produced Work* (pixels) rather than the
   database. Then only attribution applies. More work, removes the share-alike
   entirely.
3. **Drop the layer** if even a shared road-data file is unacceptable. The map
   still works without it — this is the only OSM-derived layer, isolated in one
   file and behind the "Roads" toggle, precisely so it can be removed cleanly.

This was added at your explicit direction, knowing the trade. It is flagged here
so the choice stays visible rather than buried.

---

## 12. Summary of your obligations

If you publish anything built on this project:

1. **You must credit GeoNames** — CC BY 4.0 is a legal requirement, not a
   courtesy.
2. **You should credit NASA and GEBCO** — requested, not required.
3. **You need not credit Natural Earth** — it is public domain and explicitly
   says crediting is unnecessary.
4. **You must credit NOAA/GSHHG** if the city view is included — LGPL requires
   attribution.
5. **You must credit MCGM** for the ward boundaries — GODL-India makes
   attribution mandatory, and it is the condition on which commercial use rests.
6. **You must credit OpenStreetMap AND honour ODbL share-alike** for the roads
   and railway — attribution plus, if you distribute the app, offering the
   `mumbai-roads.json` extract under ODbL. See §11; this is the one share-alike
   obligation in the project.
7. **Keep the licence headers on everything in `vendor/`.** MIT and ISC both
   require the notice to travel with the code.
8. **Keep the in-app "Data sources" credit visible.** It is what actually
   discharges obligations 1 and 4; a line in this file does not.
9. **Do not present the boundaries as authoritative.** They are simplified to
   8-12% of source detail and reflect one editorial view of several dozen active
   territorial disputes.

A single credit line covering all of it:

> Boundaries: Natural Earth (public domain). Cities: © GeoNames, CC BY 4.0.
> Imagery: NASA Earth Observatory. Elevation: GEBCO (IHO/IOC-UNESCO).
> Coastline: GSHHG (Wessel & Smith, NOAA). Wards: MCGM, GODL-India.
> Places: © GeoNames, CC BY. Roads & rail: © OpenStreetMap contributors, ODbL.

That line is already rendered in the app under "Data sources" in the lower-right
corner. If you fork the UI, carry it across.

---

*Source versions and the build date are recorded in `data/manifest.json` each
time the pipeline runs.*
