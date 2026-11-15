// FILE: src/CompanyConfig/ashby-boards.js
// The Ashby job boards this scraper walks. Split out of ashbyConfig.js (section 2).

// ✅ VERIFIED WORKING COMPANIES (with India jobs potential)
const companyBoardNames = [
        // Companies confirmed to have India jobs
        'Ashby',
        'Deel',
        'OpenAI',
        'Cohere',
        
        // Additional tech companies using Ashby
        'Linear',
        'Notion',
        'Ramp',
        'Mercury',
        'Supabase',
        'Vercel',
        'Replit',
        'Modal',
        'Perplexity',
        'Cursor',
        'Character',
        
        // ── Discovered via API scan ──
        'confluent',
        'snowflake',
        'redis',
        'clickup',
        'anyscale',
        'docker',

        // ── Discovered via ATS scan (Mar 2026) ──
        'bounce',
        'scaler',
        'yotta',
        'pesto',
        'velotio',
        'loadshare',
        // ── AI-native + modern startups (Ashby's core market) ──
'attio',
'baseten',
'runpod',
'langchain',
'suno',
'elevenlabs',
'harvey',
'gamma',
'granola',
'read-ai',
'zapier', // in case they moved
'raycast',
'pinecone',
'weaviate',
'lancedb',
'crusoe',
'lambda',
'anyscale', // dupe check
'e2b',
'coder',
'cognition',
'poolside',
'reka',
'nous-research',
'exa',

// ── India-focused / dual-HQ ──
'sarvam',

// ── Fintech / crypto ──
'rain',
'unit',

// ── Recent Ashby signups I've seen mentioned ──
'lightspark',
'goldsky',
'alchemy',
'phantom',

// ── Verified live India jobs (2026-09-15) ──
'supa',
'aiprise',
'coderabbit',
'Wisdom-AI',
'broccoli',
'humanarchive',
'Meraki-Labs',
'atlan',
'bureau',
'atlys',
    
// -- Verified live India jobs via web search (2026-09-15) --
'gainsight',
'uipath',
'tekion',
'composio',
    
// ── Discovery run 2026-09-15: verified ≥1 live India job ──
'lilt-production',  // Added via discovery — 162 India / 413 total
'bjakcareer',  // Added via discovery — 30 India / 3067 total
'netgear',  // Added via discovery — 27 India / 50 total
'riveron',  // Added via discovery — 26 India / 65 total
'ddn',  // Added via discovery — 25 India / 91 total
'lumilens',  // Added via discovery — 20 India / 159 total
'g2',  // Added via discovery — 19 India / 38 total
'inovalon',  // Added via discovery — 18 India / 71 total
'nightfall-ai',  // Added via discovery — 18 India / 29 total
'signoz',  // Added via discovery — 16 India / 16 total
'ema',  // Added via discovery — 15 India / 44 total
'opengov',  // Added via discovery — 13 India / 71 total
'skylo',  // Added via discovery — 13 India / 49 total
'uptimeai',  // Added via discovery — 13 India / 16 total
'gen-digital',  // Added via discovery — 12 India / 117 total
'coram-ai',  // Added via discovery — 11 India / 44 total
'handshake',  // Added via discovery — 11 India / 71 total
'lat',  // Added via discovery — 11 India / 11 total
'span',  // Added via discovery — 11 India / 34 total
'jellyfishcareers',  // Added via discovery — 10 India / 52 total
'litmus',  // Added via discovery — 10 India / 27 total
'plane',  // Added via discovery — 10 India / 33 total
'airwallex',  // Added via discovery — 9 India / 578 total
'lyric',  // Added via discovery — 9 India / 14 total
'certifyos',  // Added via discovery — 8 India / 11 total
'cube',  // Added via discovery — 8 India / 26 total
'kong',  // Added via discovery — 8 India / 67 total
'pebl',  // Added via discovery — 8 India / 38 total
'anuvaya',  // Added via discovery — 7 India / 7 total
'glomo',  // Added via discovery — 7 India / 7 total
'josys',  // Added via discovery — 7 India / 25 total
'ontic',  // Added via discovery — 7 India / 17 total
'emergence',  // Added via discovery — 6 India / 17 total
'gradera',  // Added via discovery — 6 India / 7 total
'hinge-health',  // Added via discovery — 6 India / 73 total
'junipersquare',  // Added via discovery — 6 India / 42 total
'lgads',  // Added via discovery — 6 India / 19 total
'metaforms',  // Added via discovery — 6 India / 6 total
'nanonets',  // Added via discovery — 6 India / 10 total
'nivoda',  // Added via discovery — 6 India / 36 total
'oneapp',  // Added via discovery — 6 India / 42 total
'spector-ai',  // Added via discovery — 6 India / 6 total
'telus-digital',  // Added via discovery — 6 India / 73 total
'architect',  // Added via discovery — 5 India / 14 total
'better-mortgage',  // Added via discovery — 5 India / 14 total
'cyberhaven',  // Added via discovery — 5 India / 27 total
'menlosecurity',  // Added via discovery — 5 India / 18 total
'pravah',  // Added via discovery — 5 India / 6 total
'siteminder',  // Added via discovery — 5 India / 40 total
'skyflow',  // Added via discovery — 5 India / 11 total
'tempo',  // Added via discovery — 5 India / 9 total
'weave',  // Added via discovery — 5 India / 23 total
'bidgely-inc',  // Added via discovery — 5 India / 14 total
'rojointegrations',  // Added via discovery — 5 India / 9 total
'almabase',  // Added via discovery — 4 India / 4 total
'altimate',  // Added via discovery — 4 India / 6 total
'amperos',  // Added via discovery — 4 India / 19 total
'apexx',  // Added via discovery — 4 India / 9 total
'ciroos',  // Added via discovery — 4 India / 8 total
'claritypay',  // Added via discovery — 4 India / 28 total
'demo.uipath.com',  // Added via discovery — 4 India / 40 total
'dehazelabs',  // Added via discovery — 4 India / 4 total
'hirehangar',  // Added via discovery — 4 India / 105 total
'hrs',  // Added via discovery — 4 India / 24 total
'openobserve-careers',  // Added via discovery — 4 India / 6 total
'pear-vc',  // Added via discovery — 4 India / 100 total
'playpowerlabs',  // Added via discovery — 4 India / 4 total
'poshmark',  // Added via discovery — 4 India / 31 total
'sanctuary',  // Added via discovery — 4 India / 6 total
'tilthq',  // Added via discovery — 4 India / 28 total
'adaption',  // Added via discovery — 3 India / 7 total
'allica-bank',  // Added via discovery — 3 India / 40 total
'ambient.ai',  // Added via discovery — 3 India / 22 total
'anyone-ai',  // Added via discovery — 3 India / 190 total
'articul8',  // Added via discovery — 3 India / 20 total
'aspora',  // Added via discovery — 3 India / 5 total
'billups',  // Added via discovery — 3 India / 11 total
'blitzy',  // Added via discovery — 3 India / 29 total
'cartesia',  // Added via discovery — 3 India / 31 total
'd-matrix',  // Added via discovery — 3 India / 41 total
'deliveroo',  // Added via discovery — 3 India / 226 total
'demandbase',  // Added via discovery — 3 India / 12 total
'hackerone',  // Added via discovery — 3 India / 19 total
'madecard',  // Added via discovery — 3 India / 11 total
'neuralconcept',  // Added via discovery — 3 India / 35 total
'novo',  // Added via discovery — 3 India / 10 total
'percona',  // Added via discovery — 3 India / 17 total
'quantcast',  // Added via discovery — 3 India / 17 total
'savvymoney',  // Added via discovery — 3 India / 14 total
'socure',  // Added via discovery — 3 India / 90 total
'surveymonkey',  // Added via discovery — 3 India / 21 total
'temporal',  // Added via discovery — 3 India / 71 total
'zuru',  // Added via discovery — 3 India / 74 total
'applied',  // Added via discovery — 2 India / 289 total
'aries',  // Added via discovery — 2 India / 3 total
'build-ai',  // Added via discovery — 2 India / 21 total
'chainalysis-careers',  // Added via discovery — 2 India / 51 total
'clarisights',  // Added via discovery — 2 India / 2 total
'commure',  // Added via discovery — 2 India / 80 total
'fleek',  // Added via discovery — 2 India / 11 total
'founders-factory',  // Added via discovery — 2 India / 23 total
'fourier',  // Added via discovery — 2 India / 6 total
'hyde',  // Added via discovery — 2 India / 5 total
'imagineart',  // Added via discovery — 2 India / 33 total
'infisical',  // Added via discovery — 2 India / 9 total
'kognitos',  // Added via discovery — 2 India / 7 total
'loopio',  // Added via discovery — 2 India / 12 total
'neara',  // Added via discovery — 2 India / 39 total
'newform',  // Added via discovery — 2 India / 22 total
'obrio',  // Added via discovery — 2 India / 20 total
'oyster',  // Added via discovery — 2 India / 25 total
'passage',  // Added via discovery — 2 India / 16 total
'paxos',  // Added via discovery — 2 India / 16 total
'protegrity',  // Added via discovery — 2 India / 9 total
'retell-ai',  // Added via discovery — 2 India / 35 total
'rox-data-corp',  // Added via discovery — 2 India / 23 total
'sensor-tower',  // Added via discovery — 2 India / 75 total
'spoton',  // Added via discovery — 2 India / 77 total
'techtorch',  // Added via discovery — 2 India / 8 total
'terac',  // Added via discovery — 2 India / 64 total
'the-global-talent-co',  // Added via discovery — 2 India / 80 total
'vultr',  // Added via discovery — 2 India / 46 total
'augrade',  // Added via discovery — 2 India / 5 total
'aios',  // Added via discovery — 1 India / 18 total
'amplify',  // Added via discovery — 1 India / 34 total
'apiphany',  // Added via discovery — 1 India / 7 total
'astronomer',  // Added via discovery — 1 India / 23 total
'atob',  // Added via discovery — 1 India / 9 total
'avoca',  // Added via discovery — 1 India / 25 total
'axelera',  // Added via discovery — 1 India / 10 total
'brightwheel',  // Added via discovery — 1 India / 15 total
'bullpen-talent',  // Added via discovery — 1 India / 12 total
'careway',  // Added via discovery — 1 India / 3 total
'clipbook',  // Added via discovery — 1 India / 9 total
'credo.ai',  // Added via discovery — 1 India / 4 total
'cygnify',  // Added via discovery — 1 India / 57 total
'darkroom',  // Added via discovery — 1 India / 23 total
'deductive',  // Added via discovery — 1 India / 3 total
'deepgram',  // Added via discovery — 1 India / 90 total
'delinea',  // Added via discovery — 1 India / 95 total
'dualentry',  // Added via discovery — 1 India / 71 total
'duck-duck-go',  // Added via discovery — 1 India / 13 total
'everis',  // Added via discovery — 1 India / 2 total
'fiddler-ai',  // Added via discovery — 1 India / 8 total
'flagright.com',  // Added via discovery — 1 India / 14 total
'furtherai',  // Added via discovery — 1 India / 12 total
'granica',  // Added via discovery — 1 India / 11 total
'gratia',  // Added via discovery — 1 India / 6 total
'gritt',  // Added via discovery — 1 India / 23 total
'harrison.ai',  // Added via discovery — 1 India / 7 total
'iceye',  // Added via discovery — 1 India / 187 total
'inflectionio',  // Added via discovery — 1 India / 2 total
'kestra',  // Added via discovery — 1 India / 10 total
'livekit',  // Added via discovery — 1 India / 29 total
'litellm',  // Added via discovery — 1 India / 10 total
'maneuver-marketing',  // Added via discovery — 1 India / 11 total
'mapbox',  // Added via discovery — 1 India / 49 total
'meter',  // Added via discovery — 1 India / 47 total
'neon',  // Added via discovery — 1 India / 5 total
'nirvana',  // Added via discovery — 1 India / 6 total
'ontologize',  // Added via discovery — 1 India / 3 total
'oscilar',  // Added via discovery — 1 India / 20 total
'overview',  // Added via discovery — 1 India / 45 total
'panoptyc',  // Added via discovery — 1 India / 8 total
'parker',  // Added via discovery — 1 India / 13 total
'permitflow',  // Added via discovery — 1 India / 45 total
'pod-network',  // Added via discovery — 1 India / 4 total
'pragmatike',  // Added via discovery — 1 India / 87 total
'qdrant.tech',  // Added via discovery — 1 India / 7 total
'raspberry',  // Added via discovery — 1 India / 10 total
'realfast',  // Added via discovery — 1 India / 1 total
'revenuebase-inc',  // Added via discovery — 1 India / 6 total
'share',  // Added via discovery — 1 India / 9 total
'shift',  // Added via discovery — 1 India / 17 total
'sieve',  // Added via discovery — 1 India / 12 total
'singular',  // Added via discovery — 1 India / 18 total
'smallest',  // Added via discovery — 1 India / 1 total
'summation',  // Added via discovery — 1 India / 8 total
'symmetry',  // Added via discovery — 1 India / 3 total
'verto',  // Added via discovery — 1 India / 4 total
'whoop',  // Added via discovery — 1 India / 156 total
'wispr-flow',  // Added via discovery — 1 India / 28 total
'worldly',  // Added via discovery — 1 India / 8 total
'zania',  // Added via discovery — 1 India / 10 total
'zip',  // Added via discovery — 1 India / 124 total
'clueso',  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:04: verified ≥1 live India job ──
'kandou-ai',  // Added via discovery — 19 India / 42 total
'interview-kickstart',  // Added via discovery — 17 India / 19 total
'outmarket',  // Added via discovery — 12 India / 23 total
'shield-ai',  // Added via discovery — 11 India / 487 total
'cerebras',  // Added via discovery — 10 India / 111 total
'spotdraft',  // Added via discovery — 10 India / 13 total
'bolna',  // Added via discovery — 9 India / 9 total
'clickhouse',  // Added via discovery — 9 India / 186 total
'sciencelogic',  // Added via discovery — 9 India / 14 total
'airbound',  // Added via discovery — 8 India / 8 total
'allwyn-corp',  // Added via discovery — 8 India / 13 total
'arrive',  // Added via discovery — 8 India / 65 total
'triomics',  // Added via discovery — 6 India / 18 total
'cardboard',  // Added via discovery — 5 India / 5 total
'libra',  // Added via discovery — 5 India / 5 total
'provenirinc',  // Added via discovery — 4 India / 24 total
'wand-ai',  // Added via discovery — 4 India / 16 total
'simply-wall-st',  // Added via discovery — 3 India / 6 total
'whiskeylibrary',  // Added via discovery — 2 India / 2 total
'wonderful',  // Added via discovery — 2 India / 123 total
'candex',  // Added via discovery — 1 India / 17 total
'encord',  // Added via discovery — 1 India / 37 total
'mistral.ai',  // Added via discovery — 1 India / 192 total
'paymentology',  // Added via discovery — 1 India / 15 total
'won.ai',  // Added via discovery — 1 India / 7 total
];

export { companyBoardNames };
