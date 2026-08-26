/* cities.js — the dossiers (holographic-view edition).
 *
 * All prose is original writing. Facts are drawn from well-established public
 * record; links point to credible primary and reference sources. No copyrighted
 * text or images are reproduced — the visuals are the procedural hologram + CSS.
 *
 * Shape of a city:
 *   { id, name, native, flag, country, coords:[lat,lon], warm,
 *     tagline, accent, accent2,
 *     founded, populationLine,
 *     stats:[{k,v}],               // bottom HUD readout bar
 *     quickfacts:[{label,value}],
 *     landmarks:[{name,note}],     // labelled on the hologram
 *     sections:[{id,icon,title,html}],
 *     figures:[{name,dates,role,note}],
 *     families:[{name,role,text}],
 *     timeline:[{yr,text}],
 *     links:[{title,url,type}] }
 */

export const CITIES = [
  /* =================================================================== */
  /* MUMBAI                                                              */
  /* =================================================================== */
  {
    id: 'mumbai',
    name: 'Mumbai',
    native: 'मुंबई',
    flag: '🇮🇳',
    country: 'India',
    coords: [19.0760, 72.8777],
    warm: true,
    tagline: 'The city built from the sea — finance, film and seven joined islands.',
    accent: '#ff2d78', accent2: '#ffc75a',
    holo: {
      features: [
        { kind: 'coast', pts: [[-30,-70],[-24,-40],[-30,-8],[-34,22],[-30,56]] },
        { kind: 'coast', pts: [[22,-64],[18,-30],[24,0],[20,40],[24,64]] },
        { kind: 'avenue', name: 'Sea Link', pts: [[-17,8],[-8,-6],[-2,-22]] },
      ],
      districts: [
        { name: 'Fort & Colaba', x: -6, z: -56, r: 13, n: 30, hlo: 18, hhi: 52, kind: 'core' },
        { name: 'Lower Parel', x: -2, z: -22, r: 12, n: 26, hlo: 24, hhi: 60, kind: 'core' },
        { name: 'Bandra–Kurla', x: 7, z: 0, r: 11, n: 22, hlo: 18, hhi: 46, kind: 'core' },
        { name: 'Dharavi', x: -7, z: -8, r: 8, n: 44, hlo: 4, hhi: 9, kind: 'low' },
        { name: 'Bandra', x: -17, z: 8, r: 10, n: 22, hlo: 8, hhi: 26, kind: 'mid' },
        { name: 'Andheri', x: -2, z: 34, r: 16, n: 34, hlo: 8, hhi: 24, kind: 'mid' },
        { name: 'Sanjay Gandhi NP', x: -2, z: 64, r: 16, kind: 'green' },
      ],
      specials: [],
    },
    founded: 'Koli fishing settlements (ancient); modern city from the 17th c.',
    populationLine: '≈12.44 million (Greater Mumbai, 2011 Census); ≈21 million metro',
    stats: [
      { k: 'Founded', v: '17th-c. city' },
      { k: 'Metro pop.', v: '≈21 M' },
      { k: 'Elevation', v: '14 m' },
      { k: 'Area', v: '603 km²' },
      { k: 'Time zone', v: 'IST +5:30' },
      { k: 'Byname', v: 'City of Dreams' },
    ],
    quickfacts: [
      { label: 'Country', value: 'India (capital of Maharashtra)' },
      { label: 'Setting', value: 'Seven islands joined by reclamation, Arabian Sea' },
      { label: 'Founded', value: 'Koli communities; city shaped 1661 onward' },
      { label: 'Population', value: '≈12.44 M city · ≈21 M metro' },
      { label: 'Languages', value: 'Marathi (official), Hindi, English, Gujarati' },
      { label: 'Known for', value: 'Finance, Bollywood, the Gateway of India' },
    ],
    landmarks: [
      { name: 'Gateway of India', note: 'Basalt arch on the harbour, completed 1924 to mark a royal visit; ironically the point from which the last British troops departed in 1948.' },
      { name: 'Chhatrapati Shivaji Terminus', note: 'F. W. Stevens’ 1888 Victorian-Gothic railway cathedral; a UNESCO World Heritage Site and one of the busiest stations on Earth.' },
      { name: 'Taj Mahal Palace Hotel', note: 'Opened 1903 by Jamsetji Tata; legend says he built it after being refused entry to a European hotel. A target on 26/11, since restored.' },
      { name: 'Bandra–Worli Sea Link', note: 'A cable-stayed bridge (2009) sweeping across Mahim Bay — the modern skyline’s signature curve.' },
      { name: 'Elephanta Caves', note: 'Rock-cut Shaiva temples across the harbour (5th–6th c. AD), crowned by the colossal three-headed Trimurti Sadashiva.' },
    ],
    sections: [
      { id: 'overview', icon: '◍', title: 'Overview', html: `
        <p class="lede">Mumbai is the financial heart of India and one of the most densely populated places on Earth — a city assembled, quite literally, out of the sea. What began as a cluster of seven marshy islands worked by <strong>Koli</strong> fisherfolk became, through two centuries of land reclamation, a single tapering peninsula that now holds the Reserve Bank of India, the <strong>Bombay Stock Exchange</strong> (Asia’s oldest, founded 1875) and the Hindi film industry the world calls <strong>Bollywood</strong>.</p>
        <p>The city generates a strikingly large share of India’s income tax and corporate wealth from a footprint of barely 600 km². It is a place of extremes pressed together: the world’s most expensive private home (Antilia) rises a few kilometres from <strong>Dharavi</strong>, one of Asia’s largest informal settlements and a recycling economy in its own right.</p>
        <p>Its older name, <em>Bombay</em>, is usually traced to the Portuguese <em>Bom Bahia</em> (“good bay”); the modern name honours the goddess <strong>Mumbadevi</strong>, patron of the original Koli inhabitants. The official rename came in 1995.</p>` },
      { id: 'geography', icon: '⬡', title: 'Geography & setting', html: `
        <p>Mumbai sits on the Konkan coast of western India, a peninsula thrusting into the Arabian Sea. The seven original islands — Bombay, Colaba, Old Woman’s Island, Mahim, Mazagaon, Parel and Worli — were fused by projects such as the <strong>Hornby Vellard</strong> (begun 1784), which dammed the tidal breach at Worli and turned an archipelago into continuous land.</p>
        <p>The sheltered, deep-water harbour on the eastern side is the reason the city exists; the exposed western shore gives <strong>Marine Drive</strong> — the “Queen’s Necklace” of lights along Back Bay — Chowpatty beach and the monsoon surf. Between June and September the southwest monsoon dumps roughly 2,200 mm of rain, and the low, reclaimed ground floods with grim reliability.</p>
        <p>Astonishingly, the northern suburbs hold <strong>Sanjay Gandhi National Park</strong>, some 87 km² of protected tropical forest <em>inside</em> the municipal limits — a genuine wilderness with a metro line at its edge.</p>` },
      { id: 'founding', icon: '⌘', title: 'Founding & the making of a port', html: `
        <p>Human presence is ancient: the rock-cut <strong>Elephanta Caves</strong> hold monumental Shaiva sculpture of the 5th–6th century AD, and the islands passed through Maurya, Silhara and Gujarat-Sultanate hands. In <strong>1534</strong> the Sultan of Gujarat ceded them to <strong>Portugal</strong>, which named the settlement Bom Bahia and left the church of Nossa Senhora and place-names still on the map.</p>
        <p>In <strong>1661</strong> the islands went to the English Crown as part of the dowry of <strong>Catherine of Braganza</strong> on her marriage to Charles II. The Crown, unsure what to do with a marshy, malarial group of islets, leased them to the <strong>East India Company</strong> in 1668 for £10 a year in gold. Governor <strong>Gerald Aungier</strong> (1672–77) is often called the true founder of the city — he guaranteed religious freedom and courts, and actively recruited Parsi, Gujarati, Jewish and Armenian traders, seeding the mercantile diversity that still defines Mumbai.</p>` },
      { id: 'culture', icon: '❖', title: 'Culture & society', html: `
        <p>Mumbai is India’s great melting pot — Marathi in its civic bones, cosmopolitan in the street. Its signature festival is <strong>Ganesh Chaturthi</strong>, when clay idols, the giant <em>Lalbaugcha Raja</em> foremost, are paraded through the city and immersed in the sea over ten roaring days.</p>
        <p>Above all there is <strong>Hindi cinema</strong>: the industry’s birth is dated to Dadasaheb Phalke’s silent <em>Raja Harishchandra</em> (Bombay, 1913), and <strong>Film City</strong> opened in Goregaon in 1977. The city runs on its own rhythms — the <strong>dabbawalas</strong>, a lunchbox-delivery network operating since the 1890s with famously vanishing error rates; the lifeline of the suburban <strong>local trains</strong> carrying some 7.5 million riders a day; the <strong>Kala Ghoda Arts Festival</strong>; and the elastic street Hindi called <em>Bambaiya</em>.</p>` },
      { id: 'food', icon: '✦', title: 'Food & cuisine', html: `
        <p>Mumbai’s street food is a cuisine of its own. The <strong>vada pav</strong> — a spiced potato fritter in a soft bun with chutneys and fried chilli — is the city’s edible emblem, invented near Dadar station in the 1960s as cheap fuel for mill workers. Beside it: <strong>pav bhaji</strong> (griddled on huge iron tavas), <strong>bhel puri</strong>, <strong>sev puri</strong>, <strong>misal pav</strong> and the toasted <strong>Bombay sandwich</strong>.</p>
        <p>The <strong>Koli</strong> give the city its seafood — pomfret, prawns and the split-dried <em>bombil</em> (“Bombay duck”). The <strong>Parsi</strong> contribute <strong>dhansak</strong>, <em>berry pulao</em> and <em>sali boti</em>, still served at Britannia & Co. And the <strong>Irani cafés</strong> — legacy of Zoroastrian émigrés from Iran — gave Mumbai its enduring ritual of <em>bun maska</em> and cutting chai under slow ceiling fans.</p>` },
      { id: 'animals', icon: '✧', title: 'Animals & wildlife', html: `
        <p>Mumbai is extraordinary among megacities for the wildlife inside it. Sanjay Gandhi National Park shelters a resident population of wild <strong>leopards</strong> — among the highest urban leopard densities anywhere — living on the edges of dense neighbourhoods, alongside spotted deer, macaques and over 250 bird species.</p>
        <p>Each winter, tens of thousands of <strong>lesser and greater flamingos</strong> descend on the mudflats and salt pans of <strong>Sewri</strong> and Thane Creek, staining the industrial waterfront pink; the city has begun protecting the area as a flamingo sanctuary. The surviving <strong>mangroves</strong> are a legally protected fish nursery and storm buffer, and the harbour’s Elephanta Island keeps its own troops of monkeys.</p>` },
      { id: 'resources', icon: '◆', title: 'Natural resources & economy', html: `
        <p>Mumbai’s original wealth came from three natural gifts: a <strong>sheltered deep-water harbour</strong>, rich coastal <strong>fisheries</strong>, and the <strong>salt pans</strong> of its tidal flats. On these the British built a port that boomed when the <strong>American Civil War</strong> (1861–65) cut off US cotton and sent global demand surging to Bombay’s mills — a speculative frenzy that made and ruined fortunes overnight.</p>
        <p>The <strong>cotton textile mills</strong> of Girangaon (“village of mills”) drove the industrial city; as they closed from the 1980s, their vast plots became the glass towers of Lower Parel. Today Mumbai is a services and finance capital — banking, insurance, the stock and commodity exchanges, media, diamonds, and the twin ports of Mumbai and Jawaharlal Nehru (Nhava Sheva), India’s busiest container gateway.</p>` },
      { id: 'wars', icon: '⚔', title: 'Wars, disasters & attacks', html: `
        <p>As a Company and colonial stronghold, Bombay was shaped by the <strong>Anglo-Maratha Wars</strong> and the contest for western India. In the 20th century the harbour suffered the catastrophic <strong>1944 Bombay Docks explosion</strong>, when the ammunition ship <em>SS Fort Stikine</em> — carrying explosives, cotton and gold — detonated, killing hundreds, raining gold bars across the docks and sinking a dozen ships.</p>
        <p>Independent Mumbai has endured repeated terror: the communal <strong>riots of 1992–93</strong>; the coordinated <strong>1993 serial bombings</strong> (257 killed); the <strong>2006 suburban train bombings</strong> (about 209 killed in the evening rush); and the <strong>26 November 2008 attacks</strong>, when ten gunmen struck the Taj Mahal Palace, the Oberoi, Chhatrapati Shivaji Terminus, a Jewish centre and other sites across three days. The city’s stubborn return to normal after each is itself part of its self-image.</p>` },
      { id: 'religion', icon: '☾', title: 'Religion & belief', html: `
        <p>Mumbai is majority <strong>Hindu</strong> but profoundly plural. It holds one of India’s largest <strong>Muslim</strong> populations — the <strong>Haji Ali Dargah</strong> stands on an islet reached by a causeway that vanishes at high tide — significant <strong>Christian</strong> communities (Mount Mary’s Basilica in Bandra), <strong>Jains</strong>, and, vital far beyond their numbers, the <strong>Parsi Zoroastrians</strong>, whose fire temples and Towers of Silence on Malabar Hill remain part of the city. A small <strong>Baghdadi Jewish</strong> community left the blue Keneseth Eliyahoo and Magen David synagogues.</p>` },
      { id: 'language', icon: '⌥', title: 'Language', html: `
        <p><strong>Marathi</strong> is the official language of Maharashtra and Mumbai. Daily life runs on a churn of Marathi, <strong>Hindi</strong>, <strong>English</strong> and <strong>Gujarati</strong>, fused in the wisecracking <em>Bambaiya</em> Hindi of the streets, the trains and the movies — a dialect so distinct it has its own slang lexicon.</p>` },
    ],
    figures: [
      { name: 'Jamsetji Tata', dates: '1839–1904', role: 'Industrialist', note: 'Founder of the Tata group; built India’s first large steelworks and the Taj Mahal Palace Hotel.' },
      { name: 'B. R. Ambedkar', dates: '1891–1956', role: 'Jurist & reformer', note: 'Principal architect of India’s Constitution; studied and organised in Bombay.' },
      { name: 'Dhirubhai Ambani', dates: '1932–2002', role: 'Founder of Reliance', note: 'Built a textiles-to-petrochemicals empire and pioneered India’s equity culture.' },
      { name: 'Lata Mangeshkar', dates: '1929–2022', role: 'Playback singer', note: 'The defining voice of Hindi cinema for over half a century.' },
      { name: 'Sachin Tendulkar', dates: 'b. 1973', role: 'Cricketer', note: 'A son of the city and the most prolific run-scorer in the history of the game.' },
      { name: 'JRD Tata', dates: '1904–1993', role: 'Aviator & chairman', note: 'India’s first licensed pilot; founded the airline that became Air India.' },
    ],
    families: [
      { name: 'The Koli', role: 'Original inhabitants', text: 'The Koli fishing communities were the islands’ first known residents; the city’s name derives from their goddess Mumbadevi, and their koliwadas still cling to the shore between the towers.' },
      { name: 'The Tatas', role: 'Parsi industrial dynasty', text: 'From Jamsetji Tata (1868): textile mills, the Taj (1903), Tata Steel (1907), Tata Power, the Indian Institute of Science and India’s first airline. Still among the country’s largest business houses, unusually owned largely by charitable trusts.' },
      { name: 'The Wadias', role: 'Master shipbuilders', text: 'From 1736 they built teak ocean-going warships for the Royal Navy — HMS Trincomalee still floats — and later founded Bombay Dyeing, one of India’s oldest surviving firms.' },
      { name: 'The Petits & Jejeebhoys', role: 'Parsi merchant-philanthropists', text: 'The Petit baronets ran early spinning mills; Sir Jamsetjee Jejeebhoy made a fortune in the China trade and endowed the hospital and art school that still bear his name.' },
      { name: 'The Sassoons', role: 'Baghdadi Jewish merchants', text: 'Arriving from Baghdad in the 1830s, the “Rothschilds of the East” built mills, libraries, a school and the Sassoon Docks (1870s), leaving a civic legacy across the city.' },
      { name: 'The Godrejs & Ambanis', role: 'Modern industrial houses', text: 'Godrej (from 1897) built locks, safes, soap and later aerospace components; Reliance, founded by Dhirubhai Ambani (1966), grew from polyester into petrochemicals and telecoms, headquartered in the city.' },
    ],
    timeline: [
      { yr: 'c.250 BC', type: 'major', text: 'The region enters the Mauryan sphere; Buddhist monks begin the Kanheri caves in the northern forests.' },
      { yr: 'c.550', type: 'culture', text: 'The great Shaiva rock-temples of Elephanta are carved across the harbour (UNESCO, 1987).' },
      { yr: '1343', type: 'politics', text: 'The Gujarat Sultanate wrests the islands from local Hindu rulers.' },
      { yr: '1508', type: 'conflict', text: 'Portuguese ships under Francisco de Almeida first probe the harbour.' },
      { yr: '1534', type: 'major', text: 'The Sultan of Gujarat cedes the seven islands to Portugal by the Treaty of Bassein.' },
      { yr: '1661', type: 'major', text: 'The islands pass to the English Crown as part of Catherine of Braganza’s dowry.' },
      { yr: '1668', type: 'major', text: 'The Crown leases Bombay to the East India Company for £10 in gold a year.' },
      { yr: '1672', type: 'politics', text: 'Governor Gerald Aungier sets up courts, a mint and religious freedom, luring Parsi and Gujarati traders.' },
      { yr: '1686', type: 'growth', text: 'The East India Company moves its western headquarters from Surat to Bombay.' },
      { yr: '1739', type: 'conflict', text: 'The Marathas seize neighbouring Salsette and Bassein from the Portuguese.' },
      { yr: '1803', type: 'disaster', text: 'A great fire tears through the crowded Fort district.' },
      { yr: '1817–18', type: 'conflict', text: 'The Third Anglo-Maratha War makes the Company paramount across western India.' },
      { yr: '1838', type: 'growth', text: 'Reclamation has effectively fused the seven islands into one landmass.' },
      { yr: '1853', type: 'growth', text: 'India’s first passenger railway steams from Bombay to Thane.' },
      { yr: '1857', type: 'conflict', text: 'The great Indian Rebellion convulses the north; Bombay stays largely quiet under the Company.' },
      { yr: '1861–65', type: 'growth', text: 'The American Civil War cuts off US cotton; a Bombay cotton boom mints instant fortunes.' },
      { yr: '1865', type: 'disaster', text: 'The speculative bubble bursts in the Back Bay share mania, ruining thousands.' },
      { yr: '1869', type: 'growth', text: 'The Suez Canal opens, putting Bombay on the express route to Europe.' },
      { yr: '1875', type: 'major', text: 'The Bombay Stock Exchange is founded under a banyan tree — Asia’s oldest.' },
      { yr: '1885', type: 'politics', text: 'The Indian National Congress holds its very first session in Bombay.' },
      { yr: '1888', type: 'culture', text: 'F. W. Stevens’ Victoria Terminus (now CST) is completed.' },
      { yr: '1896', type: 'disaster', text: 'Bubonic plague erupts, killing tens of thousands and driving hundreds of thousands to flee.' },
      { yr: '1911', type: 'growth', text: 'The foundation of the Gateway of India is laid for a royal visit (finished 1924).' },
      { yr: '1913', type: 'culture', text: 'Dadasaheb Phalke’s Raja Harishchandra, a birth of Indian cinema, is made in the city.' },
      { yr: '1918', type: 'disaster', text: 'The global influenza pandemic scythes through the crowded tenements.' },
      { yr: '1928', type: 'politics', text: 'The Simon Commission is met with black flags and “go back” protests.' },
      { yr: '1931', type: 'culture', text: 'Alam Ara, India’s first talkie, premieres in Bombay.' },
      { yr: '1942', type: 'politics', text: 'Gandhi launches the Quit India movement from Gowalia Tank Maidan.' },
      { yr: '1944', type: 'disaster', text: 'The ammunition ship SS Fort Stikine explodes in the docks, killing hundreds and raining gold bars.' },
      { yr: '1947', type: 'major', text: 'India wins independence; the last British troops sail out through the Gateway in 1948.' },
      { yr: '1956', type: 'politics', text: 'The Samyukta Maharashtra movement demands a Marathi-speaking state with Bombay as its capital.' },
      { yr: '1960', type: 'major', text: 'Bombay becomes the capital of the new state of Maharashtra.' },
      { yr: '1966', type: 'politics', text: 'The Shiv Sena is founded, reshaping the city’s regional and identity politics for decades.' },
      { yr: '1982', type: 'politics', text: 'The Great Bombay Textile Strike idles a quarter-million workers and hastens the mills’ collapse.' },
      { yr: '1989', type: 'growth', text: 'The vast new port of Nhava Sheva (JNPT) opens across the harbour.' },
      { yr: '1992–93', type: 'conflict', text: 'Communal riots convulse the city after the demolition of the Babri Masjid.' },
      { yr: '1993', type: 'conflict', text: 'Thirteen coordinated bombings kill 257 people across the city in a single afternoon.' },
      { yr: '1995', type: 'major', text: 'Bombay is officially renamed Mumbai.' },
      { yr: '2005', type: 'disaster', text: 'A record 944 mm of monsoon rain falls in a day; floods kill over 1,000.' },
      { yr: '2006', type: 'conflict', text: 'Seven bombs on the suburban rail network kill about 209 in the evening rush.' },
      { yr: '2008', type: 'conflict', text: 'The 26/11 attacks strike the Taj, the Oberoi, CST and a Jewish centre over three days.' },
      { yr: '2014', type: 'growth', text: 'Mumbai’s first Metro line opens, easing the choked rail network.' },
      { yr: '2018', type: 'culture', text: 'The Victorian Gothic and Art Deco Ensembles are inscribed by UNESCO.' },
      { yr: '2024', type: 'growth', text: 'Atal Setu, India’s longest sea bridge, opens across Mumbai harbour.' },
    ],
    links: [
      { title: 'Elephanta Caves — UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/244/', type: 'Official' },
      { title: 'Chhatrapati Shivaji Terminus — UNESCO', url: 'https://whc.unesco.org/en/list/945/', type: 'Official' },
      { title: 'Victorian Gothic & Art Deco Ensembles of Mumbai — UNESCO', url: 'https://whc.unesco.org/en/list/1480/', type: 'Official' },
      { title: 'Mumbai City District — Government of Maharashtra', url: 'https://mumbaicity.gov.in/en/history/', type: 'Official' },
      { title: 'Census of India', url: 'https://censusindia.gov.in/', type: 'Official' },
      { title: 'Mumbai — Encyclopædia Britannica', url: 'https://www.britannica.com/place/Mumbai', type: 'Reference' },
    ],
  },

  /* =================================================================== */
  /* ROME                                                                */
  /* =================================================================== */
  {
    id: 'rome',
    name: 'Rome',
    native: 'Roma',
    flag: '🇮🇹',
    country: 'Italy',
    coords: [41.9028, 12.4964],
    warm: false,
    tagline: 'The Eternal City — empire, Church and a living museum of the West.',
    accent: '#f9c74f', accent2: '#ff5d73',
    holo: {
      features: [
        { kind: 'river', name: 'Tiber', pts: [[-26,-42],[-14,-20],[-6,0],[-2,18],[-10,40],[-4,60]] },
      ],
      districts: [
        { name: 'Centro Storico', x: 8, z: 0, r: 12, n: 30, hlo: 6, hhi: 15, kind: 'low' },
        { name: 'Vatican', x: -16, z: -6, r: 8, n: 12, hlo: 7, hhi: 16, kind: 'low' },
        { name: 'Trastevere', x: -6, z: 10, r: 8, n: 20, hlo: 5, hhi: 12, kind: 'low' },
        { name: 'Esquilino', x: 24, z: -6, r: 10, n: 24, hlo: 8, hhi: 18, kind: 'mid' },
        { name: 'Testaccio', x: 9, z: 22, r: 7, n: 16, hlo: 5, hhi: 11, kind: 'low' },
        { name: 'EUR', x: 16, z: 42, r: 11, n: 18, hlo: 16, hhi: 36, kind: 'core' },
      ],
      specials: [
        { kind: 'ring', name: 'Colosseum', x: 16, z: 6, size: 6, h: 6 },
        { kind: 'dome', name: "St Peter's", x: -18, z: -8, size: 5, h: 16 },
      ],
    },
    founded: 'Traditionally 21 April 753 BC',
    populationLine: '≈2.75 million (city); ≈4.3 million metro',
    stats: [
      { k: 'Founded', v: '753 BC' },
      { k: 'Metro pop.', v: '≈4.3 M' },
      { k: 'Elevation', v: '21 m' },
      { k: 'Area', v: '1,285 km²' },
      { k: 'Time zone', v: 'CET +1' },
      { k: 'Byname', v: 'The Eternal City' },
    ],
    quickfacts: [
      { label: 'Country', value: 'Italy (national capital)' },
      { label: 'Setting', value: 'Seven hills on the River Tiber, Lazio' },
      { label: 'Founded', value: 'Traditionally 753 BC (myth of Romulus)' },
      { label: 'Population', value: '≈2.75 M city · ≈4.3 M metro' },
      { label: 'Enclave', value: 'Surrounds Vatican City, seat of the Papacy' },
      { label: 'Known for', value: 'Antiquity, the Church, Renaissance & Baroque' },
    ],
    landmarks: [
      { name: 'The Colosseum', note: 'The Flavian Amphitheatre (inaugurated 80 AD), seating perhaps 50,000 for gladiatorial games and mock sea-battles.' },
      { name: 'The Pantheon', note: 'Hadrian’s temple “to all the gods” (c. 125 AD); its unreinforced concrete dome is still the largest in the world.' },
      { name: 'St Peter’s Basilica', note: 'Rebuilt 1506–1626 over the reputed tomb of St Peter, crowned by Michelangelo’s dome.' },
      { name: 'The Roman Forum', note: 'The political and religious heart of the ancient city — temples, basilicas and the Senate house.' },
      { name: 'Trevi Fountain', note: 'Nicola Salvi’s Baroque masterpiece (1762), fed by the restored ancient Aqua Virgo aqueduct.' },
    ],
    sections: [
      { id: 'overview', icon: '◍', title: 'Overview', html: `
        <p class="lede">Rome is the “Eternal City” — capital of Italy, cradle of a civilisation that shaped Western law, language, engineering and government, and the spiritual centre of the Roman Catholic Church. Few cities carry three world-historic roles at once: the seat of an empire, the home of a Church, and a living museum of Western art from antiquity to the Baroque.</p>
        <p>Uniquely, Rome physically surrounds a separate sovereign state, <strong>Vatican City</strong>, and calls itself <em>Caput Mundi</em> — “capital of the world.” Founded by tradition in 753 BC on seven hills beside the Tiber, it grew into the first city in history to hold a million people, gave its name to an entire era, and remains a place where a Metro line detours around a 2,000-year-old aqueduct.</p>` },
      { id: 'geography', icon: '⬡', title: 'Geography & setting', html: `
        <p>Rome lies in the Lazio region of central Italy, about 24 km inland from the Tyrrhenian Sea, on the banks of the <strong>Tiber</strong>. The classical <strong>seven hills</strong> — Palatine, Capitoline, Aventine, Caelian, Esquiline, Viminal and Quirinal — framed the ancient city; the Palatine, by legend, is where Romulus founded it, and later where emperors built their palaces (the word “palace” itself comes from it).</p>
        <p>The surrounding <em>Campagna</em> and the volcanic Alban Hills supplied building stone — <strong>travertine</strong> from Tivoli, volcanic <strong>tuff</strong> — and, through a network of <strong>aqueducts</strong>, the city’s water. The Tiber both fed and menaced Rome, flooding it repeatedly until the great stone embankments (<em>muraglioni</em>) of the 1870s finally caged it.</p>` },
      { id: 'founding', icon: '⌘', title: 'Founding & the three ages', html: `
        <p>Legend tells of the twins <strong>Romulus and Remus</strong>, sons of Mars, abandoned on the Tiber, suckled by a she-wolf, and of Romulus founding the city in 753 BC after killing his brother in a quarrel over its walls. Behind the myth lies a real fusion of Latin and Sabine hill-villages, later ruled — the tradition holds — by seven kings, the last of them the tyrant Tarquin the Proud.</p>
        <p>Rome then moved through three great ages: the <strong>Kingdom</strong> (to 509 BC), the <strong>Republic</strong> (509–27 BC) governed by Senate, consuls and a fierce ideology of shared power, and the <strong>Empire</strong> (from 27 BC), when Octavian took the name <strong>Augustus</strong> and became the first emperor. At its height under Trajan the Empire stretched from Scotland to the Persian Gulf and ringed the Mediterranean — <em>Mare Nostrum</em>, “our sea.”</p>` },
      { id: 'culture', icon: '❖', title: 'Culture & society', html: `
        <p>Rome’s cultural output is almost the definition of the Western canon. From antiquity: <strong>Latin</strong> literature (Virgil’s <em>Aeneid</em>, Ovid, Cicero, Horace), Roman law, and the engineering trinity of the arch, the dome and concrete. From the Renaissance and Baroque, funded by popes and princely families: <strong>Michelangelo’s</strong> Sistine ceiling and the dome of St Peter’s, <strong>Raphael’s</strong> Vatican rooms, <strong>Caravaggio’s</strong> revolutionary shadows, and <strong>Bernini’s</strong> sculptures and fountains that turned whole squares into theatre.</p>
        <p>The city is a catalogue of monuments — the Colosseum, the Forum, the intact Pantheon, the Spanish Steps — and, in the 20th century, a capital of cinema, through the vast <strong>Cinecittà</strong> studios and the films of Fellini (<em>La Dolce Vita</em>) and Rossellini. Its daily culture is its own art: the <em>passeggiata</em>, the ritual espresso taken standing, and a dialect poetry all its own.</p>` },
      { id: 'food', icon: '✦', title: 'Food & cuisine', html: `
        <p>Roman cooking is robust and frugal — <em>cucina povera</em> raised to an art on the offcuts and staples of a working city. Its four canonical pastas share a lineage: <strong>cacio e pepe</strong> (pecorino and pepper), <strong>gricia</strong> (add guanciale), <strong>amatriciana</strong> (add tomato) and <strong>carbonara</strong> (guanciale, egg and pecorino, and emphatically no cream).</p>
        <p>Beyond pasta: <strong>saltimbocca alla romana</strong>, <strong>coda alla vaccinara</strong> (oxtail from the old slaughterhouse district of Testaccio), <strong>supplì</strong> (fried rice croquettes) and the cream-filled <strong>maritozzo</strong> for breakfast. The historic <strong>Jewish Ghetto</strong> gives Rome one of its glories, <em>carciofi alla giudia</em> — whole artichokes fried until they open crisp as a flower. Gelato and espresso punctuate the day.</p>` },
      { id: 'animals', icon: '✧', title: 'Animals & wildlife', html: `
        <p>No animal is more Roman than the <strong>she-wolf</strong> (<em>Lupa</em>), the city’s founding emblem, cast in the famous bronze on the Capitoline. Roman memory also honours the <strong>sacred geese of Juno</strong>, whose cackling supposedly woke the garrison to a night attack by the Gauls, and the <strong>eagle</strong> (<em>aquila</em>) that each legion carried as its soul.</p>
        <p>Modern Rome is famous for its protected colonies of <strong>feral cats</strong>, most visibly at the <strong>Largo di Torre Argentina</strong> — the very square where Julius Caesar was assassinated, now a sanctuary sunk below street level among the ruins. In autumn, immense murmurations of <strong>starlings</strong> pulse over the Tiber at dusk, and the river corridor draws herons and gulls deep into the centre.</p>` },
      { id: 'resources', icon: '◆', title: 'Natural resources & economy', html: `
        <p>Ancient Rome’s true resource was its <strong>engineering</strong>: eleven great aqueducts pouring water into the city, roads binding an empire (“all roads lead to Rome”), and local materials — <strong>travertine</strong>, volcanic <strong>tuff</strong> and, decisively, the <em>pozzolana</em> ash that made Roman <strong>concrete</strong> set even under water and hold up the Pantheon’s dome for nineteen centuries.</p>
        <p>Imperial wealth arrived as tribute, Egyptian grain and enslaved labour, funnelled through a population Rome could not feed itself. Today the city’s economy rests on <strong>government</strong>, the <strong>Holy See</strong> and, overwhelmingly, <strong>tourism</strong> — tens of millions of visitors a year — with cinema, fashion, universities and services alongside.</p>` },
      { id: 'wars', icon: '⚔', title: 'Wars, sacks & conflicts', html: `
        <p>Rome’s rise was written in war. The <strong>Punic Wars</strong> against Carthage (264–146 BC) — Hannibal’s elephants over the Alps, the disaster at Cannae, the final salting of Carthage — left Rome master of the western Mediterranean. Then the Republic tore itself apart in the civil wars of <strong>Caesar and Pompey</strong>, and of <strong>Octavian and Mark Antony</strong>, ending at Actium in 31 BC.</p>
        <p>The city itself was sacked again and again: by the <strong>Gauls (c. 390 BC)</strong>, the <strong>Visigoths under Alaric (410 AD)</strong> — a shock that made St Augustine write <em>The City of God</em> — the <strong>Vandals (455)</strong>, and, devastatingly, by the mutinous imperial army of Charles V in the <strong>Sack of Rome (1527)</strong>, which broke the High Renaissance. In modern times Italy seized Rome as its capital in <strong>1870</strong>; in the Second World War it was declared an “open city,” occupied, and liberated in June <strong>1944</strong>.</p>` },
      { id: 'religion', icon: '☾', title: 'Religion & belief', html: `
        <p>Rome began with a rich <strong>polytheism</strong> — Jupiter, Juno and Minerva on the Capitol, Vesta’s eternal flame, Mars the father of the city — bound up with the state and, later, the cult of the emperor himself. From the 1st century AD it became the stage for early <strong>Christianity</strong>; tradition holds that Saints <strong>Peter and Paul</strong> were martyred here under Nero, and Constantine’s conversion turned persecution into patronage.</p>
        <p>Rome became the seat of the <strong>Papacy</strong> and, through the medieval and early-modern <strong>Papal States</strong>, a temporal power ruling much of central Italy until 1870. Today the independent enclave of <strong>Vatican City</strong> — the world’s smallest sovereign state, created by the 1929 Lateran Treaty — makes Rome the global centre of the Catholic Church and home to over a billion believers’ spiritual capital.</p>` },
      { id: 'language', icon: '⌥', title: 'Language', html: `
        <p>Rome gave the world <strong>Latin</strong>, ancestor of the Romance languages and, for two millennia, the language of Western law, scholarship and the Church. The city today speaks <strong>Italian</strong>, coloured by the sharp, self-mocking <em>Romanesco</em> dialect immortalised in the sonnets of Giuseppe Belli and in Roman cinema.</p>` },
    ],
    figures: [
      { name: 'Julius Caesar', dates: '100–44 BC', role: 'General & dictator', note: 'Conqueror of Gaul; his assassination on the Ides of March ended the Republic in all but name.' },
      { name: 'Augustus', dates: '63 BC–14 AD', role: 'First emperor', note: 'Found Rome brick and left it marble; founded a 200-year imperial peace.' },
      { name: 'Constantine', dates: 'c. 272–337', role: 'Emperor', note: 'Legalised Christianity and set the Church on its imperial course.' },
      { name: 'Michelangelo', dates: '1475–1564', role: 'Artist & architect', note: 'Painted the Sistine ceiling and designed the dome of St Peter’s.' },
      { name: 'Gian Lorenzo Bernini', dates: '1598–1680', role: 'Sculptor & architect', note: 'The genius of the Roman Baroque; St Peter’s Square is his.' },
      { name: 'Federico Fellini', dates: '1920–1993', role: 'Filmmaker', note: 'Made Rome itself a character in La Dolce Vita and Roma.' },
    ],
    families: [
      { name: 'The Julii (gens Julia)', role: 'Patrician clan of the Republic', text: 'One of Rome’s oldest houses, claiming descent from Aeneas and the goddess Venus. It produced Julius Caesar and, by adoption, Augustus — founding the Julio-Claudian dynasty of emperors.' },
      { name: 'The Cornelii', role: 'Leading Republican gens', text: 'Among the most prolific noble houses, including the Scipiones — Scipio Africanus, who beat Hannibal at Zama — and the Gracchi on their mother’s side, who shook Rome with land reform.' },
      { name: 'The Colonna & Orsini', role: 'Medieval baronial dynasties', text: 'Rival warrior families who fortified Rome’s ruins into castles and feuded for centuries over the city and the Papacy, each supplying popes and cardinals.' },
      { name: 'The Barberini & Borghese', role: 'Papal families of the Baroque', text: 'Great houses that gave the Church popes (Urban VIII, Paul V) and spent that power reshaping Rome — commissioning Bernini, raising palaces and the villas that still ring the city. “What the barbarians did not do, the Barberini did,” ran the jibe.' },
    ],
    timeline: [
      { yr: '753 BC', type: 'major', text: 'Traditional founding of Rome by Romulus on the Palatine Hill.' },
      { yr: '715 BC', type: 'culture', text: 'Numa Pompilius, the second king, is said to found Rome’s priesthoods and calendar.' },
      { yr: '509 BC', type: 'politics', text: 'The Romans expel the last king, Tarquin the Proud, and found the Republic.' },
      { yr: '494 BC', type: 'politics', text: 'The plebeians secede from the city, winning tribunes to defend their rights.' },
      { yr: '450 BC', type: 'politics', text: 'The Twelve Tables set down Roman law in writing for the first time.' },
      { yr: '390 BC', type: 'conflict', text: 'A Gaulish army sacks the young city; only the Capitol holds out.' },
      { yr: '312 BC', type: 'growth', text: 'Appius Claudius begins the Appian Way and Rome’s first aqueduct.' },
      { yr: '264–146 BC', type: 'conflict', text: 'The Punic Wars against Carthage end with Rome master of the Mediterranean.' },
      { yr: '133 BC', type: 'politics', text: 'The tribune Tiberius Gracchus is murdered over land reform — political violence enters the Republic.' },
      { yr: '73–71 BC', type: 'conflict', text: 'Spartacus leads a vast slave revolt before it is crushed.' },
      { yr: '63 BC', type: 'politics', text: 'Cicero exposes and crushes the Catiline conspiracy to seize the state.' },
      { yr: '49 BC', type: 'conflict', text: 'Caesar crosses the Rubicon, igniting civil war.' },
      { yr: '44 BC', type: 'conflict', text: 'Caesar is assassinated in the Senate on the Ides of March.' },
      { yr: '27 BC', type: 'major', text: 'Octavian becomes Augustus, first emperor; the Republic gives way to Empire.' },
      { yr: '64 AD', type: 'disaster', text: 'The Great Fire of Rome burns for days; Nero blames the Christians.' },
      { yr: '80', type: 'culture', text: 'The Colosseum is inaugurated with a hundred days of games.' },
      { yr: 'c.125', type: 'culture', text: 'Hadrian rebuilds the Pantheon with its record-breaking concrete dome.' },
      { yr: '271', type: 'growth', text: 'The Aurelian Walls rise around the city as barbarian pressure mounts.' },
      { yr: '312', type: 'politics', text: 'Constantine wins at the Milvian Bridge and turns the Empire toward Christianity.' },
      { yr: '410', type: 'conflict', text: 'Alaric’s Visigoths sack Rome — a shock that stuns the ancient world.' },
      { yr: '455', type: 'conflict', text: 'The Vandals sack the city a second time.' },
      { yr: '476', type: 'major', text: 'The last Western Roman emperor is deposed; antiquity gives way to the Middle Ages.' },
      { yr: '800', type: 'politics', text: 'Charlemagne is crowned emperor in St Peter’s on Christmas Day.' },
      { yr: '1084', type: 'conflict', text: 'Norman troops sack Rome while ostensibly rescuing the Pope.' },
      { yr: '1309', type: 'politics', text: 'The Papacy decamps to Avignon, leaving Rome impoverished and unruly.' },
      { yr: '1347', type: 'politics', text: 'Cola di Rienzo seizes power dreaming of reviving the Roman Republic.' },
      { yr: '1506', type: 'culture', text: 'Julius II lays the first stone of the new St Peter’s Basilica.' },
      { yr: '1508–12', type: 'culture', text: 'Michelangelo paints the ceiling of the Sistine Chapel.' },
      { yr: '1527', type: 'conflict', text: 'Mutinous troops of Charles V sack Rome, shattering the High Renaissance.' },
      { yr: '1656', type: 'disaster', text: 'Plague sweeps through Rome, killing a large share of its people.' },
      { yr: '1798', type: 'politics', text: 'French revolutionaries proclaim a short-lived Roman Republic and depose the Pope.' },
      { yr: '1849', type: 'conflict', text: 'Garibaldi and Mazzini defend a new Roman Republic before French troops restore the Pope.' },
      { yr: '1870', type: 'major', text: 'Italian troops breach the walls at Porta Pia; Rome joins a united Italy.' },
      { yr: '1871', type: 'politics', text: 'Rome becomes the capital of the Kingdom of Italy.' },
      { yr: '1922', type: 'politics', text: 'Mussolini’s March on Rome brings the Fascists to power.' },
      { yr: '1929', type: 'politics', text: 'The Lateran Treaty creates the sovereign Vatican City.' },
      { yr: '1943–44', type: 'conflict', text: 'Rome is bombed, occupied by the Germans, and finally liberated in June 1944.' },
      { yr: '1957', type: 'growth', text: 'The Treaty of Rome founds what will become the European Union.' },
      { yr: '1960', type: 'culture', text: 'Rome hosts the Summer Olympic Games.' },
      { yr: '2000', type: 'culture', text: 'The Great Jubilee draws tens of millions of pilgrims to the city.' },
    ],
    links: [
      { title: 'Historic Centre of Rome & the Holy See — UNESCO', url: 'https://whc.unesco.org/en/list/91/', type: 'Official' },
      { title: 'Comune di Roma (City of Rome)', url: 'https://www.comune.roma.it/', type: 'Official' },
      { title: 'The Vatican — Holy See', url: 'https://www.vatican.va/', type: 'Official' },
      { title: 'Colosseum Archaeological Park (official)', url: 'https://parcocolosseo.it/en/', type: 'Official' },
      { title: 'Rome — Encyclopædia Britannica', url: 'https://www.britannica.com/place/Rome', type: 'Reference' },
      { title: 'Ancient Rome — World History Encyclopedia', url: 'https://www.worldhistory.org/Rome/', type: 'Reference' },
    ],
  },

  /* =================================================================== */
  /* CAIRO                                                               */
  /* =================================================================== */
  {
    id: 'cairo',
    name: 'Cairo',
    native: 'القاهرة',
    flag: '🇪🇬',
    country: 'Egypt',
    coords: [30.0444, 31.2357],
    warm: false,
    tagline: 'Mother of the World — the Nile, the pyramids and a thousand minarets.',
    accent: '#ffcf5c', accent2: '#22d3c5',
    holo: {
      features: [
        { kind: 'river', name: 'The Nile', pts: [[-8,-60],[-5,-30],[-3,0],[-5,30],[-9,60]] },
      ],
      districts: [
        { name: 'Islamic Cairo', x: 16, z: 0, r: 11, n: 32, hlo: 5, hhi: 13, kind: 'low', spikes: 6 },
        { name: 'Downtown', x: 6, z: -8, r: 9, n: 24, hlo: 8, hhi: 20, kind: 'mid' },
        { name: 'Zamalek', x: -3, z: 2, r: 5, n: 12, hlo: 8, hhi: 18, kind: 'mid' },
        { name: 'Giza', x: -40, z: 10, r: 10, n: 18, hlo: 5, hhi: 12, kind: 'low' },
        { name: 'Nasr City', x: 28, z: -20, r: 9, n: 20, hlo: 8, hhi: 18, kind: 'mid' },
        { name: 'New Cairo', x: 36, z: 26, r: 12, n: 20, hlo: 10, hhi: 30, kind: 'core' },
      ],
      specials: [
        { kind: 'pyramid', name: 'Great Pyramid', x: -50, z: 16, size: 9, h: 9 },
        { kind: 'pyramid', x: -42, z: 22, size: 7, h: 7 },
        { kind: 'pyramid', x: -36, z: 27, size: 5, h: 5 },
        { kind: 'spire', name: 'Cairo Tower', x: -3, z: 2, size: 1.6, h: 32 },
      ],
    },
    founded: 'al-Qāhira founded 969 AD (with far older predecessors)',
    populationLine: '≈10 million (city); ≈22 million metro — the Arab world’s largest',
    stats: [
      { k: 'Founded', v: '969 AD' },
      { k: 'Metro pop.', v: '≈22 M' },
      { k: 'Elevation', v: '23 m' },
      { k: 'Area', v: '3,085 km²' },
      { k: 'Time zone', v: 'EET +2' },
      { k: 'Byname', v: 'Mother of the World' },
    ],
    quickfacts: [
      { label: 'Country', value: 'Egypt (national capital)' },
      { label: 'Setting', value: 'The Nile, at the head of its delta' },
      { label: 'Founded', value: '969 AD (Fustat 641; Memphis nearby, c. 3100 BC)' },
      { label: 'Population', value: '≈10 M city · ≈22 M metro' },
      { label: 'Language', value: 'Arabic (Egyptian Arabic)' },
      { label: 'Known for', value: 'The Pyramids, Islamic Cairo, Al-Azhar' },
    ],
    landmarks: [
      { name: 'Pyramids of Giza', note: 'The tomb of Khufu (c. 2560 BC) was the tallest structure on Earth for nearly 4,000 years; the only surviving Wonder of the ancient world.' },
      { name: 'The Citadel of Saladin', note: 'Saladin’s 12th-century fortress on the Mokattam spur, later crowned by the Ottoman-style Muhammad Ali Mosque.' },
      { name: 'Al-Azhar Mosque', note: 'Founded 970–972 by the Fatimids; one of the oldest continuously operating universities in the world.' },
      { name: 'Khan el-Khalili', note: 'A labyrinthine bazaar founded in the 14th century, still the commercial heart of medieval Cairo.' },
      { name: 'The Grand Egyptian Museum', note: 'A vast new museum by the pyramids housing Tutankhamun’s complete treasure for the first time.' },
    ],
    sections: [
      { id: 'overview', icon: '◍', title: 'Overview', html: `
        <p class="lede">Cairo — <em>al-Qāhira</em>, “the Victorious” — is the largest city in the Arab world and in Africa, sprawling along the Nile where the river fans into its delta. Egyptians call it <em>Umm al-Dunya</em>, “Mother of the World.” It is a city in layers: pharaonic monuments on its western horizon, a Roman fortress at its Coptic core, a thousand-year-old Islamic capital of minarets and madrasas at its heart, and a restless modern megacity of some 22 million on top.</p>
        <p>The <strong>Giza pyramids</strong> are older than the medieval city beside them by two and a half thousand years — a reminder that Cairo is heir to the longest continuous urban civilisation on Earth, and that “ancient Egypt” was itself already ancient when the Fatimids laid the first stone of al-Qāhira.</p>` },
      { id: 'geography', icon: '⬡', title: 'Geography & setting', html: `
        <p>Cairo stands on the <strong>Nile</strong> at the apex of the delta, where Upper (southern) and Lower (northern) Egypt meet — the strategic hinge that has drawn capitals to this spot for five thousand years. The river is split by the islands of <strong>Gezira</strong> and Roda; to the east rise the <strong>Mokattam</strong> hills crowned by the Citadel; to the west lie Giza and the desert plateau of the pyramids.</p>
        <p>Beyond the thin green thread of the valley is desert on both sides. Everything in Egypt — its farms, its cities, 95% of its people — clings to the river, whose annual flood once built the black silt the ancients called <em>Kemet</em>, “the black land.” Since the Aswan High Dam (1970) the flood no longer comes, and Cairo now expands into the desert in vast new satellite cities.</p>` },
      { id: 'founding', icon: '⌘', title: 'Founding & many capitals', html: `
        <p>The Cairo region has hosted a chain of capitals. Nearby <strong>Memphis</strong> was the seat of the Old Kingdom pharaohs from c. 3100 BC, and the Giza pyramids — the tomb of <strong>Khufu</strong> chief among them — rose around 2560 BC. Later came <strong>Heliopolis</strong>, centre of the sun cult, and the sacred city of On.</p>
        <p>After the Arab conquest of 641 AD, the general <strong>ʿAmr ibn al-ʿAs</strong> founded the garrison town of <strong>Fustat</strong>. In <strong>969</strong> the <strong>Fatimid</strong> commander <strong>Jawhar al-Siqilli</strong> laid out a walled royal city just to the north and named it <strong>al-Qāhira</strong> — the Cairo of today. Within a year the Fatimids founded <strong>Al-Azhar</strong>, a mosque and centre of learning that became one of the oldest continuously operating universities in the world, and the intellectual anchor of Sunni Islam.</p>` },
      { id: 'culture', icon: '❖', title: 'Culture & society', html: `
        <p>Cairo has long been the cultural capital of the Arabic-speaking world — its “Hollywood on the Nile” dominated Arab cinema, and its music, publishing and television set tastes from Casablanca to Baghdad. Medieval <strong>Islamic Cairo</strong> (a UNESCO World Heritage Site) is a dense quarter of mosques, madrasas, monumental gates (Bab Zuweila) and the <strong>Khan el-Khalili</strong> bazaar, all threaded by the ancient market street of al-Muizz.</p>
        <p>The city gave the world the singer <strong>Umm Kulthum</strong>, whose monthly radio concerts once emptied the streets of the Arab world, and the novelist <strong>Naguib Mahfouz</strong>, the first Arabic-language writer to win the Nobel Prize (1988), whose <em>Cairo Trilogy</em> maps the very alleys of the old city. Life spills into the <em>ahwa</em> (coffee-house), over backgammon, shisha and impossibly strong tea.</p>` },
      { id: 'food', icon: '✦', title: 'Food & cuisine', html: `
        <p>Cairo’s national street dish is <strong>koshari</strong> — a carbohydrate symphony of rice, lentils, macaroni, chickpeas and fried onions under a spiced tomato-and-vinegar sauce, served from dedicated koshari shops. The everyday staples are <strong>ful medames</strong> (fava beans slow-cooked overnight) and <strong>taʿmeya</strong>, the Egyptian falafel made from fava rather than chickpea and fried green inside.</p>
        <p>Other classics: <strong>molokhia</strong> (a garlicky green jute-leaf stew), <strong>mahshi</strong> (stuffed vegetables and vine leaves), <strong>hamam mahshi</strong> (stuffed pigeon) and the flaky, many-layered <strong>feteer meshaltet</strong>. For dessert there is <strong>kunafa</strong>, <strong>basbousa</strong> and <strong>umm ali</strong>. Fresh sugarcane juice (<em>asab</em>) and glasses of sweet mint tea are the drinks of the street.</p>` },
      { id: 'animals', icon: '✧', title: 'Animals & wildlife', html: `
        <p>Egypt’s ancient religion was densely animal: the cat-goddess <strong>Bastet</strong>, the ibis-headed <strong>Thoth</strong>, the jackal <strong>Anubis</strong> of the necropolis, the falcon <strong>Horus</strong> and the sacred <strong>Apis</strong> bull worshipped at Memphis. Cats were so revered that killing one could be a capital offence, and vast catacombs of mummified cats, ibises and crocodiles survive.</p>
        <p>The <strong>Nile crocodile</strong> and the <strong>hippopotamus</strong> — both once common here — have retreated far to the south. Today the city’s fauna is humbler: <strong>Egyptian geese</strong>, hoopoes, egrets and the millions of migrating birds that funnel down the Nile flyway each year, and the ubiquitous street cats that seem a living echo of Bastet. The Giza plateau is worked, as ever, by camels and horses.</p>` },
      { id: 'resources', icon: '◆', title: 'Natural resources & economy', html: `
        <p>The Nile is Egypt’s supreme resource: its silt made the valley one of antiquity’s great granaries, feeding Rome itself, and its water still sustains almost the entire nation. Ancient Egypt drew <strong>gold</strong> from Nubia and the eastern desert and quarried the fine white <strong>limestone</strong> of Tura that once cased the pyramids like mirrors.</p>
        <p>Modern Egypt’s economy leans on the <strong>Suez Canal</strong> — a chokepoint of world trade — plus <strong>oil and natural gas</strong>, world-famous long-staple <strong>cotton</strong>, agriculture, remittances and <strong>tourism</strong> centred on Cairo and the pyramids. Cairo itself is the country’s administrative, financial and industrial hub; a vast <strong>New Administrative Capital</strong> is rising in the desert to its east to relieve the strain.</p>` },
      { id: 'wars', icon: '⚔', title: 'Wars & conflicts', html: `
        <p>Cairo’s history is a chronicle of conquest and defence. The Arab conquest of <strong>641</strong> ended Byzantine rule. In the 12th century <strong>Saladin</strong> repelled the Crusaders, ended Fatimid rule and built the great <strong>Citadel</strong>. The <strong>Mamluk</strong> sultans, a warrior caste of freed slaves ruling from Cairo, halted the seemingly unstoppable Mongols at <strong>Ain Jalut (1260)</strong> before themselves falling to the <strong>Ottomans</strong> in 1517.</p>
        <p>In <strong>1798</strong> Napoleon’s army seized Cairo after the Battle of the Pyramids, bringing the scholars whose <em>Description de l’Égypte</em> and the Rosetta Stone launched modern Egyptology. The <strong>1952 Revolution</strong> of the Free Officers ended the monarchy and brought <strong>Nasser</strong> to power; the <strong>Suez Crisis (1956)</strong> and the Arab–Israeli wars of 1967 and 1973 followed. In <strong>2011</strong>, Cairo’s <strong>Tahrir Square</strong> became the epicentre of the uprising that toppled Hosni Mubarak.</p>` },
      { id: 'religion', icon: '☾', title: 'Religion & belief', html: `
        <p>Cairo is a great centre of <strong>Sunni Islam</strong>: <strong>Al-Azhar</strong> is among the most influential seats of Islamic learning on Earth, and the medieval city holds hundreds of historic mosques whose call to prayer once earned Cairo the name “city of a thousand minarets.” The Fatimids who founded the city were, ironically, <strong>Shia</strong> Ismailis, a heritage still legible in its earliest architecture.</p>
        <p>The city is also a heartland of <strong>Coptic Christianity</strong>: “Coptic Cairo,” clustered around the Roman fortress of Babylon, holds the Hanging Church and sites revered as stations on the Holy Family’s flight into Egypt. A once-thriving <strong>Jewish</strong> community left the Ben Ezra Synagogue and its extraordinary document hoard, the Cairo Geniza. Beneath all of it lie more than three millennia of <strong>ancient Egyptian religion</strong>.</p>` },
      { id: 'language', icon: '⌥', title: 'Language', html: `
        <p>The language of Cairo is <strong>Egyptian Arabic</strong> — thanks to a century of Egyptian film, music and television, the most widely understood spoken Arabic dialect in the world. The ancient <strong>Egyptian language</strong> survives in the liturgy of the Coptic Church, and its hieroglyphic script — decoded by Champollion from the Rosetta Stone in 1822 — stands at the root of the alphabet itself.</p>` },
    ],
    figures: [
      { name: 'Khufu', dates: 'r. c. 2589–2566 BC', role: 'Pharaoh', note: 'Builder of the Great Pyramid of Giza, the last standing Wonder of the ancient world.' },
      { name: 'Saladin', dates: '1137–1193', role: 'Sultan', note: 'Founder of the Ayyubid dynasty; built Cairo’s Citadel and retook Jerusalem from the Crusaders.' },
      { name: 'Muhammad Ali Pasha', dates: '1769–1849', role: 'Ruler of Egypt', note: 'The Ottoman-Albanian commander regarded as the founder of modern Egypt.' },
      { name: 'Gamal Abdel Nasser', dates: '1918–1970', role: 'President', note: 'Led the 1952 revolution and nationalised the Suez Canal.' },
      { name: 'Umm Kulthum', dates: 'c. 1898–1975', role: 'Singer', note: '“The Voice of Egypt”; her funeral drew millions into Cairo’s streets.' },
      { name: 'Naguib Mahfouz', dates: '1911–2006', role: 'Novelist', note: 'The first Arabic-language Nobel laureate in Literature (1988).' },
    ],
    families: [
      { name: 'The Fatimids', role: 'Founders of Cairo (969–1171)', text: 'A Shia Ismaili dynasty that founded al-Qāhira as an imperial capital and established Al-Azhar. At their height they ruled from North Africa to Syria and the Hejaz and claimed the caliphate itself.' },
      { name: 'The Ayyubids', role: 'Dynasty of Saladin (1171–1250)', text: 'Founded by Salah al-Din, who ended Fatimid rule, restored Sunni Islam in Egypt, built the Citadel and led the Muslim recovery of Jerusalem.' },
      { name: 'The Mamluks', role: 'Warrior-sultans (1250–1517)', text: 'A self-perpetuating caste of freed military slaves who governed Egypt from Cairo, broke the Mongols and the Crusaders, and endowed the city with its finest mosque-madrasa architecture.' },
      { name: 'The Muhammad Ali dynasty', role: 'Rulers of modern Egypt (1805–1953)', text: 'Founded by Muhammad Ali Pasha, the architect of modern Egypt, who massacred the Mamluk beys to seize power. His line of khedives and kings ruled until the 1952 revolution.' },
    ],
    timeline: [
      { yr: 'c.3100 BC', type: 'major', text: 'Memphis is founded nearby as capital of a newly unified Egypt.' },
      { yr: 'c.2560 BC', type: 'culture', text: 'The Great Pyramid of Khufu rises at Giza.' },
      { yr: '525 BC', type: 'conflict', text: 'Persia conquers Egypt; the age of native pharaohs wanes.' },
      { yr: '30 BC', type: 'politics', text: 'Cleopatra dies; Egypt becomes a Roman province and Rome’s granary.' },
      { yr: '641 AD', type: 'major', text: 'Arab armies under ʿAmr ibn al-ʿAs take Egypt and found Fustat.' },
      { yr: '969', type: 'major', text: 'The Fatimids conquer Egypt and found al-Qāhira — Cairo.' },
      { yr: '970–972', type: 'culture', text: 'Al-Azhar mosque and university is founded, a beacon of learning.' },
      { yr: '1073', type: 'growth', text: 'The vizier Badr al-Jamali rebuilds Cairo’s walls and monumental gates.' },
      { yr: '1168', type: 'conflict', text: 'Fustat is burned to deny it to the Crusaders threatening Cairo.' },
      { yr: '1171', type: 'major', text: 'Saladin ends Fatimid rule and founds the Ayyubid dynasty.' },
      { yr: '1176', type: 'growth', text: 'Saladin begins the great Citadel on the Mokattam spur.' },
      { yr: '1250', type: 'politics', text: 'The Mamluks — a caste of freed slave-soldiers — seize power in Cairo.' },
      { yr: '1260', type: 'conflict', text: 'The Mamluks halt the seemingly invincible Mongols at Ain Jalut.' },
      { yr: '1348', type: 'disaster', text: 'The Black Death reaches Cairo, killing perhaps a third of its people.' },
      { yr: '1517', type: 'conflict', text: 'The Ottomans defeat the Mamluks; Egypt becomes an Ottoman province.' },
      { yr: '1798', type: 'conflict', text: 'Napoleon takes Cairo after the Battle of the Pyramids.' },
      { yr: '1801', type: 'politics', text: 'British and Ottoman forces expel the French from Egypt.' },
      { yr: '1805', type: 'major', text: 'Muhammad Ali Pasha seizes power and founds modern Egypt.' },
      { yr: '1811', type: 'conflict', text: 'Muhammad Ali massacres the Mamluk beys at the Citadel, ending their power.' },
      { yr: '1863', type: 'growth', text: 'Khedive Ismail begins remaking Cairo with grand boulevards — “Paris on the Nile.”' },
      { yr: '1869', type: 'growth', text: 'The Suez Canal opens amid lavish Cairo celebrations.' },
      { yr: '1882', type: 'conflict', text: 'Britain crushes the Urabi revolt and occupies Egypt.' },
      { yr: '1902', type: 'culture', text: 'The Egyptian Museum opens on Tahrir Square.' },
      { yr: '1919', type: 'politics', text: 'A nationwide uprising demands independence from Britain.' },
      { yr: '1922', type: 'major', text: 'Egypt gains nominal independence as a kingdom.' },
      { yr: '1948', type: 'conflict', text: 'Egypt joins the first Arab–Israeli war.' },
      { yr: '1952', type: 'major', text: 'The Free Officers depose the king; the monarchy falls.' },
      { yr: '1956', type: 'politics', text: 'Nasser nationalises the Suez Canal, triggering an international crisis.' },
      { yr: '1967', type: 'conflict', text: 'The Six-Day War ends in a shattering Egyptian defeat.' },
      { yr: '1970', type: 'growth', text: 'The Aswan High Dam is completed, ending the Nile’s ancient flood.' },
      { yr: '1975', type: 'culture', text: 'The funeral of the singer Umm Kulthum draws millions into Cairo’s streets.' },
      { yr: '1977', type: 'politics', text: '“Bread riots” erupt across Cairo against cuts to food subsidies.' },
      { yr: '1981', type: 'conflict', text: 'President Sadat is assassinated at a Cairo military parade.' },
      { yr: '1992', type: 'disaster', text: 'An earthquake kills over 500 people and topples old buildings.' },
      { yr: '2011', type: 'politics', text: 'The Tahrir Square uprising forces Hosni Mubarak from power.' },
      { yr: '2013', type: 'conflict', text: 'Mass protests and a military takeover convulse the capital.' },
      { yr: '2015', type: 'growth', text: 'Ground is broken on a vast New Administrative Capital east of Cairo.' },
      { yr: '2021', type: 'culture', text: 'Twenty-two royal mummies are paraded in a golden convoy to a new museum.' },
    ],
    links: [
      { title: 'Historic Cairo — UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/89/', type: 'Official' },
      { title: 'Memphis & its Necropolis (Giza pyramids) — UNESCO', url: 'https://whc.unesco.org/en/list/86/', type: 'Official' },
      { title: 'The Grand Egyptian Museum', url: 'https://visit-gem.com/', type: 'Official' },
      { title: 'Egyptian Tourism Authority (official)', url: 'https://egypt.travel/', type: 'Official' },
      { title: 'Cairo — Encyclopædia Britannica', url: 'https://www.britannica.com/place/Cairo', type: 'Reference' },
      { title: 'Ancient Egypt — World History Encyclopedia', url: 'https://www.worldhistory.org/egypt/', type: 'Reference' },
    ],
  },

  /* =================================================================== */
  /* TOKYO                                                               */
  /* =================================================================== */
  {
    id: 'tokyo',
    name: 'Tokyo',
    native: '東京',
    flag: '🇯🇵',
    country: 'Japan',
    coords: [35.6762, 139.6503],
    warm: false,
    tagline: 'The Eastern Capital — the largest city that has ever existed.',
    accent: '#00f0ff', accent2: '#ff2d78',
    holo: {
      features: [
        { kind: 'coast', name: 'Tokyo Bay', pts: [[46,-30],[40,0],[46,30],[40,56]] },
      ],
      districts: [
        { name: 'Shinjuku', x: -24, z: -6, r: 11, n: 34, hlo: 24, hhi: 66, kind: 'core' },
        { name: 'Marunouchi', x: 8, z: -2, r: 9, n: 26, hlo: 22, hhi: 52, kind: 'core' },
        { name: 'Shibuya', x: -16, z: 12, r: 9, n: 26, hlo: 16, hhi: 40, kind: 'core' },
        { name: 'Ginza', x: 16, z: 6, r: 8, n: 22, hlo: 14, hhi: 34, kind: 'mid' },
        { name: 'Imperial Palace', x: 2, z: -2, r: 8, kind: 'green' },
        { name: 'Asakusa', x: 28, z: -16, r: 8, n: 22, hlo: 8, hhi: 20, kind: 'low' },
        { name: 'Odaiba', x: 34, z: 24, r: 9, n: 16, hlo: 12, hhi: 34, kind: 'mid' },
      ],
      specials: [
        { kind: 'spire', name: 'Tokyo Skytree', x: 30, z: -18, size: 2.2, h: 72 },
        { kind: 'spire', name: 'Tokyo Tower', x: 6, z: 16, size: 2, h: 40 },
      ],
    },
    founded: 'Edo (village, fortified 1457); capital from 1603; renamed Tokyo 1868',
    populationLine: '≈14 million (metropolis); ≈37 million metro — the world’s largest',
    stats: [
      { k: 'Founded', v: '1457 / 1603' },
      { k: 'Metro pop.', v: '≈37 M' },
      { k: 'Elevation', v: '40 m' },
      { k: 'Area', v: '2,194 km²' },
      { k: 'Time zone', v: 'JST +9' },
      { k: 'Byname', v: 'Eastern Capital' },
    ],
    quickfacts: [
      { label: 'Country', value: 'Japan (national capital)' },
      { label: 'Setting', value: 'Kantō Plain, head of Tokyo Bay' },
      { label: 'Founded', value: 'Edo Castle 1457; shogun’s capital 1603' },
      { label: 'Population', value: '≈14 M metropolis · ≈37 M metro' },
      { label: 'Language', value: 'Japanese' },
      { label: 'Known for', value: 'Scale, technology, cuisine, pop culture' },
    ],
    landmarks: [
      { name: 'The Imperial Palace', note: 'The former Edo Castle at the city’s dead centre; residence of the Emperor amid a moated forest of green.' },
      { name: 'Sensō-ji, Asakusa', note: 'Tokyo’s oldest temple, traditionally founded 645 AD, its Kaminarimon gate hung with a giant red lantern.' },
      { name: 'Shibuya Crossing', note: 'The world’s busiest pedestrian scramble; up to 3,000 people cross at once beneath a canyon of screens.' },
      { name: 'Tokyo Tower & Skytree', note: 'A 1958 Eiffel-red broadcast tower and, at 634 m, the tallest tower on Earth (2012).' },
      { name: 'Meiji Shrine', note: 'A Shinto shrine of 1920 set in a planted forest of 100,000 donated trees, honouring the Meiji Emperor.' },
    ],
    sections: [
      { id: 'overview', icon: '◍', title: 'Overview', html: `
        <p class="lede">Tokyo is the largest metropolitan area in the history of the world — roughly 37 million people in its greater region, a low-rise ocean of neighbourhoods punctuated by skyscraper districts. It is the seat of the Japanese Emperor and government, the country’s financial engine, and a global capital of technology, design, cuisine and popular culture.</p>
        <p>For most of its life the city was called <strong>Edo</strong>. It became Japan’s de facto capital in 1603 as the seat of the Tokugawa shoguns, grew into perhaps the largest city on Earth by 1700, and was renamed <strong>Tōkyō</strong> — “eastern capital” — in 1868 when the emperor moved there from Kyoto. It has been destroyed twice in the modern era, by earthquake and by fire from the air, and twice rebuilt itself into something greater.</p>` },
      { id: 'geography', icon: '⬡', title: 'Geography & setting', html: `
        <p>Tokyo occupies the <strong>Kantō Plain</strong>, Japan’s largest lowland, at the head of <strong>Tokyo Bay</strong> on the Pacific coast of Honshu. The Sumida and Ara rivers thread the eastern flats; to the west the land climbs toward mountains, and on a clear winter morning <strong>Mount Fuji</strong> floats blue on the horizon.</p>
        <p>The city sits where several tectonic plates grind together, making it one of the most <strong>earthquake-prone</strong> great cities on Earth — a fact stamped into its building codes, its drills and its collective memory. Administratively, “Tokyo” is not a city but a <em>metropolis</em> (<em>to</em>): 23 special wards, a belt of western cities, mountains, and even subtropical Pacific islands 1,000 km south all fall under one government.</p>` },
      { id: 'founding', icon: '⌘', title: 'Founding & the shogun’s city', html: `
        <p>Edo began as a fishing village at a river mouth. In <strong>1457</strong> the warrior-poet <strong>Ōta Dōkan</strong> raised <strong>Edo Castle</strong> on the site. Its fortunes turned in <strong>1590</strong> when <strong>Tokugawa Ieyasu</strong> was granted the region and made it his base; after victory at Sekigahara he became shogun in <strong>1603</strong> and made Edo the seat of his government while the emperor remained, powerless, in Kyoto.</p>
        <p>Under the Tokugawa “great peace” (the <strong>Edo period</strong>, 1603–1868), the city exploded past a million people — likely the largest in the world. The <em>sankin-kōtai</em> system forced every provincial lord to keep a mansion in Edo and reside there in alternate years, pouring wealth, samurai and hostages into the capital. In <strong>1868</strong> the Meiji Restoration ended the shogunate; the boy emperor relocated from Kyoto, Edo Castle became the Imperial Palace, and the city was renamed Tokyo.</p>` },
      { id: 'culture', icon: '❖', title: 'Culture & society', html: `
        <p>Edo gave Japan much of its enduring popular culture: <strong>kabuki</strong> theatre, <strong>sumo</strong> wrestling, the pleasure districts of the “floating world,” and the <strong>ukiyo-e</strong> woodblock prints of Hokusai and Hiroshige that later stunned the painters of Europe. The refined and the raucous have always shared the same streets here.</p>
        <p>Modern Tokyo is a global tastemaker — the neon scramble of <strong>Shibuya</strong>, the street fashion of <strong>Harajuku</strong>, the quiet luxury of <strong>Ginza</strong>, the electronics and otaku culture of <strong>Akihabara</strong>, and the world’s densest concentrations of <strong>anime</strong>, <strong>manga</strong> and video-game production. Yet the ancient endures beside it: the <strong>Sensō-ji</strong> temple in Asakusa and the forested <strong>Meiji Shrine</strong> draw millions, and the seasons are marked by hanami cherry-blossom picnics and summer <em>matsuri</em>.</p>` },
      { id: 'food', icon: '✦', title: 'Food & cuisine', html: `
        <p>Tokyo holds more Michelin stars than any other city on Earth, but its food culture lives just as intensely at tiny counters and street stalls. <strong>Sushi</strong> in the <em>Edomae</em> style — fish from the bay, pressed over vinegared rice — was born here as fast food for busy townsfolk.</p>
        <p>The city’s canon runs from <strong>tempura</strong> and <strong>soba</strong> (both Edo inventions) to <strong>ramen</strong>, <strong>tonkatsu</strong>, <strong>unagi</strong> (grilled eel over rice), the local griddle-dish <strong>monjayaki</strong>, and the after-work world of the <strong>izakaya</strong>, where salarymen unwind over yakitori and beer. The vast <strong>Toyosu</strong> market — successor to the legendary Tsukiji — handles seafood from across Japan, and its pre-dawn tuna auctions are a spectacle in themselves.</p>` },
      { id: 'animals', icon: '✧', title: 'Animals & wildlife', html: `
        <p>No animal is more beloved in Tokyo than <strong>Hachikō</strong>, the Akita dog who returned to Shibuya Station every evening for nearly ten years to wait for his dead owner, and is now cast in bronze at the world’s busiest crossing. Japanese folklore fills the city’s imagination with the shape-shifting <strong>tanuki</strong> (raccoon dog) and the fox-spirit <strong>kitsune</strong>, whose statues guard the Inari shrines.</p>
        <p>Along the rivers and in the parks live <strong>koi</strong> carp, herons, and the clever, ever-present <strong>jungle crows</strong> that raid the morning rubbish. Tokyo Bay still supports fisheries, and the mountains at the metropolis’s western edge are home to <strong>Japanese macaques</strong> — the famous snow monkeys — sika deer and, higher up, the serow.</p>` },
      { id: 'resources', icon: '◆', title: 'Natural resources & economy', html: `
        <p>Japan is famously <strong>poor in natural resources</strong> — it imports almost all of its energy and raw materials — so Tokyo’s wealth was built on human skill, manufacturing and trade rather than minerals. Its historic resources were the <strong>rice</strong> of the Kantō Plain and the <strong>fisheries</strong> of Tokyo Bay, whose reclaimed shallows now carry the city itself.</p>
        <p>Today Tokyo is one of the foremost <strong>financial centres</strong> on Earth, home to the Tokyo Stock Exchange and the headquarters of many of the world’s largest corporations — descendants of the <em>zaibatsu</em> conglomerates Mitsui, Mitsubishi and Sumitomo. Its economy spans finance, electronics, precision machinery, automotive design, robotics, publishing, media and technology.</p>` },
      { id: 'wars', icon: '⚔', title: 'Wars & disasters', html: `
        <p>Edo was forged in the <strong>Sengoku</strong> (“Warring States”) era and secured by Tokugawa Ieyasu’s victory at Sekigahara. The long peace ended in the <strong>Boshin War (1868–69)</strong> that restored the emperor and swept the samurai away within a generation.</p>
        <p>Two catastrophes define modern Tokyo’s memory. The <strong>Great Kantō Earthquake of 1923</strong> and its firestorms killed on the order of 100,000–140,000 people at the lunch hour and levelled much of the city. Two decades later, the <strong>firebombing of 10 March 1945</strong> in the Second World War destroyed vast wooden districts and killed around 100,000 in a single night — one of the deadliest air raids in history. Rebuilt from ash each time, Tokyo hosted the Olympic Games in <strong>1964</strong>, announcing its recovery to the world, and again in <strong>2021</strong>.</p>` },
      { id: 'religion', icon: '☾', title: 'Religion & belief', html: `
        <p>Tokyo’s spiritual life blends <strong>Shinto</strong> and <strong>Buddhism</strong>, often in the same lifetime and even the same festival — a person may be blessed as a baby at a Shinto shrine, married in one rite and given a Buddhist funeral, without seeing any contradiction. Thousands of shrines and temples dot the city, from the ancient <strong>Sensō-ji</strong> to the serene <strong>Meiji Shrine</strong> raised in 1920 in a man-made forest.</p>
        <p>Belief here is less doctrine than rhythm: New Year shrine visits (<em>hatsumōde</em>) draw millions in the first days of January, summer <em>matsuri</em> carry portable shrines through the streets, and the fleeting cherry blossom of spring gives the whole city a shared, wordless observance of impermanence.</p>` },
      { id: 'language', icon: '⌥', title: 'Language', html: `
        <p>The language is <strong>Japanese</strong>, written in an intricate mix of <em>kanji</em> (Chinese characters) and the two kana syllabaries, hiragana and katakana. The modern standard language is based on the <strong>Tokyo dialect</strong>, spread nationwide through a century of broadcasting, schooling and print.</p>` },
    ],
    figures: [
      { name: 'Ōta Dōkan', dates: '1432–1486', role: 'Warrior-poet', note: 'Built the first Edo Castle in 1457, planting the seed of the future capital.' },
      { name: 'Tokugawa Ieyasu', dates: '1543–1616', role: 'First Tokugawa shogun', note: 'Made Edo the seat of power and founded 250 years of peace.' },
      { name: 'Katsushika Hokusai', dates: '1760–1849', role: 'Ukiyo-e artist', note: 'A lifelong Edoite; creator of The Great Wave off Kanagawa.' },
      { name: 'Iwasaki Yatarō', dates: '1835–1885', role: 'Industrialist', note: 'Founded Mitsubishi, which grew into one of Japan’s great conglomerates.' },
      { name: 'Emperor Meiji', dates: '1852–1912', role: 'Emperor', note: 'Moved the throne to Tokyo and presided over Japan’s rush into the modern world.' },
      { name: 'Haruki Murakami', dates: 'b. 1949', role: 'Novelist', note: 'The city’s most globally read chronicler of modern loneliness.' },
    ],
    families: [
      { name: 'The Tokugawa', role: 'Shogunal dynasty (1603–1868)', text: 'Founded by Tokugawa Ieyasu, the shoguns ruled Japan from Edo for over 250 years of peace and isolation, making the city the nation’s political and cultural heart while the emperor stayed in Kyoto.' },
      { name: 'The Imperial House', role: 'The Japanese monarchy', text: 'By tradition the world’s oldest continuous hereditary monarchy. In 1868 the emperor moved from Kyoto to Edo Castle, which became the Imperial Palace at the exact centre of Tokyo.' },
      { name: 'The Iwasaki (Mitsubishi)', role: 'Industrial founding family', text: 'Iwasaki Yatarō founded Mitsubishi in the 1870s as a shipping firm; it grew into a zaibatsu spanning shipbuilding, banking, heavy industry, aircraft and, later, cars and electronics.' },
      { name: 'The Mitsui', role: 'Merchant-to-industrial dynasty', text: 'From a 17th-century Edo dry-goods and money-changing house — inventors of the fixed-price cash sale — the Mitsui built one of the largest and oldest business conglomerates in the world.' },
    ],
    timeline: [
      { yr: '645 AD', type: 'culture', text: 'Sensō-ji temple is traditionally founded in the fishing village of Asakusa.' },
      { yr: '1457', type: 'major', text: 'The warrior-poet Ōta Dōkan raises the first Edo Castle.' },
      { yr: '1590', type: 'politics', text: 'Tokugawa Ieyasu is granted the Kantō region and makes Edo his base.' },
      { yr: '1600', type: 'conflict', text: 'Ieyasu wins the Battle of Sekigahara, becoming master of Japan.' },
      { yr: '1603', type: 'major', text: 'Ieyasu becomes shogun; Edo becomes the seat of national power.' },
      { yr: '1657', type: 'disaster', text: 'The Great Fire of Meireki destroys much of Edo and kills tens of thousands.' },
      { yr: '1703', type: 'disaster', text: 'The Genroku earthquake and its aftermath devastate the region.' },
      { yr: '1707', type: 'disaster', text: 'Mount Fuji erupts, dusting Edo with volcanic ash.' },
      { yr: 'c.1720', type: 'growth', text: 'Edo passes a million people — probably the largest city in the world.' },
      { yr: '1855', type: 'disaster', text: 'The Ansei Edo earthquake kills thousands in the shogunal capital.' },
      { yr: '1853', type: 'politics', text: 'Commodore Perry’s “black ships” arrive off Uraga, forcing Japan open.' },
      { yr: '1860', type: 'conflict', text: 'The shogun’s chief minister Ii Naosuke is assassinated outside Edo Castle.' },
      { yr: '1868', type: 'major', text: 'The Meiji Restoration ends the shogunate; Edo is renamed Tokyo, the “eastern capital.”' },
      { yr: '1872', type: 'growth', text: 'Japan’s first railway links Tokyo to Yokohama.' },
      { yr: '1889', type: 'politics', text: 'The Meiji Constitution is promulgated, creating an imperial parliament.' },
      { yr: '1905', type: 'politics', text: 'Riots erupt in Tokyo over the terms of peace ending the Russo-Japanese War.' },
      { yr: '1914', type: 'growth', text: 'Tokyo Station opens, a red-brick symbol of the modern city.' },
      { yr: '1923', type: 'disaster', text: 'The Great Kantō Earthquake and firestorms kill over 100,000 and level the city.' },
      { yr: '1936', type: 'politics', text: 'Young officers stage a bloody coup attempt (the February 26 Incident) in central Tokyo.' },
      { yr: '1945', type: 'disaster', text: 'The firebombing of 10 March kills around 100,000 in a single night.' },
      { yr: '1945', type: 'major', text: 'Japan surrenders; Tokyo comes under Allied occupation.' },
      { yr: '1947', type: 'politics', text: 'A new constitution makes the emperor a symbol and renounces war.' },
      { yr: '1958', type: 'culture', text: 'Tokyo Tower opens, a red-and-white beacon of postwar recovery.' },
      { yr: '1964', type: 'growth', text: 'Tokyo hosts the Olympics; the first bullet train (Shinkansen) begins running.' },
      { yr: '1968–69', type: 'politics', text: 'Student protests and barricades rock Tokyo’s universities.' },
      { yr: '1990', type: 'growth', text: 'The asset “bubble economy” peaks before a long, grinding slump.' },
      { yr: '1995', type: 'conflict', text: 'The Aum Shinrikyo cult releases sarin gas on the Tokyo subway, killing 13.' },
      { yr: '2011', type: 'disaster', text: 'The Tōhoku earthquake shakes Tokyo and triggers the Fukushima crisis to the north.' },
      { yr: '2012', type: 'growth', text: 'Tokyo Skytree opens at 634 m, the world’s tallest tower.' },
      { yr: '2020', type: 'disaster', text: 'The COVID-19 pandemic empties Tokyo’s streets and postpones the Olympics.' },
      { yr: '2021', type: 'culture', text: 'Tokyo hosts the delayed 2020 Olympics behind closed doors.' },
    ],
    links: [
      { title: 'Tokyo Metropolitan Government (official)', url: 'https://www.metro.tokyo.lg.jp/english/', type: 'Official' },
      { title: 'Go Tokyo — Official Tokyo Travel Guide', url: 'https://www.gotokyo.org/en/', type: 'Official' },
      { title: 'Imperial Household Agency (official)', url: 'https://www.kunaicho.go.jp/eindex.html', type: 'Official' },
      { title: 'Tokyo — Encyclopædia Britannica', url: 'https://www.britannica.com/place/Tokyo', type: 'Reference' },
      { title: 'Edo Period — World History Encyclopedia', url: 'https://www.worldhistory.org/Edo_Period/', type: 'Reference' },
    ],
  },

  /* =================================================================== */
  /* MEXICO CITY                                                         */
  /* =================================================================== */
  {
    id: 'mexico-city',
    name: 'Mexico City',
    native: 'Ciudad de México',
    flag: '🇲🇽',
    country: 'Mexico',
    coords: [19.4326, -99.1332],
    warm: false,
    tagline: 'An Aztec island-city reborn — built on a lake, sinking, unsinkable.',
    accent: '#9dff3d', accent2: '#ff3d8b',
    holo: {
      features: [
        { kind: 'avenue', name: 'Reforma', pts: [[-26,-16],[-10,-6],[4,0]] },
        { kind: 'lake', name: 'Xochimilco', pts: [[0,44],[8,50],[18,46]] },
      ],
      districts: [
        { name: 'Centro Histórico', x: 4, z: 0, r: 10, n: 28, hlo: 6, hhi: 16, kind: 'low' },
        { name: 'Reforma', x: -9, z: -6, r: 9, n: 22, hlo: 16, hhi: 44, kind: 'core' },
        { name: 'Polanco', x: -19, z: -10, r: 8, n: 20, hlo: 14, hhi: 34, kind: 'mid' },
        { name: 'Roma–Condesa', x: -6, z: 9, r: 8, n: 22, hlo: 6, hhi: 14, kind: 'low' },
        { name: 'Santa Fe', x: -42, z: 6, r: 10, n: 18, hlo: 14, hhi: 42, kind: 'core' },
        { name: 'Chapultepec', x: -17, z: -2, r: 7, kind: 'green' },
        { name: 'Xochimilco', x: 10, z: 48, r: 12, kind: 'green' },
      ],
      specials: [
        { kind: 'volcano', name: 'Popocatépetl', x: 54, z: 46, size: 14, h: 28 },
        { kind: 'volcano', x: 62, z: 54, size: 12, h: 20 },
      ],
    },
    founded: 'Tenochtitlan founded 1325 by the Mexica (Aztecs)',
    populationLine: '≈9.2 million (city proper); ≈22 million metro',
    stats: [
      { k: 'Founded', v: '1325' },
      { k: 'Metro pop.', v: '≈22 M' },
      { k: 'Elevation', v: '2,240 m' },
      { k: 'Area', v: '1,485 km²' },
      { k: 'Time zone', v: 'CST −6' },
      { k: 'Byname', v: 'CDMX' },
    ],
    quickfacts: [
      { label: 'Country', value: 'Mexico (national capital, CDMX)' },
      { label: 'Setting', value: 'A drained lake basin at 2,240 m altitude' },
      { label: 'Founded', value: '1325 (Aztec Tenochtitlan); rebuilt by Spain 1521' },
      { label: 'Population', value: '≈9.2 M city · ≈22 M metro' },
      { label: 'Language', value: 'Spanish (with Nahuatl heritage)' },
      { label: 'Known for', value: 'Aztec & colonial heritage, muralism, cuisine' },
    ],
    landmarks: [
      { name: 'The Zócalo & Metropolitan Cathedral', note: 'One of the largest public squares in the world, over the buried Aztec sacred precinct; the cathedral took 250 years to build.' },
      { name: 'Templo Mayor', note: 'The excavated great pyramid of the Mexica, rediscovered in 1978 by electricians a step from the cathedral.' },
      { name: 'Chapultepec Castle', note: 'The only true royal castle in the Americas, on a hill sacred since Aztec times; stormed by U.S. troops in 1847.' },
      { name: 'Palacio de Bellas Artes', note: 'A white-marble Art Nouveau/Deco palace holding murals by Rivera, Orozco and Siqueiros.' },
      { name: 'Xochimilco', note: 'Surviving Aztec canals and floating chinampa gardens, a UNESCO site and last refuge of the axolotl.' },
    ],
    sections: [
      { id: 'overview', icon: '◍', title: 'Overview', html: `
        <p class="lede">Mexico City is one of the oldest and largest capitals in the Americas — a metropolis of some 22 million built directly on top of an Aztec island-city, in the drained bed of a highland lake, at an altitude of about 2,240 metres. It is the largest Spanish-speaking city on Earth and the political, cultural and economic heart of Mexico.</p>
        <p>Its foundation story is stamped on the national flag: an <strong>eagle on a cactus, devouring a serpent</strong>, the omen that told the wandering Mexica exactly where to build <strong>Tenochtitlan</strong>. When the Spanish arrived in 1519 they found a city of a quarter-million on the water, laced with canals and causeways, larger and cleaner than most in Europe — and then they destroyed it and built their own capital on the rubble.</p>` },
      { id: 'geography', icon: '⬡', title: 'Geography & setting', html: `
        <p>The city sits in the <strong>Valley of Mexico</strong>, a high basin ringed by mountains and volcanoes — including the smoking, snow-capped <strong>Popocatépetl</strong> and its sleeping companion Iztaccíhuatl. The Aztecs built their capital on an island in shallow <strong>Lake Texcoco</strong> and fed it with <em>chinampas</em>, floating garden-plots of astonishing yield. The Spanish, fearing floods, spent centuries draining the lakes away.</p>
        <p>That drained lakebed is the city’s great curse. The soft clay compacts as groundwater is pumped out, so Mexico City is literally <strong>sinking</strong> — parts of the historic centre have dropped several metres over a century, tilting churches and snapping water mains. The same soft ground amplifies <strong>earthquakes</strong>, as the disasters of 1985 and 2017 showed, and the high, enclosed basin once trapped some of the worst smog on Earth.</p>` },
      { id: 'founding', icon: '⌘', title: 'Founding & conquest', html: `
        <p>By their own history, the <strong>Mexica</strong> (Aztecs) migrated from a northern homeland, <em>Aztlán</em>, guided by their war-god <strong>Huitzilopochtli</strong>. In <strong>1325</strong> they saw the promised sign — the eagle on the cactus — on a marshy island and founded <strong>Tenochtitlan</strong>. Through causeways, aqueducts and chinampas it grew into one of the largest cities in the world and the capital of a tribute empire stretching across central Mexico.</p>
        <p>In <strong>1519</strong> the Spaniard <strong>Hernán Cortés</strong> arrived with a few hundred men. Allied with the Tlaxcalans — bitter enemies of the Aztecs — and aided catastrophically by <strong>smallpox</strong>, to which the Mexica had no immunity, he besieged and destroyed Tenochtitlan in <strong>1521</strong>. The Spanish razed the temples, drained the lake, and built <strong>Mexico City</strong> over the ruins as the capital of the Viceroyalty of New Spain — the cathedral rising literally on top of the buried <strong>Templo Mayor</strong>.</p>` },
      { id: 'culture', icon: '❖', title: 'Culture & society', html: `
        <p>Mexico City’s culture is <em>mestizo</em> — a fusion of Indigenous and Spanish worlds that neither fully erased. Its most famous festival, the <strong>Day of the Dead</strong> (<em>Día de Muertos</em>), is recognised by UNESCO as intangible cultural heritage; its marigold altars, sugar skulls and skeletal <em>calaveras</em> turn mourning into a joyful reunion with the dead.</p>
        <p>In the 20th century the city led the <strong>Mexican muralist</strong> movement — the monumental public frescoes of <strong>Diego Rivera</strong>, José Clemente Orozco and David Alfaro Siqueiros, painting the nation’s history onto its ministry walls — and gave the world the painter <strong>Frida Kahlo</strong>. Its living traditions include <strong>mariachi</strong> at Plaza Garibaldi, the masked, high-flying spectacle of <strong>lucha libre</strong>, and one of the densest concentrations of museums of any city, crowned by the great <strong>National Museum of Anthropology</strong>.</p>` },
      { id: 'food', icon: '✦', title: 'Food & cuisine', html: `
        <p>Mexican cuisine is inscribed on UNESCO’s list of intangible cultural heritage, and Mexico City is its grand bazaar. The city runs on the <strong>taco</strong> in a hundred forms — <em>al pastor</em> carved from a spinning trompo, carnitas, suadero, barbacoa — plus <strong>tamales</strong> steamed in corn husks, <strong>quesadillas</strong>, <strong>tlacoyos</strong> and street corn (<strong>elote</strong> and <strong>esquites</strong>) slathered with lime, chilli and cheese.</p>
        <p>Deeper in the tradition are the great <strong>moles</strong> — sauces of dozens of chilis, spices and chocolate ground together — <strong>chiles en nogada</strong> dressed in the colours of the flag, and <strong>pozole</strong>. Much of the world’s pantry began here: <strong>maize, cacao (chocolate), chili, tomato, vanilla and avocado</strong> are all Mesoamerican. The bravest eaters still enjoy pre-Hispanic delicacies — <em>chapulines</em> (grasshoppers) and <em>escamoles</em> (ant larvae, “insect caviar”).</p>` },
      { id: 'animals', icon: '✧', title: 'Animals & wildlife', html: `
        <p>The city’s most extraordinary animal is the <strong>axolotl</strong> — a salamander that never grows up, keeping its feathery gills and larval form for life, and able to regrow whole limbs and even parts of its brain. It is endemic to the canals of <strong>Xochimilco</strong> and now critically endangered in the wild, a living emblem of the vanished lakes.</p>
        <p>From the Aztec world come the <strong>Xoloitzcuintli</strong>, the ancient hairless dog associated with the god Xolotl and believed to guide souls through the underworld, and the <strong>golden eagle</strong> of the founding myth, still the national bird on the flag. The chinampas of Xochimilco remain a haven for herons, egrets and migratory waterfowl in the middle of a megacity.</p>` },
      { id: 'resources', icon: '◆', title: 'Natural resources & economy', html: `
        <p>The wealth of colonial New Spain was <strong>silver</strong> — Mexico became the greatest silver producer in the world, and Mexico City was where that silver was minted into the “pieces of eight” that circulated as far as China, funding its palaces and churches. The Valley’s <strong>volcanic soils</strong> and the intensely productive lake <em>chinampas</em> fed the ancient city several harvests a year.</p>
        <p>Modern Mexico City generates a large share of the national economy across <strong>finance, services, manufacturing, media and government</strong>. Nationally, Mexico is a major producer of <strong>silver, oil</strong> and agricultural goods; the capital is the country’s corporate and financial command centre and one of Latin America’s principal business hubs.</p>` },
      { id: 'wars', icon: '⚔', title: 'Wars & conflicts', html: `
        <p>Mexico City has been a prize of war again and again. The <strong>Spanish conquest (1519–21)</strong> destroyed the Aztec capital. Three centuries later the <strong>War of Independence (1810–21)</strong> ended Spanish rule. In the <strong>Mexican–American War</strong>, U.S. forces stormed the city in 1847 and took Chapultepec Castle — the young military cadets who died rather than surrender are honoured as the <strong>Niños Héroes</strong>, one said to have leapt from the walls wrapped in the flag.</p>
        <p>The <strong>French intervention</strong> installed the doomed Habsburg emperor Maximilian (1864–67), executed on the orders of Benito Juárez. The <strong>Mexican Revolution (1910–20)</strong> — of Madero, Zapata and Villa — remade the nation at the cost of perhaps a million lives. In <strong>1968</strong>, ten days before the Olympic Games opened, the army fired on student protesters in the <strong>Tlatelolco massacre</strong>, a wound still raw in the city’s politics.</p>` },
      { id: 'religion', icon: '☾', title: 'Religion & belief', html: `
        <p>The Mexica practised a demanding <strong>polytheism</strong> — Huitzilopochtli the sun and war god, Tlaloc the rain god, Quetzalcoatl the feathered serpent — centred on the twin-templed Templo Mayor, and sustained, by their own accounts, with large-scale human sacrifice meant to keep the sun in motion.</p>
        <p>After the conquest the city became overwhelmingly <strong>Roman Catholic</strong>, but on its own terms. Its central devotion is to <strong>Our Lady of Guadalupe</strong>, who by tradition appeared in 1531 to the Indigenous convert Juan Diego on a hill sacred to an Aztec goddess. The <strong>Basilica of Guadalupe</strong> is now among the most visited Catholic shrines on Earth — a fusion of Indigenous and Spanish faith that became a symbol of Mexican identity itself.</p>` },
      { id: 'language', icon: '⌥', title: 'Language', html: `
        <p>The language of the city is <strong>Spanish</strong> — Mexico City is the largest Spanish-speaking city in the world. Beneath it lives <strong>Nahuatl</strong>, the language of the Aztecs, still spoken by over a million people nationally and quietly present in every kitchen: <em>chocolate</em>, <em>tomato</em>, <em>avocado</em>, <em>chili</em>, <em>coyote</em> and <em>chic­le</em> are all Nahuatl words the world now uses.</p>` },
    ],
    figures: [
      { name: 'Moctezuma II', dates: 'c. 1466–1520', role: 'Aztec emperor', note: 'Ruled Tenochtitlan at its height and received — fatally — Cortés into the city.' },
      { name: 'Cuauhtémoc', dates: 'c. 1495–1525', role: 'Last tlatoani', note: 'Led the final defence of Tenochtitlan; a national symbol of resistance.' },
      { name: 'Sor Juana Inés de la Cruz', dates: '1648–1695', role: 'Poet & scholar', note: 'A self-taught nun and one of the greatest writers of the Spanish Golden Age.' },
      { name: 'Benito Juárez', dates: '1806–1872', role: 'President', note: 'Zapotec reformer who defeated the French-backed empire.' },
      { name: 'Diego Rivera', dates: '1886–1957', role: 'Muralist', note: 'Painted the nation’s epic onto the walls of its public buildings.' },
      { name: 'Frida Kahlo', dates: '1907–1954', role: 'Painter', note: 'Turned her own pain and heritage into some of the most recognised art of the century.' },
    ],
    families: [
      { name: 'The Mexica tlatoque', role: 'Aztec ruling dynasty', text: 'The line of rulers (tlatoque) from Acamapichtli (c. 1375) through Moctezuma I and II to Cuauhtémoc, who built and led an empire from Tenochtitlan until the Spanish conquest ended it.' },
      { name: 'Hernán Cortés & the conquistadors', role: 'Spanish conquest', text: 'Cortés destroyed Tenochtitlan in 1521 and founded Mexico City over it, becoming the first Marqués del Valle de Oaxaca and setting the pattern of colonial New Spain.' },
      { name: 'The criollo elite', role: 'Colonial aristocracy', text: 'American-born Spanish families grew immensely wealthy on silver mining and vast estates during three centuries as capital of New Spain, and ultimately led the drive to independence against the Crown.' },
      { name: 'Revolutionary leaders', role: 'Makers of modern Mexico', text: 'From Miguel Hidalgo’s 1810 cry for independence and Benito Juárez’s reforms to Madero, Zapata and Villa in the Revolution, these figures reshaped the nation from and around its capital.' },
    ],
    timeline: [
      { yr: '1325', type: 'major', text: 'The Mexica found Tenochtitlan on an island in Lake Texcoco, guided by the eagle-and-cactus omen.' },
      { yr: '1375', type: 'politics', text: 'Acamapichtli becomes the first tlatoani (ruler) of the Mexica.' },
      { yr: '1428', type: 'politics', text: 'The Aztec Triple Alliance is forged; the empire begins to expand.' },
      { yr: '1440', type: 'growth', text: 'Under Moctezuma I the city builds a great dyke and aqueducts against flooding.' },
      { yr: '1487', type: 'culture', text: 'The rebuilt Templo Mayor is dedicated with mass sacrificial rites.' },
      { yr: '1502', type: 'politics', text: 'Moctezuma II ascends the throne at the empire’s height.' },
      { yr: '1519', type: 'conflict', text: 'Hernán Cortés reaches Tenochtitlan and takes Moctezuma hostage.' },
      { yr: '1520', type: 'conflict', text: 'The “Sad Night”: the Mexica drive the Spanish from the city with heavy losses.' },
      { yr: '1521', type: 'major', text: 'After a brutal siege and smallpox, Tenochtitlan falls; Cortés founds Mexico City on the ruins.' },
      { yr: '1531', type: 'culture', text: 'Our Lady of Guadalupe is said to appear to Juan Diego on Tepeyac hill.' },
      { yr: '1535', type: 'politics', text: 'Mexico City becomes the capital of the Viceroyalty of New Spain.' },
      { yr: '1551', type: 'culture', text: 'The Royal University of Mexico is founded, among the first in the Americas.' },
      { yr: '1629', type: 'disaster', text: 'A catastrophic flood submerges the city for years, prompting vast drainage works.' },
      { yr: '1692', type: 'politics', text: 'Riots over maize shortages burn the viceroy’s palace on the Zócalo.' },
      { yr: '1810', type: 'conflict', text: 'Father Hidalgo’s “Cry of Dolores” launches the war of independence.' },
      { yr: '1821', type: 'major', text: 'Independence is won; Mexico City becomes capital of a new nation.' },
      { yr: '1847', type: 'conflict', text: 'US troops storm Chapultepec Castle; the young cadets die as the Niños Héroes.' },
      { yr: '1864', type: 'politics', text: 'The French install the Habsburg Maximilian as emperor in Mexico City.' },
      { yr: '1867', type: 'conflict', text: 'Maximilian is overthrown and executed; the republic is restored under Juárez.' },
      { yr: '1877', type: 'growth', text: 'Porfirio Díaz begins decades of rule, modernising and beautifying the capital.' },
      { yr: '1910', type: 'conflict', text: 'The Mexican Revolution erupts against the Díaz dictatorship.' },
      { yr: '1913', type: 'conflict', text: 'The “Ten Tragic Days” of street fighting devastate central Mexico City.' },
      { yr: '1929', type: 'politics', text: 'The party that will rule for 71 years (later the PRI) is founded.' },
      { yr: '1934', type: 'culture', text: 'The Palace of Fine Arts opens, filling with murals by Rivera and his rivals.' },
      { yr: '1968', type: 'conflict', text: 'Troops massacre student protesters at Tlatelolco days before the Olympics.' },
      { yr: '1968', type: 'culture', text: 'Mexico City hosts the Summer Olympics, the first in Latin America.' },
      { yr: '1978', type: 'culture', text: 'Electrical workers rediscover the buried Templo Mayor beneath the centre.' },
      { yr: '1985', type: 'disaster', text: 'A magnitude-8 earthquake kills thousands and flattens whole districts.' },
      { yr: '2009', type: 'disaster', text: 'The H1N1 flu pandemic first alarms the world from Mexico City.' },
      { yr: '2016', type: 'politics', text: 'The Federal District becomes the autonomous entity of Mexico City (CDMX).' },
      { yr: '2017', type: 'disaster', text: 'Another major earthquake — 32 years to the day after 1985 — strikes the city.' },
    ],
    links: [
      { title: 'Historic Centre & Xochimilco — UNESCO World Heritage', url: 'https://whc.unesco.org/en/list/412/', type: 'Official' },
      { title: 'Gobierno de la Ciudad de México (official)', url: 'https://www.cdmx.gob.mx/', type: 'Official' },
      { title: 'National Museum of Anthropology (INAH)', url: 'https://www.mna.inah.gob.mx/', type: 'Official' },
      { title: 'Templo Mayor Museum (INAH)', url: 'https://www.templomayor.inah.gob.mx/', type: 'Official' },
      { title: 'Mexico City — Encyclopædia Britannica', url: 'https://www.britannica.com/place/Mexico-City', type: 'Reference' },
      { title: 'Aztec Civilization — World History Encyclopedia', url: 'https://www.worldhistory.org/Aztec_Civilization/', type: 'Reference' },
    ],
  },
];
