#!/usr/bin/env node
/**
 * build-world-cities.mjs — ten more city history files, authored fresh.
 *
 * Same data-driven city sub-view as Mumbai and the ported atlas four: a
 * `data/cities/<id>.json` (timeline + eras + figures + families + places +
 * sources) plus a `<id>-land.geojson` coastline, keyed by GeoNames id in
 * index.json. Unlike the atlas cities, the prose here is written from scratch.
 *
 * Honesty, as everywhere in this project: the timeline is compiled from general
 * reference works (Britannica, UNESCO, World History Encyclopedia, official city
 * portals), not an event-by-event primary archive — each file says so in
 * `caveats`, and the earliest, legendary dates are flagged as traditional.
 *
 * Compact event shape: { y:year, yd?:displayYear, t:title, b:body, e?:eraId,
 *   s?:sourceId, p?:placeId, pv?:pivotal, g?:tag }. Era is auto-assigned by year
 *   unless `e` is given; source defaults to the city's srcDefault unless `s`.
 *
 * Run:  node tools/build-world-cities.mjs      (writes all ten + index.json)
 * Then: node tools/build-city.mjs <id>         (per city, for the coastline)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'cities');

const PROVENANCE_CAVEAT =
  'This timeline is compiled from general reference works — listed under ' +
  'Sources — rather than an event-by-event archive of primary documents, as ' +
  'the Mumbai timeline is. Treat it as a reliable outline, not a citation of record.';
const LEGEND_CAVEAT =
  'Dates for the earliest, legendary events are traditional rather than documented.';

const eraFor = (eras, year) => {
  for (const e of eras) if (year >= e.from && year < e.to) return e.id;
  return eras[eras.length - 1].id;
};

const C = '#f5a623', C2 = '#ff7a45', C3 = '#e8467c', C4 = '#a56bff', C5 = '#00e5ff', C6 = '#3dfa8a';

const CITIES = [

/* ===================== LONDON ===================== */
{
  id: 'london', name: 'London', country: 'United Kingdom', geonameId: 2643743,
  centre: [-0.1257, 51.5085], bbox: [-0.35, 51.38, 0.15, 51.62],
  formerName: 'Londinium', renamed: null, nameLocal: null, coverage: '47 AD – 2012',
  summary: "London began as Londinium, a Roman trading town founded around AD 47 at the lowest bridging point of the Thames. Sacked by Boudica, abandoned by Rome, refounded by Alfred and remade by the Normans, it grew into the capital of England and the heart of the largest empire in history — the most populous city on Earth for much of the 19th century. Bombed in the Blitz and rebuilt, it is today a global capital of finance and culture astride the tidal river that made it.",
  srcDefault: 'britannica-london',
  eras: [
    { id: 'roman', label: 'Roman Londinium', from: 43, to: 410, color: C },
    { id: 'saxon', label: 'Saxon & Viking', from: 410, to: 1066, color: C2 },
    { id: 'medieval', label: 'Norman & Medieval', from: 1066, to: 1485, color: C3 },
    { id: 'tudor', label: 'Tudor & Stuart', from: 1485, to: 1714, color: C4 },
    { id: 'georgian', label: 'Georgian & Victorian', from: 1714, to: 1901, color: C5 },
    { id: 'modern', label: 'Modern', from: 1901, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-london': { title: 'London — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/London', official: false },
    'gla': { title: 'Greater London Authority — official site', publisher: 'Greater London Authority', url: 'https://www.london.gov.uk/', official: true },
    'whe-london': { title: 'Roman & Medieval London — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/london/', official: false },
  },
  figures: [
    { label: 'Population', value: '≈8.9 million', note: 'Greater London (2021); ≈14 million in the wider metropolitan area.', sourceId: 'gla' },
    { label: 'Founded', value: 'AD 47', note: 'As the Roman town of Londinium.', sourceId: 'whe-london' },
    { label: 'Setting', value: 'On the tidal Thames', note: 'Southeast England, at the river’s lowest historic bridging point.', sourceId: 'britannica-london' },
    { label: 'World Heritage', value: '4 sites', note: 'Tower of London, Westminster, Kew Gardens and Maritime Greenwich.', sourceId: 'britannica-london' },
    { label: 'Largest city', value: '1831–1925', note: 'The most populous city in the world for nearly a century.', sourceId: 'britannica-london' },
  ],
  places: [
    { id: 'cityoflondon', name: 'City of London', lat: 51.5155, lon: -0.0922, note: 'The “Square Mile” — the Roman and medieval core, still the financial district.' },
    { id: 'tower', name: 'Tower of London', lat: 51.5081, lon: -0.0759, note: 'The Norman fortress begun by William the Conqueror.' },
    { id: 'westminster', name: 'Westminster', lat: 51.4995, lon: -0.1248, note: 'The abbey and palace — seat of coronations and Parliament.' },
    { id: 'stpauls', name: "St Paul’s Cathedral", lat: 51.5138, lon: -0.0984, note: 'Wren’s domed cathedral, rebuilt after the Great Fire.' },
    { id: 'southwark', name: 'Bankside / Southwark', lat: 51.5080, lon: -0.0972, note: 'The south bank of playhouses, including Shakespeare’s Globe.' },
  ],
  ev: [
    { y: 47, yd: 'AD 47', t: 'Londinium founded', b: 'The Romans establish Londinium as a trading settlement and bridgehead on the Thames soon after the invasion of AD 43.', s: 'whe-london', p: 'cityoflondon', pv: true, g: 'origins' },
    { y: 60, t: 'Boudica burns Londinium', b: 'The rebel queen Boudica sacks and burns the young town during her revolt against Rome.', s: 'whe-london', g: 'conflict' },
    { y: 200, yd: 'c. 200', t: 'The Roman city wall', b: 'Londinium is enclosed by a great stone wall whose line the City of London still echoes.', s: 'whe-london', p: 'cityoflondon' },
    { y: 410, t: 'Rome withdraws', b: 'Roman rule in Britain ends and Londinium is largely abandoned to ruin.', g: 'decline' },
    { y: 604, t: 'The first St Paul’s', b: 'A cathedral to St Paul is founded on Ludgate Hill as the Saxon trading town of Lundenwic grows to the west.', p: 'stpauls', g: 'religion' },
    { y: 886, t: 'Alfred refounds London', b: 'Alfred the Great retakes the ruined Roman city from the Vikings and re-establishes it within the old walls.', pv: true },
    { y: 1066, t: 'The Norman Conquest', b: 'William the Conqueror is crowned in Westminster Abbey; London submits and keeps its ancient liberties.', p: 'westminster', pv: true, g: 'conflict' },
    { y: 1078, t: 'The White Tower', b: 'William begins the Tower of London to guard — and overawe — the city.', p: 'tower' },
    { y: 1215, t: 'Magna Carta', b: 'London’s support helps force King John to seal Magna Carta; the City’s rights are confirmed.', g: 'politics' },
    { y: 1348, t: 'The Black Death', b: 'Plague arrives in England and kills perhaps half of London’s people.', g: 'disaster' },
    { y: 1381, t: "The Peasants' Revolt", b: 'Rebels led by Wat Tyler storm London and the Tower before the rising is crushed.', p: 'tower', g: 'conflict' },
    { y: 1485, t: 'The Tudor age begins', b: 'Henry VII’s victory at Bosworth begins the Tudor century; London flourishes as a trading capital.', g: 'politics' },
    { y: 1599, t: 'The Globe Theatre', b: 'Shakespeare’s company opens the Globe on Bankside, heart of London’s theatre boom.', p: 'southwark', g: 'culture' },
    { y: 1605, t: 'The Gunpowder Plot', b: 'Guy Fawkes is caught beneath Parliament in a plot to blow up king and Lords.', p: 'westminster', g: 'conflict' },
    { y: 1649, t: 'The king is executed', b: 'Charles I is beheaded outside the Banqueting House at the climax of the Civil War.', p: 'westminster', pv: true, g: 'politics' },
    { y: 1665, t: 'The Great Plague', b: 'The last great outbreak of bubonic plague kills nearly a quarter of Londoners.', g: 'disaster' },
    { y: 1666, t: 'The Great Fire', b: 'A fire starting in Pudding Lane destroys medieval London, including old St Paul’s.', p: 'stpauls', pv: true, g: 'disaster' },
    { y: 1710, t: 'Wren’s St Paul’s', b: 'Christopher Wren’s great domed cathedral is completed, crowning the rebuilt City.', p: 'stpauls', g: 'culture' },
    { y: 1714, t: 'Georgian London', b: 'Under the Hanoverians London spreads west into elegant garden squares.', g: 'growth' },
    { y: 1834, t: 'Parliament burns', b: 'Fire destroys the old Palace of Westminster; the Gothic Houses of Parliament rise in its place.', p: 'westminster', g: 'disaster' },
    { y: 1851, t: 'The Great Exhibition', b: 'The Crystal Palace showcases the world’s manufactures at the height of empire.', g: 'culture' },
    { y: 1863, t: 'The Underground', b: 'The world’s first underground railway opens beneath London.', s: 'gla', g: 'growth' },
    { y: 1888, t: 'The Whitechapel murders', b: 'The unsolved “Jack the Ripper” killings horrify the crowded East End.', g: 'conflict' },
    { y: 1901, t: 'The largest city on Earth', b: 'At Queen Victoria’s death London is the biggest and richest city in the world.', g: 'growth' },
    { y: 1940, t: 'The Blitz', b: 'German bombing devastates London for months; the city endures night after night.', pv: true, g: 'conflict' },
    { y: 1948, t: 'Windrush and the Games', b: 'Postwar London hosts the Olympics and welcomes Caribbean migrants who reshape the city.', g: 'culture' },
    { y: 2000, t: 'Mayor and Millennium', b: 'London elects its first citywide mayor and marks the millennium with the Eye and Tate Modern.', s: 'gla', g: 'politics' },
    { y: 2005, t: 'The 7/7 bombings', b: 'Suicide bombers attack the transport network, killing 52 people.', g: 'conflict' },
    { y: 2012, t: 'London 2012', b: 'London becomes the first city to host the modern Olympic Games three times.', s: 'gla', g: 'culture' },
  ],
  families: [
    { id: 'plantagenet', name: 'House of Plantagenet', community: 'Medieval royal dynasty', span: '1154–1485', industries: ['Monarchy', 'War', 'Law'], legacy: 'The Tower, Westminster and English common law', era: 'medieval', sourceId: 'britannica-london', place: 'tower', summary: 'The kings who built the Tower and Westminster and shaped English common law, ruling from London through the Middle Ages.' },
    { id: 'tudor', name: 'House of Tudor', community: 'Renaissance dynasty', span: '1485–1603', industries: ['Monarchy', 'Church', 'Trade'], legacy: 'The English Reformation and a European capital', era: 'tudor', sourceId: 'britannica-london', place: 'westminster', summary: 'Henry VIII and Elizabeth I broke with Rome and made London a great European capital of trade and theatre.' },
    { id: 'corporation', name: 'The City of London Corporation', community: 'Merchant self-government', span: 'From the 12th century', industries: ['Trade', 'Finance', 'Governance'], legacy: 'The self-governing “Square Mile”', era: 'medieval', sourceId: 'britannica-london', place: 'cityoflondon', summary: 'The livery companies and ancient Corporation gave the City a self-rule and mercantile power that outlasted kings.' },
    { id: 'rothschild', name: 'The Rothschilds', community: 'Banking dynasty', span: 'From 1811', industries: ['Banking', 'Finance'], legacy: 'London as a capital of global finance', era: 'georgian', sourceId: 'britannica-london', summary: 'N. M. Rothschild & Sons helped make 19th-century London the hub of world finance.' },
  ],
},

/* ===================== PARIS ===================== */
{
  id: 'paris', name: 'Paris', country: 'France', geonameId: 2988507,
  centre: [2.3488, 48.8534], bbox: [2.18, 48.75, 2.52, 48.94],
  formerName: 'Lutetia', renamed: '360', nameLocal: null, coverage: '52 BC – 2024',
  summary: "Paris grew from Lutetia, a Roman town on an island in the Seine, into the capital of the Frankish kings and then of France itself. It gave the world Notre-Dame and the Sorbonne, the storming of the Bastille and the Terror, Haussmann's boulevards and the Eiffel Tower. Occupied and liberated within living memory, it remains a world capital of art, ideas and style on the river that has always defined it.",
  srcDefault: 'britannica-paris',
  eras: [
    { id: 'gallo-roman', label: 'Gallo-Roman', from: -52, to: 486, color: C },
    { id: 'medieval', label: 'Medieval', from: 486, to: 1515, color: C2 },
    { id: 'bourbon', label: 'Renaissance & Bourbon', from: 1515, to: 1789, color: C3 },
    { id: 'revolution', label: 'Revolution & Empire', from: 1789, to: 1852, color: C4 },
    { id: 'haussmann', label: 'Haussmann to War', from: 1852, to: 1944, color: C5 },
    { id: 'modern', label: 'Modern', from: 1944, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-paris': { title: 'Paris — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Paris', official: false },
    'mairie': { title: 'Ville de Paris — official city portal', publisher: 'Ville de Paris', url: 'https://www.paris.fr/', official: true },
    'whe-gaul': { title: 'Roman Gaul — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/Gaul/', official: false },
  },
  figures: [
    { label: 'Population', value: '≈2.1 million', note: 'City of Paris; ≈11 million in the Île-de-France metropolitan region.', sourceId: 'mairie' },
    { label: 'Founded', value: '52 BC', note: 'As Roman Lutetia; renamed Paris, after the Parisii, in the 4th century.', sourceId: 'whe-gaul' },
    { label: 'Setting', value: 'On the Seine', note: 'Île-de-France, in the north of France.', sourceId: 'britannica-paris' },
    { label: 'World Heritage', value: 'Banks of the Seine (1991)', note: 'The riverfront from the Louvre to the Eiffel Tower.', sourceId: 'britannica-paris' },
    { label: 'Known for', value: 'Art, revolution, style', note: 'A world capital of culture for centuries.', sourceId: 'britannica-paris' },
  ],
  places: [
    { id: 'ile-de-la-cite', name: 'Île de la Cité', lat: 48.8550, lon: 2.3470, note: 'The island in the Seine where Roman and medieval Paris began.' },
    { id: 'notredame', name: 'Notre-Dame', lat: 48.8530, lon: 2.3499, note: 'The Gothic cathedral begun in 1163.' },
    { id: 'louvre', name: 'The Louvre', lat: 48.8606, lon: 2.3376, note: 'Royal palace turned the world’s most-visited museum.' },
    { id: 'bastille', name: 'The Bastille', lat: 48.8532, lon: 2.3692, note: 'The fortress-prison whose fall in 1789 began the Revolution.' },
    { id: 'eiffel', name: 'The Eiffel Tower', lat: 48.8584, lon: 2.2945, note: 'Built for the 1889 World’s Fair; the symbol of Paris.' },
  ],
  ev: [
    { y: -52, yd: '52 BC', t: 'Roman Lutetia', b: 'Rome conquers the Gaulish Parisii and builds the town of Lutetia on the Seine’s island and left bank.', s: 'whe-gaul', p: 'ile-de-la-cite', pv: true, g: 'origins' },
    { y: 360, t: 'Julian and the name “Paris”', b: 'Roman troops here proclaim Julian emperor; over the 4th century the town takes the name of its people, the Parisii.', s: 'whe-gaul', g: 'origins' },
    { y: 451, t: 'Sainte Geneviève', b: 'By tradition Geneviève rallies the townsfolk, and their prayers turn Attila’s Huns away from Paris.', g: 'religion' },
    { y: 508, t: 'Clovis makes it his capital', b: 'The Frankish king Clovis settles Paris as the capital of his new kingdom.', pv: true, g: 'politics' },
    { y: 845, t: 'The Vikings sack Paris', b: 'Norse raiders sail up the Seine and pillage the city; more sieges follow.', g: 'conflict' },
    { y: 1163, t: 'Notre-Dame begun', b: 'Construction starts on the great cathedral of Notre-Dame de Paris.', p: 'notredame', g: 'religion' },
    { y: 1257, t: 'The Sorbonne', b: 'Robert de Sorbon founds the college that anchors the famed University of Paris.', g: 'culture' },
    { y: 1348, t: 'The Black Death', b: 'Plague devastates Paris, killing tens of thousands.', g: 'disaster' },
    { y: 1431, t: 'An English coronation', b: 'During the Hundred Years’ War the boy-king Henry VI of England is crowned king of France in Paris.', g: 'conflict' },
    { y: 1572, t: "St Bartholomew's Day Massacre", b: 'Thousands of Protestants are slaughtered in Paris during the Wars of Religion.', g: 'conflict' },
    { y: 1594, t: '“Paris is worth a Mass”', b: 'Henri IV converts to Catholicism and enters Paris, ending the religious wars.', g: 'politics' },
    { y: 1682, t: 'The court leaves for Versailles', b: 'Louis XIV moves the royal court out of Paris to his new palace at Versailles.', g: 'politics' },
    { y: 1789, t: 'The Bastille falls', b: 'A Paris crowd storms the Bastille on 14 July, igniting the French Revolution.', p: 'bastille', pv: true, g: 'politics' },
    { y: 1793, t: 'The king guillotined', b: 'Louis XVI is executed on today’s Place de la Concorde; the Terror follows.', g: 'conflict' },
    { y: 1804, t: 'Napoleon crowned', b: 'Napoleon crowns himself Emperor of the French at Notre-Dame.', p: 'notredame', g: 'politics' },
    { y: 1836, t: 'The Arc de Triomphe', b: 'Napoleon’s great triumphal arch is finally completed.', g: 'culture' },
    { y: 1852, t: 'Haussmann remakes Paris', b: 'Baron Haussmann drives broad boulevards and sewers through the medieval city.', pv: true, g: 'growth' },
    { y: 1871, t: 'The Paris Commune', b: 'A radical commune governs Paris for two months before being crushed in a bloody week.', g: 'conflict' },
    { y: 1889, t: 'The Eiffel Tower', b: 'Built for the World’s Fair, the tower becomes the enduring symbol of Paris.', p: 'eiffel', pv: true, g: 'culture' },
    { y: 1900, t: 'The Métro and the Belle Époque', b: 'The Paris Métro opens as the city dazzles the world at another World’s Fair.', s: 'mairie', g: 'growth' },
    { y: 1919, t: 'The Treaty of Versailles', b: 'The peace ending the First World War is signed just outside Paris.', g: 'politics' },
    { y: 1940, t: 'The Nazi occupation', b: 'German troops march into Paris; the occupation lasts four years.', g: 'conflict' },
    { y: 1944, t: 'The Liberation', b: 'Allied and Free French forces liberate Paris in August 1944.', pv: true, g: 'conflict' },
    { y: 1968, t: 'May 1968', b: 'A student revolt and general strike shake the French state to its foundations.', g: 'politics' },
    { y: 1977, t: 'The Pompidou Centre', b: 'A radical modern-art museum opens, part of a wave of grand cultural projects.', g: 'culture' },
    { y: 1989, t: 'The Louvre Pyramid', b: 'I. M. Pei’s glass pyramid opens for the bicentenary of the Revolution.', p: 'louvre', s: 'mairie', g: 'culture' },
    { y: 2015, t: 'The November attacks', b: 'Coordinated terrorist attacks across the city kill 130 people.', g: 'conflict' },
    { y: 2019, t: 'Notre-Dame burns', b: 'Fire ravages Notre-Dame; a global effort begins to restore it.', p: 'notredame', g: 'disaster' },
    { y: 2024, t: 'The Paris Olympics', b: 'Paris hosts the Summer Games a century after it last did, in 1924.', s: 'mairie', g: 'culture' },
  ],
  families: [
    { id: 'capetians', name: 'The Capetians', community: 'Founding royal dynasty', span: '987–1328', industries: ['Monarchy'], legacy: 'Paris as the fixed capital of France', era: 'medieval', sourceId: 'britannica-paris', place: 'ile-de-la-cite', summary: 'The line that made Paris the permanent capital of France and raised its first great monuments.' },
    { id: 'bourbons', name: 'House of Bourbon', community: 'Absolutist dynasty', span: '1589–1792', industries: ['Monarchy'], legacy: 'Royal Paris — before the court left for Versailles', era: 'bourbon', sourceId: 'britannica-paris', place: 'louvre', summary: 'Henri IV and Louis XIV shaped Paris before moving the court to Versailles; the Revolution ended their reign.' },
    { id: 'bonaparte', name: 'House of Bonaparte', community: 'Imperial dynasty', span: '1804–1870', industries: ['Empire', 'War'], legacy: 'The Arc de Triomphe and Haussmann’s boulevards', era: 'revolution', sourceId: 'britannica-paris', place: 'notredame', summary: 'Napoleon I and III crowned themselves in Paris and reshaped it, from triumphal arch to grand boulevards.' },
  ],
},

/* ===================== ISTANBUL ===================== */
{
  id: 'istanbul', name: 'Istanbul', country: 'Turkey', geonameId: 745044,
  centre: [28.9497, 41.0138], bbox: [28.85, 40.95, 29.15, 41.15],
  formerName: 'Constantinople', renamed: '1930', nameLocal: 'İstanbul', coverage: '660 BC – 2020',
  summary: "No city has been the capital of more history than this one. Founded as the Greek colony of Byzantion around 660 BC on the point where Europe meets Asia, it was refounded by Constantine in 330 as Constantinople — capital of the Roman and then Byzantine empire and centre of Orthodox Christianity for over a thousand years. Conquered by the Ottomans in 1453, it ruled an Islamic empire from Topkapı until 1922. Renamed Istanbul, it is today the largest city in Europe, and the only one that straddles two continents.",
  srcDefault: 'britannica-istanbul',
  eras: [
    { id: 'byzantion', label: 'Greek Byzantion', from: -660, to: 330, color: C },
    { id: 'byzantine', label: 'Constantinople / Byzantine', from: 330, to: 1453, color: C2 },
    { id: 'ottoman-classical', label: 'Ottoman Classical', from: 1453, to: 1703, color: C3 },
    { id: 'ottoman-late', label: 'Late Ottoman', from: 1703, to: 1922, color: C4 },
    { id: 'republic', label: 'Turkish Republic', from: 1922, to: 1980, color: C5 },
    { id: 'modern', label: 'Modern', from: 1980, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-istanbul': { title: 'Istanbul — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Istanbul', official: false },
    'unesco-356': { title: 'Historic Areas of Istanbul — UNESCO World Heritage List', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/356/', official: true },
    'whe-constantinople': { title: 'Constantinople — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/Constantinople/', official: false },
  },
  figures: [
    { label: 'Population', value: '≈15.7 million', note: 'The largest city in Europe; its metropolitan area spans two continents.', sourceId: 'britannica-istanbul' },
    { label: 'Founded', value: '660 BC', note: 'As Greek Byzantion; refounded as Constantinople in AD 330.', sourceId: 'whe-constantinople' },
    { label: 'Setting', value: 'On the Bosphorus', note: 'The strait joining the Black Sea and the Mediterranean, between Europe and Asia.', sourceId: 'britannica-istanbul' },
    { label: 'World Heritage', value: 'Historic Areas (1985)', note: 'The old city of Constantinople and its monuments.', sourceId: 'unesco-356' },
    { label: 'Capital of', value: 'Three empires', note: 'Roman/Byzantine, Latin and Ottoman.', sourceId: 'britannica-istanbul' },
  ],
  places: [
    { id: 'hagiasophia', name: 'Hagia Sophia', lat: 41.0086, lon: 28.9802, note: 'Justinian’s great domed church of 537, later mosque, museum and mosque again.' },
    { id: 'topkapi', name: 'Topkapı Palace', lat: 41.0115, lon: 28.9834, note: 'Seat of the Ottoman sultans for nearly four centuries.' },
    { id: 'bluemosque', name: 'The Blue Mosque', lat: 41.0054, lon: 28.9768, note: 'The Sultan Ahmed Mosque of 1616, facing Hagia Sophia.' },
    { id: 'grandbazaar', name: 'The Grand Bazaar', lat: 41.0106, lon: 28.9681, note: 'One of the world’s oldest and largest covered markets.' },
    { id: 'galata', name: 'Galata', lat: 41.0256, lon: 28.9744, note: 'The old Genoese quarter across the Golden Horn.' },
  ],
  ev: [
    { y: -660, yd: '660 BC', t: 'Greek Byzantion', b: 'Greek colonists from Megara found Byzantion on the point where Europe meets the Bosphorus.', s: 'whe-constantinople', p: 'topkapi', pv: true, g: 'origins' },
    { y: -512, yd: 'c. 512 BC', t: 'Persians and Greeks', b: 'Byzantion passes between Persian, Athenian and Spartan control through the classical centuries.', s: 'whe-constantinople', g: 'conflict' },
    { y: 196, yd: 'AD 196', t: 'Rome rebuilds it', b: 'Emperor Septimius Severus razes and then rebuilds Byzantium after a long siege.', s: 'whe-constantinople' },
    { y: 330, t: 'Constantinople founded', b: 'Constantine refounds the city as the new capital of the Roman Empire — Constantinople.', p: 'hagiasophia', pv: true, g: 'politics' },
    { y: 537, t: 'Hagia Sophia', b: 'Justinian completes the vast domed church of Hagia Sophia, wonder of the age.', p: 'hagiasophia', g: 'culture' },
    { y: 674, t: 'Arab sieges repelled', b: 'The city withstands the first great Arab sieges, saved partly by the secret weapon of “Greek fire.”', g: 'conflict' },
    { y: 1054, t: 'The Great Schism', b: 'The Christian church splits between Rome and Constantinople.', g: 'religion' },
    { y: 1204, t: 'The Fourth Crusade sacks the city', b: 'Crusaders storm and pillage Constantinople — a wound from which Byzantium never fully recovers.', pv: true, g: 'conflict' },
    { y: 1261, t: 'Byzantine restoration', b: 'The Palaiologos emperors retake the diminished city from its Latin rulers.', g: 'politics' },
    { y: 1453, t: 'The Ottoman conquest', b: 'Mehmed II takes Constantinople; the Byzantine Empire ends and the city becomes Ottoman.', p: 'topkapi', pv: true, g: 'conflict' },
    { y: 1459, t: 'Topkapı Palace', b: 'Mehmed begins Topkapı Palace, seat of the sultans for the next four centuries.', p: 'topkapi' },
    { y: 1481, t: 'Hagia Sophia a mosque', b: 'The great church is converted to a mosque and minarets rise around it.', p: 'hagiasophia', g: 'religion' },
    { y: 1520, t: 'Süleyman the Magnificent', b: 'Under Süleyman the city becomes the dazzling heart of a Mediterranean empire.', g: 'politics' },
    { y: 1557, t: 'Sinan’s Süleymaniye', b: 'The architect Sinan completes the Süleymaniye Mosque crowning the skyline.', g: 'culture' },
    { y: 1616, t: 'The Blue Mosque', b: 'The Sultan Ahmed (Blue) Mosque is completed opposite Hagia Sophia.', p: 'bluemosque', g: 'culture' },
    { y: 1730, t: 'The end of the Tulip Era', b: 'A janissary revolt ends the westernising “Tulip Era” of the early 18th century.', g: 'conflict' },
    { y: 1826, t: 'The Auspicious Incident', b: 'Sultan Mahmud II violently destroys the rebellious janissary corps.', g: 'politics' },
    { y: 1853, t: 'The Crimean War', b: 'The city becomes a base and hospital hub in the Crimean War.', g: 'conflict' },
    { y: 1889, t: 'The Orient Express', b: 'The famous luxury train links Paris with Constantinople.', g: 'growth' },
    { y: 1922, t: 'The sultanate abolished', b: 'The Ottoman sultanate ends and the last sultan quietly leaves the city.', pv: true, g: 'politics' },
    { y: 1923, t: 'Ankara made capital', b: 'The new Turkish Republic moves its capital to Ankara.', g: 'politics' },
    { y: 1930, t: 'Renamed Istanbul', b: 'The city’s name is officially fixed as Istanbul.', g: 'politics' },
    { y: 1955, t: 'The Istanbul pogrom', b: 'Mobs attack the Greek and other minority communities; many leave for good.', g: 'conflict' },
    { y: 1973, t: 'The Bosphorus Bridge', b: 'The first bridge links Europe and Asia across the strait.', g: 'growth' },
    { y: 1985, t: 'World Heritage', b: 'The historic areas of the old city are inscribed on the UNESCO World Heritage List.', s: 'unesco-356', g: 'culture' },
    { y: 2013, t: 'The Gezi Park protests', b: 'Protests over a park in Taksim Square swell into a nationwide movement.', g: 'politics' },
    { y: 2020, t: 'Hagia Sophia a mosque again', b: 'Hagia Sophia is reconverted from a museum into a working mosque.', p: 'hagiasophia', g: 'religion' },
  ],
  families: [
    { id: 'constantinian', name: 'The House of Constantine', community: 'Founders of Constantinople', span: '324–363', industries: ['Empire', 'Church'], legacy: 'The Christian capital of the Roman world', era: 'byzantine', sourceId: 'whe-constantinople', place: 'hagiasophia', summary: 'Constantine and his heirs made the city the Christian capital of the Roman Empire.' },
    { id: 'komnenos', name: 'The Komnenos & Palaiologos', community: 'Byzantine imperial houses', span: '1081–1453', industries: ['Empire'], legacy: 'The last defence of Byzantium', era: 'byzantine', sourceId: 'britannica-istanbul', summary: 'The last great Byzantine dynasties, who defended, lost and briefly restored the city before its final fall.' },
    { id: 'osman', name: 'The House of Osman', community: 'Ottoman sultans', span: '1453–1922', industries: ['Empire', 'Religion'], legacy: 'A Mediterranean empire ruled from Topkapı', era: 'ottoman-classical', sourceId: 'britannica-istanbul', place: 'topkapi', summary: 'The Ottoman dynasty ruled an empire from Topkapı Palace for four and a half centuries.' },
  ],
},

/* ===================== ATHENS ===================== */
{
  id: 'athens', name: 'Athens', country: 'Greece', geonameId: 264371,
  centre: [23.7278, 37.9838], bbox: [23.55, 37.87, 23.85, 38.06],
  formerName: null, renamed: null, nameLocal: 'Αθήνα', coverage: 'c. 1600 BC – 2009',
  summary: "Athens has been lived in for over three thousand years — from a Bronze Age citadel on the Acropolis to the city that gave the world democracy, philosophy and drama in its 5th-century-BC golden age. The Parthenon crowned that height; Rome, Byzantium and the Ottomans followed, and a Venetian shell shattered the temple in 1687. Chosen as the capital of a newly independent Greece in 1834, when it was barely a town, Athens grew into a metropolis of over three million beneath the ancient rock.",
  srcDefault: 'britannica-athens',
  eras: [
    { id: 'ancient', label: 'Bronze & Archaic', from: -1600, to: -508, color: C },
    { id: 'classical', label: 'Classical', from: -508, to: -323, color: C2 },
    { id: 'hellenistic-roman', label: 'Hellenistic & Roman', from: -323, to: 330, color: C3 },
    { id: 'byzantine-ottoman', label: 'Byzantine & Ottoman', from: 330, to: 1833, color: C4 },
    { id: 'kingdom', label: 'Capital of Greece', from: 1833, to: 1946, color: C5 },
    { id: 'modern', label: 'Modern', from: 1946, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-athens': { title: 'Athens — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Athens', official: false },
    'unesco-404': { title: 'Acropolis, Athens — UNESCO World Heritage List', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/404/', official: true },
    'whe-athens': { title: 'Athens — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/athens/', official: false },
  },
  figures: [
    { label: 'Population', value: '≈664,000', note: 'City proper; ≈3.6 million in the Athens metropolitan area.', sourceId: 'britannica-athens' },
    { label: 'Founded', value: 'c. 1600 BC', note: 'Continuously inhabited for over 3,000 years.', sourceId: 'whe-athens' },
    { label: 'Setting', value: 'The Attic plain', note: 'Its port, Piraeus, lies 8 km to the southwest.', sourceId: 'britannica-athens' },
    { label: 'World Heritage', value: 'The Acropolis (1987)', note: 'Crowned by the Parthenon.', sourceId: 'unesco-404' },
    { label: 'Birthplace of', value: 'Democracy', note: 'And of Western philosophy and drama.', sourceId: 'whe-athens' },
  ],
  places: [
    { id: 'acropolis', name: 'The Acropolis', lat: 37.9715, lon: 23.7257, note: 'The sacred rock and citadel above the city.' },
    { id: 'parthenon', name: 'The Parthenon', lat: 37.9715, lon: 23.7267, note: 'Pericles’ temple to Athena, symbol of classical Greece.' },
    { id: 'agora', name: 'The Ancient Agora', lat: 37.9755, lon: 23.7228, note: 'The civic heart where democracy and philosophy were practised.' },
    { id: 'syntagma', name: 'Syntagma Square', lat: 37.9755, lon: 23.7348, note: 'The square before Parliament, centre of the modern city.' },
    { id: 'piraeus', name: 'Piraeus', lat: 37.9421, lon: 23.6465, note: 'Athens’ ancient and modern port on the Saronic Gulf.' },
  ],
  ev: [
    { y: -1600, yd: 'c. 1600 BC', t: 'Mycenaean Athens', b: 'A fortified palace crowns the Acropolis in the Bronze Age.', s: 'whe-athens', p: 'acropolis', pv: true, g: 'origins' },
    { y: -1050, yd: 'c. 1050 BC', t: 'An Ionian refuge', b: 'Athens survives the Bronze Age collapse and grows as an Ionian centre.', s: 'whe-athens', g: 'origins' },
    { y: -621, yd: '621 BC', t: 'Draco’s harsh laws', b: 'Draco gives Athens its first written — and famously severe — law code.', s: 'whe-athens', g: 'politics' },
    { y: -594, yd: '594 BC', t: 'Solon’s reforms', b: 'Solon reforms debt and citizenship, laying the ground for democracy.', s: 'whe-athens', g: 'politics' },
    { y: -561, yd: '561 BC', t: 'Peisistratus the tyrant', b: 'The tyrant Peisistratus beautifies Athens and promotes its great festivals.', s: 'whe-athens', p: 'acropolis' },
    { y: -508, yd: '508 BC', t: 'Democracy is born', b: 'Cleisthenes establishes the world’s first democracy at Athens.', p: 'agora', pv: true, g: 'politics' },
    { y: -490, yd: '490 BC', t: 'Marathon', b: 'Athenian hoplites defeat the invading Persians on the plain of Marathon.', s: 'whe-athens', g: 'conflict' },
    { y: -480, yd: '480 BC', t: 'Salamis and the sack', b: 'Persia burns the Acropolis, but the Athenian fleet wins a decisive victory at Salamis.', p: 'acropolis', g: 'conflict' },
    { y: -447, yd: '447 BC', t: 'The Parthenon', b: 'Under Pericles the Parthenon rises on the rebuilt Acropolis at the height of Athens’ power.', p: 'parthenon', pv: true, g: 'culture' },
    { y: -431, yd: '431 BC', t: 'The Peloponnesian War', b: 'Athens and Sparta begin a long war that will end the Athenian golden age.', g: 'conflict' },
    { y: -399, yd: '399 BC', t: 'The death of Socrates', b: 'Socrates is condemned by an Athenian jury and drinks hemlock.', p: 'agora', g: 'culture' },
    { y: -387, yd: '387 BC', t: 'Plato’s Academy', b: 'Plato founds the Academy; Aristotle’s Lyceum will follow.', s: 'whe-athens', g: 'culture' },
    { y: -338, yd: '338 BC', t: 'Macedon takes Greece', b: 'Philip II of Macedon defeats Athens and Thebes at Chaeronea.', g: 'conflict' },
    { y: -86, yd: '86 BC', t: 'Rome sacks Athens', b: 'The Roman general Sulla storms and plunders the city.', g: 'conflict' },
    { y: 125, yd: 'AD 125', t: 'Hadrian’s Athens', b: 'The emperor Hadrian lavishes new buildings and a great arch on the city.', g: 'culture' },
    { y: 529, t: 'The schools are closed', b: 'The emperor Justinian closes the ancient philosophical schools of Athens.', g: 'religion' },
    { y: 1204, t: 'Frankish Athens', b: 'Crusaders seize Athens and the Parthenon becomes a Latin cathedral.', p: 'parthenon', g: 'conflict' },
    { y: 1456, t: 'The Ottoman conquest', b: 'The Ottomans take Athens; the Parthenon is turned into a mosque.', g: 'conflict' },
    { y: 1687, t: 'The Parthenon explodes', b: 'A Venetian shell ignites Ottoman gunpowder stored in the Parthenon, wrecking the temple.', p: 'parthenon', pv: true, g: 'disaster' },
    { y: 1801, t: 'The Elgin Marbles', b: 'Lord Elgin removes much of the Parthenon’s sculpture to Britain.', p: 'parthenon', g: 'culture' },
    { y: 1834, t: 'Capital of Greece', b: 'After independence, Athens — then a small town — is chosen as capital of the new Greek kingdom.', p: 'syntagma', pv: true, g: 'politics' },
    { y: 1896, t: 'The first modern Olympics', b: 'Athens hosts the revived Olympic Games.', g: 'culture' },
    { y: 1923, t: 'The refugee flood', b: 'Nearly a million Greek refugees from Anatolia swell the city.', g: 'growth' },
    { y: 1944, t: 'Occupation and civil war', b: 'Nazi occupation ends, but fighting in Athens opens the Greek Civil War.', g: 'conflict' },
    { y: 1981, t: 'Into Europe', b: 'Greece joins the European Community, with Athens as its capital.', g: 'politics' },
    { y: 2004, t: 'The Games return', b: 'Athens hosts the Summer Olympics for the first time since 1896.', g: 'culture' },
    { y: 2009, t: 'The debt crisis', b: 'A sovereign-debt crisis brings years of austerity and protest to the streets of Athens.', g: 'politics' },
  ],
  families: [
    { id: 'alcmaeonidae', name: 'The Alcmaeonidae', community: 'Aristocratic reforming clan', span: '7th–5th c. BC', industries: ['Politics'], legacy: 'Cleisthenes and Pericles', era: 'classical', sourceId: 'whe-athens', place: 'agora', summary: 'The clan of Cleisthenes, father of democracy, and later of Pericles, who built the Parthenon.' },
    { id: 'peisistratids', name: 'The Peisistratids', community: 'Tyrant dynasty', span: '561–510 BC', industries: ['Politics', 'Building'], legacy: 'Festivals and monuments of archaic Athens', era: 'ancient', sourceId: 'whe-athens', place: 'acropolis', summary: 'Tyrants who adorned Athens and fostered its festivals before democracy replaced them.' },
    { id: 'glucksburg', name: 'The House of Glücksburg', community: 'Kings of the Hellenes', span: '1863–1973', industries: ['Monarchy'], legacy: 'Athens as a modern European capital', era: 'kingdom', sourceId: 'britannica-athens', place: 'syntagma', summary: 'The royal house under which Athens grew from a small town into a modern capital.' },
  ],
},

/* ===================== JERUSALEM ===================== */
{
  id: 'jerusalem', name: 'Jerusalem', country: 'Israel', geonameId: 281184,
  centre: [35.2163, 31.769], bbox: [35.12, 31.70, 35.31, 31.84],
  formerName: null, renamed: null, nameLocal: 'ירושלים · القدس', coverage: 'c. 1800 BC – 2000',
  caveat: 'Jerusalem’s political status and boundaries are internationally disputed; this account records widely agreed history as neutrally as it can, and takes no position on any claim.',
  summary: "Jerusalem is among the oldest cities on Earth and holy to three faiths. A Canaanite town became King David's capital around 1000 BC and the site of Solomon's Temple; that Temple was destroyed by Babylon, rebuilt, and destroyed again by Rome in AD 70, leaving the Western Wall. Christians revere it as the place of the Crucifixion and Resurrection, Muslims as the site of the Dome of the Rock and al-Aqsa. Fought over by Crusaders, Ayyubids and Ottomans, it remains one of the world's most contested cities — its status disputed to this day.",
  srcDefault: 'britannica-jerusalem',
  eras: [
    { id: 'canaanite', label: 'Canaanite & Israelite', from: -2000, to: -586, color: C },
    { id: 'second-temple', label: 'Second Temple', from: -586, to: 70, color: C2 },
    { id: 'roman-byzantine', label: 'Roman & Byzantine', from: 70, to: 638, color: C3 },
    { id: 'islamic-crusader', label: 'Islamic & Crusader', from: 638, to: 1517, color: C4 },
    { id: 'ottoman', label: 'Ottoman', from: 1517, to: 1917, color: C5 },
    { id: 'modern', label: 'Modern', from: 1917, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-jerusalem': { title: 'Jerusalem — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Jerusalem', official: false },
    'unesco-148': { title: 'Old City of Jerusalem and its Walls — UNESCO', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/148/', official: true },
    'whe-jerusalem': { title: 'Jerusalem — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/jerusalem/', official: false },
  },
  figures: [
    { label: 'Population', value: '≈970,000', note: 'The most populous city administered by Israel; its status is internationally disputed.', sourceId: 'britannica-jerusalem' },
    { label: 'Founded', value: 'c. 1800 BC', note: 'One of the oldest cities on Earth.', sourceId: 'whe-jerusalem' },
    { label: 'Setting', value: 'The Judaean hills', note: 'About 750 m above sea level.', sourceId: 'britannica-jerusalem' },
    { label: 'World Heritage', value: 'Old City & walls (1981)', note: 'Also on the List of World Heritage in Danger.', sourceId: 'unesco-148' },
    { label: 'Holy to', value: 'Three faiths', note: 'Judaism, Christianity and Islam.', sourceId: 'britannica-jerusalem' },
  ],
  places: [
    { id: 'templemount', name: 'Temple Mount / Haram al-Sharif', lat: 31.7780, lon: 35.2354, note: 'Site of the Jewish Temples and of the Dome of the Rock and al-Aqsa.' },
    { id: 'westernwall', name: 'The Western Wall', lat: 31.7767, lon: 35.2345, note: 'The surviving retaining wall of Herod’s Temple Mount.' },
    { id: 'holysepulchre', name: 'Church of the Holy Sepulchre', lat: 31.7784, lon: 35.2297, note: 'Built over the traditional site of Christ’s tomb.' },
    { id: 'davidcity', name: 'City of David', lat: 31.7736, lon: 35.2358, note: 'The oldest settled core, south of the Temple Mount.' },
    { id: 'oldcity', name: 'The Old City walls', lat: 31.7767, lon: 35.2312, note: 'The present walls, rebuilt by Süleyman the Magnificent.' },
  ],
  ev: [
    { y: -1800, yd: 'c. 1800 BC', t: 'Canaanite Jerusalem', b: 'A Canaanite town called Urusalim appears in Egyptian records.', s: 'whe-jerusalem', pv: true, g: 'origins' },
    { y: -1000, yd: 'c. 1000 BC', t: 'David’s capital', b: 'King David takes the city and makes it the capital of Israel.', p: 'davidcity', pv: true, g: 'politics' },
    { y: -957, yd: 'c. 957 BC', t: 'Solomon’s Temple', b: 'Solomon builds the First Temple on Mount Moriah.', p: 'templemount', g: 'religion' },
    { y: -701, yd: '701 BC', t: 'Assyria repelled', b: 'Hezekiah’s Jerusalem survives an Assyrian siege; his water tunnel still runs beneath the city.', s: 'whe-jerusalem', g: 'conflict' },
    { y: -586, yd: '586 BC', t: 'Babylon destroys the Temple', b: 'Nebuchadnezzar razes the city and Temple and exiles the people of Judah.', p: 'templemount', pv: true, g: 'conflict' },
    { y: -516, yd: 'c. 516 BC', t: 'The Second Temple', b: 'Returned exiles rebuild the Temple.', p: 'templemount', g: 'religion' },
    { y: -164, yd: '164 BC', t: 'The Maccabees', b: 'The Maccabean revolt frees Jerusalem and rededicates the Temple, remembered at Hanukkah.', g: 'conflict' },
    { y: -37, yd: '37 BC', t: 'Herod the Great', b: 'Herod rebuilds the Temple on a vast scale and fortifies the city.', p: 'templemount', g: 'growth' },
    { y: 30, yd: 'c. AD 30', t: 'The Crucifixion', b: 'By Christian tradition Jesus is crucified and buried in Jerusalem.', p: 'holysepulchre', g: 'religion' },
    { y: 70, t: 'Rome destroys the Temple', b: 'Titus sacks Jerusalem and burns the Second Temple, leaving only its retaining wall.', p: 'westernwall', pv: true, g: 'conflict' },
    { y: 135, t: 'Aelia Capitolina', b: 'After the Bar Kokhba revolt Rome rebuilds the city as pagan Aelia Capitolina and bars Jews from it.', g: 'politics' },
    { y: 335, t: 'The Holy Sepulchre', b: 'Constantine’s mother Helena builds the Church of the Holy Sepulchre over the tomb of Christ.', p: 'holysepulchre', g: 'religion' },
    { y: 638, t: 'The Muslim conquest', b: 'The Caliph Umar takes Jerusalem peacefully from Byzantium.', pv: true, g: 'conflict' },
    { y: 691, t: 'The Dome of the Rock', b: 'The Umayyads build the Dome of the Rock on the Temple Mount.', p: 'templemount', pv: true, g: 'religion' },
    { y: 1099, t: 'The Crusaders', b: 'The First Crusade storms Jerusalem in a notorious massacre and founds a Latin kingdom.', pv: true, g: 'conflict' },
    { y: 1187, t: 'Saladin retakes the city', b: 'Saladin recaptures Jerusalem for Islam after the Battle of Hattin.', g: 'conflict' },
    { y: 1517, t: 'Ottoman rule', b: 'The Ottomans take Jerusalem; it stays under their rule for four centuries.', p: 'oldcity', g: 'politics' },
    { y: 1538, t: 'Süleyman’s walls', b: 'Süleyman the Magnificent rebuilds the Old City walls that still stand today.', p: 'oldcity' },
    { y: 1860, t: 'Beyond the walls', b: 'The first neighbourhoods are built outside the crowded Old City.', g: 'growth' },
    { y: 1917, t: 'General Allenby enters', b: 'British forces take Jerusalem from the Ottomans in the First World War.', pv: true, g: 'conflict' },
    { y: 1947, t: 'The UN partition vote', b: 'The United Nations votes to partition Palestine, proposing Jerusalem as an international city.', g: 'politics' },
    { y: 1948, t: 'A divided city', b: 'War splits Jerusalem between Israel and Jordan.', g: 'conflict' },
    { y: 1967, t: 'The Six-Day War', b: 'Israel captures the Old City and East Jerusalem.', p: 'westernwall', pv: true, g: 'conflict' },
    { y: 1980, t: 'Israel’s declaration', b: 'Israel declares a united Jerusalem its capital — a status not recognised by most of the world.', g: 'politics' },
    { y: 2000, t: 'The Second Intifada', b: 'Tensions on the Temple Mount help ignite a Palestinian uprising.', p: 'templemount', g: 'conflict' },
  ],
  families: [
    { id: 'house-of-david', name: 'The House of David', community: 'Israelite royal dynasty', span: 'from c. 1000 BC', industries: ['Monarchy', 'Religion'], legacy: 'The First Temple and a central place in three faiths', era: 'canaanite', sourceId: 'whe-jerusalem', place: 'davidcity', summary: 'David and Solomon made Jerusalem their capital and built the First Temple; the line runs deep through Jewish and Christian tradition.' },
    { id: 'hasmoneans', name: 'The Hasmoneans', community: 'Priest-kings', span: '164–37 BC', industries: ['Religion', 'War'], legacy: 'A brief independent Jewish state', era: 'second-temple', sourceId: 'whe-jerusalem', place: 'templemount', summary: 'The Maccabees and their heirs, who freed Jerusalem and rededicated the Temple.' },
    { id: 'herodians', name: 'The Herodian dynasty', community: 'Roman client kings', span: '37 BC – AD 92', industries: ['Monarchy', 'Building'], legacy: 'The Temple Mount whose Western Wall still stands', era: 'second-temple', sourceId: 'britannica-jerusalem', place: 'westernwall', summary: 'Herod the Great rebuilt the Temple and its mount on a monumental scale.' },
    { id: 'crusader-kings', name: 'Kings of Jerusalem', community: 'Crusader dynasty', span: '1099–1291', industries: ['Monarchy', 'War'], legacy: 'The Latin Kingdom of Jerusalem', era: 'islamic-crusader', sourceId: 'britannica-jerusalem', place: 'holysepulchre', summary: 'The Latin rulers of the Crusader kingdom centred on the holy city.' },
  ],
},

/* ===================== BEIJING ===================== */
{
  id: 'beijing', name: 'Beijing', country: 'China', geonameId: 1816670,
  centre: [116.3972, 39.9075], bbox: [116.25, 39.80, 116.55, 40.02],
  formerName: 'Dadu', renamed: '1403', nameLocal: '北京', coverage: 'c. 1045 BC – 2022',
  summary: "A capital in some form for over a thousand years, Beijing began as the frontier town of Ji and became the Mongol Dadu of Kublai Khan, described in wonder by Marco Polo. The Ming renamed it Beijing and built the Forbidden City and the Temple of Heaven; the Manchu Qing ruled a vast empire from it until 1912. From Tiananmen Gate, Mao proclaimed the People's Republic in 1949. Twice an Olympic host, it is today one of the largest and most powerful cities in the world.",
  srcDefault: 'britannica-beijing',
  eras: [
    { id: 'early', label: 'Ji to Liao', from: -1045, to: 1153, color: C },
    { id: 'jin-yuan', label: 'Zhongdu & Dadu', from: 1153, to: 1368, color: C2 },
    { id: 'ming', label: 'Ming', from: 1368, to: 1644, color: C3 },
    { id: 'qing', label: 'Qing', from: 1644, to: 1912, color: C4 },
    { id: 'republic', label: 'Republic & War', from: 1912, to: 1949, color: C5 },
    { id: 'prc', label: "People's Republic", from: 1949, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-beijing': { title: 'Beijing — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Beijing', official: false },
    'unesco-439': { title: 'Imperial Palaces of the Ming and Qing (Forbidden City) — UNESCO', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/439/', official: true },
    'whe-china': { title: 'Ancient China — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/china/', official: false },
  },
  figures: [
    { label: 'Population', value: '≈21 million', note: 'Beijing Municipality; among the largest cities in the world.', sourceId: 'britannica-beijing' },
    { label: 'Capital since', value: '1271', note: 'As Mongol Dadu; renamed Beijing in 1403.', sourceId: 'whe-china' },
    { label: 'Setting', value: 'North China Plain', note: 'At its northern edge, near the mountains and the Great Wall.', sourceId: 'britannica-beijing' },
    { label: 'World Heritage', value: 'The Forbidden City (1987)', note: 'The largest surviving palace complex on Earth.', sourceId: 'unesco-439' },
    { label: 'Seat of', value: 'Ming, Qing & modern China', note: 'The imperial and then national capital.', sourceId: 'britannica-beijing' },
  ],
  places: [
    { id: 'forbiddencity', name: 'The Forbidden City', lat: 39.9163, lon: 116.3972, note: 'The vast imperial palace of the Ming and Qing.' },
    { id: 'tiananmen', name: 'Tiananmen Square', lat: 39.9055, lon: 116.3976, note: 'The great square before the palace, stage of modern China.' },
    { id: 'templeheaven', name: 'Temple of Heaven', lat: 39.8822, lon: 116.4066, note: 'The ritual complex where emperors prayed for good harvests.' },
    { id: 'summerpalace', name: 'The Summer Palace', lat: 39.9999, lon: 116.2755, note: 'The Qing pleasure gardens northwest of the city.' },
  ],
  ev: [
    { y: -1045, yd: 'c. 1045 BC', t: 'The town of Ji', b: 'A walled town called Ji, capital of the state of Yan, stands near modern Beijing.', s: 'whe-china', pv: true, g: 'origins' },
    { y: 938, yd: 'AD 938', t: 'A Liao capital', b: 'The Khitan Liao make the city one of their secondary capitals, Nanjing.', g: 'politics' },
    { y: 1153, t: 'Jin Zhongdu', b: 'The Jurchen Jin make the city their central capital, Zhongdu.', pv: true, g: 'politics' },
    { y: 1215, t: 'Genghis Khan sacks it', b: 'Mongol armies destroy Zhongdu.', g: 'conflict' },
    { y: 1271, t: 'Kublai’s Dadu', b: 'Kublai Khan builds a grand new capital, Dadu, seat of the Yuan dynasty.', p: 'forbiddencity', pv: true, g: 'politics' },
    { y: 1275, t: 'Marco Polo', b: 'The Venetian traveller describes the splendour of Kublai Khan’s capital.', g: 'culture' },
    { y: 1368, t: 'The Ming take the city', b: 'The Ming overthrow the Mongols and rename the city Beiping.', g: 'politics' },
    { y: 1403, t: 'Renamed Beijing', b: 'The Yongle Emperor makes it his capital and names it Beijing — “northern capital.”', pv: true, g: 'politics' },
    { y: 1420, t: 'The Forbidden City', b: 'Yongle completes the vast palace complex at the heart of the city.', p: 'forbiddencity', pv: true, g: 'culture' },
    { y: 1421, t: 'The Temple of Heaven', b: 'The great ritual complex is built for the emperor’s sacrifices.', p: 'templeheaven', g: 'religion' },
    { y: 1553, t: 'The outer wall', b: 'A new southern wall encloses the growing city.', g: 'growth' },
    { y: 1644, t: 'The Qing conquest', b: 'The Manchu Qing seize Beijing as the Ming dynasty falls.', pv: true, g: 'conflict' },
    { y: 1750, t: 'The Summer Palace', b: 'The Qing build lavish gardens and palaces northwest of the city.', p: 'summerpalace', g: 'culture' },
    { y: 1860, t: 'The Old Summer Palace burned', b: 'British and French troops loot and burn the Yuanmingyuan during the Second Opium War.', p: 'summerpalace', pv: true, g: 'conflict' },
    { y: 1900, t: 'The Boxer siege', b: 'The foreign legations are besieged in the Boxer Rebellion; an eight-nation army then sacks the city.', g: 'conflict' },
    { y: 1912, t: 'The last emperor abdicates', b: 'The Qing dynasty ends; the boy emperor Puyi abdicates in the Forbidden City.', p: 'forbiddencity', pv: true, g: 'politics' },
    { y: 1919, t: 'The May Fourth Movement', b: 'Student protests in Beijing launch a new nationalist and cultural movement.', p: 'tiananmen', g: 'politics' },
    { y: 1937, t: 'Japanese occupation', b: 'Japan seizes Beijing at the start of the wider war in China.', g: 'conflict' },
    { y: 1949, t: 'The People’s Republic', b: 'Mao Zedong proclaims the People’s Republic of China from Tiananmen Gate.', p: 'tiananmen', pv: true, g: 'politics' },
    { y: 1958, t: 'Remaking the centre', b: 'The old city walls come down and Tiananmen Square is vastly enlarged.', p: 'tiananmen', g: 'growth' },
    { y: 1966, t: 'The Cultural Revolution', b: 'Mao launches the Cultural Revolution; Red Guards rally in Beijing.', g: 'politics' },
    { y: 1976, t: 'Mao dies', b: 'Chairman Mao dies; his mausoleum is built on Tiananmen Square.', p: 'tiananmen', g: 'politics' },
    { y: 1989, t: 'Tiananmen', b: 'Pro-democracy protests centred on Tiananmen Square are suppressed.', p: 'tiananmen', pv: true, g: 'conflict' },
    { y: 2008, t: 'The Summer Olympics', b: 'Beijing hosts the Summer Games, announcing a rising China to the world.', g: 'culture' },
    { y: 2022, t: 'The Winter Olympics', b: 'Beijing becomes the first city to host both the Summer and Winter Games.', g: 'culture' },
  ],
  families: [
    { id: 'yuan', name: 'The Yuan (Mongol) dynasty', community: 'Mongol emperors', span: '1271–1368', industries: ['Empire'], legacy: 'Dadu, the first imperial capital here', era: 'jin-yuan', sourceId: 'whe-china', place: 'forbiddencity', summary: 'Kublai Khan built Dadu as the capital of a Mongol empire that spanned Asia.' },
    { id: 'ming', name: 'The Ming dynasty', community: 'Chinese imperial house', span: '1368–1644', industries: ['Empire', 'Building'], legacy: 'The Forbidden City and Temple of Heaven', era: 'ming', sourceId: 'britannica-beijing', place: 'forbiddencity', summary: 'The Ming made Beijing the capital and built its greatest monuments.' },
    { id: 'qing', name: 'The Qing dynasty', community: 'Manchu emperors', span: '1644–1912', industries: ['Empire'], legacy: 'A vast empire ruled from the Forbidden City', era: 'qing', sourceId: 'britannica-beijing', place: 'summerpalace', summary: 'China’s last dynasty ruled a vast empire from Beijing until 1912.' },
  ],
},

/* ===================== DELHI ===================== */
{
  id: 'delhi', name: 'Delhi', country: 'India', geonameId: 1273294,
  centre: [77.2315, 28.652], bbox: [77.10, 28.50, 77.36, 28.75],
  formerName: null, renamed: null, nameLocal: 'दिल्ली', coverage: 'c. 1400 BC – 2010',
  summary: "Delhi is really many cities layered on one plain by the Yamuna — said to have been founded and destroyed seven times. Legend makes it the Pandavas' Indraprastha; history brings the Rajputs, then the Delhi Sultanate whose Qutb Minar still towers, then the Mughals, whose Shah Jahan built the Red Fort and the Jama Masjid. Sacked by Timur and Nadir Shah, centre of the 1857 rebellion, it became the capital of British India in 1911 and of independent India in 1947 — today one of the largest urban areas on Earth.",
  srcDefault: 'britannica-delhi',
  eras: [
    { id: 'early', label: 'Indraprastha to Rajput', from: -1400, to: 1206, color: C },
    { id: 'sultanate', label: 'Delhi Sultanate', from: 1206, to: 1526, color: C2 },
    { id: 'mughal', label: 'Mughal', from: 1526, to: 1739, color: C3 },
    { id: 'decline', label: 'Decline & Company', from: 1739, to: 1911, color: C4 },
    { id: 'raj', label: 'Imperial Capital', from: 1911, to: 1947, color: C5 },
    { id: 'modern', label: 'Republic', from: 1947, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-delhi': { title: 'Delhi — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Delhi', official: false },
    'asi': { title: 'Archaeological Survey of India', publisher: 'Archaeological Survey of India, Govt. of India', url: 'https://asi.nic.in/', official: true },
    'whe-india': { title: 'Ancient India — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/india/', official: false },
  },
  figures: [
    { label: 'Population', value: '≈11 million', note: 'Delhi proper; ≈32 million in the National Capital Territory and its metro — among the largest on Earth.', sourceId: 'britannica-delhi' },
    { label: 'Capital since', value: '1911', note: 'When the British moved India’s capital here; a Mughal capital 1638–1857.', sourceId: 'britannica-delhi' },
    { label: 'Setting', value: 'On the Yamuna', note: 'On the plains of northern India.', sourceId: 'britannica-delhi' },
    { label: 'World Heritage', value: '3 sites', note: 'The Qutb Minar, the Red Fort and Humayun’s Tomb.', sourceId: 'asi' },
    { label: 'Built', value: 'Seven times', note: 'Delhi is traditionally said to have been founded and rebuilt seven times.', sourceId: 'whe-india' },
  ],
  places: [
    { id: 'qutbminar', name: 'Qutb Minar', lat: 28.5245, lon: 77.1855, note: 'The soaring victory tower begun by the first sultan of Delhi.' },
    { id: 'redfort', name: 'The Red Fort', lat: 28.6562, lon: 77.2410, note: 'Shah Jahan’s Mughal citadel, heart of Shahjahanabad.' },
    { id: 'humayuntomb', name: "Humayun's Tomb", lat: 28.5933, lon: 77.2507, note: 'The garden-tomb that inspired the Taj Mahal.' },
    { id: 'jamamasjid', name: 'Jama Masjid', lat: 28.6507, lon: 77.2334, note: 'Shah Jahan’s great congregational mosque.' },
    { id: 'indiagate', name: 'India Gate / New Delhi', lat: 28.6129, lon: 77.2295, note: 'The ceremonial heart of Lutyens’ New Delhi.' },
    { id: 'rajghat', name: 'Raj Ghat', lat: 28.6406, lon: 77.2495, note: 'The riverside memorial where Gandhi was cremated.' },
  ],
  ev: [
    { y: -1400, yd: 'c. 1400 BC', t: 'Indraprastha', b: 'Legend places the Pandavas’ city of Indraprastha here, in the epic Mahabharata.', s: 'whe-india', pv: true, g: 'origins' },
    { y: 736, yd: 'AD 736', t: 'Tomara Dhillika', b: 'The Tomara Rajputs found a town, Dhillika, an ancestor of the name Delhi.', s: 'whe-india', g: 'origins' },
    { y: 1052, t: 'The Lal Kot', b: 'The Tomaras and then the Chauhans build the first of Delhi’s fortified cities.', g: 'growth' },
    { y: 1192, t: 'The Ghurid conquest', b: 'Muhammad of Ghor’s victory opens northern India to Muslim rule from Delhi.', g: 'conflict' },
    { y: 1199, t: 'The Qutb Minar', b: 'Qutb al-Din Aibak begins the towering Qutb Minar, victory tower of a new order.', p: 'qutbminar', g: 'culture' },
    { y: 1206, t: 'The Delhi Sultanate', b: 'Qutb al-Din Aibak founds the Sultanate — the first great Muslim empire of India.', p: 'qutbminar', pv: true, g: 'politics' },
    { y: 1298, t: 'The Khalji sultans', b: 'Alauddin Khalji repels repeated Mongol invasions and expands across India.', g: 'conflict' },
    { y: 1327, t: 'Tughlaq’s failed move', b: 'Muhammad bin Tughlaq forces Delhi’s people to march to a new southern capital, then back again.', g: 'politics' },
    { y: 1398, t: 'Timur sacks Delhi', b: 'Timur (Tamerlane) storms Delhi and massacres its people.', g: 'conflict' },
    { y: 1526, t: 'Babur founds the Mughals', b: 'Babur defeats the last sultan at Panipat and founds the Mughal Empire.', pv: true, g: 'conflict' },
    { y: 1565, t: "Humayun's Tomb", b: 'The great garden-tomb of the emperor Humayun is built, forerunner of the Taj.', p: 'humayuntomb', g: 'culture' },
    { y: 1638, t: 'Shah Jahan’s new city', b: 'Shah Jahan moves the Mughal capital to Delhi and builds Shahjahanabad.', pv: true, g: 'growth' },
    { y: 1648, t: 'The Red Fort and Jama Masjid', b: 'His Red Fort and great congregational mosque are completed.', p: 'redfort', g: 'culture' },
    { y: 1739, t: 'Nadir Shah’s sack', b: 'The Persian Nadir Shah plunders Delhi and carries off the Peacock Throne.', pv: true, g: 'conflict' },
    { y: 1803, t: 'The British take Delhi', b: 'The East India Company seizes the city, keeping a powerless Mughal emperor on the throne.', g: 'politics' },
    { y: 1857, t: 'The Great Rebellion', b: 'Delhi is the centre of the 1857 uprising; its recapture ends Mughal rule for good.', p: 'redfort', pv: true, g: 'conflict' },
    { y: 1911, t: 'Capital of the Raj', b: 'Britain moves the capital of India from Calcutta to Delhi.', pv: true, g: 'politics' },
    { y: 1931, t: 'New Delhi inaugurated', b: 'Edwin Lutyens’ grand imperial capital, New Delhi, is formally opened.', p: 'indiagate', g: 'growth' },
    { y: 1947, t: 'Independence and Partition', b: 'India wins independence; Partition brings a flood of refugees to Delhi.', pv: true, g: 'politics' },
    { y: 1948, t: 'Gandhi assassinated', b: 'Mahatma Gandhi is shot dead in Delhi and cremated at Raj Ghat.', p: 'rajghat', g: 'conflict' },
    { y: 1984, t: 'The anti-Sikh riots', b: 'The assassination of Indira Gandhi triggers deadly riots across the capital.', g: 'conflict' },
    { y: 2010, t: 'The Commonwealth Games', b: 'Delhi hosts the Games amid rapid, sprawling growth.', g: 'culture' },
  ],
  families: [
    { id: 'sultanate-dyn', name: 'The Delhi Sultans', community: 'Turkic & Afghan dynasties', span: '1206–1526', industries: ['Empire', 'War'], legacy: 'The Qutb complex and Muslim rule in India', era: 'sultanate', sourceId: 'britannica-delhi', place: 'qutbminar', summary: 'Five dynasties — Mamluk, Khalji, Tughlaq, Sayyid and Lodi — ruled north India from Delhi and built its first great monuments.' },
    { id: 'mughals-delhi', name: 'The Mughals', community: 'Imperial dynasty', span: '1526–1857', industries: ['Empire', 'Architecture'], legacy: 'The Red Fort, Jama Masjid and Shahjahanabad', era: 'mughal', sourceId: 'britannica-delhi', place: 'redfort', summary: 'Shah Jahan made Delhi his capital and built the Red Fort and the Jama Masjid; the last emperor fell in 1857.' },
    { id: 'british-raj', name: 'The British Raj', community: 'Colonial rulers', span: '1803–1947', industries: ['Governance'], legacy: 'Lutyens’ New Delhi', era: 'raj', sourceId: 'britannica-delhi', place: 'indiagate', summary: 'The British built New Delhi as the monumental capital of their Indian empire.' },
  ],
},

/* ===================== BAGHDAD ===================== */
{
  id: 'baghdad', name: 'Baghdad', country: 'Iraq', geonameId: 98182,
  centre: [44.4009, 33.3406], bbox: [44.28, 33.24, 44.52, 33.44],
  formerName: null, renamed: null, nameLocal: 'بغداد', coverage: '762 – 2003',
  summary: "Founded in 762 by the caliph al-Mansur as a perfectly round 'City of Peace', Baghdad became the capital of the Abbasid caliphate and, for a time, the largest and most learned city on Earth — the Baghdad of Harun al-Rashid, the House of Wisdom and the Thousand and One Nights. The Mongols ended that golden age in 1258. Ottoman for centuries, it became the capital of Iraq in 1921 and the stage, within living memory, for revolution, dictatorship and war. It still stands on the Tigris that made it.",
  srcDefault: 'britannica-baghdad',
  eras: [
    { id: 'abbasid-golden', label: 'Abbasid Golden Age', from: 762, to: 1055, color: C },
    { id: 'seljuk', label: 'Seljuk & Late Abbasid', from: 1055, to: 1258, color: C2 },
    { id: 'mongol', label: 'Mongol & Turkmen', from: 1258, to: 1534, color: C3 },
    { id: 'ottoman', label: 'Ottoman', from: 1534, to: 1917, color: C4 },
    { id: 'modern-iraq', label: 'Modern Iraq', from: 1917, to: 1968, color: C5 },
    { id: 'contemporary', label: 'Contemporary', from: 1968, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-baghdad': { title: 'Baghdad — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Baghdad', official: false },
    'whe-baghdad': { title: 'Baghdad — World History Encyclopedia', publisher: 'World History Encyclopedia', url: 'https://www.worldhistory.org/Baghdad/', official: false },
  },
  figures: [
    { label: 'Population', value: '≈7 million', note: 'Greater Baghdad; the largest city in Iraq.', sourceId: 'britannica-baghdad' },
    { label: 'Founded', value: 'AD 762', note: 'By the Abbasid caliph al-Mansur as the round “City of Peace.”', sourceId: 'whe-baghdad' },
    { label: 'Setting', value: 'On the Tigris', note: 'In the Mesopotamian plain of central Iraq.', sourceId: 'britannica-baghdad' },
    { label: 'Golden Age', value: '8th–9th century', note: 'The world’s largest city and its greatest centre of learning.', sourceId: 'whe-baghdad' },
    { label: 'Known for', value: 'The House of Wisdom', note: 'And the tales of the Thousand and One Nights.', sourceId: 'whe-baghdad' },
  ],
  places: [
    { id: 'roundcity', name: 'The Round City', lat: 33.3550, lon: 44.3700, note: 'Al-Mansur’s perfectly circular “City of Peace,” long since vanished.' },
    { id: 'mustansiriya', name: 'Mustansiriya', lat: 33.3392, lon: 44.3861, note: 'One of the oldest surviving universities in the world.' },
    { id: 'tigris-banks', name: 'The Tigris', lat: 33.3406, lon: 44.4009, note: 'The river along which Baghdad was built and burned.' },
    { id: 'tahrir-baghdad', name: 'Tahrir Square', lat: 33.3152, lon: 44.4236, note: 'The civic square of the modern city.' },
  ],
  ev: [
    { y: 762, t: 'Al-Mansur founds Baghdad', b: 'The Abbasid caliph al-Mansur builds the round “City of Peace” on the Tigris.', p: 'roundcity', pv: true, g: 'origins' },
    { y: 786, t: 'Harun al-Rashid', b: 'Under Harun al-Rashid, Baghdad becomes the fabled city of the Thousand and One Nights.', s: 'whe-baghdad', pv: true, g: 'culture' },
    { y: 830, t: 'The House of Wisdom', b: 'Caliph al-Ma’mun makes Baghdad the world’s centre of learning and translation.', s: 'whe-baghdad', p: 'mustansiriya', g: 'culture' },
    { y: 836, t: 'The court moves to Samarra', b: 'The caliphs briefly shift the capital upriver to Samarra.', g: 'politics' },
    { y: 892, t: 'The caliphs return', b: 'Baghdad resumes as the Abbasid capital and remains the largest city in the world.', g: 'growth' },
    { y: 945, t: 'The Buyids take power', b: 'Persian Buyid emirs seize real power, keeping the caliph as a figurehead.', g: 'politics' },
    { y: 1055, t: 'The Seljuk Turks', b: 'Seljuk sultans enter Baghdad and rule in the caliph’s name.', pv: true, g: 'politics' },
    { y: 1227, t: 'The Mustansiriya', b: 'One of the world’s first true universities is founded in Baghdad.', p: 'mustansiriya', g: 'culture' },
    { y: 1258, t: 'The Mongol sack', b: 'Hulagu Khan destroys Baghdad and kills the last Abbasid caliph — the end of the golden age.', p: 'tigris-banks', pv: true, g: 'conflict' },
    { y: 1401, t: 'Timur’s massacre', b: 'Timur sacks Baghdad and, by report, builds towers from the skulls of the dead.', g: 'conflict' },
    { y: 1534, t: 'The Ottomans', b: 'Süleyman the Magnificent takes Baghdad for the Ottoman Empire.', pv: true, g: 'conflict' },
    { y: 1623, t: 'A Safavid interlude', b: 'Persia’s Safavids seize Baghdad before the Ottomans retake it.', g: 'conflict' },
    { y: 1638, t: 'Ottoman reconquest', b: 'Murad IV storms Baghdad; it stays Ottoman for nearly three centuries.', g: 'conflict' },
    { y: 1869, t: 'Midhat Pasha reforms', b: 'A reforming governor begins to modernise the city.', g: 'growth' },
    { y: 1917, t: 'The British take Baghdad', b: 'British forces capture Baghdad from the Ottomans in the First World War.', pv: true, g: 'conflict' },
    { y: 1921, t: 'Capital of Iraq', b: 'Baghdad becomes the capital of the new Kingdom of Iraq under King Faisal I.', g: 'politics' },
    { y: 1932, t: 'Independence', b: 'Iraq gains independence, with Baghdad as its capital.', g: 'politics' },
    { y: 1958, t: 'The monarchy falls', b: 'A revolution overthrows the monarchy and Iraq becomes a republic.', g: 'politics' },
    { y: 1968, t: 'The Ba’ath seize power', b: 'A coup brings the Ba’ath Party — and eventually Saddam Hussein — to power.', pv: true, g: 'politics' },
    { y: 1979, t: 'Saddam takes control', b: 'Saddam Hussein becomes president, ruling Iraq from Baghdad.', g: 'politics' },
    { y: 1991, t: 'The Gulf War', b: 'US-led bombing strikes Baghdad after Iraq’s invasion of Kuwait.', g: 'conflict' },
    { y: 2003, t: 'The US invasion', b: 'American forces take Baghdad and Saddam’s statue is toppled.', p: 'tahrir-baghdad', pv: true, g: 'conflict' },
    { y: 2007, t: 'Sectarian war', b: 'Baghdad is torn by sectarian violence at the height of the insurgency.', g: 'conflict' },
  ],
  families: [
    { id: 'abbasids', name: 'The Abbasid caliphs', community: 'Founders & rulers', span: '762–1258', industries: ['Caliphate', 'Learning'], legacy: 'Baghdad and its golden age', era: 'abbasid-golden', sourceId: 'whe-baghdad', place: 'roundcity', summary: 'The dynasty that built Baghdad and made it the heart of an Islamic golden age, until the Mongols killed the last caliph.' },
    { id: 'barmakids', name: 'The Barmakids', community: 'Vizier dynasty', span: '8th century', industries: ['Administration', 'Patronage'], legacy: 'The learned court of Harun al-Rashid', era: 'abbasid-golden', sourceId: 'whe-baghdad', summary: 'A family of viziers who ran the empire and patronised its learning under Harun al-Rashid.' },
    { id: 'hashemites', name: 'The Hashemites', community: 'Kings of Iraq', span: '1921–1958', industries: ['Monarchy'], legacy: 'The modern Iraqi state', era: 'modern-iraq', sourceId: 'britannica-baghdad', summary: 'The dynasty installed by Britain to rule the new Iraqi state from Baghdad.' },
  ],
},

/* ===================== MOSCOW ===================== */
{
  id: 'moscow', name: 'Moscow', country: 'Russia', geonameId: 524901,
  centre: [37.6178, 55.752], bbox: [37.45, 55.66, 37.80, 55.84],
  formerName: null, renamed: null, nameLocal: 'Москва', coverage: '1147 – 1991',
  summary: "First mentioned in 1147, Moscow rose from a small fort on the Moskva River to the heart of Russia. Its princes gathered power under Mongol overlordship, then threw it off; Ivan the Terrible was crowned the first tsar here in 1547 beneath the new domes of St Basil's. Peter the Great moved the capital to St Petersburg in 1712, but the Bolsheviks brought it back in 1918, and from the Kremlin Lenin and Stalin ruled the Soviet Union. Burned by Napoleon, besieged by Hitler, it endures as Europe's largest city.",
  srcDefault: 'britannica-moscow',
  eras: [
    { id: 'founding', label: 'Founding', from: 1147, to: 1263, color: C },
    { id: 'grand-duchy', label: 'Grand Duchy', from: 1263, to: 1547, color: C2 },
    { id: 'tsardom', label: 'Tsardom', from: 1547, to: 1712, color: C3 },
    { id: 'imperial', label: 'Imperial (second city)', from: 1712, to: 1917, color: C4 },
    { id: 'soviet', label: 'Soviet', from: 1917, to: 1991, color: C5 },
    { id: 'modern', label: 'Modern', from: 1991, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-moscow': { title: 'Moscow — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/Moscow', official: false },
    'unesco-545': { title: 'Kremlin and Red Square, Moscow — UNESCO', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/545/', official: true },
    'mosru': { title: 'Moscow city government — official portal', publisher: 'Government of Moscow', url: 'https://www.mos.ru/en/', official: true },
  },
  figures: [
    { label: 'Population', value: '≈12.6 million', note: 'Moscow city; the most populous city in Europe.', sourceId: 'mosru' },
    { label: 'First mentioned', value: '1147', note: 'It grew from a small fort into the capital of Russia.', sourceId: 'britannica-moscow' },
    { label: 'Setting', value: 'On the Moskva River', note: 'In the forests and plains of western Russia.', sourceId: 'britannica-moscow' },
    { label: 'World Heritage', value: 'Kremlin & Red Square (1990)', note: 'The fortified heart of the city and state.', sourceId: 'unesco-545' },
    { label: 'Capital', value: '1263–1712; 1918–', note: 'St Petersburg was the capital in between.', sourceId: 'britannica-moscow' },
  ],
  places: [
    { id: 'kremlin', name: 'The Kremlin', lat: 55.7520, lon: 37.6175, note: 'The fortified seat of princely, tsarist and Soviet power.' },
    { id: 'redsquare', name: 'Red Square', lat: 55.7539, lon: 37.6208, note: 'The great square beside the Kremlin.' },
    { id: 'stbasil', name: "St Basil's Cathedral", lat: 55.7525, lon: 37.6231, note: 'Ivan the Terrible’s fantastical domed church.' },
    { id: 'bolshoi', name: 'The Bolshoi Theatre', lat: 55.7602, lon: 37.6186, note: 'The home of Russian ballet and opera.' },
  ],
  ev: [
    { y: 1147, t: 'First mention', b: 'Moscow is first recorded when Prince Yuri Dolgoruky invites an ally to feast here.', p: 'kremlin', pv: true, g: 'origins' },
    { y: 1237, t: 'The Mongols burn Moscow', b: 'The Mongol invasion destroys the small wooden town.', g: 'conflict' },
    { y: 1263, t: 'A princely seat', b: 'Moscow becomes the seat of a minor branch of the Rurikid princes.', g: 'politics' },
    { y: 1327, t: 'Ivan Kalita', b: 'Ivan I gathers wealth and the seat of the Orthodox Church, raising Moscow’s power.', p: 'kremlin', g: 'politics' },
    { y: 1380, t: 'Kulikovo', b: 'Dmitry Donskoy of Moscow beats a Mongol army at Kulikovo.', pv: true, g: 'conflict' },
    { y: 1480, t: 'The Mongol yoke ends', b: 'Ivan III ends Mongol overlordship and builds the brick Kremlin that still stands.', p: 'kremlin', pv: true, g: 'politics' },
    { y: 1547, t: 'Ivan the Terrible, Tsar', b: 'Ivan IV is crowned the first Tsar of all Russia in Moscow.', pv: true, g: 'politics' },
    { y: 1561, t: "St Basil's Cathedral", b: 'Ivan builds the fantastical St Basil’s on Red Square.', p: 'stbasil', g: 'culture' },
    { y: 1571, t: 'The Tatars burn Moscow', b: 'A Crimean Tatar raid burns almost the entire city.', g: 'conflict' },
    { y: 1612, t: 'The Time of Troubles', b: 'Muscovites expel a Polish garrison from the Kremlin, ending years of chaos.', p: 'kremlin', g: 'conflict' },
    { y: 1712, t: 'The capital moves away', b: 'Peter the Great moves the capital to St Petersburg; Moscow becomes the second city.', pv: true, g: 'politics' },
    { y: 1755, t: 'Moscow University', b: 'Russia’s first university is founded in Moscow.', g: 'culture' },
    { y: 1812, t: 'Napoleon and the great fire', b: 'Napoleon takes Moscow, but the city burns and his army retreats to ruin.', pv: true, g: 'conflict' },
    { y: 1851, t: 'The railway to St Petersburg', b: 'The two capitals are linked by rail.', g: 'growth' },
    { y: 1905, t: 'Revolution', b: 'An armed uprising in Moscow is crushed in the revolution of 1905.', g: 'conflict' },
    { y: 1917, t: 'The Bolsheviks', b: 'Revolution sweeps Russia; fierce fighting takes the Kremlin.', pv: true, g: 'politics' },
    { y: 1918, t: 'Capital again', b: 'Lenin moves the capital back to Moscow; the Kremlin becomes the seat of Soviet power.', p: 'kremlin', pv: true, g: 'politics' },
    { y: 1935, t: 'The Metro opens', b: 'Moscow’s palatial underground railway opens.', g: 'growth' },
    { y: 1941, t: 'The Battle of Moscow', b: 'The Red Army halts the Nazi advance at the very gates of the city.', pv: true, g: 'conflict' },
    { y: 1953, t: 'Stalin dies', b: 'The dictator dies; his long rule from the Kremlin ends.', g: 'politics' },
    { y: 1980, t: 'The Moscow Olympics', b: 'The USSR hosts the Summer Games, boycotted by much of the West.', g: 'culture' },
    { y: 1991, t: 'The Soviet collapse', b: 'A failed coup in Moscow hastens the end of the Soviet Union.', p: 'redsquare', pv: true, g: 'politics' },
    { y: 1993, t: 'The constitutional crisis', b: 'Tanks shell the Russian parliament in a violent political standoff.', g: 'conflict' },
  ],
  families: [
    { id: 'daniilovich', name: 'The Daniilovich princes', community: 'Grand princes of Moscow', span: '1263–1598', industries: ['Monarchy', 'Church'], legacy: 'Moscow as the head of Russia', era: 'grand-duchy', sourceId: 'britannica-moscow', place: 'kremlin', summary: 'The Rurikid line that raised Moscow from a small town to the head of Russia and threw off Mongol rule.' },
    { id: 'romanovs', name: 'The House of Romanov', community: 'Russian dynasty', span: '1613–1917', industries: ['Monarchy'], legacy: 'Three centuries of Russian empire', era: 'tsardom', sourceId: 'britannica-moscow', place: 'kremlin', summary: 'The tsars who ruled Russia for three centuries, crowned in Moscow though their capital lay at St Petersburg.' },
    { id: 'soviet', name: 'The Soviet leadership', community: 'Communist rulers', span: '1918–1991', industries: ['Governance', 'Ideology'], legacy: 'The USSR, ruled from the Kremlin', era: 'soviet', sourceId: 'britannica-moscow', place: 'kremlin', summary: 'Lenin and Stalin ruled the Soviet Union from the Kremlin after making Moscow the capital once more.' },
  ],
},

/* ===================== NEW YORK CITY ===================== */
{
  id: 'new-york-city', name: 'New York City', country: 'United States', geonameId: 5128581,
  centre: [-74.006, 40.7143], bbox: [-74.10, 40.55, -73.85, 40.85],
  formerName: 'New Amsterdam', renamed: '1664', nameLocal: null, coverage: '1609 – 2012',
  summary: "New York began as New Amsterdam, a Dutch fur-trading post founded on Manhattan in 1624 and seized by the English forty years later. The Erie Canal made it the nation's greatest port; the Statue of Liberty and Ellis Island made it the gateway for millions of immigrants; Wall Street made it the capital of American finance. Consolidated into five boroughs in 1898 and home to the United Nations since 1945, it endured the Crash of 1929 and the attacks of September 11, 2001, and remains the largest and most influential city in the United States.",
  srcDefault: 'britannica-nyc',
  eras: [
    { id: 'dutch', label: 'New Amsterdam', from: 1609, to: 1664, color: C },
    { id: 'colonial', label: 'British New York', from: 1664, to: 1783, color: C2 },
    { id: 'early-republic', label: 'Early Republic', from: 1783, to: 1865, color: C3 },
    { id: 'gilded', label: 'Gilded Age & Immigration', from: 1865, to: 1929, color: C4 },
    { id: 'modern', label: 'Depression to Postwar', from: 1929, to: 1990, color: C5 },
    { id: 'contemporary', label: 'Contemporary', from: 1990, to: 2027, color: C6 },
  ],
  sources: {
    'britannica-nyc': { title: 'New York City — Encyclopædia Britannica', publisher: 'Encyclopædia Britannica', url: 'https://www.britannica.com/place/New-York-City', official: false },
    'unesco-307': { title: 'Statue of Liberty — UNESCO World Heritage List', publisher: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/307/', official: true },
    'nyc-gov': { title: 'The Official Website of the City of New York', publisher: 'City of New York', url: 'https://www.nyc.gov/', official: true },
  },
  figures: [
    { label: 'Population', value: '≈8.8 million', note: 'City proper; ≈20 million in the metropolitan area — the most populous US city.', sourceId: 'nyc-gov' },
    { label: 'Founded', value: '1624', note: 'As Dutch New Amsterdam; renamed New York in 1664.', sourceId: 'britannica-nyc' },
    { label: 'Setting', value: 'A great natural harbour', note: 'At the mouth of the Hudson River.', sourceId: 'britannica-nyc' },
    { label: 'World Heritage', value: 'Statue of Liberty (1984)', note: 'France’s gift in the harbour.', sourceId: 'unesco-307' },
    { label: 'Known for', value: 'Immigration & finance', note: 'Ellis Island and Wall Street.', sourceId: 'britannica-nyc' },
  ],
  places: [
    { id: 'wallstreet', name: 'Wall Street', lat: 40.7069, lon: -74.0113, note: 'Site of the Dutch wall and the world’s financial capital.' },
    { id: 'statueliberty', name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, note: 'France’s 1886 gift, welcoming immigrants to the harbour.' },
    { id: 'ellisisland', name: 'Ellis Island', lat: 40.6995, lon: -74.0396, note: 'The immigration station that processed millions of newcomers.' },
    { id: 'centralpark', name: 'Central Park', lat: 40.7829, lon: -73.9654, note: 'The vast green rectangle at Manhattan’s heart.' },
    { id: 'brooklynbridge', name: 'Brooklyn Bridge', lat: 40.7061, lon: -73.9969, note: 'The great 1883 suspension bridge over the East River.' },
    { id: 'worldtrade', name: 'World Trade Center', lat: 40.7115, lon: -74.0134, note: 'The towers destroyed on September 11, 2001, and the site rebuilt since.' },
  ],
  ev: [
    { y: 1609, t: 'Henry Hudson', b: 'Sailing for the Dutch, Henry Hudson explores the river that now bears his name.', pv: true, g: 'origins' },
    { y: 1624, t: 'New Amsterdam', b: 'The Dutch found a fur-trading post on the tip of Manhattan.', p: 'wallstreet', pv: true, g: 'origins' },
    { y: 1626, t: 'Manhattan “purchased”', b: 'Peter Minuit acquires Manhattan from the Lenape for a bundle of trade goods.', g: 'politics' },
    { y: 1653, t: 'The wall on Wall Street', b: 'The Dutch build a defensive wall along the line of today’s Wall Street.', p: 'wallstreet' },
    { y: 1664, t: 'The English take over', b: 'An English fleet seizes the colony and renames it New York.', pv: true, g: 'politics' },
    { y: 1776, t: 'Revolution and occupation', b: 'Washington loses the Battle of Brooklyn; the British hold New York through the Revolution.', p: 'brooklynbridge', g: 'conflict' },
    { y: 1785, t: 'Capital of the nation', b: 'New York briefly serves as the capital of the new United States.', g: 'politics' },
    { y: 1789, t: 'Washington inaugurated', b: 'George Washington is sworn in as the first president on Wall Street.', p: 'wallstreet', pv: true, g: 'politics' },
    { y: 1811, t: 'The grid', b: 'The Commissioners’ Plan lays out Manhattan’s famous rectangular street grid.', g: 'growth' },
    { y: 1825, t: 'The Erie Canal', b: 'The canal makes New York the gateway to the interior and the nation’s greatest port.', pv: true, g: 'growth' },
    { y: 1858, t: 'Central Park', b: 'Work begins on Central Park, a vast green space amid the exploding city.', p: 'centralpark', g: 'culture' },
    { y: 1863, t: 'The Draft Riots', b: 'Violent, racist anti-draft riots convulse the city during the Civil War.', g: 'conflict' },
    { y: 1883, t: 'The Brooklyn Bridge', b: 'The great suspension bridge finally links Manhattan and Brooklyn.', p: 'brooklynbridge', pv: true, g: 'growth' },
    { y: 1886, t: 'The Statue of Liberty', b: 'France’s colossal gift is dedicated in New York harbour.', p: 'statueliberty', pv: true, g: 'culture' },
    { y: 1892, t: 'Ellis Island opens', b: 'The immigration station begins processing millions of newcomers to America.', p: 'ellisisland', pv: true, g: 'growth' },
    { y: 1898, t: 'The five boroughs', b: 'New York consolidates into a single city of five boroughs.', g: 'politics' },
    { y: 1904, t: 'The subway', b: 'The first line of the New York City Subway opens.', s: 'nyc-gov', g: 'growth' },
    { y: 1929, t: 'The Wall Street Crash', b: 'The stock market collapses, beginning the Great Depression.', p: 'wallstreet', pv: true, g: 'politics' },
    { y: 1931, t: 'The Empire State Building', b: 'The world’s tallest building opens in the depths of the Depression.', g: 'culture' },
    { y: 1945, t: 'Capital of the world', b: 'The new United Nations chooses New York for its headquarters.', g: 'politics' },
    { y: 1969, t: 'Stonewall', b: 'A police raid at the Stonewall Inn sparks the modern gay-rights movement.', g: 'culture' },
    { y: 1977, t: 'Blackout and crisis', b: 'A blackout, a fiscal crisis and rising crime mark the city’s hardest years.', g: 'conflict' },
    { y: 1990, t: 'Renewal', b: 'Crime falls sharply and the city rebounds through the 1990s.', s: 'nyc-gov', g: 'growth' },
    { y: 2001, t: 'September 11', b: 'Hijacked planes destroy the World Trade Center, killing nearly 3,000 people.', p: 'worldtrade', pv: true, g: 'conflict' },
    { y: 2012, t: 'Hurricane Sandy', b: 'A superstorm floods much of the low-lying city.', g: 'disaster' },
  ],
  families: [
    { id: 'dutch-founders', name: 'The Dutch founders', community: 'New Amsterdam merchants', span: '1624–1664', industries: ['Trade'], legacy: 'The trading town that became New York', era: 'dutch', sourceId: 'britannica-nyc', place: 'wallstreet', summary: 'The Dutch West India Company men who founded the fur-trading town at the tip of Manhattan.' },
    { id: 'astors', name: 'The Astors', community: 'Fur & real-estate dynasty', span: 'from 1784', industries: ['Fur', 'Real estate'], legacy: 'America’s first great fortune', era: 'early-republic', sourceId: 'britannica-nyc', summary: 'John Jacob Astor built America’s first great fortune and shaped the growth of Manhattan property.' },
    { id: 'gilded', name: 'The Gilded Age dynasties', community: 'Vanderbilts, Rockefellers, Morgans', span: '1860s–1920s', industries: ['Railroads', 'Oil', 'Finance'], legacy: 'New York as the capital of American capitalism', era: 'gilded', sourceId: 'britannica-nyc', place: 'wallstreet', summary: 'The families whose railroads, oil and banks made New York the capital of American capitalism.' },
    { id: 'tammany', name: 'Tammany Hall', community: 'Political machine', span: '19th–20th century', industries: ['Politics'], legacy: 'A century of machine politics', era: 'gilded', sourceId: 'britannica-nyc', summary: 'The Democratic machine that ran the city, courting immigrants and mastering patronage.' },
  ],
},

];

/* ===================== BUILD ===================== */
function build(city) {
  const events = city.ev.map((e) => {
    const ev = {
      year: e.y,
      era: e.e || eraFor(city.eras, e.y),
      title: e.t,
      body: e.b,
      sourceId: e.s || city.srcDefault,
      tags: [e.g || 'history'],
    };
    if (e.yd) ev.yearDisplay = e.yd;
    if (e.p) ev.place = e.p;
    if (e.pv) ev.pivotal = true;
    return ev;
  }).sort((a, b) => a.year - b.year);

  const caveats = [PROVENANCE_CAVEAT, LEGEND_CAVEAT];
  if (city.caveat) caveats.push(city.caveat);

  const out = {
    id: city.id, name: city.name, formerName: city.formerName, nameLocal: city.nameLocal,
    country: city.country, geonameId: city.geonameId, centre: city.centre, bbox: city.bbox,
    renamed: city.renamed, summary: city.summary, figures: city.figures, eras: city.eras,
    events, places: city.places, sources: city.sources, caveats,
    dynasties: { note: city.familiesNote || `Dynasties and houses that shaped ${city.name}.`, list: city.families },
  };

  // Validate every cross-reference the city view will dereference.
  const eraIds = new Set(city.eras.map((e) => e.id));
  const srcIds = new Set(Object.keys(city.sources));
  const placeIds = new Set(city.places.map((p) => p.id));
  for (const ev of events) {
    if (!eraIds.has(ev.era)) throw new Error(`${city.id}: event ${ev.year} bad era ${ev.era}`);
    if (!srcIds.has(ev.sourceId)) throw new Error(`${city.id}: event ${ev.year} bad source ${ev.sourceId}`);
    if (ev.place && !placeIds.has(ev.place)) throw new Error(`${city.id}: event ${ev.year} bad place ${ev.place}`);
  }
  for (const f of city.families) {
    if (!eraIds.has(f.era)) throw new Error(`${city.id}: family ${f.id} bad era ${f.era}`);
    if (!srcIds.has(f.sourceId)) throw new Error(`${city.id}: family ${f.id} bad source ${f.sourceId}`);
    if (f.place && !placeIds.has(f.place)) throw new Error(`${city.id}: family ${f.id} bad place ${f.place}`);
  }
  for (const f of city.figures) {
    if (!srcIds.has(f.sourceId)) throw new Error(`${city.id}: figure "${f.label}" bad source ${f.sourceId}`);
  }
  return out;
}

const index = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
for (const city of CITIES) {
  const data = build(city);
  fs.writeFileSync(path.join(OUT, `${city.id}.json`), JSON.stringify(data, null, 2));
  index.cities[String(city.geonameId)] = {
    id: city.id, name: city.name, events: data.events.length,
    coverage: city.coverage, families: city.families.length, places: city.places.length,
  };
  console.log(`wrote ${city.id}.json — ${data.events.length} events, ${city.families.length} families, ${city.places.length} places`);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
console.log('index.json cities:', Object.keys(index.cities).length);

export { CITIES };
