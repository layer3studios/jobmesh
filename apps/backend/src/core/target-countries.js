// FILE: src/core/target-countries.js
// THE one place that decides which countries JobMesh scrapes.
//
// Every ATS config used to carry its own hardcoded India test — ashbyConfig had
// hasIndiaLocation, greenhouseConfig had isIndiaLocation, personio and
// smartrecruiters imported isIndiaString, and each kept its own city list. The
// scraper already fetches every company's FULL global board and then discards
// everything that fails those tests, so the only thing standing between 8.5k
// jobs and a multi-country board was eight copies of one predicate.
//
// Adding a country is now a single entry below. Nothing else changes: no ATS
// config, no mapper, no query.
//
// ENABLED_COUNTRIES is what actually runs; a country can sit here fully
// described and switched off, which is the point — the list can be grown and
// reviewed separately from the decision to turn it on. Override at deploy time
// with TARGET_COUNTRIES=IN,GB,CA (ISO codes, comma separated).

/**
 * One entry per country.
 *
 * `names`   — what the country itself is called in a location string,
 *             including the ISO codes employers use as a whole segment.
 * `regions` — states/provinces that appear INSTEAD of the country name.
 * `cities`  — the cities that actually carry tech hiring there. Not
 *             exhaustive by design: a city list that tries to cover every
 *             town matches noise, so this holds the places with real volume,
 *             and the country name catches the rest.
 *
 * Matching is whole-word, so short codes cannot fire inside another word
 * ("IN" must not match "Indianapolis", which is exactly the bug that put a US
 * city on an India-only board).
 */
export const COUNTRIES = Object.freeze({
  IN: {
    name: 'India',
    names: ['india', 'bharat', 'ind'],
    regions: ['karnataka', 'maharashtra', 'telangana', 'tamil nadu', 'haryana',
      'uttar pradesh', 'west bengal', 'gujarat', 'kerala', 'delhi ncr', 'ncr'],
    cities: ['bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi', 'hyderabad',
      'pune', 'chennai', 'noida', 'gurgaon', 'gurugram', 'kolkata', 'ahmedabad',
      'jaipur', 'lucknow', 'chandigarh', 'indore', 'nagpur', 'coimbatore',
      'kochi', 'cochin', 'thiruvananthapuram', 'trivandrum', 'visakhapatnam',
      'vizag', 'bhubaneswar', 'mangalore', 'mysore', 'mysuru', 'vadodara',
      'surat', 'patna', 'ranchi', 'guwahati', 'bhopal', 'nashik', 'gandhinagar'],
  },
  US: {
    name: 'United States',
    names: ['united states', 'usa', 'u.s.', 'u.s.a.', 'america'],
    // 'US' is deliberately absent from names: as a bare token it collides with
    // ordinary words far too often to be safe, and the state codes below plus
    // the city list cover real postings.
    regions: ['california', 'new york', 'texas', 'washington', 'massachusetts',
      'illinois', 'colorado', 'georgia', 'florida', 'north carolina', 'virginia',
      'pennsylvania', 'oregon', 'arizona', 'new jersey', 'utah'],
    // Two-letter state codes are deliberately NOT listed. "IN" is Indiana to a
    // US employer and India to an Indian one, and nothing in the string
    // resolves which is meant — that ambiguity is exactly what put
    // "Indianapolis, IN" on an India-only board. City names are unambiguous,
    // so the cities carry the match and the codes stay out.
    cities: ['san francisco', 'new york city', 'nyc', 'seattle', 'austin', 'boston',
      'chicago', 'los angeles', 'san jose', 'palo alto', 'mountain view',
      'sunnyvale', 'denver', 'atlanta', 'miami', 'portland', 'san diego',
      'washington dc', 'philadelphia', 'dallas', 'houston', 'phoenix',
      'salt lake city', 'raleigh', 'pittsburgh', 'minneapolis', 'detroit',
      'indianapolis', 'columbus', 'nashville', 'charlotte', 'tampa', 'orlando',
      'st louis', 'kansas city', 'cincinnati', 'cleveland', 'milwaukee',
      'sacramento', 'san antonio', 'las vegas', 'boulder', 'ann arbor',
      'durham', 'madison', 'provo', 'irvine', 'santa clara', 'redmond',
      'bellevue', 'cupertino', 'menlo park', 'brooklyn', 'jersey city'],
  },
  GB: {
    name: 'United Kingdom',
    names: ['united kingdom', 'uk', 'u.k.', 'great britain', 'england',
      'scotland', 'wales', 'northern ireland'],
    regions: ['greater london', 'yorkshire', 'surrey', 'kent'],
    cities: ['london', 'manchester', 'edinburgh', 'birmingham', 'bristol',
      'cambridge', 'oxford', 'leeds', 'glasgow', 'belfast', 'reading',
      'brighton', 'sheffield', 'newcastle', 'nottingham', 'cardiff'],
  },
  CA: {
    name: 'Canada',
    names: ['canada'],
    regions: ['ontario', 'british columbia', 'quebec', 'alberta', 'nova scotia'],
    cities: ['toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'edmonton',
      'waterloo', 'kitchener', 'mississauga', 'halifax', 'victoria', 'winnipeg'],
  },
  AU: {
    name: 'Australia',
    names: ['australia'],
    regions: ['new south wales', 'victoria', 'queensland', 'western australia'],
    cities: ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra',
      'gold coast', 'hobart'],
  },
  IE: {
    name: 'Ireland',
    names: ['ireland', 'republic of ireland', 'eire'],
    regions: ['leinster', 'munster'],
    cities: ['dublin', 'cork', 'galway', 'limerick', 'waterford'],
  },
  SG: {
    name: 'Singapore',
    names: ['singapore'],
    regions: [],
    cities: ['singapore'],
  },
  NZ: {
    name: 'New Zealand',
    names: ['new zealand'],
    regions: [],
    cities: ['auckland', 'wellington', 'christchurch', 'hamilton', 'dunedin'],
  },
  AE: {
    name: 'United Arab Emirates',
    names: ['united arab emirates', 'uae', 'u.a.e.'],
    regions: [],
    cities: ['dubai', 'abu dhabi', 'sharjah'],
  },
  ZA: {
    name: 'South Africa',
    names: ['south africa'],
    regions: ['gauteng', 'western cape'],
    cities: ['johannesburg', 'cape town', 'pretoria', 'durban'],
  },
});

