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

];

export { companySiteNames };
