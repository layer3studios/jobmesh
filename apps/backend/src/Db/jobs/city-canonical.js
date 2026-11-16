// FILE: src/Db/jobs/city-canonical.js
// ONE owner for "what city is this job in", used by BOTH halves of the City
// filter. That sharing is the whole point of the module.
//
// The facet pills are built by collapsing raw `Location` strings into city
// names; the filter then matches a chosen city back against `Location` with a
// word-boundary regex. While those two used different rules the filter lied:
// merging Bangalore into Bengaluru would have shown one pill reading 1,567 that
// returned only the 856 jobs whose Location literally said "Bengaluru". So
// canonicalCity() decides the label and cityMatchTerms() decides what that
// label matches, and they are derived from the same table.
//
// Every alias below was taken from a pill observed live on jobmesh.in, not
// guessed: Bengaluru(856) sat next to Bangalore(711), Gurugram(89) next to
// Gurgaon(13), and "IND"(50), "IN"(36), "Mumbai Remote"(13), "Hybrid in
// Bangalore"(11) and "Manyata Embassy Business Park"(11) were all offered as
// cities to click.

/**
 * canonical city → every spelling that means it, INCLUDING itself.
 *
 * Two kinds of entry, deliberately mixed because the filter cannot tell them
 * apart and should not care:
 *   • renamed cities — Bengaluru/Bangalore, Gurugram/Gurgaon, Kolkata/Calcutta.
 *     Employers use both, often within one ATS.
 *   • campuses and micro-localities that employers write INSTEAD of the city —
 *     "Manyata Embassy Business Park" is in Bengaluru, "Nanakramguda" and
 *     "Hi-Tec City" are in Hyderabad. As their own pills they are noise; mapped
 *     onto their city they are 40+ extra jobs a seeker can actually find.
 */
export const CITY_ALIASES = Object.freeze({
  Bengaluru: ['bengaluru', 'bangalore', 'bangaluru', 'bengalore', 'blr',
    'manyata embassy business park', 'epip industrial area', 'epip zone',
    'whitefield', 'electronic city', 'bellandur', 'koramangala'],
  Hyderabad: ['hyderabad', 'secunderabad', 'hyd', 'nanakramguda', 'hi-tec city',
    'hitec city', 'hi tech city', 'waverock', 'gachibowli', 'madhapur'],
  Pune: ['pune', 'poona', 'hinjewadi', 'hinjawadi', 'kharadi', 'magarpatta'],
  Mumbai: ['mumbai', 'bombay', 'navi mumbai', 'thane', 'powai', 'andheri', 'bkc'],
  Gurugram: ['gurugram', 'gurgaon'],
  Noida: ['noida', 'greater noida'],
  Delhi: ['delhi', 'new delhi', 'delhi ncr', 'ncr', 'delhi-ncr'],
  Chennai: ['chennai', 'madras', 'itec', 'siruseri', 'taramani'],
  Kolkata: ['kolkata', 'calcutta', 'salt lake'],
  Kochi: ['kochi', 'cochin', 'ernakulam', 'infopark'],
  Thiruvananthapuram: ['thiruvananthapuram', 'trivandrum', 'technopark'],
  Visakhapatnam: ['visakhapatnam', 'vizag', 'vishakhapatnam'],
  Ahmedabad: ['ahmedabad', 'amdavad'],
  Gandhinagar: ['gandhinagar', 'gift city'],
  Jaipur: ['jaipur'],
  Indore: ['indore'],
  Chandigarh: ['chandigarh', 'mohali', 'panchkula'],
  Coimbatore: ['coimbatore'],
  Nagpur: ['nagpur'],
  Bhubaneswar: ['bhubaneswar', 'bhubaneshwar'],
  Mysuru: ['mysuru', 'mysore'],
  Vadodara: ['vadodara', 'baroda'],
  Lucknow: ['lucknow'],
  Bhopal: ['bhopal'],
  Nashik: ['nashik', 'nasik'],
  Sanand: ['sanand'],
  Trichy: ['trichy', 'tiruchirappalli'],
  Mangaluru: ['mangaluru', 'mangalore'],
});

/** alias (lower-case) → canonical. Built once; the table above is the source. */
const ALIAS_TO_CANONICAL = new Map();
for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
  for (const alias of aliases) ALIAS_TO_CANONICAL.set(alias, canonical);
}

/**
 * Segments that are never a city: countries and country CODES, work modes, and
 * the scraper's own leakage.
 *
 * 'ind' and 'in' are the ones that mattered most — they were offered as cities
 * 50 and 36 times. 'in' is also why "Indianapolis IN" survived: a US state code
 * read as India. That is a scraper location-filter problem, not a facet one, but
 * the code itself has no business being a pill either way.
 */
const NON_CITY_SEGMENTS = new Set([
  // countries and codes
  'india', 'ind', 'in', 'bharat', 'apac', 'emea', 'global', 'worldwide',
  // work modes
  'remote', 'hybrid', 'on-site', 'onsite', 'on site', 'in-office', 'in office',
  'office', 'work from home', 'wfh', 'work from office', 'flexible',
  'remote (india)', 'remote - india', 'fully remote', 'telecommute',
  // non-answers
  'n/a', 'na', 'anywhere', 'multiple locations', 'pan india', 'various', 'other',
  'all locations', 'any', 'tbd', 'unknown', 'not specified',
  // field names and statuses a broken mapper has written into Location
  'published', 'active', 'location', 'null', 'undefined', 'none', '-', '',
]);

