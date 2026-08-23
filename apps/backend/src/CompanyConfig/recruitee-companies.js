// FILE: src/CompanyConfig/recruitee-companies.js
// The Recruitee company slugs this scraper walks. Split out of recruiteeConfig.js
// (section 2).

const companySlugs = [
  // To find Recruitee companies that hire in India:
  // 1. Search Google: site:*.recruitee.com "India" OR "Bangalore" OR "Mumbai"
  // 2. The subdomain is the slug: https://{slug}.recruitee.com
  // 3. Verify: curl https://{slug}.recruitee.com/api/offers/ | jq '.offers | length'
  //
//   // Add verified slugs below:



'kcoverseaseducation',
'holepunch',
'samy1',
'o2h',
'frisbii',
'synapseanalytics',
'blackbelt',
'trafilea',
'somniosoftware',
'bettercollective',
'careersdeltacapita',
'xogene',
'jobsdeerns',
'devfinders',
'consultdss',
'infoprolearning',
'gustileder',

  'box8',    // Poncho Hospitality Pvt. Ltd. (5 India jobs)
  'mgid',
'transperfect',
'tether',
'fullcreative',  
    'hudsonmanpower',

    // ── Discovered via ATS scan (Mar 2026) ──
    'ampere',
    'ramco',
    // Verify each — Recruitee slug quality varies wildly
'penta',
'kontist',
];

export { companySlugs };
