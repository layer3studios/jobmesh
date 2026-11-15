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

// ── Discovery run 2026-09-15: verified ≥1 live India job ──
'lenskartcareers',  // Added via discovery — 77 India / 87 total
'tgs',  // Added via discovery — 69 India / 614 total
'techbizglobal',  // Added via discovery — 33 India / 197 total
'clanx',  // Added via discovery — 27 India / 27 total
'gsbsolutions1',  // Added via discovery — 18 India / 42 total
'signode',  // Added via discovery — 15 India / 41 total
'framestore',  // Added via discovery — 9 India / 53 total
'gain',  // Added via discovery — 7 India / 16 total
'metyisag',  // Added via discovery — 6 India / 81 total
'sioux',  // Added via discovery — 5 India / 19 total
'beinguser',  // Added via discovery — 5 India / 5 total
'allshoretalent',  // Added via discovery — 4 India / 8 total
'deephealth',  // Added via discovery — 3 India / 29 total
'curotec',  // Added via discovery — 2 India / 18 total
'brainsquare',  // Added via discovery — 1 India / 5 total
'castolin',  // Added via discovery — 1 India / 16 total
'cmcom',  // Added via discovery — 1 India / 14 total
'mailerlite',  // Added via discovery — 1 India / 3 total
'qualifyzegmbh',  // Added via discovery — 1 India / 10 total
'scioteq',  // Added via discovery — 1 India / 38 total
'veocareers',  // Added via discovery — 1 India / 58 total
'wordbank',  // Added via discovery — 1 India / 5 total
'globaljetluxembourg',  // Added via discovery — 1 India / 20 total

// ── Discovery run 2026-09-15T10:36: verified ≥1 live India job ──
'mitsogo',  // Added via discovery — 13 India / 15 total
'krishnaconsultants',  // Added via discovery — 12 India / 15 total
'flextrade',  // Added via discovery — 11 India / 33 total
'kinly',  // Added via discovery — 8 India / 28 total
'gainpro',  // Added via discovery — 7 India / 16 total
'kuonitumlare',  // Added via discovery — 6 India / 37 total
'lftechnology',  // Added via discovery — 5 India / 15 total
'allshorevirtualstaffing',  // Added via discovery — 4 India / 8 total
'cbsapac',  // Added via discovery — 4 India / 22 total
'hyand',  // Added via discovery — 4 India / 20 total
'aidence',  // Added via discovery — 3 India / 29 total
'fulfilio',  // Added via discovery — 3 India / 9 total
'gac',  // Added via discovery — 3 India / 62 total
'majorleaguehacking',  // Added via discovery — 3 India / 8 total
'marcusevanscareers',  // Added via discovery — 3 India / 54 total
'mrmarinegroup',  // Added via discovery — 3 India / 17 total
'brightriverindia',  // Added via discovery — 2 India / 2 total
'jobsolutions',  // Added via discovery — 2 India / 49 total
'aartsen',  // Added via discovery — 1 India / 24 total
'esteco',  // Added via discovery — 1 India / 4 total
'futureworks',  // Added via discovery — 1 India / 1 total
'mailerlite1',  // Added via discovery — 1 India / 3 total
];

export { companySlugs };