/**
 * Work-mode and country words stripped from INSIDE a segment, so
 * "Mumbai Remote" and "Hybrid in Bangalore" resolve to their city instead of
 * becoming their own pills. Applied only when something is left over.
 */
const NOISE_WORDS = /\b(remote|hybrid|on-?site|in-?office|wfh|work from home|flexible|india|ind|hq|office|campus|based|only|or|and|in)\b/gi;

/** A city reads as words — not a number, a code, or a URL fragment. */
const CITY_SHAPE = /^[\p{L}][\p{L}\p{M}\s.'’-]*$/u;
/** "example.com" passes CITY_SHAPE; a place name never ends in a bare TLD. */
const LOOKS_LIKE_DOMAIN = /\.[a-z]{2,}$/i;

/**
 * "PUNE" and "noida" were both live pills. Display is Title Case either way.
 *
 * Capitalises after whitespace and hyphens only — NOT after an apostrophe,
 * which would render "Bird's Hill" as "Bird'S Hill".
 */
function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
}

/** Strips noise words and tidies the leftover punctuation/whitespace. */
function denoise(segment) {
  const stripped = segment.replace(NOISE_WORDS, ' ').replace(/\s+/g, ' ').trim();
  return stripped.replace(/^[-–—,.\s]+|[-–—,.\s]+$/g, '');
}

/**
 * Resolve one raw `Location` string to a canonical city, or null when it holds
 * no city at all (a country, a work mode, or junk).
 *
 * Segments are tried in order, so "Bengaluru, Karnataka, India" answers
 * Bengaluru and "India - Hyderabad" answers Hyderabad. A segment matching the
 * alias table wins outright; otherwise the first segment that still looks like
 * a place after denoising is taken at face value and Title Cased, which is what
 * keeps genuine smaller cities from being thrown away just for being absent
 * from the table.
 */
export function canonicalCity(raw) {
  if (typeof raw !== 'string') return null;
  if (raw.includes('://')) return null;

  const segments = raw.split(/[,/|;]|\s[-–—]\s/);

  // Pass 1 — an exact alias anywhere in the string is the most reliable answer.
  for (const part of segments) {
    const seg = part.trim().replace(/\s+/g, ' ').toLowerCase();
    const hit = ALIAS_TO_CANONICAL.get(seg);
    if (hit) return hit;
  }

  // Pass 2 — the same, after stripping work-mode and country noise. This is
  // what turns "Mumbai Remote" and "Hybrid in Bangalore" into real cities.
  for (const part of segments) {
    const seg = denoise(part.trim().replace(/\s+/g, ' ')).toLowerCase();
    if (!seg) continue;
    const hit = ALIAS_TO_CANONICAL.get(seg);
    if (hit) return hit;
  }

  // Pass 3 — a known city name EMBEDDED in a longer segment. Employers append
  // the campus to the city without a separator this splits on:
  // "Hyderabad-Waverock", "Chennai ITEC", "Bengaluru-EPIP Industrial Area",
  // "New Delhi Country Program Office". Each was its own live pill.
  //
  // Only aliases of 4+ characters are eligible, and only on a word boundary, so
  // the short ones ('in', 'blr', 'hyd', 'ncr', 'bkc') cannot fire inside an
  // unrelated word. The longest alias wins, so "new delhi" beats "delhi".
  for (const part of segments) {
    const seg = part.trim().replace(/\s+/g, ' ');
    if (!seg) continue;
    let best = null;
    for (const [alias, canonical] of ALIAS_TO_CANONICAL) {
      if (alias.length < 4) continue;
      if (best && alias.length <= best.alias.length) continue;
      const re = new RegExp(`(^|[^\\p{L}])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'iu');
      if (re.test(seg)) best = { alias, canonical };
    }
    if (best) return best.canonical;
  }

  // Pass 4 — an unknown but plausible place name. Kept so a legitimate small
  // city is not silently dropped for missing from the table above.
  for (const part of segments) {
    const raw2 = part.trim().replace(/\s+/g, ' ');
    if (NON_CITY_SEGMENTS.has(raw2.toLowerCase())) continue;
    const seg = denoise(raw2);
    if (seg.length < 3 || seg.length > 40) continue;
    if (NON_CITY_SEGMENTS.has(seg.toLowerCase())) continue;
    if (!CITY_SHAPE.test(seg) || LOOKS_LIKE_DOMAIN.test(seg)) continue;
    return titleCase(seg);
  }

  return null;
}

/**
 * Every spelling the filter must match for a chosen city — the other half of
 * the contract.
 *
 * A pill labelled "Bengaluru" counts the Bangalore jobs too, so clicking it
 * has to return them; matching only the label would show 1,567 and deliver 856.
 * An unknown city (one that reached a pill through pass 3) matches just itself.
 */
export function cityMatchTerms(city) {
  if (typeof city !== 'string') return [];
  const trimmed = city.trim();
  if (!trimmed) return [];

  const canonical = ALIAS_TO_CANONICAL.get(trimmed.toLowerCase());
  if (canonical) return [...CITY_ALIASES[canonical]];
  return [trimmed];
}

export const __testing = { titleCase, denoise, ALIAS_TO_CANONICAL, NON_CITY_SEGMENTS };