/**
 * Location words that describe no country at all. A posting reading "Remote"
 * or "Anywhere" is kept — refusing it would drop genuinely open roles — but it
 * is matched here rather than smuggled into India's city list, which is where
 * it used to live and why "Remote" counted as an Indian location.
 */
const COUNTRY_AGNOSTIC = ['remote', 'fully remote', 'work from home', 'wfh',
  'anywhere', 'worldwide', 'global', 'distributed'];

/** ISO codes that are live. TARGET_COUNTRIES overrides at deploy time. */
export const ENABLED_COUNTRIES = Object.freeze(
  (process.env.TARGET_COUNTRIES || 'IN')
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter((code) => Object.hasOwn(COUNTRIES, code)),
);

const escape = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * One whole-word regex per country, built once.
 *
 * Whole-word matching is the part that matters. A substring test let "IN"
 * match "Indianapolis" and put US cities on an India-only board; it would now
 * also let "uk" match "Paducah". The boundaries use a letter class rather than
 * \b so that "u.k." and "u.s.a." still match.
 */
function buildMatcher(country) {
  const terms = [...country.names, ...country.regions, ...country.cities]
    .map(escape)
    .sort((a, b) => b.length - a.length); // longest first: "new york city" before "new york"
  return new RegExp(`(^|[^\\p{L}])(${terms.join('|')})($|[^\\p{L}])`, 'iu');
}

const MATCHERS = new Map(
  Object.entries(COUNTRIES).map(([code, country]) => [code, buildMatcher(country)]),
);

const AGNOSTIC_MATCHER = new RegExp(
  `(^|[^\\p{L}])(${COUNTRY_AGNOSTIC.map(escape).join('|')})($|[^\\p{L}])`, 'iu',
);

/**
 * The ISO code a location string belongs to, or null when none matches.
 * Checks enabled countries only, in the order they were enabled, so the
 * first-listed country wins a string naming two.
 */
export function countryOf(location, enabled = ENABLED_COUNTRIES) {
  if (!location || typeof location !== 'string') return null;
  const text = location.trim();
  if (!text) return null;
  for (const code of enabled) {
    const matcher = MATCHERS.get(code);
    if (matcher && matcher.test(text)) return code;
  }
  return null;
}

/** True when a location names an enabled country, or names nowhere in particular. */
export function isTargetLocation(location, enabled = ENABLED_COUNTRIES) {
  if (!location || typeof location !== 'string') return false;
  const text = location.trim();
  if (!text) return false;
  if (countryOf(text, enabled) !== null) return true;
  return AGNOSTIC_MATCHER.test(text);
}

/** Human-readable summary for the boot log. */
export function describeEnabledCountries(enabled = ENABLED_COUNTRIES) {
  if (enabled.length === 0) return 'NONE (TARGET_COUNTRIES matched no known code)';
  return enabled.map((code) => `${code} ${COUNTRIES[code].name}`).join(', ');
}

export const __testing = { buildMatcher, COUNTRY_AGNOSTIC };
