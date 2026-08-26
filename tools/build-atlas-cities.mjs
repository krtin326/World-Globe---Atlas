#!/usr/bin/env node
/**
 * build-atlas-cities.mjs — port the ATLAS dossiers into globe city history files.
 *
 * The city sub-view (src/city/cityview.js) is data-driven: dropping a
 * `data/cities/<id>.json` next to a `<id>-land.geojson` coastline and listing
 * the GeoNames id in `index.json` is enough to give a city an "Explore history"
 * button and the full timeline / families / map view — no code changes.
 *
 * Mumbai was researched from primary gazetteers with per-event citations. These
 * four cities (Rome, Cairo, Tokyo, Mexico City) reuse the original prose already
 * written for the `atlas/` site (atlas/js/cities.js), reshaped into the globe's
 * schema. Because that prose was compiled from general reference works rather
 * than an event-by-event archive, every file carries a `caveats` note saying so
 * — the same honesty the Mumbai file keeps. All text is original; the `sources`
 * point at credible public references (UNESCO, national/city government portals,
 * Britannica, World History Encyclopedia).
 *
 * The event BODY text is taken verbatim from the atlas timeline (already
 * original writing); the TITLE, ERA banding, SOURCE assignment, map PLACES and
 * FIGURES are authored here.
 *
 * Run:  node tools/build-atlas-cities.mjs        (writes all four + index.json)
 * Then: node tools/build-city.mjs rome           (etc. — the coastline)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITIES as ATLAS } from '../atlas/js/cities.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'cities');

const atlasById = Object.fromEntries(ATLAS.map((c) => [c.id, c]));

/* ------------------------------------------------------------------ *
 * Year parsing: "753 BC" -> {year:-753, display:"753 BC"};
 * "80" -> {year:80}; "c.125" -> {year:125, display:"c. 125"};
 * "264–146 BC" -> {year:-264, display:"264–146 BC"}.
 * ------------------------------------------------------------------ */
function parseYr(yr) {
  const raw = String(yr).trim();
  const bc = /\bBC\b/i.test(raw);
  const m = raw.match(/\d+/);
  let year = m ? parseInt(m[0], 10) : 0;
  if (bc) year = -year;
  // A "plain" year is just digits — it formats itself, so it needs no display
  // override. Anything with BC / AD / a range / a "c." keeps the original text.
  const plain = /^\d+$/.test(raw);
  let display = null;
  if (!plain) display = raw.replace(/^c\.?\s*/i, 'c. ').replace(/\bc\.(\d)/i, 'c. $1');
  return { year, yearDisplay: display };
}

function eraFor(eras, year) {
  for (const e of eras) if (year >= e.from && year < e.to) return e.id;
  return eras[eras.length - 1].id;
}

/* Shared honesty note appended to every city built here. */
const PROVENANCE_CAVEAT =
  'This timeline is compiled from general reference works — listed under ' +
  'Sources — rather than an event-by-event archive of primary documents, as ' +
  'the Mumbai timeline is. Treat it as a reliable outline, not a citation of ' +
  'record.';
const LEGEND_CAVEAT =
  'Dates for the earliest, legendary events are traditional rather than ' +
  'documented.';

/* ------------------------------------------------------------------ *
 * Per-city curation. `titles` runs parallel to the atlas timeline; the body
 * text and year come from that entry, the title/era/source/place from here.
 * `src` maps a timeline index to a sourceId (default `srcDefault` otherwise);
 * `place` maps an index to a places[] id; `pivotal` lists indices to highlight.
 * ------------------------------------------------------------------ */
