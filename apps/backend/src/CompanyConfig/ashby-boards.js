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
    ];

export { companyBoardNames };
