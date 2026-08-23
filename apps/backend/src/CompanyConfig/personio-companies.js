// FILE: src/CompanyConfig/personio-companies.js
// The Personio subdomains this scraper walks. Split out of personioConfig.js
// (section 2).

// ─── Company targets ──────────────────────────────────────────────────
// European companies with India offices that post India roles on Personio.
// Format: https://{subdomain}.jobs.personio.{tld}/xml?language=en
//
// HOW TO FIND MORE:
// 1. Google: site:*.jobs.personio.de "India" OR "Bangalore" OR "Hyderabad"
// 2. Or: site:*.jobs.personio.com "India" OR "Mumbai" OR "Pune"
// 3. Hit the XML feed: https://{subdomain}.jobs.personio.{tld}/xml?language=en
// 4. If any <office> contains an Indian city name, add it here.
const companyTargets = [
        // European companies known to post India/Remote-India roles
        { subdomain: 'delivery-hero',       tld: 'de' },
        { subdomain: 'hellofresh',          tld: 'de' },
        { subdomain: 'agile-robots-se',     tld: 'de' },
        { subdomain: 'personio',            tld: 'de' },
        { subdomain: 'scalable-gmbh',       tld: 'de' },
        { subdomain: 'celonis',             tld: 'de' },
        { subdomain: 'contentful',          tld: 'de' },
        { subdomain: 'adjust',              tld: 'de' },
        { subdomain: 'sennder',             tld: 'de' },
        { subdomain: 'zalando',             tld: 'de' },
        { subdomain: 'data4life',           tld: 'de' },
        { subdomain: 'studysmarter',        tld: 'de' },
        { subdomain: 'tech11',              tld: 'de' },
        { subdomain: 'aignostics',          tld: 'de' },
        { subdomain: 'robco',               tld: 'de' },
        { subdomain: 'carbmee',             tld: 'com' },
        { subdomain: 'pitch',               tld: 'de' },
        { subdomain: 'socialhub',           tld: 'de' },
        { subdomain: 'freighthub',      tld: 'de' }, // Forto
{ subdomain: 'forto',           tld: 'de' },
{ subdomain: 'wefox',           tld: 'de' },
{ subdomain: 'clark',           tld: 'de' },
{ subdomain: 'ottonova',        tld: 'de' },
{ subdomain: 'grover',          tld: 'de' },
{ subdomain: 'penta-fintech',   tld: 'de' },
{ subdomain: 'kontist',         tld: 'de' },
{ subdomain: 'finmid',          tld: 'de' },
{ subdomain: 'staffbase',       tld: 'de' },
{ subdomain: 'billie',          tld: 'de' },
{ subdomain: 'moss',            tld: 'de' },
{ subdomain: 'mambu',           tld: 'de' },
{ subdomain: 'raisin',          tld: 'de' },
{ subdomain: 'demodesk',        tld: 'de' },
{ subdomain: 'seven-senders',   tld: 'de' },
{ subdomain: 'sevensenders',    tld: 'com' },
{ subdomain: 'usercentrics',    tld: 'de' },
{ subdomain: 'idnow',           tld: 'de' },
{ subdomain: 'nu-informatik',   tld: 'de' },
{ subdomain: 'westwing',        tld: 'de' },
{ subdomain: 'flaschenpost',    tld: 'de' },
{ subdomain: 'urlaubsguru',     tld: 'de' },
{ subdomain: 'kayak',           tld: 'de' },
{ subdomain: 'quandoo',         tld: 'de' },
{ subdomain: 'homeday',         tld: 'de' },
{ subdomain: 'blinkist',        tld: 'de' },
{ subdomain: 'signavio-personio', tld: 'de' },
{ subdomain: 'gorillas-personio', tld: 'de' },
{ subdomain: 'holidu',          tld: 'de' },
{ subdomain: 'omio',            tld: 'de' },
    ];

export { companyTargets };