const CONFIG = {
  rome: {
    geonameId: 3169070,
    centre: [12.5113, 41.8919],
    bbox: [12.20, 41.72, 12.66, 42.02],
    nameLocal: 'Roma',
    formerName: null,
    renamed: null,
    coverage: '753 BC – 2000',
    summary:
      "Founded by tradition in 753 BC on seven hills beside the Tiber, Rome grew " +
      "from a cluster of hilltop villages into the capital of an empire that " +
      "shaped Western law, language, engineering and government. As that empire " +
      "faded it became the seat of the Roman Catholic Church, and across the " +
      "Renaissance and Baroque it was remade again in travertine and marble. " +
      "Uniquely among cities it surrounds a separate sovereign state, Vatican " +
      "City, and still calls itself Caput Mundi — capital of the world.",
    eras: [
      { id: 'regal', label: 'Kingdom', from: -753, to: -509, color: '#f5a623' },
      { id: 'republic', label: 'Republic', from: -509, to: -27, color: '#ff7a45' },
      { id: 'empire', label: 'Empire', from: -27, to: 476, color: '#e8467c' },
      { id: 'medieval', label: 'Medieval & Papal', from: 476, to: 1420, color: '#a56bff' },
      { id: 'renaissance', label: 'Renaissance & Baroque', from: 1420, to: 1798, color: '#00e5ff' },
      { id: 'modern', label: 'Modern', from: 1798, to: 2027, color: '#3dfa8a' },
    ],
    sources: {
      'unesco-91': { title: 'Historic Centre of Rome — UNESCO World Heritage List', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/91/', official: true },
      'comune-roma': { title: 'Roma Capitale — official city portal', publisher: 'Comune di Roma', url: 'https://www.comune.roma.it/', official: true },
      'britannica-rome': { title: 'Rome — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Rome', official: false },
      'whe-rome': { title: 'Ancient Rome — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/Rome/', official: false },
    },
    srcDefault: 'britannica-rome',
    figures: [
      { label: 'Population', value: '≈2.75 million', note: 'City proper; ≈4.3 million in the metropolitan area.', sourceId: 'comune-roma' },
      { label: 'Founded', value: '753 BC', note: 'Traditional date, 21 April, in the myth of Romulus.', sourceId: 'whe-rome' },
      { label: 'Setting', value: 'Seven hills on the Tiber', note: 'Lazio, central Italy.', sourceId: 'britannica-rome' },
      { label: 'Encloses', value: 'Vatican City', note: 'The city surrounds a separate sovereign state, the seat of the Papacy.', sourceId: 'unesco-91' },
      { label: 'World Heritage', value: 'Historic Centre (1980)', note: 'Inscribed with the Holy See’s extraterritorial properties.', sourceId: 'unesco-91' },
    ],
    places: [
      { id: 'palatine', name: 'Palatine Hill', lat: 41.8892, lon: 12.4875, note: 'Where tradition places Romulus’s founding of the city.' },
      { id: 'forum', name: 'Roman Forum', lat: 41.8925, lon: 12.4853, note: 'The political and religious heart of the ancient city.' },
      { id: 'colosseum', name: 'The Colosseum', lat: 41.8902, lon: 12.4922, note: 'The Flavian Amphitheatre, inaugurated 80 AD.' },
      { id: 'pantheon', name: 'The Pantheon', lat: 41.8986, lon: 12.4769, note: 'Hadrian’s temple to all the gods; still the largest unreinforced concrete dome.' },
      { id: 'st-peters', name: 'St Peter’s Basilica', lat: 41.9022, lon: 12.4539, note: 'Rebuilt 1506–1626 over the reputed tomb of St Peter, in Vatican City.' },
      { id: 'trevi', name: 'Trevi Fountain', lat: 41.9009, lon: 12.4833, note: 'Salvi’s Baroque fountain (1762), fed by the ancient Aqua Virgo.' },
    ],
    titles: [
      'The founding of Rome', 'Numa and the first religion', 'The Republic is founded',
      'The plebeians secede', 'The Twelve Tables', 'The Gauls sack Rome',
      'The Appian Way begins', 'The Punic Wars', 'The murder of Tiberius Gracchus',
      'The revolt of Spartacus', 'Cicero and the Catiline plot', 'Caesar crosses the Rubicon',
      'The Ides of March', 'Augustus, first emperor', 'The Great Fire of Rome',
      'The Colosseum opens', "Hadrian's Pantheon", 'The Aurelian Walls',
      'Constantine at the Milvian Bridge', "Alaric's Visigoths sack Rome", 'The Vandals sack Rome',
      'The fall of the Western Empire', 'Charlemagne crowned emperor', 'The Norman sack',
      'The Papacy leaves for Avignon', "Cola di Rienzo's republic", 'The new St Peter’s begins',
      "Michelangelo's Sistine ceiling", 'The Sack of Rome, 1527', 'The plague of 1656',
      'A short-lived Roman Republic', 'Garibaldi defends Rome', 'The breach at Porta Pia',
      'Capital of a united Italy', 'The March on Rome', 'The Lateran Treaty and the Vatican',
      'Occupation and liberation', 'The Treaty of Rome', 'The 1960 Olympics', 'The Great Jubilee',
    ],
    pivotal: [0, 12, 13, 21, 32],
    place: { 0: 'palatine', 2: 'forum', 5: 'forum', 12: 'forum', 15: 'colosseum', 16: 'pantheon', 22: 'st-peters', 26: 'st-peters' },
    src: {
      0: 'whe-rome', 1: 'whe-rome', 2: 'whe-rome', 3: 'whe-rome', 4: 'whe-rome', 7: 'whe-rome',
      15: 'unesco-91', 16: 'unesco-91', 26: 'unesco-91', 27: 'unesco-91',
      33: 'comune-roma', 35: 'comune-roma', 37: 'comune-roma', 38: 'comune-roma', 39: 'comune-roma',
    },
  },

  cairo: {
    geonameId: 360630,
    centre: [31.2497, 30.0626],
    bbox: [31.10, 29.92, 31.42, 30.20],
    nameLocal: 'القاهرة',
    formerName: null,
    renamed: null,
    coverage: 'c. 3100 BC – 2021',
    summary:
      "Cairo — al-Qāhira, ‘the Victorious’ — is the largest city in the Arab " +
      "world and in Africa, strung along the Nile where the river fans into its " +
      "delta. It is a city in layers: the pharaonic pyramids of Giza on its " +
      "western horizon, a Roman fortress and Coptic churches at its old core, a " +
      "thousand-year-old Islamic capital of minarets and madrasas at its heart, " +
      "and a restless megacity of some 22 million on top. Egyptians call it Umm " +
      "al-Dunya — the Mother of the World.",
    eras: [
      { id: 'pharaonic', label: 'Pharaonic', from: -3100, to: -30, color: '#f5a623' },
      { id: 'roman', label: 'Roman & Coptic', from: -30, to: 641, color: '#ff7a45' },
      { id: 'fatimid', label: 'Early Islamic', from: 641, to: 1171, color: '#e8467c' },
      { id: 'mamluk', label: 'Ayyubid & Mamluk', from: 1171, to: 1517, color: '#a56bff' },
      { id: 'ottoman', label: 'Ottoman & Khedival', from: 1517, to: 1882, color: '#00e5ff' },
      { id: 'modern', label: 'Modern', from: 1882, to: 2027, color: '#3dfa8a' },
    ],
    sources: {
      'unesco-89': { title: 'Historic Cairo — UNESCO World Heritage List', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/89/', official: true },
      'unesco-giza': { title: 'Memphis and its Necropolis – the Pyramid Fields — UNESCO', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/86/', official: true },
      'britannica-cairo': { title: 'Cairo — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Cairo', official: false },
      'whe-egypt': { title: 'Ancient Egypt — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/egypt/', official: false },
    },
    srcDefault: 'britannica-cairo',
    figures: [
      { label: 'Population', value: '≈10 million', note: 'City proper; ≈22 million in Greater Cairo — the largest metropolis in the Arab world and Africa.', sourceId: 'britannica-cairo' },
      { label: 'al-Qāhira founded', value: '969 AD', note: 'By the Fatimids. Predecessors: Fustat (641) and Memphis nearby (c. 3100 BC).', sourceId: 'britannica-cairo' },
      { label: 'Setting', value: 'Head of the Nile delta', note: 'Where the river fans out just north of the city.', sourceId: 'britannica-cairo' },
      { label: 'World Heritage', value: 'Historic Cairo (1979)', note: 'One of the world’s oldest Islamic cities, with its famous mosques and madrasas.', sourceId: 'unesco-89' },
      { label: 'On the horizon', value: 'The Giza pyramids', note: 'Older than the medieval city beside them by roughly 2,500 years.', sourceId: 'unesco-giza' },
    ],
    places: [
      { id: 'giza', name: 'Giza pyramids', lat: 29.9792, lon: 31.1342, note: 'The pyramids of Khufu, Khafre and Menkaure, on the desert edge west of the city.' },
      { id: 'fustat', name: 'Fustat (Old Cairo)', lat: 30.0069, lon: 31.2331, note: 'The first Arab capital of Egypt (641) and the Coptic core.' },
      { id: 'al-azhar', name: 'Al-Azhar', lat: 30.0459, lon: 31.2622, note: 'Mosque and university founded 970–972, a millennium-old seat of learning.' },
      { id: 'citadel', name: 'The Citadel', lat: 30.0296, lon: 31.2611, note: 'Saladin’s fortress on the Mokattam spur, begun 1176.' },
      { id: 'tahrir', name: 'Tahrir Square', lat: 30.0444, lon: 31.2357, note: 'The civic heart of modern Cairo and the Egyptian Museum.' },
      { id: 'khan-el-khalili', name: 'Khan el-Khalili', lat: 30.0477, lon: 31.2622, note: 'The great medieval bazaar of Islamic Cairo.' },
    ],
    titles: [
      'Memphis, first capital', 'The Great Pyramid', 'Persia conquers Egypt',
      'Cleopatra and Roman Egypt', 'The Arab conquest and Fustat', 'The Fatimids found Cairo',
      'Al-Azhar is founded', "Badr al-Jamali's walls", 'Fustat is burned',
      'Saladin ends Fatimid rule', "Saladin's Citadel begins", 'The Mamluks seize power',
      'Victory at Ain Jalut', 'The Black Death', 'The Ottoman conquest',
      'Napoleon takes Cairo', 'The French are expelled', 'Muhammad Ali seizes power',
      'Massacre at the Citadel', '‘Paris on the Nile’', 'The Suez Canal opens',
      'Britain occupies Egypt', 'The Egyptian Museum opens', 'The 1919 revolution',
      'A kingdom’s independence', 'The first Arab–Israeli war', 'The Free Officers’ revolution',
      'Nasser nationalises the Canal', 'The Six-Day War', 'The Aswan High Dam',
      'The funeral of Umm Kulthum', 'The bread riots', 'Sadat is assassinated',
      'The 1992 earthquake', "Tahrir Square and Mubarak's fall", 'The upheaval of 2013',
      'A new capital in the desert', 'The Pharaohs’ Golden Parade',
    ],
    pivotal: [0, 4, 5, 9, 17, 26],
    place: { 0: 'giza', 1: 'giza', 4: 'fustat', 6: 'al-azhar', 8: 'fustat', 10: 'citadel', 18: 'citadel', 22: 'tahrir', 34: 'tahrir', 35: 'tahrir' },
    src: {
      0: 'unesco-giza', 1: 'unesco-giza', 2: 'whe-egypt', 3: 'whe-egypt',
      5: 'unesco-89', 6: 'unesco-89', 7: 'unesco-89', 8: 'unesco-89', 10: 'unesco-89', 18: 'unesco-89',
    },
  },

  tokyo: {
    geonameId: 1850147,
    centre: [139.6917, 35.6895],
    bbox: [139.55, 35.50, 139.92, 35.82],
    nameLocal: '東京',
    formerName: 'Edo',
    renamed: '1868',
    coverage: '645 – 2021',
    summary:
      "For most of its life this city was called Edo — a castle town that became " +
      "the seat of the Tokugawa shoguns in 1603 and grew, by around 1720, into " +
      "perhaps the largest city on Earth. Renamed Tōkyō, the ‘eastern capital’, " +
      "when the emperor moved there in 1868, it has twice been destroyed within " +
      "living memory — by the 1923 earthquake and the 1945 firebombing — and " +
      "twice rebuilt. Today its greater region holds some 37 million people, the " +
      "largest metropolitan area in the history of the world.",
    eras: [
      { id: 'early', label: 'Early Edo', from: 645, to: 1603, color: '#f5a623' },
      { id: 'edo', label: 'Edo / Tokugawa', from: 1603, to: 1868, color: '#ff7a45' },
      { id: 'meiji', label: 'Meiji', from: 1868, to: 1912, color: '#e8467c' },
      { id: 'imperial', label: 'Imperial & War', from: 1912, to: 1945, color: '#a56bff' },
      { id: 'postwar', label: 'Postwar', from: 1945, to: 1990, color: '#00e5ff' },
      { id: 'contemporary', label: 'Contemporary', from: 1990, to: 2027, color: '#3dfa8a' },
    ],
    sources: {
      'metro-tokyo': { title: 'Tokyo Metropolitan Government — official site', publisher: 'Tokyo Metropolitan Government', url: 'https://www.metro.tokyo.lg.jp/english/', official: true },
      'britannica-tokyo': { title: 'Tokyo — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Tokyo', official: false },
      'whe-japan': { title: 'Ancient & Medieval Japan — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/Japan/', official: false },
    },
    srcDefault: 'britannica-tokyo',
    figures: [
      { label: 'Population', value: '≈14 million', note: 'Tokyo Metropolis; ≈37 million in the greater region — the largest metropolitan area in history.', sourceId: 'metro-tokyo' },
      { label: 'Founded', value: 'Edo Castle, 1457', note: 'Shogunal capital from 1603; renamed Tokyo in 1868.', sourceId: 'britannica-tokyo' },
      { label: 'Setting', value: 'Kantō Plain, Tokyo Bay', note: 'The largest plain in Japan, at the head of the bay.', sourceId: 'britannica-tokyo' },
      { label: 'Seat of', value: 'Emperor & government', note: 'The Imperial Palace stands on the old Edo Castle grounds at the city’s centre.', sourceId: 'metro-tokyo' },
      { label: 'By c. 1720', value: '≈1 million people', note: 'Probably the largest city in the world at the time.', sourceId: 'whe-japan' },
    ],
    places: [
      { id: 'imperial-palace', name: 'Imperial Palace', lat: 35.6852, lon: 139.7528, note: 'The old Edo Castle; the emperor’s residence since 1868, at the city’s centre.' },
      { id: 'sensoji', name: 'Sensō-ji', lat: 35.7148, lon: 139.7967, note: 'Tokyo’s oldest temple, traditionally founded 645, in Asakusa.' },
      { id: 'tokyo-station', name: 'Tokyo Station', lat: 35.6812, lon: 139.7671, note: 'The red-brick central terminus, opened 1914.' },
      { id: 'tokyo-tower', name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454, note: 'The 1958 broadcasting tower, a symbol of postwar recovery.' },
      { id: 'shibuya', name: 'Shibuya', lat: 35.6595, lon: 139.7005, note: 'The archetypal neon crossing of the contemporary city.' },
    ],
    titles: [
      'Sensō-ji is founded', 'Ōta Dōkan builds Edo Castle', 'Ieyasu takes the Kantō',
      'Victory at Sekigahara', 'Edo, the shogun’s capital', 'The Great Fire of Meireki',
      'The Genroku earthquake', 'Mount Fuji erupts', 'A city of a million',
      'The Ansei earthquake', "Perry's black ships", 'Ii Naosuke assassinated',
      'The Meiji Restoration', 'The first railway', 'The Meiji Constitution',
      'The Hibiya riots', 'Tokyo Station opens', 'The Great Kantō Earthquake',
      'The February 26 Incident', 'The firebombing of Tokyo', 'Surrender and occupation',
      'A new constitution', 'Tokyo Tower', 'Olympics and the bullet train',
      'The student protests', 'The bubble economy peaks', 'The subway sarin attack',
      'The Tōhoku earthquake', 'Tokyo Skytree', 'The pandemic empties Tokyo',
      'The delayed Olympics',
    ],
    pivotal: [1, 4, 12, 20],
    place: { 0: 'sensoji', 1: 'imperial-palace', 4: 'imperial-palace', 11: 'imperial-palace', 13: 'tokyo-station', 16: 'tokyo-station', 22: 'tokyo-tower', 28: 'sensoji' },
    src: {
      0: 'whe-japan', 1: 'whe-japan', 2: 'whe-japan', 3: 'whe-japan', 4: 'whe-japan',
      13: 'metro-tokyo', 14: 'metro-tokyo', 16: 'metro-tokyo', 22: 'metro-tokyo', 23: 'metro-tokyo', 30: 'metro-tokyo',
    },
  },

  'mexico-city': {
    geonameId: 3530597,
    centre: [-99.1277, 19.4285],
    bbox: [-99.30, 19.28, -98.95, 19.58],
    nameLocal: 'Ciudad de México',
    formerName: 'Tenochtitlan',
    renamed: '1521',
    coverage: '1325 – 2017',
    summary:
      "Mexico City stands on the drained bed of a highland lake, at about 2,240 " +
      "metres, directly on top of the Aztec island-capital of Tenochtitlan. " +
      "Founded by the Mexica in 1325 where an eagle perched on a cactus — the omen " +
      "now stamped on the national flag — it was besieged and razed by Hernán " +
      "Cortés in 1521 and rebuilt as the capital of New Spain. It is the largest " +
      "Spanish-speaking city on Earth and, sinking slowly back into its old " +
      "lakebed, both endlessly troubled by water and impossible to move.",
    eras: [
      { id: 'aztec', label: 'Mexica / Tenochtitlan', from: 1325, to: 1521, color: '#f5a623' },
      { id: 'conquest', label: 'Conquest & Early New Spain', from: 1521, to: 1650, color: '#ff7a45' },
      { id: 'viceroyalty', label: 'Viceroyalty', from: 1650, to: 1821, color: '#e8467c' },
      { id: 'independence', label: 'Independent 19th century', from: 1821, to: 1910, color: '#a56bff' },
      { id: 'revolution', label: 'Revolution & Modern', from: 1910, to: 1980, color: '#00e5ff' },
      { id: 'megacity', label: 'Megacity', from: 1980, to: 2027, color: '#3dfa8a' },
    ],
    sources: {
      'unesco-412': { title: 'Historic Centre of Mexico City and Xochimilco — UNESCO', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/412/', official: true },
      'gob-cdmx': { title: 'Gobierno de la Ciudad de México — official portal', publisher: 'Gobierno de la Ciudad de México', url: 'https://www.cdmx.gob.mx/', official: true },
      'britannica-mx': { title: 'Mexico City — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Mexico-City', official: false },
      'whe-aztec': { title: 'Tenochtitlan — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/Tenochtitlan/', official: false },
    },
    srcDefault: 'britannica-mx',
    figures: [
      { label: 'Population', value: '≈9.2 million', note: 'City proper (CDMX); ≈22 million in the metropolitan area.', sourceId: 'gob-cdmx' },
      { label: 'Founded', value: '1325', note: 'As Aztec Tenochtitlan; rebuilt by Spain from 1521.', sourceId: 'whe-aztec' },
      { label: 'Altitude', value: '≈2,240 m', note: 'Built in the drained bed of Lake Texcoco.', sourceId: 'britannica-mx' },
      { label: 'Language', value: 'Spanish', note: 'The largest Spanish-speaking city on Earth, over a Nahuatl heritage.', sourceId: 'britannica-mx' },
      { label: 'World Heritage', value: 'Historic Centre (1987)', note: 'Inscribed with Xochimilco; built over the Aztec capital.', sourceId: 'unesco-412' },
    ],
    places: [
      { id: 'templo-mayor', name: 'Templo Mayor / Zócalo', lat: 19.4344, lon: -99.1319, note: 'The great Aztec temple and the vast main square built over it.' },
      { id: 'chapultepec', name: 'Chapultepec', lat: 19.4204, lon: -99.1817, note: 'The ancient forested hill and its castle, west of the centre.' },
      { id: 'guadalupe', name: 'Basilica of Guadalupe', lat: 19.4847, lon: -99.1176, note: 'On Tepeyac hill, where the Virgin is said to have appeared in 1531.' },
      { id: 'bellas-artes', name: 'Palace of Fine Arts', lat: 19.4352, lon: -99.1413, note: 'The marble concert hall (1934), filled with murals by Rivera and rivals.' },
      { id: 'tlatelolco', name: 'Tlatelolco', lat: 19.4506, lon: -99.1370, note: 'Aztec sister-city and market; site of the 1968 massacre.' },
    ],
    titles: [
      'Tenochtitlan is founded', 'The first tlatoani', 'The Triple Alliance',
      'Dykes against the lake', 'The Templo Mayor dedicated', 'Moctezuma II at the height',
      'Cortés reaches Tenochtitlan', 'The Sad Night', 'The fall of Tenochtitlan',
      'The Virgin of Guadalupe', 'Capital of New Spain', 'The Royal University',
      'The great flood of 1629', 'The maize riots', 'The Cry of Dolores',
      'Independence won', 'The Niños Héroes', 'Maximilian’s empire',
      'The republic restored', 'The Porfiriato begins', 'The Revolution erupts',
      'The Ten Tragic Days', 'The founding of the PRI', 'The Palace of Fine Arts',
      'The Tlatelolco massacre', 'The 1968 Olympics', 'The Templo Mayor rediscovered',
      'The 1985 earthquake', 'The H1N1 pandemic', 'CDMX is born', 'The 2017 earthquake',
    ],
    pivotal: [0, 8, 15],
    place: { 0: 'templo-mayor', 4: 'templo-mayor', 6: 'templo-mayor', 8: 'templo-mayor', 9: 'guadalupe', 16: 'chapultepec', 17: 'chapultepec', 23: 'bellas-artes', 24: 'tlatelolco', 26: 'templo-mayor' },
    src: {
      0: 'whe-aztec', 1: 'whe-aztec', 2: 'whe-aztec', 3: 'whe-aztec', 4: 'whe-aztec',
      5: 'whe-aztec', 6: 'whe-aztec', 7: 'whe-aztec', 8: 'whe-aztec',
      10: 'unesco-412', 23: 'unesco-412', 26: 'unesco-412',
      27: 'gob-cdmx', 29: 'gob-cdmx', 30: 'gob-cdmx',
    },
  },
};

/* ------------------------------------------------------------------ *
 * Families: map the atlas dossier families -> the globe `dynasties` block.
 * The globe card shows name, community (role), span, industries, summary,
 * optional figures[] and legacy, a source and an optional map place.
 * ------------------------------------------------------------------ */
const FAMILIES = {
  rome: {
    note: 'Roman houses that shaped the city across its ages — Republican gentes, medieval barons and Baroque papal families.',
    list: [
      { id: 'julii', era: 'republic', span: 'Republic → Empire', community: 'Patrician gens', industries: ['Politics', 'Military'], figures: ['Julius Caesar', 'Augustus (by adoption)'], legacy: 'The Julio-Claudian dynasty of emperors', sourceId: 'whe-rome', place: 'forum' },
      { id: 'cornelii', era: 'republic', span: 'The Roman Republic', community: 'Leading Republican gens', industries: ['Politics', 'Military'], figures: ['Scipio Africanus', 'The Gracchi (maternal line)'], sourceId: 'whe-rome', place: 'forum' },
      { id: 'colonna-orsini', era: 'medieval', span: 'Medieval Rome', community: 'Baronial dynasties', industries: ['War', 'Church', 'Politics'], legacy: 'Popes, cardinals and fortified family strongholds', sourceId: 'britannica-rome' },
      { id: 'barberini-borghese', era: 'renaissance', span: '16th–17th century', community: 'Papal families of the Baroque', industries: ['Church', 'Arts', 'Patronage'], figures: ['Urban VIII (Barberini)', 'Paul V (Borghese)'], legacy: 'Bernini’s Rome — palaces, villas and fountains', sourceId: 'britannica-rome', place: 'st-peters' },
    ],
  },
  cairo: {
    note: 'The dynasties that built and ruled Cairo, from the Fatimid founders to the makers of modern Egypt.',
    list: [
      { id: 'fatimids', era: 'fatimid', span: '969–1171', community: 'Founders of Cairo', industries: ['Rule', 'Religion', 'Learning'], legacy: 'Al-Qāhira itself and Al-Azhar', sourceId: 'unesco-89', place: 'al-azhar' },
      { id: 'ayyubids', era: 'mamluk', span: '1171–1250', community: 'Dynasty of Saladin', industries: ['Rule', 'War', 'Building'], legacy: 'The Citadel and Sunni restoration', sourceId: 'britannica-cairo', place: 'citadel' },
      { id: 'mamluks', era: 'mamluk', span: '1250–1517', community: 'Warrior-sultans', industries: ['War', 'Rule', 'Architecture'], legacy: 'Cairo’s finest mosque-madrasa architecture', sourceId: 'unesco-89' },
      { id: 'muhammad-ali', era: 'ottoman', span: '1805–1953', community: 'Rulers of modern Egypt', industries: ['Rule', 'Reform', 'Military'], figures: ['Muhammad Ali Pasha', 'Khedive Ismail'], legacy: 'The Egyptian state, and ‘Paris on the Nile’', sourceId: 'britannica-cairo', place: 'citadel' },
    ],
  },
  tokyo: {
    note: 'The houses that ruled Edo-Tokyo and the merchant dynasties that industrialised it.',
    list: [
      { id: 'tokugawa', era: 'edo', span: '1603–1868', community: 'Shogunal dynasty', industries: ['Rule', 'Military'], figures: ['Tokugawa Ieyasu'], legacy: '250 years of peace with Edo as the nation’s heart', sourceId: 'whe-japan', place: 'imperial-palace' },
      { id: 'imperial-house', era: 'meiji', span: 'To the present', community: 'The Japanese monarchy', industries: ['Sovereignty'], legacy: 'The Imperial Palace at the exact centre of Tokyo', sourceId: 'britannica-tokyo', place: 'imperial-palace' },
      { id: 'iwasaki', era: 'meiji', span: 'From the 1870s', community: 'Industrial founding family', industries: ['Shipping', 'Heavy industry', 'Finance'], figures: ['Iwasaki Yatarō'], legacy: 'Mitsubishi', sourceId: 'britannica-tokyo' },
      { id: 'mitsui', era: 'edo', span: 'From the 17th century', community: 'Merchant-to-industrial dynasty', industries: ['Retail', 'Banking', 'Trade'], legacy: 'One of the oldest and largest business conglomerates on Earth', sourceId: 'britannica-tokyo' },
    ],
  },
  'mexico-city': {
    note: 'The ruling lines of the city, from the Mexica tlatoque to the makers of modern Mexico.',
    list: [
      { id: 'mexica', era: 'aztec', span: 'c. 1375–1521', community: 'Aztec ruling dynasty', industries: ['Rule', 'War', 'Religion'], figures: ['Acamapichtli', 'Moctezuma I & II', 'Cuauhtémoc'], legacy: 'Tenochtitlan and the Aztec empire', sourceId: 'whe-aztec', place: 'templo-mayor' },
      { id: 'conquistadors', era: 'conquest', span: 'From 1521', community: 'Spanish conquest', industries: ['Conquest', 'Rule'], figures: ['Hernán Cortés'], legacy: 'Mexico City and the pattern of New Spain', sourceId: 'britannica-mx', place: 'templo-mayor' },
      { id: 'criollo', era: 'viceroyalty', span: '16th–19th century', community: 'Colonial aristocracy', industries: ['Silver mining', 'Land', 'Politics'], legacy: 'The wealth of New Spain — and the drive to independence', sourceId: 'britannica-mx' },
      { id: 'revolutionaries', era: 'revolution', span: '1810–1920', community: 'Makers of modern Mexico', industries: ['Politics', 'Revolution'], figures: ['Hidalgo', 'Juárez', 'Madero', 'Zapata', 'Villa'], legacy: 'The modern nation, shaped from its capital', sourceId: 'britannica-mx' },
    ],
  },
};

/* ------------------------------------------------------------------ * Build * */
function buildCity(id) {
  const cfg = CONFIG[id];
  const atlas = atlasById[id];
  if (!cfg || !atlas) throw new Error(`missing config/atlas for ${id}`);

  const events = atlas.timeline.map((t, i) => {
    const { year, yearDisplay } = parseYr(t.yr);
    const ev = {
      year,
      era: eraFor(cfg.eras, year),
      title: cfg.titles[i] || t.text.replace(/\.$/, ''),
      body: t.text,
      sourceId: cfg.src?.[i] || cfg.srcDefault,
      tags: [t.type],
    };
    if (yearDisplay) ev.yearDisplay = yearDisplay;
    if (cfg.place?.[i]) ev.place = cfg.place[i];
    if (cfg.pivotal?.includes(i)) ev.pivotal = true;
    return ev;
  });

  // Sort chronologically so the timeline reads top-to-bottom in time (the atlas
  // order is already chronological, but ranges like 1853 before 1855 can jump).
  events.sort((a, b) => a.year - b.year);

  const inland = !cfg.hasCoast;
  const caveats = [PROVENANCE_CAVEAT, LEGEND_CAVEAT];

  const out = {
    id,
    name: atlas.name,
    formerName: cfg.formerName,
    nameLocal: cfg.nameLocal,
    country: atlas.country,
    geonameId: cfg.geonameId,
    centre: cfg.centre,
    bbox: cfg.bbox,
    renamed: cfg.renamed,
    summary: cfg.summary,
    figures: cfg.figures,
    eras: cfg.eras,
    events,
    places: cfg.places,
    sources: cfg.sources,
    caveats,
    dynasties: FAMILIES[id],
  };

  // Validate: every referenced era/source/place must resolve, or the view throws.
  const eraIds = new Set(cfg.eras.map((e) => e.id));
  const placeIds = new Set(cfg.places.map((p) => p.id));
  const srcIds = new Set(Object.keys(cfg.sources));
  for (const ev of events) {
    if (!eraIds.has(ev.era)) throw new Error(`${id}: event ${ev.year} bad era ${ev.era}`);
    if (!srcIds.has(ev.sourceId)) throw new Error(`${id}: event ${ev.year} bad source ${ev.sourceId}`);
    if (ev.place && !placeIds.has(ev.place)) throw new Error(`${id}: event ${ev.year} bad place ${ev.place}`);
  }
  for (const f of FAMILIES[id].list) {
    if (!eraIds.has(f.era)) throw new Error(`${id}: family ${f.id} bad era ${f.era}`);
    if (!srcIds.has(f.sourceId)) throw new Error(`${id}: family ${f.id} bad source ${f.sourceId}`);
    if (f.place && !placeIds.has(f.place)) throw new Error(`${id}: family ${f.id} bad place ${f.place}`);
  }
  for (const f of cfg.figures) {
    if (!srcIds.has(f.sourceId)) throw new Error(`${id}: figure "${f.label}" bad source ${f.sourceId}`);
  }

  return out;
}

/* Give each family its name/summary/community from the atlas prose. */
function hydrateFamilies(id) {
  const fam = FAMILIES[id];
  const src = atlasById[id].families;
  fam.list.forEach((f, i) => {
    f.name = src[i].name;
    f.community = f.community || src[i].role;
    f.summary = src[i].text;
  });
}

const targets = Object.keys(CONFIG);
const index = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));

for (const id of targets) {
  hydrateFamilies(id);
  const data = buildCity(id);
  const file = path.join(OUT, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  index.cities[String(data.geonameId)] = {
    id,
    name: data.name,
    events: data.events.length,
    coverage: CONFIG[id].coverage,
    families: data.dynasties.list.length,
    places: data.places.length,
  };
  console.log(`wrote ${id}.json — ${data.events.length} events, ${data.dynasties.list.length} families, ${data.places.length} places`);
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
console.log('updated index.json — cities:', Object.keys(index.cities).length);
