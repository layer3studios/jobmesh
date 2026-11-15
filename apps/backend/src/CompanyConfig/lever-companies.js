// FILE: src/CompanyConfig/lever-companies.js
// The Lever boards this scraper walks, one company slug per entry. Split out of
// leverConfig.js (naming conventions section 2): this list changes when the
// company set changes; the adapter beside it changes when Lever's API does.

/**
 * Verified working companies (tested and confirmed)
 * 
 * Start with these - they're known to use Lever and have active job postings
 */
const companySiteNames = [
  // Tech companies with frequent job postings
//  'welocalize',
 'jumpcloud',
  'meesho',
  '3pillarglobal',
  'stable-money1',
  'jobgether',
  'paytm',
  'lingarogroup',
  'gohighlevel',
  'crypto',
  'smart-working-solutions',
  'egen',
  'saviynt',
  'rackspace',
  'Allata',
  'entrata',
  'aeratechnology',
  'SymmetrySystems',
  'clovirtualfashion',
  'klearnow',
  'coupa',
  'nium',
  'foxitsoftware',
  'rapidai',
  'veeva',
  'binance',
  'jiostar',
  'ion',
  'everbridge',
  'highspot',
  'better',
  'thinkahead',
  'acceldata',
  'alifsemi',
  'idt',
  'hevodata',
  'findem',
  'accurate',
  'tryjeeves',
  'spreetail',
  'pattern',
  'nextgenfed',
  'economicmodeling',
  'weekdayworks',
  'gushwork',
  'megaport',
  'spotify',
  'certik',
  'regrello',
  'zeta',
  'fampay',
  'coatesgroup',
  'xsolla',
  'lucidworks',
  'floqast',
  'zuru',
  'sysdig',
  'palantir',
  'valdera',
  'Zeller',
  'extremenetworks',
  'getwingapp',
  'plaid',
  'drivetrain',
  'matchgroup',
  'ninjavan',
  'erg',
  'actian',
  'Sprinto',
  'mactores',
  'zimperium',
  '100ms',

  // ── Discovered via API scan ──
  'mindtickle',
  'dozee',
  'outreach',
  'cred',
  'sophos',

  // ── Discovered via ATS scan (Mar 2026) ──
  'porter',
  'hevo',
  'epifi',
  'freshworks',
  'pocketfm',
  // ── High-confidence Indian companies ──
'plivo',

// ── Global tech using Lever ──
'walkme',


// -- Verified live India jobs via web search (2026-09-15) --
'levelai',
'moonpay',
'greenlight',
'smarsh',
'linkedin',
'Wayground',
'wmg',
'safe',
'brillio-2',
'bpmcpa',
'neuron7',
'galepartners',
'rws',
'idmworks',
'portcast',
'additionwealth',
'Onehouse',
'uei',
'doxel',
'endpointclinical',
'valgenesis',
'insiderone',
'dnb',
    
// ── Discovery run 2026-09-15: verified ≥1 live India job ──
'cargo-partner',  // Added via discovery — 16 India / 91 total
'balbix',  // Added via discovery — 10 India / 11 total
'cprime',  // Added via discovery — 10 India / 17 total
'keyloop',  // Added via discovery — 10 India / 58 total
'appzen',  // Added via discovery — 9 India / 21 total
'brevo',  // Added via discovery — 8 India / 24 total
'ConverseNow',  // Added via discovery — 7 India / 8 total
'aleph',  // Added via discovery — 7 India / 100 total
'bazaarvoice',  // Added via discovery — 7 India / 25 total
'elfbeauty',  // Added via discovery — 7 India / 80 total
'enveda',  // Added via discovery — 7 India / 8 total
'fireworkhq',  // Added via discovery — 7 India / 21 total
'highstreetit',  // Added via discovery — 7 India / 13 total
'aeva',  // Added via discovery — 6 India / 43 total
'cyara',  // Added via discovery — 6 India / 18 total
'docsumo',  // Added via discovery — 6 India / 7 total
'kobie',  // Added via discovery — 6 India / 18 total
'cyderes',  // Added via discovery — 5 India / 14 total
'brightedge',  // Added via discovery — 4 India / 26 total
'genesis',  // Added via discovery — 4 India / 4 total
'kenko',  // Added via discovery — 3 India / 3 total
'ampd-energy',  // Added via discovery — 2 India / 11 total
'ashoka',  // Added via discovery — 2 India / 5 total
'azul',  // Added via discovery — 2 India / 17 total
'dexcarehealth',  // Added via discovery — 2 India / 2 total
'dlocal',  // Added via discovery — 2 India / 56 total
'employ',  // Added via discovery — 2 India / 3 total
'firemon',  // Added via discovery — 2 India / 8 total
'GoToGroup',  // Added via discovery — 1 India / 35 total
'Potloc',  // Added via discovery — 1 India / 5 total
'alimentiv-2',  // Added via discovery — 1 India / 39 total
'biocatch',  // Added via discovery — 1 India / 13 total
'bogaardgroup',  // Added via discovery — 1 India / 6 total
'bolster',  // Added via discovery — 1 India / 6 total
'brafton',  // Added via discovery — 1 India / 21 total
'caliza-financial-technologies',  // Added via discovery — 1 India / 2 total
'cambiumnetworks',  // Added via discovery — 1 India / 1 total
'canarytechnologies',  // Added via discovery — 1 India / 30 total
'cin7',  // Added via discovery — 1 India / 8 total
'confluera',  // Added via discovery — 1 India / 11 total
'deleteme',  // Added via discovery — 1 India / 15 total
'equativ',  // Added via discovery — 1 India / 20 total
'factor',  // Added via discovery — 1 India / 10 total
'h1',  // Added via discovery — 1 India / 19 total
'hive',  // Added via discovery — 1 India / 75 total
'infstones',  // Added via discovery — 1 India / 5 total
'jmawireless',  // Added via discovery — 1 India / 7 total
'kpler',  // Added via discovery — 1 India / 68 total

// ── Discovery run 2026-09-15T10:04: verified ≥1 live India job ──
'beghouconsulting',  // Added via discovery — 47 India / 73 total
'omnidesigntech',  // Added via discovery — 38 India / 56 total
'portagepointpartners',  // Added via discovery — 31 India / 52 total
'netomi',  // Added via discovery — 13 India / 23 total
'parallelwireless',  // Added via discovery — 12 India / 48 total
'sonatype',  // Added via discovery — 10 India / 31 total
'shyftlabs',  // Added via discovery — 9 India / 25 total
'mythic-ai.com',  // Added via discovery — 8 India / 30 total
'uvcyber',  // Added via discovery — 8 India / 25 total
'pditechnologies',  // Added via discovery — 7 India / 19 total
'sitetracker',  // Added via discovery — 7 India / 14 total
'wahed.com',  // Added via discovery — 7 India / 26 total
'resilinc',  // Added via discovery — 6 India / 9 total
'z1tech',  // Added via discovery — 6 India / 13 total
'oneimpression',  // Added via discovery — 5 India / 5 total
'vendavo',  // Added via discovery — 5 India / 6 total
'zaimler',  // Added via discovery — 5 India / 13 total
'acronaviation',  // Added via discovery — 5 India / 42 total
'onit',  // Added via discovery — 4 India / 10 total
'propelsoftware',  // Added via discovery — 4 India / 5 total
'merklescience',  // Added via discovery — 3 India / 25 total
'oaknorth.ai',  // Added via discovery — 3 India / 3 total
'reply',  // Added via discovery — 3 India / 52 total
'spinai',  // Added via discovery — 3 India / 9 total
'outcomesai',  // Added via discovery — 3 India / 4 total
'modeln',  // Added via discovery — 2 India / 10 total
'perforce',  // Added via discovery — 2 India / 8 total
'peoplegrove',  // Added via discovery — 2 India / 11 total
'payjoy',  // Added via discovery — 2 India / 81 total
'popsockets',  // Added via discovery — 2 India / 3 total
'revefi',  // Added via discovery — 2 India / 4 total
'rfa-2',  // Added via discovery — 2 India / 8 total
'teikametrics',  // Added via discovery — 2 India / 5 total
'unlimit',  // Added via discovery — 2 India / 52 total
'yuno',  // Added via discovery — 2 India / 34 total
'Zadara',  // Added via discovery — 2 India / 7 total
'lalamove',  // Added via discovery — 2 India / 155 total
'novaspace',  // Added via discovery — 1 India / 28 total
'omnidian',  // Added via discovery — 1 India / 6 total
'parcelvision',  // Added via discovery — 1 India / 10 total
'pslove-pte',  // Added via discovery — 1 India / 13 total
'revinate',  // Added via discovery — 1 India / 2 total
'serotonin',  // Added via discovery — 1 India / 3 total
'shakudo',  // Added via discovery — 1 India / 12 total
'skio',  // Added via discovery — 1 India / 4 total
'swapcard',  // Added via discovery — 1 India / 2 total
'tala',  // Added via discovery — 1 India / 6 total
'teecom',  // Added via discovery — 1 India / 31 total
'turvo',  // Added via discovery — 1 India / 1 total
'xage-security',  // Added via discovery — 1 India / 10 total
'Ionicpartners',  // Added via discovery — 1 India / 4 total
'Ketch',  // Added via discovery — 1 India / 4 total
'mindy',  // Added via discovery — 1 India / 7 total
'leverdemo-8',  // Added via discovery — 1 India / 429 total

// ── Discovery run 2026-09-15T10:12: verified ≥1 live India job ──
'protolabs',  // Added via discovery — 10 India / 82 total

// ── Discovery run 2026-09-15T10:36: verified ≥1 live India job ──
'ttecdigital',  // Added via discovery — 23 India / 72 total
'zeeco',  // Added via discovery — 10 India / 109 total
'safran-ai',  // Added via discovery — 1 India / 36 total
];

export { companySiteNames };
