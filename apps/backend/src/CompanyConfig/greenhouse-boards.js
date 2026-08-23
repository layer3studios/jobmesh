// FILE: src/CompanyConfig/greenhouse-boards.js
// The Greenhouse board tokens this scraper walks. Split out of greenhouseConfig.js
// (section 2).

const companyBoardTokens = [
        // ✅ WORKING TOKENS (verified)
        'airbnb',
        'stripe',
        'figma',
        'airtable',
        'gitlab',
        'reddit',
        'pinterest',
        'twitch',
        
        // ✅ ADDITIONAL WORKING TOKENS (tech companies with India jobs)
        'wolt',
        'contentful',
        'celonis',
        'n26',
        'raisin',
        'eyeo',
        
        // ✅ More tech companies (may or may not have India jobs)
        'datadog',
        'asana',
        'dropbox',
        'databricks',
        'cloudflare',
        'mongodb',
        'elastic',
        'okta',
        'hubspot',
        'intercom',
        'amplitude',
        'mixpanel',
        'launchdarkly',
        'pagerduty',

        // ── Discovered via API scan ──
        'zscaler',
        'sigmoid',
        'rubrik',
        'inmobi',
        'phonepe',
        'highradius',
        'toast',
        'glance',
        'zenoti',
        'tripactions',
        'groww',
        'hackerrank',
        'druva',
        'twilio',
        'commvault',
        'postman',
        'newrelic',
        'yugabyte',
        'coinbase',
        'coursera',
        'samsara',
        'observeai',
        'flexport',
        'thoughtworks',
        'fastly',
        'neo4j',
        'cockroachlabs',
        'singlestore',
        'verkada',
        'starburst',
        'duolingo',
        'labelbox',
        'naukri',

        // ── Discovered via ATS scan (Mar 2026) ──
        'tcs',
        'slice',
        // ── High-confidence: Indian unicorns/soonicorns ──
'digit',

// ── High-confidence: Global tech with India engineering ──
'databricks',
'circleci',
'buildkite',
'launchdarkly',
'fivetran',
'dremio',
'clickhouse',
'planetscale',
'netlify',
'nubank',
'brex',
'mercury',
'chime',
'affirm',
'discord',
'roblox',
'coinbase', // in case not tried
'gemini',
'okx',
'bybit',
'bitgo',
'fireblocks',
'consensys',
'zscaler', // already there, dedupe on your end
'commvault', // dupe check
'rubrik', // dupe
'druva', // dupe
'mongodb', // dupe
'nubank',

// ── High-confidence: US SaaS with big India presence ──
'gusto',
'zoominfo',
'6sense',
'salesloft',
'greenhouse', // Greenhouse itself
    ];

export { companyBoardTokens };
