// FILE: src/CompanyConfig/workday-boards.js
// Every Workday tenant this scraper walks: company, instance, site and label.
// Split out of workdayConfig.js (naming conventions section 2) -- this list grows
// when the company set changes, while the adapter beside it changes when
// Workday's CXS API does.

const companyBoards = [
    // ── HIGH VOLUME (100+ India jobs) ───────────────────────────────────────
    { company: 'amgen',           instance: 'wd1', site: 'Careers',          name: 'Amgen' },            // 836 India / 1436 total
    { company: 'cadence',         instance: 'wd1', site: 'External_Careers', name: 'Cadence' },          // 282 India / 595 total
    { company: 'fractal',         instance: 'wd1', site: 'Careers',          name: 'Fractal' },          // 205 India / 112 total
    { company: 'micron',          instance: 'wd1', site: 'External',         name: 'Micron' },           // 203 India / 2126 total
    { company: 'dell',            instance: 'wd1', site: 'External',         name: 'Dell' },             // 198 India / 585 total
    { company: 'qualys',          instance: 'wd5', site: 'Careers',          name: 'Qualys' },           // 162 India / 214 total
    { company: 'nxp',             instance: 'wd3', site: 'Careers',          name: 'NXP' },              // 136 India / 476 total
    { company: 'unisys',          instance: 'wd5', site: 'External',         name: 'Unisys' },           // 112 India / 369 total
    { company: 'thales',          instance: 'wd3', site: 'Careers',          name: 'Thales' },           // 106 India / 2000 total

    // ── MEDIUM VOLUME (40–99 India jobs) ────────────────────────────────────
    { company: 'analogdevices',   instance: 'wd1', site: 'External',         name: 'Analog Devices' },   // 84 India / 926 total
    { company: 'paypal',          instance: 'wd1', site: 'Jobs',             name: 'PayPal' },           // 77 India / 639 total
    { company: 'takeda',          instance: 'wd3', site: 'External',         name: 'Takeda' },           // 77 India / 1392 total
    { company: 'globalfoundries', instance: 'wd1', site: 'External',         name: 'GlobalFoundries' },  // 74 India / 570 total
    { company: 'astrazeneca',     instance: 'wd3', site: 'Careers',          name: 'AstraZeneca' },      // 72 India / 1585 total
    { company: 'kone',            instance: 'wd3', site: 'Careers',          name: 'KONE' },             // 68 India / 913 total
    { company: 'intel',           instance: 'wd1', site: 'External',         name: 'Intel' },            // 67 India / 579 total
    { company: 'labcorp',         instance: 'wd1', site: 'External',         name: 'Labcorp' },          // 63 India / 1330 total
    { company: 'browserstack',    instance: 'wd3', site: 'External',         name: 'BrowserStack' },     // 56 India / 62 total
    { company: 'equinix',         instance: 'wd1', site: 'External',         name: 'Equinix' },          // 47 India / 416 total
    { company: 'sprinklr',        instance: 'wd1', site: 'Careers',          name: 'Sprinklr' },         // 46 India / 90 total
    { company: 'chevron',         instance: 'wd5', site: 'Jobs',             name: 'Chevron' },          // 45 India / 166 total
    { company: 'broadridge',      instance: 'wd5', site: 'Careers',          name: 'Broadridge' },       // 45 India / 309 total
    { company: 'boeing',          instance: 'wd1', site: 'External_Careers', name: 'Boeing' },           // 43 India / 1172 total

    // ── LOWER VOLUME (1–39 India jobs) ──────────────────────────────────────
    { company: 'ntst',            instance: 'wd1', site: 'Careers',          name: 'Netsmart' },         // 20 India / 59 total
    { company: 'mars',            instance: 'wd3', site: 'External',         name: 'Mars' },             // 20 India / 678 total
    { company: 'dupont',          instance: 'wd5', site: 'Jobs',             name: 'DuPont' },           // 15 India / 161 total
    { company: 'leidos',          instance: 'wd5', site: 'External',         name: 'Leidos' },           // 9 India / 1881 total
    { company: 'trendmicro',      instance: 'wd3', site: 'External',         name: 'Trend Micro' },      // 8 India / 287 total
    { company: 'rackspace',       instance: 'wd1', site: 'External',         name: 'Rackspace' },        // 6 India / 60 total
    { company: 'mckesson',        instance: 'wd3', site: 'External_Careers', name: 'McKesson' },         // 6 India / 362 total
    { company: 'regeneron',       instance: 'wd1', site: 'Careers',          name: 'Regeneron' },        // 5 India / 448 total
    { company: 'unum',            instance: 'wd1', site: 'External',         name: 'Unum' },             // 1 India / 62 total
    // ── VERIFIED FROM SEARCHES ──
{ company: 'bdx',           instance: 'wd1',  site: 'EXTERNAL_CAREER_SITE_INDIA', name: 'BD (Becton Dickinson)' },
{ company: 'relx',          instance: 'wd3',  site: 'ElsevierJobs',    name: 'Elsevier/RELX' },
{ company: 'hpe',           instance: 'wd5',  site: 'Jobsathpe',       name: 'HPE' },
{ company: 'salesforce',    instance: 'wd12', site: 'External_Career_Site', name: 'Salesforce' },
{ company: 'elevancehealth',instance: 'wd1',  site: 'carelonglobal_in', name: 'Carelon (Elevance)' },
{ company: 'path',          instance: 'wd1',  site: 'External',        name: 'PATH' },

// ── High-confidence Fortune 500 with India offices, most on Workday ──
// (Verify instance via curl to their careers redirect)
{ company: 'accenture',     instance: 'wd3',  site: 'AccentureCareers',name: 'Accenture' },
{ company: 'deloitte',      instance: 'wd103',site: 'External',        name: 'Deloitte' },
{ company: 'nvidia',        instance: 'wd5',  site: 'NVIDIAExternalCareerSite', name: 'NVIDIA' },
{ company: 'adobe',         instance: 'wd5',  site: 'external_experienced', name: 'Adobe' },
{ company: 'autodesk',      instance: 'wd1',  site: 'Ext',             name: 'Autodesk' },
{ company: 'amd',           instance: 'wd1',  site: 'External',        name: 'AMD' },
{ company: 'appliedmaterials', instance: 'wd1', site: 'External',      name: 'Applied Materials' },
{ company: 'kla',           instance: 'wd5',  site: 'Search',          name: 'KLA' },
{ company: 'cisco',         instance: 'wd1',  site: 'External_Career_Site', name: 'Cisco' },
{ company: 'jnj',           instance: 'wd5',  site: 'jnjcareers',      name: 'Johnson & Johnson' },
{ company: 'medtronic',     instance: 'wd1',  site: 'MedtronicCareers', name: 'Medtronic' },
{ company: 'abbott',        instance: 'wd12', site: 'abbottcareers',   name: 'Abbott' },
{ company: 'thermofisher',  instance: 'wd3',  site: 'thermofishercareers', name: 'Thermo Fisher' },
{ company: 'biogen',        instance: 'wd1',  site: 'External',        name: 'Biogen' },
{ company: 'gilead',        instance: 'wd1',  site: 'gileadcareers',   name: 'Gilead' },
{ company: 'novartis',      instance: 'wd3',  site: 'Novartis_Careers', name: 'Novartis' },
{ company: 'sanofi',        instance: 'wd3',  site: 'SanofiCareers',   name: 'Sanofi' },
{ company: 'bayer',         instance: 'wd3',  site: 'bayer',           name: 'Bayer' },
{ company: 'pfizer',        instance: 'wd1',  site: 'PfizerCareers',   name: 'Pfizer' },
{ company: 'lilly',         instance: 'wd5',  site: 'LLY',             name: 'Eli Lilly' },
{ company: 'bms',           instance: 'wd1',  site: 'BMS',             name: 'Bristol-Myers Squibb' },
{ company: 'abbvie',        instance: 'wd1',  site: 'External',        name: 'AbbVie' },
{ company: 'merck',         instance: 'wd5',  site: 'External',        name: 'Merck' },
{ company: 'gsk',           instance: 'wd3',  site: 'GSKcareers',      name: 'GSK' },
{ company: 'walmart',       instance: 'wd5',  site: 'WalmartExternal', name: 'Walmart' },
{ company: 'target',        instance: 'wd5',  site: 'targetcareers',   name: 'Target' },
{ company: 'kroger',        instance: 'wd5',  site: 'External_Career_Site', name: 'Kroger' },
{ company: 'jpmc',          instance: 'wd1',  site: 'jpmc',            name: 'JPMorgan Chase' },
{ company: 'wellsfargo',    instance: 'wd1',  site: 'External',        name: 'Wells Fargo' },
{ company: 'citi',          instance: 'wd1',  site: 'Citi_Careers',    name: 'Citi' },
{ company: 'bofa',          instance: 'wd12', site: 'BofA_Careers',    name: 'Bank of America' },
{ company: 'ms',            instance: 'wd1',  site: 'External',        name: 'Morgan Stanley' },
{ company: 'schwab',        instance: 'wd1',  site: 'External',        name: 'Charles Schwab' },
{ company: 'fidelity',      instance: 'wd1',  site: 'fidelitycareers', name: 'Fidelity' },
{ company: 'amex',          instance: 'wd1',  site: 'AXP',             name: 'American Express' },
{ company: 'mastercard',    instance: 'wd5',  site: 'CorporateCareers', name: 'Mastercard' },
{ company: 'metlife',       instance: 'wd5',  site: 'External',        name: 'MetLife' },
{ company: 'prudential',    instance: 'wd5',  site: 'PruCareers',      name: 'Prudential' },
{ company: 'allstate',      instance: 'wd1',  site: 'External',        name: 'Allstate' },
{ company: 'progressive',   instance: 'wd5',  site: 'External',        name: 'Progressive' },
{ company: 'travelers',     instance: 'wd5',  site: 'External',        name: 'Travelers' },
{ company: 'unitedhealthgroup', instance: 'wd1', site: 'External',    name: 'UnitedHealth Group' },
{ company: 'humana',        instance: 'wd1',  site: 'External',        name: 'Humana' },
{ company: 'cvs',           instance: 'wd1',  site: 'External',        name: 'CVS Health' },
{ company: 'siemens',       instance: 'wd3',  site: 'siemens',         name: 'Siemens' },
{ company: 'se',            instance: 'wd3',  site: 'External',        name: 'Schneider Electric' },
{ company: 'schneider-electric', instance: 'wd3', site: 'Careers',    name: 'Schneider Electric' },
{ company: 'honeywell',     instance: 'wd1',  site: 'Professional_Careers', name: 'Honeywell' },
{ company: '3m',            instance: 'wd1',  site: 'Search',          name: '3M' },
{ company: 'ge',            instance: 'wd5',  site: 'GE_ExternalSite', name: 'GE' },
{ company: 'gehealthcare',  instance: 'wd5',  site: 'External',        name: 'GE HealthCare' },
{ company: 'colgate',       instance: 'wd5',  site: 'Colgate',         name: 'Colgate-Palmolive' },
{ company: 'nestle',        instance: 'wd3',  site: 'Nestle_External_Careers', name: 'Nestle' },
{ company: 'pepsico',       instance: 'wd5',  site: 'PepsiCoCareers',  name: 'PepsiCo' },
{ company: 'cocacola',      instance: 'wd1',  site: 'coca_cola_careers', name: 'Coca-Cola' },
{ company: 'kraftheinz',    instance: 'wd12', site: 'KraftHeinz',      name: 'Kraft Heinz' },
{ company: 'generalmills',  instance: 'wd1',  site: 'External',        name: 'General Mills' },
{ company: 'kellanova',     instance: 'wd1',  site: 'External',        name: 'Kellanova' },
{ company: 'mondelez',      instance: 'wd1',  site: 'External',        name: 'Mondelez' },
{ company: 'diageo',        instance: 'wd3',  site: 'Diageo_Careers',  name: 'Diageo' },
{ company: 'reckittbenckiser', instance: 'wd3', site: 'RB_Careers',   name: 'Reckitt' },
{ company: 'philips',       instance: 'wd3',  site: 'jobs-and-careers', name: 'Philips' },
{ company: 'siemens-healthineers', instance: 'wd3', site: 'External', name: 'Siemens Healthineers' },
{ company: 'baxter',        instance: 'wd5',  site: 'External',        name: 'Baxter' },
{ company: 'ford',          instance: 'wd1',  site: 'FordCareers',     name: 'Ford' },
{ company: 'gm',            instance: 'wd1',  site: 'External',        name: 'General Motors' },
{ company: 'volkswagen',    instance: 'wd3',  site: 'VW_ExternalCareers', name: 'Volkswagen' },
{ company: 'bmw',           instance: 'wd3',  site: 'BMWGroup',        name: 'BMW Group' },
{ company: 'mercedes-benz', instance: 'wd3',  site: 'MBcars',          name: 'Mercedes-Benz' },
{ company: 'adidas',        instance: 'wd3',  site: 'adidas',          name: 'adidas' },
{ company: 'lvmh',          instance: 'wd3',  site: 'LVMH_Careers',    name: 'LVMH' },
{ company: 'disney',        instance: 'wd5',  site: 'disneycareer',    name: 'Disney' },
{ company: 'comcast',       instance: 'wd5',  site: 'Comcast_Careers', name: 'Comcast' },
{ company: 'warnerbros',    instance: 'wd5',  site: 'global',          name: 'Warner Bros Discovery' },
{ company: 'paramount',     instance: 'wd5',  site: 'ParamountCareers',name: 'Paramount' },
{ company: 'nbcuniversal',  instance: 'wd1',  site: 'nbcunicareers',   name: 'NBCUniversal' },
{ company: 'aa',            instance: 'wd1',  site: 'American_Airlines', name: 'American Airlines' },
{ company: 'delta',         instance: 'wd1',  site: 'DeltaCareers',    name: 'Delta Air Lines' },
{ company: 'united',        instance: 'wd1',  site: 'UnitedCareers',   name: 'United Airlines' },
{ company: 'boozallen',     instance: 'wd1',  site: 'BAH_Jobs',        name: 'Booz Allen Hamilton' },
{ company: 'cbre',          instance: 'wd1',  site: 'CBRE',            name: 'CBRE' },
{ company: 'jll',           instance: 'wd1',  site: 'jllcareers',      name: 'JLL' },
{ company: 'cushmanwakefield', instance: 'wd1', site: 'CWCareers',    name: 'Cushman & Wakefield' },
{ company: 'publicisgroupe',instance: 'wd3',  site: 'External',        name: 'Publicis Groupe' },
{ company: 'omnicom',       instance: 'wd5',  site: 'omnicom',         name: 'Omnicom' },
{ company: 'nielsen',       instance: 'wd1',  site: 'Nielsen_External_Careers', name: 'Nielsen' },
{ company: 'niq',           instance: 'wd1',  site: 'NIQ_External_Careers', name: 'NielsenIQ' },
{ company: 'gartner',       instance: 'wd1',  site: 'EXT',             name: 'Gartner' },
{ company: 'forrester',     instance: 'wd1',  site: 'External',        name: 'Forrester' },
{ company: 'idc',           instance: 'wd1',  site: 'External',        name: 'IDC' },
{ company: 'spglobal',      instance: 'wd1',  site: 'External',        name: 'S&P Global' },
{ company: 'moodys',        instance: 'wd1',  site: 'Careers',         name: "Moody's" },
{ company: 'factset',       instance: 'wd1',  site: 'FactSetCareers',  name: 'FactSet' },
{ company: 'msci',          instance: 'wd5',  site: 'External',        name: 'MSCI' },
{ company: 'cmegroup',      instance: 'wd5',  site: 'External',        name: 'CME Group' },
{ company: 'ice',           instance: 'wd1',  site: 'Careers',         name: 'ICE' },
{ company: 'wolterskluwer', instance: 'wd3',  site: 'External',        name: 'Wolters Kluwer' },
{ company: 'pearson',       instance: 'wd3',  site: 'PearsonCareers',  name: 'Pearson' },
{ company: 'genpact',       instance: 'wd1',  site: 'Genpact',         name: 'Genpact' },
{ company: 'wns',           instance: 'wd1',  site: 'External',        name: 'WNS' },
{ company: 'firstsource',   instance: 'wd3',  site: 'firstsource',     name: 'Firstsource' },
{ company: 'ltimindtree',   instance: 'wd5',  site: 'External',        name: 'LTIMindtree' },
{ company: 'hcltech',       instance: 'wd3',  site: 'External',        name: 'HCLTech' },
{ company: 'techmahindra',  instance: 'wd3',  site: 'External',        name: 'Tech Mahindra' },
{ company: 'coforge',       instance: 'wd5',  site: 'External',        name: 'Coforge' },
{ company: 'mphasis',       instance: 'wd1',  site: 'External',        name: 'Mphasis' },
{ company: 'oracle',        instance: 'wd1',  site: 'External',        name: 'Oracle' },
{ company: 'sap',           instance: 'wd3',  site: 'SAP_SuccessFactors_Careers', name: 'SAP' },
{ company: 'infor',         instance: 'wd1',  site: 'Infor',           name: 'Infor' },
{ company: 'epicor',        instance: 'wd1',  site: 'External',        name: 'Epicor' },
{ company: 'openai',        instance: 'wd1',  site: 'External',        name: 'OpenAI' }, // if not on Ashby

// ── Discovery run 2026-09-15: verified ≥1 live India job ──
{ company: 'genpact', instance: 'wd108', site: 'External_Careers', name: 'genpact' },  // Added via discovery — 1970 India / 1970 total
{ company: 'flextronics', instance: 'wd1', site: 'careers', name: 'flextronics' },  // Added via discovery — 1064 India / 1064 total
{ company: 'freseniusmedicalcare', instance: 'wd3', site: 'fme', name: 'freseniusmedicalcare' },  // Added via discovery — 1044 India / 1044 total
{ company: 'citi', instance: 'wd5', site: '2', name: 'citi' },  // Added via discovery — 980 India / 980 total
{ company: 'pwc', instance: 'wd3', site: 'crm_experienced_careers_site', name: 'pwc' },  // Added via discovery — 878 India / 878 total
{ company: 'hitachi', instance: 'wd1', site: 'hitachi', name: 'hitachi' },  // Added via discovery — 867 India / 867 total
{ company: 'cnx', instance: 'wd1', site: 'external_global', name: 'cnx' },  // Added via discovery — 485 India / 485 total
{ company: 'advanceauto', instance: 'wd5', site: 'advanceexternalcareers', name: 'advanceauto' },  // Added via discovery — 449 India / 449 total
{ company: 'dbs', instance: 'wd3', site: 'dbs_careers', name: 'dbs' },  // Added via discovery — 442 India / 442 total
{ company: 'taskus', instance: 'wd1', site: 'careers', name: 'taskus' },  // Added via discovery — 425 India / 425 total
{ company: 'theapexgroup', instance: 'wd3', site: 'apexgroupcareers', name: 'theapexgroup' },  // Added via discovery — 412 India / 412 total
{ company: 'hpe', instance: 'wd5', site: 'wfmathpe', name: 'hpe' },  // Added via discovery — 407 India / 407 total
{ company: 'hpe', instance: 'wd5', site: 'acjobsite', name: 'hpe' },  // Added via discovery — 404 India / 404 total
{ company: 'allstate', instance: 'wd5', site: 'allstate_careers', name: 'allstate' },  // Added via discovery — 367 India / 367 total
{ company: 'kyndryl', instance: 'wd5', site: 'kyndrylprofessionalcareers', name: 'kyndryl' },  // Added via discovery — 362 India / 362 total
{ company: 'cw', instance: 'wd1', site: 'external', name: 'cw' },  // Added via discovery — 333 India / 333 total
{ company: 'cisco', instance: 'wd5', site: 'cisco_careers', name: 'cisco' },  // Added via discovery — 322 India / 322 total
{ company: 'pwc', instance: 'wd3', site: 'nonpublic_postings', name: 'pwc' },  // Added via discovery — 304 India / 304 total
{ company: 'statestreet', instance: 'wd1', site: 'global', name: 'statestreet' },  // Added via discovery — 298 India / 298 total
{ company: 'abb', instance: 'wd3', site: 'external_career_page', name: 'abb' },  // Added via discovery — 289 India / 289 total
{ company: 'ag', instance: 'wd3', site: 'airbus', name: 'ag' },  // Added via discovery — 288 India / 288 total
{ company: 'db', instance: 'wd3', site: 'dbwebsite', name: 'db' },  // Added via discovery — 280 India / 280 total
{ company: 'hcmportal', instance: 'wd5', site: 'search', name: 'hcmportal' },  // Added via discovery — 264 India / 264 total
{ company: 'nttlimited', instance: 'wd3', site: 'ntt_careers', name: 'nttlimited' },  // Added via discovery — 262 India / 262 total
{ company: 'pae', instance: 'wd1', site: 'amentum_careers', name: 'pae' },  // Added via discovery — 254 India / 254 total
{ company: 'rsm', instance: 'wd1', site: 'rsmcareers', name: 'rsm' },  // Added via discovery — 248 India / 248 total
{ company: 'jiostar', instance: 'wd102', site: 'JioStar', name: 'jiostar' },  // Added via discovery — 247 India / 247 total
{ company: 'slihrms', instance: 'wd3', site: 'careers', name: 'slihrms' },  // Added via discovery — 224 India / 224 total
{ company: 'maersk', instance: 'wd3', site: 'maersk_careers', name: 'maersk' },  // Added via discovery — 217 India / 217 total
{ company: 'mufgub', instance: 'wd3', site: 'mufg-careers', name: 'mufgub' },  // Added via discovery — 204 India / 204 total
{ company: 'jci', instance: 'wd5', site: 'jci', name: 'jci' },  // Added via discovery — 203 India / 203 total
{ company: 'lseg', instance: 'wd3', site: 'careers', name: 'lseg' },  // Added via discovery — 200 India / 200 total
{ company: 'amat', instance: 'wd1', site: 'external', name: 'amat' },  // Added via discovery — 195 India / 195 total
{ company: 'piramalpharma', instance: 'wd102', site: 'piramal_external_careers', name: 'piramalpharma' },  // Added via discovery — 188 India / 188 total
{ company: 'terex', instance: 'wd1', site: 'terexcareers', name: 'terex' },  // Added via discovery — 188 India / 188 total
{ company: 'valeo', instance: 'wd3', site: 'valeo_jobs', name: 'valeo' },  // Added via discovery — 188 India / 188 total
{ company: 'wf', instance: 'wd1', site: 'wellsfargojobs', name: 'wf' },  // Added via discovery — 188 India / 188 total
{ company: 'tranetechnologies', instance: 'wd12', site: 'Trane_Technologies_Careers', name: 'tranetechnologies' },  // Added via discovery — 170 India / 170 total
{ company: 'paloaltonetworks', instance: 'wd5', site: 'panwexternalcareers', name: 'paloaltonetworks' },  // Added via discovery — 169 India / 169 total
{ company: 'danaher', instance: 'wd1', site: 'danaherjobs', name: 'danaher' },  // Added via discovery — 157 India / 157 total
{ company: 'hp', instance: 'wd5', site: 'exteu-ac-careersite', name: 'hp' },  // Added via discovery — 156 India / 156 total
{ company: 'harman', instance: 'wd3', site: 'harman', name: 'harman' },  // Added via discovery — 155 India / 155 total
{ company: 'kenvue', instance: 'wd5', site: 'kenvue', name: 'kenvue' },  // Added via discovery — 155 India / 155 total
{ company: 'allegion', instance: 'wd5', site: 'careers', name: 'allegion' },  // Added via discovery — 151 India / 151 total
{ company: 'dentsuaegis', instance: 'wd3', site: 'dan_global', name: 'dentsuaegis' },  // Added via discovery — 151 India / 151 total
{ company: 'magna', instance: 'wd3', site: 'magna', name: 'magna' },  // Added via discovery — 151 India / 151 total
{ company: 'elanco', instance: 'wd5', site: 'external_career', name: 'elanco' },  // Added via discovery — 145 India / 145 total
{ company: 'cigna', instance: 'wd5', site: 'cignacareers', name: 'cigna' },  // Added via discovery — 143 India / 143 total
{ company: 'kbr', instance: 'wd5', site: 'kbr_careers', name: 'kbr' },  // Added via discovery — 143 India / 143 total
{ company: 'guardianlife', instance: 'wd5', site: 'guardian-life-careers', name: 'guardianlife' },  // Added via discovery — 142 India / 142 total
{ company: 'cat', instance: 'wd5', site: 'caterpillarcareers', name: 'cat' },  // Added via discovery — 141 India / 141 total
{ company: 'mdlz', instance: 'wd3', site: 'external', name: 'mdlz' },  // Added via discovery — 141 India / 141 total
{ company: 'pwc', instance: 'wd3', site: 'global_experienced_careers', name: 'pwc' },  // Added via discovery — 139 India / 139 total
{ company: 'syneoshealth', instance: 'wd12', site: 'syneos_health_external_site', name: 'syneoshealth' },  // Added via discovery — 139 India / 139 total
{ company: 'jj', instance: 'wd5', site: 'jj', name: 'jj' },  // Added via discovery — 135 India / 135 total
{ company: 'arrow', instance: 'wd1', site: 'ec', name: 'arrow' },  // Added via discovery — 135 India / 135 total
{ company: 'synnex', instance: 'wd5', site: 'tdsynnexcareers', name: 'synnex' },  // Added via discovery — 134 India / 134 total
{ company: 'lowes', instance: 'wd5', site: 'lws_external_cs', name: 'lowes' },  // Added via discovery — 133 India / 133 total
{ company: 'medtronic', instance: 'wd1', site: 'redeploymentmedtroniccareers', name: 'medtronic' },  // Added via discovery — 132 India / 132 total
{ company: 'carrier', instance: 'wd5', site: 'jobs', name: 'carrier' },  // Added via discovery — 124 India / 124 total
{ company: 'globalhr', instance: 'wd5', site: 'rec_rtx_ext_gateway', name: 'globalhr' },  // Added via discovery — 123 India / 123 total
{ company: 'skechers', instance: 'wd5', site: 'one-career-site', name: 'skechers' },  // Added via discovery — 121 India / 121 total
{ company: 'guidehouse', instance: 'wd1', site: 'external', name: 'guidehouse' },  // Added via discovery — 120 India / 120 total
{ company: 'xylem', instance: 'wd5', site: 'xylem-careers', name: 'xylem' },  // Added via discovery — 120 India / 120 total
{ company: 'ksb', instance: 'wd3', site: 'ksb_externalcareersite', name: 'ksb' },  // Added via discovery — 117 India / 117 total
{ company: 'aptiv', instance: 'wd5', site: 'aptiv_careers', name: 'aptiv' },  // Added via discovery — 116 India / 116 total
{ company: 'bristolmyerssquibb', instance: 'wd5', site: 'bms', name: 'bristolmyerssquibb' },  // Added via discovery — 114 India / 114 total
{ company: 'dxctechnology', instance: 'wd1', site: 'dxcjobs', name: 'dxctechnology' },  // Added via discovery — 107 India / 107 total
{ company: 'ghr', instance: 'wd1', site: 'lateral-ba_continuum', name: 'ghr' },  // Added via discovery — 104 India / 104 total
{ company: 'bakertilly', instance: 'wd5', site: 'btcareers', name: 'bakertilly' },  // Added via discovery — 103 India / 103 total
{ company: 'iqvia', instance: 'wd1', site: 'iqvia', name: 'iqvia' },  // Added via discovery — 103 India / 103 total
{ company: 'jabil', instance: 'wd5', site: 'jabil_careers', name: 'jabil' },  // Added via discovery — 103 India / 103 total
{ company: 'ntrs', instance: 'wd1', site: 'northerntrust', name: 'ntrs' },  // Added via discovery — 102 India / 102 total
{ company: 'wk', instance: 'wd3', site: 'external', name: 'wk' },  // Added via discovery — 102 India / 102 total
{ company: 'myhrabc', instance: 'wd5', site: 'global', name: 'myhrabc' },  // Added via discovery — 101 India / 101 total
{ company: 'crowe', instance: 'wd12', site: 'external_careers', name: 'crowe' },  // Added via discovery — 98 India / 98 total
{ company: 'heinz', instance: 'wd1', site: 'kraftheinz_careers', name: 'heinz' },  // Added via discovery — 97 India / 97 total
{ company: 'hp', instance: 'wd5', site: 'externalcareersite', name: 'hp' },  // Added via discovery — 94 India / 94 total
{ company: 'microchiphr', instance: 'wd5', site: 'external', name: 'microchiphr' },  // Added via discovery — 94 India / 94 total
{ company: 'mmc', instance: 'wd1', site: 'mmc', name: 'mmc' },  // Added via discovery — 94 India / 94 total
{ company: 'agilent', instance: 'wd5', site: 'agilent_careers', name: 'agilent' },  // Added via discovery — 92 India / 92 total
{ company: 'freudenberg', instance: 'wd3', site: 'freudenberg-group', name: 'freudenberg' },  // Added via discovery — 91 India / 91 total
{ company: 'nab', instance: 'wd3', site: 'nab_careers', name: 'nab' },  // Added via discovery — 89 India / 89 total
{ company: 'erm', instance: 'wd3', site: 'erm_careers', name: 'erm' },  // Added via discovery — 87 India / 87 total
{ company: 'outsystems', instance: 'wd503', site: 'outsystems', name: 'outsystems' },  // Added via discovery — 87 India / 87 total
{ company: 'simcorp', instance: 'wd3', site: 'simcorp_jobs', name: 'simcorp' },  // Added via discovery — 87 India / 87 total
{ company: 'vanguard', instance: 'wd5', site: 'vanguard_external', name: 'vanguard' },  // Added via discovery — 86 India / 86 total
{ company: 'tjx', instance: 'wd1', site: 'tjx_external', name: 'tjx' },  // Added via discovery — 85 India / 85 total
{ company: 'barrywehmiller', instance: 'wd1', site: 'bwcareers', name: 'barrywehmiller' },  // Added via discovery — 84 India / 84 total
{ company: 'zeissgroup', instance: 'wd3', site: 'external', name: 'zeissgroup' },  // Added via discovery — 84 India / 84 total
{ company: 'rollsroyce', instance: 'wd3', site: 'professional', name: 'rollsroyce' },  // Added via discovery — 83 India / 83 total
{ company: 'harriscomputer', instance: 'wd3', site: '1', name: 'harriscomputer' },  // Added via discovery — 81 India / 81 total
{ company: 'fourseasons', instance: 'wd3', site: 'search', name: 'fourseasons' },  // Added via discovery — 79 India / 79 total
{ company: 'huron', instance: 'wd1', site: 'huroncareers', name: 'huron' },  // Added via discovery — 79 India / 79 total
{ company: 'bpinternational', instance: 'wd3', site: 'bpcareers', name: 'bpinternational' },  // Added via discovery — 78 India / 78 total
{ company: 'internationalschools', instance: 'wd3', site: 'ispcareers', name: 'internationalschools' },  // Added via discovery — 78 India / 78 total
{ company: 'regalrexnord', instance: 'wd1', site: 'careers', name: 'regalrexnord' },  // Added via discovery — 78 India / 78 total
{ company: 'roche', instance: 'wd3', site: 'roche-ext', name: 'roche' },  // Added via discovery — 77 India / 77 total
{ company: 'alkami', instance: 'wd12', site: 'alkami', name: 'alkami' },  // Added via discovery — 76 India / 76 total
{ company: 'healthcare', instance: 'wd1', site: 'search', name: 'healthcare' },  // Added via discovery — 76 India / 76 total
{ company: 'synechron', instance: 'wd1', site: 'synechroncareers', name: 'synechron' },  // Added via discovery — 76 India / 76 total
{ company: 'visa', instance: 'wd5', site: 'visa', name: 'visa' },  // Added via discovery — 76 India / 76 total
{ company: 'modmed', instance: 'wd501', site: 'modmed12', name: 'modmed' },  // Added via discovery — 75 India / 75 total
{ company: 'nike', instance: 'wd1', site: 'nke', name: 'nike' },  // Added via discovery — 75 India / 75 total
{ company: 'ssctech', instance: 'wd1', site: 'ssctechnologies', name: 'ssctech' },  // Added via discovery — 75 India / 75 total
{ company: 'altera', instance: 'wd1', site: 'altera', name: 'altera' },  // Added via discovery — 73 India / 73 total
{ company: 'relx', instance: 'wd3', site: 'relx', name: 'relx' },  // Added via discovery — 73 India / 73 total
{ company: 'wasatchproperty', instance: 'wd1', site: 'marketstarcareers', name: 'wasatchproperty' },  // Added via discovery — 73 India / 73 total
{ company: 'ameriprise', instance: 'wd5', site: 'ameriprise', name: 'ameriprise' },  // Added via discovery — 72 India / 72 total
{ company: 'aveva', instance: 'wd3', site: 'aveva_careers', name: 'aveva' },  // Added via discovery — 70 India / 70 total
{ company: 'lonza', instance: 'wd3', site: 'lonza_careers', name: 'lonza' },  // Added via discovery — 69 India / 69 total
{ company: 'medline', instance: 'wd5', site: 'medline', name: 'medline' },  // Added via discovery — 68 India / 68 total
{ company: 'veradigm', instance: 'wd12', site: 'vr', name: 'veradigm' },  // Added via discovery — 68 India / 68 total
{ company: 'slihrms', instance: 'wd3', site: 'linxon', name: 'slihrms' },  // Added via discovery — 67 India / 67 total
{ company: 'iff', instance: 'wd5', site: 'iff_careers', name: 'iff' },  // Added via discovery — 66 India / 66 total
{ company: 'jda', instance: 'wd5', site: 'jda_careers', name: 'jda' },  // Added via discovery — 66 India / 66 total
{ company: 'armaninollp', instance: 'wd1', site: 'armanino_india', name: 'armaninollp' },  // Added via discovery — 64 India / 64 total
{ company: 'ingrammicro', instance: 'wd5', site: 'ingrammicro', name: 'ingrammicro' },  // Added via discovery — 63 India / 63 total
{ company: 'ebay', instance: 'wd5', site: 'apply', name: 'ebay' },  // Added via discovery — 63 India / 63 total
{ company: 'airliquidehr', instance: 'wd3', site: 'airliquideexternalcareer', name: 'airliquidehr' },  // Added via discovery — 62 India / 62 total
{ company: 'latticesemi', instance: 'wd5', site: 'latticesemiconductorscareers', name: 'latticesemi' },  // Added via discovery — 62 India / 62 total
{ company: 'rockwellautomation', instance: 'wd1', site: 'external_rockwell_automation', name: 'rockwellautomation' },  // Added via discovery — 62 India / 62 total
{ company: 'baxter', instance: 'wd1', site: 'baxter', name: 'baxter' },  // Added via discovery — 61 India / 61 total
{ company: 'motorolasolutions', instance: 'wd5', site: 'careers', name: 'motorolasolutions' },  // Added via discovery — 61 India / 61 total
{ company: 'coke', instance: 'wd1', site: 'coca-cola-careers', name: 'coke' },  // Added via discovery — 59 India / 59 total
{ company: 'corteva', instance: 'wd5', site: 'corteva', name: 'corteva' },  // Added via discovery — 59 India / 59 total
{ company: 'finastra', instance: 'wd3', site: 'finc', name: 'finastra' },  // Added via discovery — 58 India / 58 total
{ company: 'blackrock', instance: 'wd1', site: 'blackrock_professional', name: 'blackrock' },  // Added via discovery — 57 India / 57 total
{ company: 'puma', instance: 'wd502', site: 'jobs_at_puma', name: 'puma' },  // Added via discovery — 57 India / 57 total
{ company: 'spgi', instance: 'wd5', site: 'spgi_internal', name: 'spgi' },  // Added via discovery — 57 India / 57 total
{ company: 'fiserv', instance: 'wd5', site: 'ext', name: 'fiserv' },  // Added via discovery — 56 India / 56 total
{ company: 'aresmgmt', instance: 'wd1', site: 'external', name: 'aresmgmt' },  // Added via discovery — 55 India / 55 total
{ company: 'lbg', instance: 'wd3', site: 'lloyds_technology_centre', name: 'lbg' },  // Added via discovery — 55 India / 55 total
{ company: 'citicclsa', instance: 'wd3', site: 'external', name: 'citicclsa' },  // Added via discovery — 54 India / 54 total
{ company: 'sec', instance: 'wd3', site: 'samsung_careers', name: 'sec' },  // Added via discovery — 54 India / 54 total
{ company: 'surbanajurong', instance: 'wd3', site: 'careersatsmec', name: 'surbanajurong' },  // Added via discovery — 54 India / 54 total
{ company: 'crowdstrike', instance: 'wd5', site: 'crowdstrikecareers', name: 'crowdstrike' },  // Added via discovery — 53 India / 53 total
{ company: 'erm', instance: 'wd3', site: 'erm_experiencedprofessionals', name: 'erm' },  // Added via discovery — 53 India / 53 total
{ company: 'gsknch', instance: 'wd3', site: 'gskcareers', name: 'gsknch' },  // Added via discovery — 52 India / 52 total
{ company: 'maersk', instance: 'wd3', site: 'maersk_manual', name: 'maersk' },  // Added via discovery — 52 India / 52 total
{ company: 'arrow', instance: 'wd1', site: 'ac', name: 'arrow' },  // Added via discovery — 51 India / 51 total
{ company: 'astreya', instance: 'wd5', site: 'life-at-astreya-opportunities', name: 'astreya' },  // Added via discovery — 51 India / 51 total
{ company: 'quantiphi', instance: 'wd1', site: 'careers_at_quantiphi', name: 'quantiphi' },  // Added via discovery — 51 India / 51 total
{ company: 'resourcepro', instance: 'wd12', site: 'career', name: 'resourcepro' },  // Added via discovery — 51 India / 51 total
{ company: 'thehartford', instance: 'wd5', site: 'careers_external', name: 'thehartford' },  // Added via discovery — 51 India / 51 total
{ company: 'solenis', instance: 'wd1', site: 'solenis', name: 'solenis' },  // Added via discovery — 50 India / 50 total
{ company: 'jj', instance: 'wd5', site: 'displacedemployees', name: 'jj' },  // Added via discovery — 49 India / 49 total
{ company: 'mgpru', instance: 'wd3', site: 'mandgprudential', name: 'mgpru' },  // Added via discovery — 49 India / 49 total
{ company: 'aristocrat', instance: 'wd3', site: 'aristocratexternalcareerssite', name: 'aristocrat' },  // Added via discovery — 48 India / 48 total
{ company: 'generalmotors', instance: 'wd5', site: 'careers_gm', name: 'generalmotors' },  // Added via discovery — 48 India / 48 total
{ company: 'masco', instance: 'wd1', site: 'masco', name: 'masco' },  // Added via discovery — 48 India / 48 total
{ company: 'parexel', instance: 'wd1', site: 'parexel_external_careers', name: 'parexel' },  // Added via discovery — 48 India / 48 total
{ company: 'disney', instance: 'wd5', site: 'disneycareerdc', name: 'disney' },  // Added via discovery — 48 India / 48 total
{ company: 'genesys', instance: 'wd1', site: 'genesys', name: 'genesys' },  // Added via discovery — 47 India / 47 total
{ company: 'sabre', instance: 'wd1', site: 'sabrejobs', name: 'sabre' },  // Added via discovery — 47 India / 47 total
{ company: 'sifive', instance: 'wd1', site: 'sifivecareers', name: 'sifive' },  // Added via discovery — 47 India / 47 total
{ company: 'vishay', instance: 'wd3', site: 'vishaycareers', name: 'vishay' },  // Added via discovery — 47 India / 47 total
{ company: 'candescent', instance: 'wd501', site: 'hiring', name: 'candescent' },  // Added via discovery — 46 India / 46 total
{ company: 'copeland', instance: 'wd5', site: 'copeland_external_careers_page', name: 'copeland' },  // Added via discovery — 46 India / 46 total
{ company: 'gevernova', instance: 'wd5', site: 'only_confidential_executive_recruiting', name: 'gevernova' },  // Added via discovery — 46 India / 46 total
{ company: 'ms', instance: 'wd5', site: 'private', name: 'ms' },  // Added via discovery — 46 India / 46 total
{ company: 'spgi', instance: 'wd5', site: 'spgi_careers', name: 'spgi' },  // Added via discovery — 45 India / 45 total
{ company: 'cba', instance: 'wd3', site: 'commbank_careers', name: 'cba' },  // Added via discovery — 44 India / 44 total
{ company: 'dow', instance: 'wd1', site: 'externalcareers', name: 'dow' },  // Added via discovery — 44 India / 44 total
{ company: 'firstam', instance: 'wd1', site: 'faicareers', name: 'firstam' },  // Added via discovery — 44 India / 44 total
{ company: 'gevernova', instance: 'wd5', site: 'vernova_externalsite', name: 'gevernova' },  // Added via discovery — 44 India / 44 total
{ company: 'marmon', instance: 'wd501', site: 'marmon_careers', name: 'marmon' },  // Added via discovery — 44 India / 44 total
{ company: 'solera', instance: 'wd5', site: 'global_career_site', name: 'solera' },  // Added via discovery — 44 India / 44 total
{ company: 'travelhrportal', instance: 'wd1', site: 'jobs', name: 'travelhrportal' },  // Added via discovery — 44 India / 44 total
{ company: 'empower', instance: 'wd12', site: 'empower', name: 'empower' },  // Added via discovery — 43 India / 43 total
{ company: 'o9solutions', instance: 'wd5', site: 'o9solutionsexternal', name: 'o9solutions' },  // Added via discovery — 43 India / 43 total
{ company: 'rbs', instance: 'wd3', site: 'rbs', name: 'rbs' },  // Added via discovery — 43 India / 43 total
{ company: 'att', instance: 'wd1', site: 'attgeneral', name: 'att' },  // Added via discovery — 42 India / 42 total
{ company: 'guidewire', instance: 'wd5', site: 'external', name: 'guidewire' },  // Added via discovery — 42 India / 42 total
{ company: 'invesco', instance: 'wd1', site: 'ivz', name: 'invesco' },  // Added via discovery — 42 India / 42 total
{ company: 'alfalaval', instance: 'wd3', site: 'alfa_laval_jobs', name: 'alfalaval' },  // Added via discovery — 41 India / 41 total
{ company: 'blackbaud', instance: 'wd1', site: 'externalcareers', name: 'blackbaud' },  // Added via discovery — 41 India / 41 total
{ company: 'flowserve', instance: 'wd1', site: 'applied', name: 'flowserve' },  // Added via discovery — 41 India / 41 total
{ company: 'nttglobaldatacenters', instance: 'wd501', site: 'external', name: 'nttglobaldatacenters' },  // Added via discovery — 41 India / 41 total
{ company: 'nvent', instance: 'wd5', site: 'nvent', name: 'nvent' },  // Added via discovery — 41 India / 41 total
{ company: 'edwards', instance: 'wd5', site: 'edwardscareers', name: 'edwards' },  // Added via discovery — 40 India / 40 total
{ company: 'firstadvantage', instance: 'wd5', site: 'FirstAdvantage', name: 'firstadvantage' },  // Added via discovery — 40 India / 40 total
{ company: 'novartis', instance: 'wd3', site: 'internal_careers_for_acquired_entities', name: 'novartis' },  // Added via discovery — 40 India / 40 total
{ company: 'pg', instance: 'wd5', site: '1000', name: 'pg' },  // Added via discovery — 39 India / 39 total
{ company: 'verizon', instance: 'wd12', site: 'verizon-careers', name: 'verizon' },  // Added via discovery — 39 India / 39 total
{ company: 'applyboard', instance: 'wd3', site: 'applyboardnh', name: 'applyboard' },  // Added via discovery — 38 India / 38 total
{ company: 'lighting', instance: 'wd3', site: 'jobs-and-careers', name: 'lighting' },  // Added via discovery — 38 India / 38 total
{ company: 'transunion', instance: 'wd5', site: 'transunion', name: 'transunion' },  // Added via discovery — 38 India / 38 total
{ company: 'aspentech', instance: 'wd5', site: 'aspentech', name: 'aspentech' },  // Added via discovery — 37 India / 37 total
{ company: 'aliaxis', instance: 'wd3', site: 'aliaxis', name: 'aliaxis' },  // Added via discovery — 36 India / 36 total
{ company: 'bpinternational', instance: 'wd3', site: 'bpprivateexternalcareerssite', name: 'bpinternational' },  // Added via discovery — 36 India / 36 total
{ company: 'fedex', instance: 'wd1', site: 'fxe-meisa-external', name: 'fedex' },  // Added via discovery — 36 India / 36 total
{ company: 'fortrea', instance: 'wd1', site: 'fortrea', name: 'fortrea' },  // Added via discovery — 36 India / 36 total
{ company: 'nordsonhcm', instance: 'wd501', site: 'nordsoncareers', name: 'nordsonhcm' },  // Added via discovery — 36 India / 36 total
{ company: 'svb', instance: 'wd5', site: 'firstcitizensindia', name: 'svb' },  // Added via discovery — 36 India / 36 total
{ company: 'icf', instance: 'wd5', site: 'icfexternal_career_site', name: 'icf' },  // Added via discovery — 35 India / 35 total
{ company: 'surbanajurong', instance: 'wd3', site: 'sj_careers', name: 'surbanajurong' },  // Added via discovery — 35 India / 35 total
{ company: 'worldwide', instance: 'wd1', site: 'external', name: 'worldwide' },  // Added via discovery — 35 India / 35 total
{ company: 'dexcom', instance: 'wd1', site: 'dexcom', name: 'dexcom' },  // Added via discovery — 34 India / 34 total
{ company: 'equifax', instance: 'wd5', site: 'external', name: 'equifax' },  // Added via discovery — 34 India / 34 total
{ company: 'mrisoftware', instance: 'wd501', site: 'external_careersite', name: 'mrisoftware' },  // Added via discovery — 34 India / 34 total
{ company: 'nttlimited', instance: 'wd3', site: 'internal_employees_not_on_workday', name: 'nttlimited' },  // Added via discovery — 34 India / 34 total
{ company: 'ryan', instance: 'wd1', site: 'ryancareers', name: 'ryan' },  // Added via discovery — 34 India / 34 total
{ company: 'centific', instance: 'wd1', site: 'centific_global', name: 'centific' },  // Added via discovery — 33 India / 33 total
{ company: 'harriscomputer', instance: 'wd3', site: 'altera', name: 'harriscomputer' },  // Added via discovery — 33 India / 33 total
{ company: 'lnw', instance: 'wd5', site: 'lightwonderexternalcareers', name: 'lnw' },  // Added via discovery — 33 India / 33 total
{ company: 'prudential', instance: 'wd3', site: 'prudential', name: 'prudential' },  // Added via discovery — 33 India / 33 total
{ company: 'ptc', instance: 'wd1', site: 'ptc', name: 'ptc' },  // Added via discovery — 33 India / 33 total
{ company: 'rockwoolgroup', instance: 'wd3', site: 'rockwool', name: 'rockwoolgroup' },  // Added via discovery — 33 India / 33 total
{ company: 'sandvik', instance: 'wd3', site: 'sandvik-jobs', name: 'sandvik' },  // Added via discovery — 33 India / 33 total
{ company: 'silabs', instance: 'wd1', site: 'siliconlabscareers', name: 'silabs' },  // Added via discovery — 33 India / 33 total
{ company: 'silabs', instance: 'wd1', site: 'experiencedjobs', name: 'silabs' },  // Added via discovery — 33 India / 33 total
{ company: 'zillow', instance: 'wd5', site: 'zillow_group_external', name: 'zillow' },  // Added via discovery — 33 India / 33 total
{ company: 'myhr', instance: 'wd3', site: 'planseegroup_career', name: 'myhr' },  // Added via discovery — 32 India / 32 total
{ company: 'vwr', instance: 'wd1', site: 'avantorjobs', name: 'vwr' },  // Added via discovery — 32 India / 32 total
{ company: 'athenahealth', instance: 'wd1', site: 'external', name: 'athenahealth' },  // Added via discovery — 31 India / 31 total
{ company: 'clarivate', instance: 'wd3', site: 'clarivate_careers', name: 'clarivate' },  // Added via discovery — 31 India / 31 total
{ company: 'theaccessgroup', instance: 'wd103', site: 'access_group_external_careers', name: 'theaccessgroup' },  // Added via discovery — 31 India / 31 total
{ company: 'tsys', instance: 'wd1', site: 'tsys', name: 'tsys' },  // Added via discovery — 31 India / 31 total
{ company: 'wf', instance: 'wd1', site: 'wellsfargojobstargeted', name: 'wf' },  // Added via discovery — 31 India / 31 total
{ company: 'barclays', instance: 'wd3', site: 'external_career_site_barclays', name: 'barclays' },  // Added via discovery — 30 India / 30 total
{ company: 'cubic', instance: 'wd1', site: 'cubic_global_careers', name: 'cubic' },  // Added via discovery — 30 India / 30 total
{ company: 'omnissa', instance: 'wd501', site: 'omnissa_external_career_site', name: 'omnissa' },  // Added via discovery — 30 India / 30 total
{ company: 'soti', instance: 'wd3', site: 'careers', name: 'soti' },  // Added via discovery — 30 India / 30 total
{ company: 'circles', instance: 'wd103', site: 'circles', name: 'circles' },  // Added via discovery — 29 India / 29 total
{ company: 'johnsonelectric', instance: 'wd3', site: 'career_je', name: 'johnsonelectric' },  // Added via discovery — 29 India / 29 total
{ company: 'kantar', instance: 'wd3', site: 'kantar', name: 'kantar' },  // Added via discovery — 29 India / 29 total
{ company: 'nasdaq', instance: 'wd1', site: 'global_external_site', name: 'nasdaq' },  // Added via discovery — 29 India / 29 total
{ company: 'abglobal', instance: 'wd1', site: 'alliancebernsteincareers', name: 'abglobal' },  // Added via discovery — 28 India / 28 total
{ company: 'bloomenergy', instance: 'wd1', site: 'bloomenergycareers', name: 'bloomenergy' },  // Added via discovery — 28 India / 28 total
{ company: 'eisneramper', instance: 'wd1', site: 'eisneramper_external', name: 'eisneramper' },  // Added via discovery — 28 India / 28 total
{ company: 'equiniti', instance: 'wd3', site: 'opportunities', name: 'equiniti' },  // Added via discovery — 28 India / 28 total
{ company: 'fnz', instance: 'wd3', site: 'fnz_careers', name: 'fnz' },  // Added via discovery — 28 India / 28 total
{ company: 'galderma', instance: 'wd3', site: 'external', name: 'galderma' },  // Added via discovery — 28 India / 28 total
{ company: 'pvh', instance: 'wd1', site: 'pvh_careers', name: 'pvh' },  // Added via discovery — 28 India / 28 total
{ company: 'trimble', instance: 'wd1', site: 'trimblecareers', name: 'trimble' },  // Added via discovery — 28 India / 28 total
{ company: 'trinitylifesciences', instance: 'wd108', site: 'trinity', name: 'trinitylifesciences' },  // Added via discovery — 28 India / 28 total
{ company: 'tysonfoods', instance: 'wd5', site: 'tsn', name: 'tysonfoods' },  // Added via discovery — 28 India / 28 total
{ company: 'aliaxis', instance: 'wd3', site: 'aliaxis_indiaashirvad1', name: 'aliaxis' },  // Added via discovery — 27 India / 27 total
{ company: 'athene', instance: 'wd5', site: 'apollononpubliccareersite', name: 'athene' },  // Added via discovery — 27 India / 27 total
{ company: 'mksinst', instance: 'wd1', site: 'mkscareersemea', name: 'mksinst' },  // Added via discovery — 27 India / 27 total
{ company: 'oaktree', instance: 'wd1', site: 'oaktree', name: 'oaktree' },  // Added via discovery — 27 India / 27 total
{ company: 'pretiumenterpriseservices', instance: 'wd1', site: 'pretium-enterprise-services', name: 'pretiumenterpriseservices' },  // Added via discovery — 27 India / 27 total
{ company: 'workday', instance: 'wd5', site: 'workday', name: 'workday' },  // Added via discovery — 27 India / 27 total
{ company: 'aptiagroup', instance: 'wd3', site: 'opportunities', name: 'aptiagroup' },  // Added via discovery — 26 India / 26 total
{ company: 'athene', instance: 'wd5', site: 'apollo_careers', name: 'athene' },  // Added via discovery — 26 India / 26 total
{ company: 'bb', instance: 'wd3', site: 'blackberry', name: 'bb' },  // Added via discovery — 26 India / 26 total
{ company: 'db', instance: 'wd3', site: 'dwswebsite', name: 'db' },  // Added via discovery — 26 India / 26 total
{ company: 'evonik', instance: 'wd3', site: 'external_careers', name: 'evonik' },  // Added via discovery — 26 India / 26 total
{ company: 'ffive', instance: 'wd5', site: 'f5jobs', name: 'ffive' },  // Added via discovery — 26 India / 26 total
{ company: 'issgovernance', instance: 'wd1', site: 'isscareers', name: 'issgovernance' },  // Added via discovery — 26 India / 26 total
{ company: 'kiongroup', instance: 'wd3', site: 'kiongroup', name: 'kiongroup' },  // Added via discovery — 26 India / 26 total
{ company: 'morningstar', instance: 'wd5', site: 'americas', name: 'morningstar' },  // Added via discovery — 26 India / 26 total
{ company: 'proofpoint', instance: 'wd5', site: 'proofpointcareers', name: 'proofpoint' },  // Added via discovery — 26 India / 26 total
{ company: 'servicetitan', instance: 'wd1', site: 'servicetitan', name: 'servicetitan' },  // Added via discovery — 26 India / 26 total
{ company: 'trintech', instance: 'wd501', site: 'trintech', name: 'trintech' },  // Added via discovery — 26 India / 26 total
{ company: 'bakerhughes', instance: 'wd5', site: 'bakerhughes', name: 'bakerhughes' },  // Added via discovery — 25 India / 25 total
{ company: 'brinks', instance: 'wd5', site: 'brinkscareersus', name: 'brinks' },  // Added via discovery — 25 India / 25 total
{ company: 'illumina', instance: 'wd1', site: 'illumina-careers', name: 'illumina' },  // Added via discovery — 25 India / 25 total
{ company: 'ironmountain', instance: 'wd5', site: 'iron-mountain-jobs', name: 'ironmountain' },  // Added via discovery — 25 India / 25 total
{ company: 'momentive', instance: 'wd1', site: 'mc', name: 'momentive' },  // Added via discovery — 25 India / 25 total
{ company: 'prysmiangroup', instance: 'wd3', site: 'careers', name: 'prysmiangroup' },  // Added via discovery — 25 India / 25 total
{ company: 'russell', instance: 'wd5', site: 'russellinvestments', name: 'russell' },  // Added via discovery — 25 India / 25 total
{ company: 'tnsi', instance: 'wd1', site: 'search', name: 'tnsi' },  // Added via discovery — 25 India / 25 total
{ company: 'zoll', instance: 'wd5', site: 'zollmedicalcorp', name: 'zoll' },  // Added via discovery — 25 India / 25 total
{ company: 'amlrightsource', instance: 'wd1', site: 'amlrightsource', name: 'amlrightsource' },  // Added via discovery — 24 India / 24 total
{ company: 'collinsongroup', instance: 'wd103', site: 'the_collinson_group_external', name: 'collinsongroup' },  // Added via discovery — 24 India / 24 total
{ company: 'hysteryale', instance: 'wd1', site: 'hyster-yalecareers', name: 'hysteryale' },  // Added via discovery — 24 India / 24 total
{ company: 'ncr', instance: 'wd1', site: 'ext_apac', name: 'ncr' },  // Added via discovery — 24 India / 24 total
{ company: 'relx', instance: 'wd3', site: 'risksolutions', name: 'relx' },  // Added via discovery — 24 India / 24 total
{ company: 'sglottery', instance: 'wd5', site: 'scientificgamesexternalcareers', name: 'sglottery' },  // Added via discovery — 24 India / 24 total
{ company: 'veralto', instance: 'wd1', site: 'hachjobs', name: 'veralto' },  // Added via discovery — 24 India / 24 total
{ company: 'brenntag', instance: 'wd3', site: 'brenntag_jobs', name: 'brenntag' },  // Added via discovery — 23 India / 23 total
{ company: 'copart', instance: 'wd12', site: 'copart', name: 'copart' },  // Added via discovery — 23 India / 23 total
{ company: 'endo', instance: 'wd1', site: 'External', name: 'endo' },  // Added via discovery — 23 India / 23 total
{ company: 'flsmidth', instance: 'wd3', site: 'fls_global', name: 'flsmidth' },  // Added via discovery — 23 India / 23 total
{ company: 'millerknoll', instance: 'wd1', site: 'millerknoll', name: 'millerknoll' },  // Added via discovery — 23 India / 23 total
{ company: 'owensminor', instance: 'wd1', site: 'omcareers', name: 'owensminor' },  // Added via discovery — 23 India / 23 total
{ company: 'ryan', instance: 'wd1', site: 'experienced-professionals', name: 'ryan' },  // Added via discovery — 23 India / 23 total
{ company: 'simcorp', instance: 'wd3', site: 'simcorp_private', name: 'simcorp' },  // Added via discovery — 23 India / 23 total
{ company: 'arcticwolf', instance: 'wd1', site: 'external', name: 'arcticwolf' },  // Added via discovery — 22 India / 22 total
{ company: 'axalta', instance: 'wd1', site: 'axalta', name: 'axalta' },  // Added via discovery — 22 India / 22 total
{ company: 'billgosling', instance: 'wd5', site: 'global', name: 'billgosling' },  // Added via discovery — 22 India / 22 total
{ company: 'envista', instance: 'wd1', site: 'envistacareers', name: 'envista' },  // Added via discovery — 22 India / 22 total
{ company: 'kimberlyclark', instance: 'wd1', site: 'global', name: 'kimberlyclark' },  // Added via discovery — 22 India / 22 total
{ company: 'michelinhr', instance: 'wd3', site: 'michelin', name: 'michelinhr' },  // Added via discovery — 22 India / 22 total
{ company: 'ncratleos', instance: 'wd1', site: 'ext_apacatleos', name: 'ncratleos' },  // Added via discovery — 22 India / 22 total
{ company: 'riministreet', instance: 'wd1', site: 'riministreet', name: 'riministreet' },  // Added via discovery — 22 India / 22 total
{ company: 'sandvik', instance: 'wd3', site: 'sandvik_internal_for_nonwd_employees', name: 'sandvik' },  // Added via discovery — 22 India / 22 total
{ company: 'sulzer', instance: 'wd502', site: 'sulzerjobs', name: 'sulzer' },  // Added via discovery — 22 India / 22 total
{ company: 'unilever', instance: 'wd3', site: 'unilever_experienced_professionals', name: 'unilever' },  // Added via discovery — 22 India / 22 total
{ company: 'vanderlande', instance: 'wd3', site: 'careers', name: 'vanderlande' },  // Added via discovery — 22 India / 22 total
{ company: 'veralto', instance: 'wd1', site: 'veraltocorporatejobs', name: 'veralto' },  // Added via discovery — 22 India / 22 total
{ company: 'wiley', instance: 'wd1', site: 'wiley_careers', name: 'wiley' },  // Added via discovery — 22 India / 22 total
{ company: 'fluenceenergy', instance: 'wd12', site: 'fluenceenergy-jobs', name: 'fluenceenergy' },  // Added via discovery — 21 India / 21 total
{ company: 'fmr', instance: 'wd1', site: 'fidelitycareers', name: 'fmr' },  // Added via discovery — 21 India / 21 total
{ company: 'ingredion', instance: 'wd1', site: 'ingredioncareers', name: 'ingredion' },  // Added via discovery — 21 India / 21 total
{ company: 'logitech', instance: 'wd5', site: 'logitech', name: 'logitech' },  // Added via discovery — 21 India / 21 total
{ company: 'magnitudesoftware', instance: 'wd1', site: 'external', name: 'magnitudesoftware' },  // Added via discovery — 21 India / 21 total
{ company: 'onelinxens', instance: 'wd3', site: 'external_careers', name: 'onelinxens' },  // Added via discovery — 21 India / 21 total
{ company: 'roquette', instance: 'wd3', site: 'external', name: 'roquette' },  // Added via discovery — 21 India / 21 total
{ company: 'strada', instance: 'wd12', site: 'careers', name: 'strada' },  // Added via discovery — 21 India / 21 total
{ company: 'transperfect', instance: 'wd5', site: 'transperfect', name: 'transperfect' },  // Added via discovery — 21 India / 21 total
{ company: 'dyson', instance: 'wd3', site: 'dyson_careers', name: 'dyson' },  // Added via discovery — 20 India / 20 total
{ company: 'electrolux', instance: 'wd3', site: 'electroluxcareersite', name: 'electrolux' },  // Added via discovery — 20 India / 20 total
{ company: 'kimberlyclark', instance: 'wd1', site: 'linkedin', name: 'kimberlyclark' },  // Added via discovery — 20 India / 20 total
{ company: 'msd', instance: 'wd5', site: 'searchjobs', name: 'msd' },  // Added via discovery — 20 India / 20 total
{ company: 'selinc', instance: 'wd1', site: 'sel', name: 'selinc' },  // Added via discovery — 20 India / 20 total
{ company: 'web', instance: 'wd1', site: 'externalcareersite', name: 'web' },  // Added via discovery — 20 India / 20 total
{ company: 'bb', instance: 'wd3', site: 'qnx', name: 'bb' },  // Added via discovery — 19 India / 19 total
{ company: 'cvgrp', instance: 'wd5', site: 'cvg', name: 'cvgrp' },  // Added via discovery — 19 India / 19 total
{ company: 'ecolab', instance: 'wd1', site: 'ecolab_external', name: 'ecolab' },  // Added via discovery — 19 India / 19 total
{ company: 'ig', instance: 'wd103', site: 'ext_ig', name: 'ig' },  // Added via discovery — 19 India / 19 total
{ company: 'marvell', instance: 'wd1', site: 'marvellcareers', name: 'marvell' },  // Added via discovery — 19 India / 19 total
{ company: 'miqdigital', instance: 'wd3', site: 'MiQ_Careers', name: 'miqdigital' },  // Added via discovery — 19 India / 19 total
{ company: 'mufgub', instance: 'wd3', site: 'mufg-earlycareers', name: 'mufgub' },  // Added via discovery — 19 India / 19 total
{ company: 'revvity', instance: 'wd103', site: 'external', name: 'revvity' },  // Added via discovery — 19 India / 19 total
{ company: 'saxobank', instance: 'wd3', site: 'careeratsaxobank', name: 'saxobank' },  // Added via discovery — 19 India / 19 total
{ company: 'sbdinc', instance: 'wd1', site: 'stanley_black_decker_career_site', name: 'sbdinc' },  // Added via discovery — 19 India / 19 total
{ company: 'vareximaging', instance: 'wd103', site: 'External_Career_Site', name: 'vareximaging' },  // Added via discovery — 19 India / 19 total
{ company: 'worldpay', instance: 'wd5', site: 'worldpay_external_careers_site', name: 'worldpay' },  // Added via discovery — 19 India / 19 total
{ company: 'ascensushr', instance: 'wd1', site: 'ascensuscareers', name: 'ascensushr' },  // Added via discovery — 18 India / 18 total
{ company: 'borgwarner', instance: 'wd5', site: 'borgwarner_careers', name: 'borgwarner' },  // Added via discovery — 18 India / 18 total
{ company: 'columbiasportswearcompany', instance: 'wd5', site: 'csc_careers', name: 'columbiasportswearcompany' },  // Added via discovery — 18 India / 18 total
{ company: 'columbiasportswearcompany', instance: 'wd5', site: 'columbia_career_site', name: 'columbiasportswearcompany' },  // Added via discovery — 18 India / 18 total
{ company: 'convatec', instance: 'wd1', site: 'convatec', name: 'convatec' },  // Added via discovery — 18 India / 18 total
{ company: 'donaldson', instance: 'wd115', site: 'donaldsoncareers', name: 'donaldson' },  // Added via discovery — 18 India / 18 total
{ company: 'erm', instance: 'wd3', site: 'erm_earlycareers', name: 'erm' },  // Added via discovery — 18 India / 18 total
{ company: 'priceline', instance: 'wd1', site: 'priceline', name: 'priceline' },  // Added via discovery — 18 India / 18 total
{ company: 'sartorius', instance: 'wd3', site: 'sartoriuscareers', name: 'sartorius' },  // Added via discovery — 18 India / 18 total
{ company: 'sensata', instance: 'wd1', site: 'sensata-careers', name: 'sensata' },  // Added via discovery — 18 India / 18 total
{ company: 'shell', instance: 'wd3', site: 'shellcareers', name: 'shell' },  // Added via discovery — 18 India / 18 total
{ company: 'weir', instance: 'wd3', site: 'weir_external_careers', name: 'weir' },  // Added via discovery — 18 India / 18 total
{ company: 'woodward', instance: 'wd5', site: 'woodward', name: 'woodward' },  // Added via discovery — 18 India / 18 total
{ company: 'alegeus', instance: 'wd1', site: 'alegeus_external_careers', name: 'alegeus' },  // Added via discovery — 17 India / 17 total
{ company: 'availity', instance: 'wd1', site: 'availity_careers_india', name: 'availity' },  // Added via discovery — 17 India / 17 total
{ company: 'clarioclinical', instance: 'wd1', site: 'clarioclinical_careers', name: 'clarioclinical' },  // Added via discovery — 17 India / 17 total
{ company: 'connorgp', instance: 'wd12', site: 'cg', name: 'connorgp' },  // Added via discovery — 17 India / 17 total
{ company: 'geaerospace', instance: 'wd5', site: 'ge_externalsite', name: 'geaerospace' },  // Added via discovery — 17 India / 17 total
{ company: 'globusmedical', instance: 'wd5', site: 'gmed_careers', name: 'globusmedical' },  // Added via discovery — 17 India / 17 total
{ company: 'optiva', instance: 'wd3', site: 'qvantel_external_career_site', name: 'optiva' },  // Added via discovery — 17 India / 17 total
{ company: 'relx', instance: 'wd3', site: 'lexisnexislegal', name: 'relx' },  // Added via discovery — 17 India / 17 total
{ company: 'relx', instance: 'wd3', site: 'reedexhibitions', name: 'relx' },  // Added via discovery — 17 India / 17 total
{ company: 'semtech', instance: 'wd1', site: 'semtechcareers', name: 'semtech' },  // Added via discovery — 17 India / 17 total
{ company: 'alliancedata', instance: 'wd5', site: 'breadfinancial_india', name: 'alliancedata' },  // Added via discovery — 16 India / 16 total
{ company: 'capitalone', instance: 'wd12', site: 'capital_one', name: 'capitalone' },  // Added via discovery — 16 India / 16 total
{ company: 'cohesity', instance: 'wd5', site: 'cohesity_careers', name: 'cohesity' },  // Added via discovery — 16 India / 16 total
{ company: 'enovis', instance: 'wd5', site: 'enovis', name: 'enovis' },  // Added via discovery — 16 India / 16 total
{ company: 'fico', instance: 'wd1', site: 'external', name: 'fico' },  // Added via discovery — 16 India / 16 total
{ company: 'fox', instance: 'wd1', site: 'domestic', name: 'fox' },  // Added via discovery — 16 India / 16 total
{ company: 'gehc', instance: 'wd5', site: 'gehc_externalsite', name: 'gehc' },  // Added via discovery — 16 India / 16 total
{ company: 'harriscomputer', instance: 'wd3', site: 'gbs', name: 'harriscomputer' },  // Added via discovery — 16 India / 16 total
{ company: 'kimberlyclark', instance: 'wd1', site: 'equest', name: 'kimberlyclark' },  // Added via discovery — 16 India / 16 total
{ company: 'mavenir', instance: 'wd1', site: 'mavenir_careers', name: 'mavenir' },  // Added via discovery — 16 India / 16 total
{ company: 'plantemoran', instance: 'wd1', site: 'pmexternalcareers', name: 'plantemoran' },  // Added via discovery — 16 India / 16 total
{ company: 'procore', instance: 'wd12', site: 'procore_external_careers', name: 'procore' },  // Added via discovery — 16 India / 16 total
{ company: 'shakeshack', instance: 'wd5', site: 'external', name: 'shakeshack' },  // Added via discovery — 16 India / 16 total
{ company: 'synchronyfinancial', instance: 'wd5', site: 'careers', name: 'synchronyfinancial' },  // Added via discovery — 16 India / 16 total
{ company: 'valmet', instance: 'wd103', site: 'external', name: 'valmet' },  // Added via discovery — 16 India / 16 total
{ company: 'cai', instance: 'wd5', site: 'computer_aid', name: 'cai' },  // Added via discovery — 15 India / 15 total
{ company: 'capita', instance: 'wd3', site: 'capitaglobal', name: 'capita' },  // Added via discovery — 15 India / 15 total
{ company: 'clarivate', instance: 'wd3', site: 'jobs', name: 'clarivate' },  // Added via discovery — 15 India / 15 total
{ company: 'epicorsoftware', instance: 'wd5', site: 'epicorjobs', name: 'epicorsoftware' },  // Added via discovery — 15 India / 15 total
{ company: 'fronius', instance: 'wd3', site: 'job_board', name: 'fronius' },  // Added via discovery — 15 India / 15 total
{ company: 'halma', instance: 'wd3', site: 'halma', name: 'halma' },  // Added via discovery — 15 India / 15 total
{ company: 'kyndryl', instance: 'wd5', site: 'kyndrylearlycareers', name: 'kyndryl' },  // Added via discovery — 15 India / 15 total
{ company: 'takraf', instance: 'wd103', site: 'takraf_external_careers', name: 'takraf' },  // Added via discovery — 15 India / 15 total
{ company: 'ttc', instance: 'wd1', site: 'toro_external_careers', name: 'ttc' },  // Added via discovery — 15 India / 15 total
{ company: 'velsera', instance: 'wd103', site: 'velsera', name: 'velsera' },  // Added via discovery — 15 India / 15 total
{ company: 'veralto', instance: 'wd1', site: 'eskojobs', name: 'veralto' },  // Added via discovery — 15 India / 15 total
{ company: 'automationanywhere', instance: 'wd5', site: 'automationanywherejobs', name: 'automationanywhere' },  // Added via discovery — 14 India / 14 total
{ company: 'bacardi', instance: 'wd3', site: 'jobs_bacardi', name: 'bacardi' },  // Added via discovery — 14 India / 14 total
{ company: 'biibhr', instance: 'wd3', site: 'external', name: 'biibhr' },  // Added via discovery — 14 India / 14 total
{ company: 'curtisswright', instance: 'wd1', site: 'cw_external_career_site', name: 'curtisswright' },  // Added via discovery — 14 India / 14 total
{ company: 'georgfischer', instance: 'wd103', site: 'georgfischer_careers', name: 'georgfischer' },  // Added via discovery — 14 India / 14 total
{ company: 'giorgiglobal', instance: 'wd3', site: 'canpack', name: 'giorgiglobal' },  // Added via discovery — 14 India / 14 total
{ company: 'pibgroup', instance: 'wd3', site: 'pib', name: 'pibgroup' },  // Added via discovery — 14 India / 14 total
{ company: 'pitneybowes', instance: 'wd1', site: 'PBCareers', name: 'pitneybowes' },  // Added via discovery — 14 India / 14 total
{ company: 'revantage', instance: 'wd1', site: 'revantage', name: 'revantage' },  // Added via discovery — 14 India / 14 total
{ company: 'sailpoint', instance: 'wd1', site: 'sailpoint', name: 'sailpoint' },  // Added via discovery — 14 India / 14 total
{ company: 'seic', instance: 'wd1', site: 'sei_global_services', name: 'seic' },  // Added via discovery — 14 India / 14 total
{ company: 'spectris', instance: 'wd3', site: 'hbk_careers', name: 'spectris' },  // Added via discovery — 14 India / 14 total
{ company: 'springernature', instance: 'wd3', site: 'springernaturecareers', name: 'springernature' },  // Added via discovery — 14 India / 14 total
{ company: 'weareeverise', instance: 'wd1', site: 'everisecareers', name: 'weareeverise' },  // Added via discovery — 14 India / 14 total
{ company: 'westernunion', instance: 'wd5', site: 'hiddenwujobs', name: 'westernunion' },  // Added via discovery — 14 India / 14 total
{ company: 'assurant', instance: 'wd1', site: 'Assurant_Careers', name: 'assurant' },  // Added via discovery — 13 India / 13 total
{ company: 'astrazeneca', instance: 'wd3', site: 'broadbean_external', name: 'astrazeneca' },  // Added via discovery — 13 India / 13 total
{ company: 'cognex', instance: 'wd1', site: 'external_career_site', name: 'cognex' },  // Added via discovery — 13 India / 13 total
{ company: 'corpay', instance: 'wd103', site: 'ext_001', name: 'corpay' },  // Added via discovery — 13 India / 13 total
{ company: 'duckcreek', instance: 'wd1', site: 'duckcreek-linkedin', name: 'duckcreek' },  // Added via discovery — 13 India / 13 total
{ company: 'duckcreek', instance: 'wd1', site: 'duckcreekcareers', name: 'duckcreek' },  // Added via discovery — 13 India / 13 total
{ company: 'essity', instance: 'wd3', site: 'job_opportunities', name: 'essity' },  // Added via discovery — 13 India / 13 total
{ company: 'flir', instance: 'wd1', site: 'flircareers', name: 'flir' },  // Added via discovery — 13 India / 13 total
{ company: 'flutterbe', instance: 'wd3', site: 'group_external', name: 'flutterbe' },  // Added via discovery — 13 India / 13 total
{ company: 'jotun', instance: 'wd3', site: 'jotun_careers', name: 'jotun' },  // Added via discovery — 13 India / 13 total
{ company: 'nextgen', instance: 'wd5', site: 'nextgen_careers', name: 'nextgen' },  // Added via discovery — 13 India / 13 total
{ company: 'panduit', instance: 'wd1', site: 'international', name: 'panduit' },  // Added via discovery — 13 India / 13 total
{ company: 'ruderfinn', instance: 'wd5', site: 'ruderfinn', name: 'ruderfinn' },  // Added via discovery — 13 India / 13 total
{ company: 'smithnephew', instance: 'wd5', site: 'external', name: 'smithnephew' },  // Added via discovery — 13 India / 13 total
{ company: 'swarovski', instance: 'wd3', site: 'swarovski', name: 'swarovski' },  // Added via discovery — 13 India / 13 total
{ company: 'wexinc', instance: 'wd5', site: 'wexinc', name: 'wexinc' },  // Added via discovery — 13 India / 13 total
{ company: 'zendesk', instance: 'wd1', site: 'zendesk', name: 'zendesk' },  // Added via discovery — 13 India / 13 total
{ company: 'bsigroup', instance: 'wd3', site: 'BSI_Careers', name: 'bsigroup' },  // Added via discovery — 13 India / 13 total
{ company: 'accelleron', instance: 'wd3', site: 'accelleron', name: 'accelleron' },  // Added via discovery — 12 India / 12 total
{ company: 'alcon', instance: 'wd5', site: 'careers_alcon', name: 'alcon' },  // Added via discovery — 12 India / 12 total
{ company: 'alliance', instance: 'wd3', site: 'nissanjobs', name: 'alliance' },  // Added via discovery — 12 India / 12 total
{ company: 'arabellesolutions', instance: 'wd3', site: 'Arabelle_Solutions', name: 'arabellesolutions' },  // Added via discovery — 12 India / 12 total
{ company: 'aveva', instance: 'wd3', site: 'rib_careers', name: 'aveva' },  // Added via discovery — 12 India / 12 total
{ company: 'avnet', instance: 'wd1', site: 'external', name: 'avnet' },  // Added via discovery — 12 India / 12 total
{ company: 'fmc', instance: 'wd12', site: 'fmc', name: 'fmc' },  // Added via discovery — 12 India / 12 total
{ company: 'hbfuller', instance: 'wd1', site: 'careers', name: 'hbfuller' },  // Added via discovery — 12 India / 12 total
{ company: 'mimecast', instance: 'wd5', site: 'mimecast-careers', name: 'mimecast' },  // Added via discovery — 12 India / 12 total
{ company: 'oshkoshcorporation', instance: 'wd5', site: 'oshkosh', name: 'oshkoshcorporation' },  // Added via discovery — 12 India / 12 total
{ company: 'pentair', instance: 'wd5', site: 'Pentair_Careers', name: 'pentair' },  // Added via discovery — 12 India / 12 total
{ company: 'viavisolutions', instance: 'wd1', site: 'careers', name: 'viavisolutions' },  // Added via discovery — 12 India / 12 total
{ company: 'wilhelmsen', instance: 'wd3', site: 'wilhelmsen', name: 'wilhelmsen' },  // Added via discovery — 12 India / 12 total
{ company: 'accelya', instance: 'wd103', site: 'careers', name: 'accelya' },  // Added via discovery — 11 India / 11 total
{ company: 'alation', instance: 'wd503', site: 'externalsite', name: 'alation' },  // Added via discovery — 11 India / 11 total
{ company: 'ayvens', instance: 'wd3', site: 'ayvenscareers', name: 'ayvens' },  // Added via discovery — 11 India / 11 total
{ company: 'bf', instance: 'wd5', site: 'international', name: 'bf' },  // Added via discovery — 11 India / 11 total
{ company: 'cgm', instance: 'wd3', site: 'cgm', name: 'cgm' },  // Added via discovery — 11 India / 11 total
{ company: 'exos', instance: 'wd501', site: 'exoscareers', name: 'exos' },  // Added via discovery — 11 India / 11 total
{ company: 'flexerasoftware', instance: 'wd1', site: 'flexerasoftware', name: 'flexerasoftware' },  // Added via discovery — 11 India / 11 total
{ company: 'hempel', instance: 'wd3', site: 'hempelcareers', name: 'hempel' },  // Added via discovery — 11 India / 11 total
{ company: 'infobip', instance: 'wd3', site: 'infobipcareers', name: 'infobip' },  // Added via discovery — 11 India / 11 total
{ company: 'jas', instance: 'wd1', site: 'jascareers', name: 'jas' },  // Added via discovery — 11 India / 11 total
{ company: 'newperkinelmer', instance: 'wd1', site: 'external', name: 'newperkinelmer' },  // Added via discovery — 11 India / 11 total
{ company: 'nutreco', instance: 'wd3', site: 'nutreco_external', name: 'nutreco' },  // Added via discovery — 11 India / 11 total
{ company: 'onehealthineers', instance: 'wd3', site: 'ijmhrms', name: 'onehealthineers' },  // Added via discovery — 11 India / 11 total
{ company: 'swa', instance: 'wd1', site: 'external', name: 'swa' },  // Added via discovery — 11 India / 11 total
{ company: 'telstra', instance: 'wd3', site: 'Telstra_Careers', name: 'telstra' },  // Added via discovery — 11 India / 11 total
{ company: 'trellix', instance: 'wd1', site: 'enterprisecareers', name: 'trellix' },  // Added via discovery — 11 India / 11 total
{ company: 'veralto', instance: 'wd1', site: 'videojetjobs', name: 'veralto' },  // Added via discovery — 11 India / 11 total
{ company: 'veripark', instance: 'wd103', site: 'veripark', name: 'veripark' },  // Added via discovery — 11 India / 11 total
{ company: 'albemarle', instance: 'wd5', site: 'external', name: 'albemarle' },  // Added via discovery — 10 India / 10 total
{ company: 'aveva', instance: 'wd3', site: 'etap_careers', name: 'aveva' },  // Added via discovery — 10 India / 10 total
{ company: 'azelis', instance: 'wd3', site: 'azelis_careers', name: 'azelis' },  // Added via discovery — 10 India / 10 total
{ company: 'brookfield', instance: 'wd5', site: 'brookfield', name: 'brookfield' },  // Added via discovery — 10 India / 10 total
{ company: 'calix', instance: 'wd1', site: 'externalinternational', name: 'calix' },  // Added via discovery — 10 India / 10 total
{ company: 'creditacceptance', instance: 'wd5', site: 'credit_acceptance', name: 'creditacceptance' },  // Added via discovery — 10 India / 10 total
{ company: 'csagroup', instance: 'wd3', site: 'csagroup', name: 'csagroup' },  // Added via discovery — 10 India / 10 total
{ company: 'curriculumassociates', instance: 'wd5', site: 'external', name: 'curriculumassociates' },  // Added via discovery — 10 India / 10 total
{ company: 'generac', instance: 'wd5', site: 'externalcareers', name: 'generac' },  // Added via discovery — 10 India / 10 total
{ company: 'haier', instance: 'wd3', site: 'ge_appliances', name: 'haier' },  // Added via discovery — 10 India / 10 total
{ company: 'hempel', instance: 'wd3', site: 'careersnolink', name: 'hempel' },  // Added via discovery — 10 India / 10 total
{ company: 'nexperia', instance: 'wd3', site: 'careers', name: 'nexperia' },  // Added via discovery — 10 India / 10 total
{ company: 'phinia', instance: 'wd5', site: 'phinia_careers', name: 'phinia' },  // Added via discovery — 10 India / 10 total
{ company: 'pinnaclegroup', instance: 'wd1', site: 'pinnaclegroup', name: 'pinnaclegroup' },  // Added via discovery — 10 India / 10 total
{ company: 'plugpower', instance: 'wd5', site: 'plug_power_inc', name: 'plugpower' },  // Added via discovery — 10 India / 10 total
{ company: 'polaris', instance: 'wd5', site: 'polarisjobs', name: 'polaris' },  // Added via discovery — 10 India / 10 total
{ company: 'q2ebanking', instance: 'wd5', site: 'q2', name: 'q2ebanking' },  // Added via discovery — 10 India / 10 total
{ company: 'rehlko', instance: 'wd12', site: 'reh', name: 'rehlko' },  // Added via discovery — 10 India / 10 total
{ company: 'royalihc', instance: 'wd103', site: 'external_career', name: 'royalihc' },  // Added via discovery — 10 India / 10 total
{ company: 'trafigura', instance: 'wd3', site: 'puma_energy_careers', name: 'trafigura' },  // Added via discovery — 10 India / 10 total
{ company: 'trekbikes', instance: 'wd1', site: 'trek', name: 'trekbikes' },  // Added via discovery — 10 India / 10 total
{ company: 'welocalize', instance: 'wd1', site: 'welocalize', name: 'welocalize' },  // Added via discovery — 10 India / 10 total
{ company: 'aggreko', instance: 'wd3', site: 'aggreko_careers_1', name: 'aggreko' },  // Added via discovery — 9 India / 9 total
{ company: 'amadeus', instance: 'wd502', site: 'jobs', name: 'amadeus' },  // Added via discovery — 9 India / 9 total
{ company: 'calyx', instance: 'wd1', site: 'perceptive', name: 'calyx' },  // Added via discovery — 9 India / 9 total
{ company: 'circle', instance: 'wd1', site: 'circle', name: 'circle' },  // Added via discovery — 9 India / 9 total
{ company: 'cmegroup', instance: 'wd1', site: 'cme_careers', name: 'cmegroup' },  // Added via discovery — 9 India / 9 total
{ company: 'cochlear', instance: 'wd3', site: 'cochlear_careers', name: 'cochlear' },  // Added via discovery — 9 India / 9 total
{ company: 'epiqsystems', instance: 'wd503', site: 'epiq_careers', name: 'epiqsystems' },  // Added via discovery — 9 India / 9 total
{ company: 'essity', instance: 'wd3', site: 'hms_job_opportunities', name: 'essity' },  // Added via discovery — 9 India / 9 total
{ company: 'expedia', instance: 'wd108', site: 'search', name: 'expedia' },  // Added via discovery — 9 India / 9 total
{ company: 'fedex', instance: 'wd1', site: 'ftn_apac_external', name: 'fedex' },  // Added via discovery — 9 India / 9 total
{ company: 'fis', instance: 'wd5', site: 'searchjobs', name: 'fis' },  // Added via discovery — 9 India / 9 total
{ company: 'gategroup', instance: 'wd3', site: 'gategroup_external_careers', name: 'gategroup' },  // Added via discovery — 9 India / 9 total
{ company: 'gn', instance: 'wd3', site: 'gn-careers', name: 'gn' },  // Added via discovery — 9 India / 9 total
{ company: 'greif', instance: 'wd5', site: 'greif', name: 'greif' },  // Added via discovery — 9 India / 9 total
{ company: 'itron', instance: 'wd5', site: 'itron', name: 'itron' },  // Added via discovery — 9 India / 9 total
{ company: 'movadogroup', instance: 'wd1', site: 'careers', name: 'movadogroup' },  // Added via discovery — 9 India / 9 total
{ company: 'mywdhr', instance: 'wd1', site: 'hudsonsbayindia_careers', name: 'mywdhr' },  // Added via discovery — 9 India / 9 total
{ company: 'optiv', instance: 'wd5', site: 'optiv_careers', name: 'optiv' },  // Added via discovery — 9 India / 9 total
{ company: 'rhe', instance: 'wd3', site: 'r1111', name: 'rhe' },  // Added via discovery — 9 India / 9 total
{ company: 'tbc', instance: 'wd12', site: 'lyriccareers', name: 'tbc' },  // Added via discovery — 9 India / 9 total
{ company: 'adtran', instance: 'wd3', site: 'adtran', name: 'adtran' },  // Added via discovery — 8 India / 8 total
{ company: 'alliance', instance: 'wd3', site: 'nissanprivateexternal', name: 'alliance' },  // Added via discovery — 8 India / 8 total
{ company: 'altapm', instance: 'wd1', site: 'altacareers', name: 'altapm' },  // Added via discovery — 8 India / 8 total
{ company: 'aviagen', instance: 'wd1', site: 'aviagen-careers', name: 'aviagen' },  // Added via discovery — 8 India / 8 total
{ company: 'cae', instance: 'wd3', site: 'career', name: 'cae' },  // Added via discovery — 8 India / 8 total
{ company: 'chrobinson', instance: 'wd5', site: 'chrobinson', name: 'chrobinson' },  // Added via discovery — 8 India / 8 total
{ company: 'cip', instance: 'wd103', site: 'cipfs_careers', name: 'cip' },  // Added via discovery — 8 India / 8 total
{ company: 'esab', instance: 'wd5', site: 'esabcareers', name: 'esab' },  // Added via discovery — 8 India / 8 total
{ company: 'gea', instance: 'wd3', site: 'geacareers', name: 'gea' },  // Added via discovery — 8 India / 8 total
{ company: 'gn', instance: 'wd3', site: 'resoundcareers', name: 'gn' },  // Added via discovery — 8 India / 8 total
{ company: 'hellmann', instance: 'wd103', site: 'hellmannexternaljobs', name: 'hellmann' },  // Added via discovery — 8 India / 8 total
{ company: 'huhtamaki', instance: 'wd103', site: 'external', name: 'huhtamaki' },  // Added via discovery — 8 India / 8 total
{ company: 'husqvarnagroup', instance: 'wd3', site: 'external_career_site', name: 'husqvarnagroup' },  // Added via discovery — 8 India / 8 total
{ company: 'infios', instance: 'wd502', site: 'infios', name: 'infios' },  // Added via discovery — 8 India / 8 total
{ company: 'itw', instance: 'wd5', site: 'external', name: 'itw' },  // Added via discovery — 8 India / 8 total
{ company: 'jbtm', instance: 'wd108', site: 'jbt_marel_career_site', name: 'jbtm' },  // Added via discovery — 8 India / 8 total
{ company: 'kognitivinc', instance: 'wd1', site: 'kognitiv-careers', name: 'kognitivinc' },  // Added via discovery — 8 India / 8 total
{ company: 'mitsubishichemicalgroup', instance: 'wd3', site: 'mccgroupcareers', name: 'mitsubishichemicalgroup' },  // Added via discovery — 8 India / 8 total
{ company: 'ohmium', instance: 'wd12', site: 'ohmium_careers', name: 'ohmium' },  // Added via discovery — 8 India / 8 total
{ company: 'propharmagroup', instance: 'wd1', site: 'ppgcareers', name: 'propharmagroup' },  // Added via discovery — 8 India / 8 total
{ company: 'ringcentral', instance: 'wd1', site: 'ringcentral_careers', name: 'ringcentral' },  // Added via discovery — 8 India / 8 total
{ company: 'schreiberfoods', instance: 'wd115', site: 'schreiber_careers', name: 'schreiberfoods' },  // Added via discovery — 8 India / 8 total
{ company: 'tollgroup', instance: 'wd5', site: 'tollgroup', name: 'tollgroup' },  // Added via discovery — 8 India / 8 total
{ company: 'vantiva', instance: 'wd103', site: 'vantiva', name: 'vantiva' },  // Added via discovery — 8 India / 8 total
{ company: 'xpel', instance: 'wd5', site: 'xpel_careers', name: 'xpel' },  // Added via discovery — 8 India / 8 total
{ company: 'abcfinancial', instance: 'wd5', site: 'ABCFinancialServices', name: 'abcfinancial' },  // Added via discovery — 7 India / 7 total
{ company: 'accenture', instance: 'wd103', site: 'avanadecareers', name: 'accenture' },  // Added via discovery — 7 India / 7 total
{ company: 'alteryx', instance: 'wd108', site: 'alteryxcareers', name: 'alteryx' },  // Added via discovery — 7 India / 7 total
{ company: 'amherstgroup', instance: 'wd1', site: 'amherst_holdings_careers', name: 'amherstgroup' },  // Added via discovery — 7 India / 7 total
{ company: 'bcone', instance: 'wd1', site: 'bristlecone', name: 'bcone' },  // Added via discovery — 7 India / 7 total
{ company: 'ciena', instance: 'wd5', site: 'careers', name: 'ciena' },  // Added via discovery — 7 India / 7 total
{ company: 'cpsi', instance: 'wd1', site: 'cpsi', name: 'cpsi' },  // Added via discovery — 7 India / 7 total
{ company: 'enovix', instance: 'wd12', site: 'external', name: 'enovix' },  // Added via discovery — 7 India / 7 total
{ company: 'forcepoint', instance: 'wd1', site: 'engineering-external-careers1', name: 'forcepoint' },  // Added via discovery — 7 India / 7 total
{ company: 'forcepoint', instance: 'wd1', site: 'external-careers', name: 'forcepoint' },  // Added via discovery — 7 India / 7 total
{ company: 'hl', instance: 'wd1', site: 'lateral', name: 'hl' },  // Added via discovery — 7 India / 7 total
{ company: 'hpinc', instance: 'wd5', site: 'hpinc', name: 'hpinc' },  // Added via discovery — 7 India / 7 total
{ company: 'hrhub', instance: 'wd3', site: 'euronext_career_page', name: 'hrhub' },  // Added via discovery — 7 India / 7 total
{ company: 'imerys', instance: 'wd3', site: 'imerys-careers', name: 'imerys' },  // Added via discovery — 7 India / 7 total
{ company: 'nature', instance: 'wd108', site: 'externalcareers', name: 'nature' },  // Added via discovery — 7 India / 7 total
{ company: 'premierresearch', instance: 'wd12', site: 'premierresearch', name: 'premierresearch' },  // Added via discovery — 7 India / 7 total
{ company: 'sunlife', instance: 'wd3', site: 'experienced-jobs', name: 'sunlife' },  // Added via discovery — 7 India / 7 total
{ company: 'toppanmerrill', instance: 'wd5', site: 'toppan_merrill', name: 'toppanmerrill' },  // Added via discovery — 7 India / 7 total
{ company: 'trumpf', instance: 'wd3', site: 'trumpf_graduates_and_professionals', name: 'trumpf' },  // Added via discovery — 7 India / 7 total
{ company: 'airasia', instance: 'wd3', site: 'careers', name: 'airasia' },  // Added via discovery — 6 India / 6 total
{ company: 'alsglobal', instance: 'wd103', site: 'external', name: 'alsglobal' },  // Added via discovery — 6 India / 6 total
{ company: 'ashland', instance: 'wd12', site: 'ashlandcareers1', name: 'ashland' },  // Added via discovery — 6 India / 6 total
{ company: 'atsg', instance: 'wd108', site: 'xtiumcareers', name: 'atsg' },  // Added via discovery — 6 India / 6 total
{ company: 'brinks', instance: 'wd5', site: 'brinkscareers_row', name: 'brinks' },  // Added via discovery — 6 India / 6 total
{ company: 'centricsoftware', instance: 'wd501', site: 'centric', name: 'centricsoftware' },  // Added via discovery — 6 India / 6 total
{ company: 'chubbfiresecurity', instance: 'wd3', site: 'chubbfs', name: 'chubbfiresecurity' },  // Added via discovery — 6 India / 6 total
{ company: 'communitybrands', instance: 'wd1', site: 'momentive_external_careers', name: 'communitybrands' },  // Added via discovery — 6 India / 6 total
{ company: 'dssmith', instance: 'wd3', site: 'careers', name: 'dssmith' },  // Added via discovery — 6 India / 6 total
{ company: 'elemica', instance: 'wd501', site: 'elemica_careers', name: 'elemica' },  // Added via discovery — 6 India / 6 total
{ company: 'encore', instance: 'wd1', site: 'externalnew', name: 'encore' },  // Added via discovery — 6 India / 6 total
{ company: 'flexerasoftware', instance: 'wd1', site: 'revenera', name: 'flexerasoftware' },  // Added via discovery — 6 India / 6 total
{ company: 'forcepoint', instance: 'wd1', site: 'sales-external-careers-1', name: 'forcepoint' },  // Added via discovery — 6 India / 6 total
{ company: 'galderma', instance: 'wd3', site: 'broadbean_external', name: 'galderma' },  // Added via discovery — 6 India / 6 total
{ company: 'ghc', instance: 'wd1', site: 'kaplan_careers', name: 'ghc' },  // Added via discovery — 6 India / 6 total
{ company: 'ghr', instance: 'wd1', site: 'lateral-apac', name: 'ghr' },  // Added via discovery — 6 India / 6 total
{ company: 'hmhw', instance: 'wd12', site: 'hmh_careers', name: 'hmhw' },  // Added via discovery — 6 India / 6 total
{ company: 'kbi', instance: 'wd5', site: 'kontoor', name: 'kbi' },  // Added via discovery — 6 India / 6 total
{ company: 'lummustechnology', instance: 'wd501', site: 'lummustechnology', name: 'lummustechnology' },  // Added via discovery — 6 India / 6 total
{ company: 'matthey', instance: 'wd3', site: 'ext_career_site', name: 'matthey' },  // Added via discovery — 6 India / 6 total
{ company: 'mywdhr', instance: 'wd1', site: 'saks_offfifth_careers', name: 'mywdhr' },  // Added via discovery — 6 India / 6 total
{ company: 'regalrexnord', instance: 'wd1', site: 'student_and_earlycareer', name: 'regalrexnord' },  // Added via discovery — 6 India / 6 total
{ company: 'resmed', instance: 'wd3', site: 'resmed_external_careers', name: 'resmed' },  // Added via discovery — 6 India / 6 total
{ company: 'shell', instance: 'wd3', site: 'proactive', name: 'shell' },  // Added via discovery — 6 India / 6 total
{ company: 'trafigura', instance: 'wd3', site: 'trafiguracareersite', name: 'trafigura' },  // Added via discovery — 6 India / 6 total
{ company: 'tysonfoods', instance: 'wd5', site: 'tyit', name: 'tysonfoods' },  // Added via discovery — 6 India / 6 total
{ company: 'weg', instance: 'wd501', site: 'careers', name: 'weg' },  // Added via discovery — 6 India / 6 total
{ company: 'westlake', instance: 'wd1', site: 'westlake', name: 'westlake' },  // Added via discovery — 6 India / 6 total
{ company: 'zoom', instance: 'wd5', site: 'zoom', name: 'zoom' },  // Added via discovery — 6 India / 6 total
{ company: '4flow', instance: 'wd3', site: '4flow', name: '4flow' },  // Added via discovery — 5 India / 5 total
{ company: 'ah', instance: 'wd108', site: 'avenhospitalityjobs', name: 'ah' },  // Added via discovery — 5 India / 5 total
{ company: 'allegromicro', instance: 'wd5', site: 'allegrocareers', name: 'allegromicro' },  // Added via discovery — 5 India / 5 total
{ company: 'ansira', instance: 'wd1', site: 'ansira_careers', name: 'ansira' },  // Added via discovery — 5 India / 5 total
{ company: 'armacell', instance: 'wd3', site: 'career-armacell', name: 'armacell' },  // Added via discovery — 5 India / 5 total
{ company: 'ascendperformancematerials', instance: 'wd1', site: 'ascend', name: 'ascendperformancematerials' },  // Added via discovery — 5 India / 5 total
{ company: 'belkin', instance: 'wd5', site: 'belkin_careers', name: 'belkin' },  // Added via discovery — 5 India / 5 total
{ company: 'blackstone', instance: 'wd1', site: 'bx_external_site', name: 'blackstone' },  // Added via discovery — 5 India / 5 total
{ company: 'boeing', instance: 'wd1', site: 'external_subsidiary', name: 'boeing' },  // Added via discovery — 5 India / 5 total
{ company: 'cdw', instance: 'wd5', site: 'careers', name: 'cdw' },  // Added via discovery — 5 India / 5 total
{ company: 'cengage', instance: 'wd5', site: 'cengageindiacareers', name: 'cengage' },  // Added via discovery — 5 India / 5 total
{ company: 'cengage', instance: 'wd5', site: 'cengagenorthamericacareers', name: 'cengage' },  // Added via discovery — 5 India / 5 total
{ company: 'csgi', instance: 'wd5', site: 'csgcareers', name: 'csgi' },  // Added via discovery — 5 India / 5 total
{ company: 'dynata', instance: 'wd108', site: 'careers', name: 'dynata' },  // Added via discovery — 5 India / 5 total
{ company: 'entrust', instance: 'wd1', site: 'entrustcareers', name: 'entrust' },  // Added via discovery — 5 India / 5 total
{ company: 'frenckengroup', instance: 'wd103', site: 'external', name: 'frenckengroup' },  // Added via discovery — 5 India / 5 total
{ company: 'fugro', instance: 'wd3', site: 'careers', name: 'fugro' },  // Added via discovery — 5 India / 5 total
{ company: 'gapinc', instance: 'wd1', site: 'gapinc', name: 'gapinc' },  // Added via discovery — 5 India / 5 total
{ company: 'griffithfoods', instance: 'wd12', site: 'external', name: 'griffithfoods' },  // Added via discovery — 5 India / 5 total
{ company: 'gtt', instance: 'wd3', site: 'external', name: 'gtt' },  // Added via discovery — 5 India / 5 total
{ company: 'guggenheiminvestment', instance: 'wd5', site: 'external', name: 'guggenheiminvestment' },  // Added via discovery — 5 India / 5 total
{ company: 'huntsman', instance: 'wd1', site: 'huntsman', name: 'huntsman' },  // Added via discovery — 5 India / 5 total
{ company: 'jci', instance: 'wd5', site: 'jci_confidential', name: 'jci' },  // Added via discovery — 5 India / 5 total
{ company: 'keppel', instance: 'wd3', site: 'keppelcareers', name: 'keppel' },  // Added via discovery — 5 India / 5 total
{ company: 'lifung', instance: 'wd3', site: 'lifung', name: 'lifung' },  // Added via discovery — 5 India / 5 total
{ company: 'merative', instance: 'wd12', site: 'external_career_site', name: 'merative' },  // Added via discovery — 5 India / 5 total
{ company: 'nutreco', instance: 'wd3', site: 'shv_internal_job_board', name: 'nutreco' },  // Added via discovery — 5 India / 5 total
{ company: 'redhat', instance: 'wd5', site: 'jobs', name: 'redhat' },  // Added via discovery — 5 India / 5 total
{ company: 'sandvik', instance: 'wd3', site: 'coromant-jobs', name: 'sandvik' },  // Added via discovery — 5 India / 5 total
{ company: 'speedcast', instance: 'wd1', site: 'speedcastcareers', name: 'speedcast' },  // Added via discovery — 5 India / 5 total
{ company: 'acciona', instance: 'wd3', site: 'acciona_employment_channel', name: 'acciona' },  // Added via discovery — 4 India / 4 total
{ company: 'airproducts', instance: 'wd5', site: 'ap0001', name: 'airproducts' },  // Added via discovery — 4 India / 4 total
{ company: 'alleima', instance: 'wd3', site: 'alleima-jobs', name: 'alleima' },  // Added via discovery — 4 India / 4 total
{ company: 'areteir', instance: 'wd1', site: 'arete-careers', name: 'areteir' },  // Added via discovery — 4 India / 4 total
{ company: 'asml', instance: 'wd3', site: 'asmlext1', name: 'asml' },  // Added via discovery — 4 India / 4 total
{ company: 'brambles', instance: 'wd5', site: 'brambles_careers', name: 'brambles' },  // Added via discovery — 4 India / 4 total
{ company: 'brevanhoward', instance: 'wd3', site: 'bh_externalcareers', name: 'brevanhoward' },  // Added via discovery — 4 India / 4 total
{ company: 'comscore', instance: 'wd5', site: 'external', name: 'comscore' },  // Added via discovery — 4 India / 4 total
{ company: 'demegroup', instance: 'wd3', site: 'careers_external', name: 'demegroup' },  // Added via discovery — 4 India / 4 total
{ company: 'djeholdings', instance: 'wd5', site: 'edelman-careers-e200', name: 'djeholdings' },  // Added via discovery — 4 India / 4 total
{ company: 'enzazaden', instance: 'wd103', site: 'enza-careers', name: 'enzazaden' },  // Added via discovery — 4 India / 4 total
{ company: 'evolent', instance: 'wd1', site: 'external', name: 'evolent' },  // Added via discovery — 4 India / 4 total
{ company: 'gatesfoundation', instance: 'wd1', site: 'gates', name: 'gatesfoundation' },  // Added via discovery — 4 India / 4 total
{ company: 'hbpublishing', instance: 'wd1', site: 'careers', name: 'hbpublishing' },  // Added via discovery — 4 India / 4 total
{ company: 'healthcare', instance: 'wd1', site: 'private', name: 'healthcare' },  // Added via discovery — 4 India / 4 total
{ company: 'hl', instance: 'wd1', site: 'corporate', name: 'hl' },  // Added via discovery — 4 India / 4 total
{ company: 'incora', instance: 'wd5', site: 'incora', name: 'incora' },  // Added via discovery — 4 India / 4 total
{ company: 'integralife', instance: 'wd1', site: 'careers', name: 'integralife' },  // Added via discovery — 4 India / 4 total
{ company: 'lifung', instance: 'wd3', site: 'funggroup', name: 'lifung' },  // Added via discovery — 4 India / 4 total
{ company: 'lsi', instance: 'wd3', site: 'arxada_careers', name: 'lsi' },  // Added via discovery — 4 India / 4 total
{ company: 'maersk', instance: 'wd3', site: 'apmt_careers', name: 'maersk' },  // Added via discovery — 4 India / 4 total
{ company: 'manh', instance: 'wd5', site: 'external', name: 'manh' },  // Added via discovery — 4 India / 4 total
{ company: 'marvell', instance: 'wd1', site: 'marvellcareers2', name: 'marvell' },  // Added via discovery — 4 India / 4 total
{ company: 'masco', instance: 'wd1', site: 'MascoHomeProductsIndia', name: 'masco' },  // Added via discovery — 4 India / 4 total
{ company: 'moog', instance: 'wd5', site: 'moog_external_career_site', name: 'moog' },  // Added via discovery — 4 India / 4 total
{ company: 'onemagnify', instance: 'wd5', site: 'onemagnify_careers', name: 'onemagnify' },  // Added via discovery — 4 India / 4 total
{ company: 'orthoclinical', instance: 'wd1', site: 'search', name: 'orthoclinical' },  // Added via discovery — 4 India / 4 total
{ company: 'pinnacle', instance: 'wd1', site: 'Pinnacle', name: 'pinnacle' },  // Added via discovery — 4 India / 4 total
{ company: 'reputation', instance: 'wd1', site: 'external', name: 'reputation' },  // Added via discovery — 4 India / 4 total
{ company: 'roberthalf', instance: 'wd1', site: 'protivitiindia', name: 'roberthalf' },  // Added via discovery — 4 India / 4 total
{ company: 'safeguardglobal', instance: 'wd3', site: 'external_careers', name: 'safeguardglobal' },  // Added via discovery — 4 India / 4 total
{ company: 'sec', instance: 'wd3', site: 'samsung_jobs', name: 'sec' },  // Added via discovery — 4 India / 4 total
{ company: 'semrush', instance: 'wd5', site: 'semrushcareers', name: 'semrush' },  // Added via discovery — 4 India / 4 total
{ company: 'snapchat', instance: 'wd1', site: 'snap', name: 'snapchat' },  // Added via discovery — 4 India / 4 total
{ company: 'spe', instance: 'wd1', site: 'sonypicturesentertainment', name: 'spe' },  // Added via discovery — 4 India / 4 total
{ company: 'sunlife', instance: 'wd3', site: 'experienced', name: 'sunlife' },  // Added via discovery — 4 India / 4 total
{ company: 'trumpf', instance: 'wd3', site: 'trumpf_students', name: 'trumpf' },  // Added via discovery — 4 India / 4 total
{ company: 'venaenergy', instance: 'wd102', site: 'external', name: 'venaenergy' },  // Added via discovery — 4 India / 4 total
{ company: 'virbac', instance: 'wd103', site: 'career', name: 'virbac' },  // Added via discovery — 4 India / 4 total
{ company: 'volarisgroup', instance: 'wd3', site: 'incadea', name: 'volarisgroup' },  // Added via discovery — 4 India / 4 total
{ company: 'yougov', instance: 'wd103', site: 'yougov_external_careers', name: 'yougov' },  // Added via discovery — 4 India / 4 total
{ company: 'zoetis', instance: 'wd5', site: 'broadbean_external', name: 'zoetis' },  // Added via discovery — 4 India / 4 total
{ company: 'jci', instance: 'wd5', site: 'TUPU', name: 'jci' },  // Added via discovery — 4 India / 4 total
{ company: 'aptiagroup', instance: 'wd3', site: 'broadbean_external', name: 'aptiagroup' },  // Added via discovery — 3 India / 3 total
{ company: 'broadcom', instance: 'wd1', site: 'external_career', name: 'broadcom' },  // Added via discovery — 3 India / 3 total
{ company: 'cat', instance: 'wd5', site: 'solarturbines', name: 'cat' },  // Added via discovery — 3 India / 3 total
{ company: 'cerence', instance: 'wd5', site: 'cerence', name: 'cerence' },  // Added via discovery — 3 India / 3 total
{ company: 'clearwateranalytics', instance: 'wd1', site: 'clearwater_analytics_careers', name: 'clearwateranalytics' },  // Added via discovery — 3 India / 3 total
{ company: 'disa', instance: 'wd5', site: 'disa_external_career_site', name: 'disa' },  // Added via discovery — 3 India / 3 total
{ company: 'dowjones', instance: 'wd1', site: 'news_corp_careers', name: 'dowjones' },  // Added via discovery — 3 India / 3 total
{ company: 'equinix', instance: 'wd1', site: 'applications_by_invitations', name: 'equinix' },  // Added via discovery — 3 India / 3 total
{ company: 'ferring', instance: 'wd3', site: 'ferring', name: 'ferring' },  // Added via discovery — 3 India / 3 total
{ company: 'flender', instance: 'wd3', site: 'flender_global', name: 'flender' },  // Added via discovery — 3 India / 3 total
{ company: 'gn', instance: 'wd3', site: 'jabracareers', name: 'gn' },  // Added via discovery — 3 India / 3 total
{ company: 'littelfuse', instance: 'wd1', site: 'littelfuse-careers', name: 'littelfuse' },  // Added via discovery — 3 India / 3 total
{ company: 'mitel', instance: 'wd3', site: 'mitelcareers', name: 'mitel' },  // Added via discovery — 3 India / 3 total
{ company: 'mobility', instance: 'wd503', site: 'mobility', name: 'mobility' },  // Added via discovery — 3 India / 3 total
{ company: 'monolithicpower', instance: 'wd12', site: 'mps_careers', name: 'monolithicpower' },  // Added via discovery — 3 India / 3 total
{ company: 'monotype', instance: 'wd1', site: 'monotype', name: 'monotype' },  // Added via discovery — 3 India / 3 total
{ company: 'multitude', instance: 'wd103', site: 'careers_multitude', name: 'multitude' },  // Added via discovery — 3 India / 3 total
{ company: 'murex', instance: 'wd3', site: 'murexcareerpage1', name: 'murex' },  // Added via discovery — 3 India / 3 total
{ company: 'newbalance', instance: 'wd1', site: 'careers', name: 'newbalance' },  // Added via discovery — 3 India / 3 total
{ company: 'ouryahoo', instance: 'wd5', site: 'careers', name: 'ouryahoo' },  // Added via discovery — 3 India / 3 total
{ company: 'pacificlife', instance: 'wd1', site: 'pacificliferecareers', name: 'pacificlife' },  // Added via discovery — 3 India / 3 total
{ company: 'pernodricard', instance: 'wd3', site: 'pernod-ricard', name: 'pernodricard' },  // Added via discovery — 3 India / 3 total
{ company: 'reliaquest', instance: 'wd5', site: 'reliaquest_careers', name: 'reliaquest' },  // Added via discovery — 3 India / 3 total
{ company: 'rgare', instance: 'wd1', site: 'careers', name: 'rgare' },  // Added via discovery — 3 India / 3 total
{ company: 'sandvik', instance: 'wd3', site: 'dormerpramet-jobs', name: 'sandvik' },  // Added via discovery — 3 India / 3 total
{ company: 'spectris', instance: 'wd3', site: 'pms_careers', name: 'spectris' },  // Added via discovery — 3 India / 3 total
{ company: 'talentmanagementsolution', instance: 'wd3', site: 'jonassoftwareusa', name: 'talentmanagementsolution' },  // Added via discovery — 3 India / 3 total
{ company: 'tieto', instance: 'wd3', site: 'tieto_careers_external_site', name: 'tieto' },  // Added via discovery — 3 India / 3 total
{ company: 'topbloc', instance: 'wd5', site: 'topbloc_careers', name: 'topbloc' },  // Added via discovery — 3 India / 3 total
{ company: 'uniphore', instance: 'wd503', site: 'uniphore', name: 'uniphore' },  // Added via discovery — 3 India / 3 total
{ company: 'vanderlande', instance: 'wd3', site: 'talexternalcareers', name: 'vanderlande' },  // Added via discovery — 3 India / 3 total
{ company: 'veralto', instance: 'wd1', site: 'trojanjobs', name: 'veralto' },  // Added via discovery — 3 India / 3 total
{ company: 'westernunion', instance: 'wd5', site: 'westernunionjobs', name: 'westernunion' },  // Added via discovery — 3 India / 3 total
{ company: 'wlt', instance: 'wd3', site: 'wl_careers', name: 'wlt' },  // Added via discovery — 3 India / 3 total
{ company: 'woodmac', instance: 'wd3', site: 'woodmaccareers', name: 'woodmac' },  // Added via discovery — 3 India / 3 total
{ company: 'adient', instance: 'wd3', site: 'external', name: 'adient' },  // Added via discovery — 2 India / 2 total
{ company: 'albemarle', instance: 'wd5', site: 'ketjenexternal', name: 'albemarle' },  // Added via discovery — 2 India / 2 total
{ company: 'alliance', instance: 'wd3', site: 'traineeprivateaccess', name: 'alliance' },  // Added via discovery — 2 India / 2 total
{ company: 'amgen', instance: 'wd1', site: 'agency', name: 'amgen' },  // Added via discovery — 2 India / 2 total
{ company: 'ankura', instance: 'wd5', site: 'ankura', name: 'ankura' },  // Added via discovery — 2 India / 2 total
{ company: 'averis', instance: 'wd3', site: 'rge', name: 'averis' },  // Added via discovery — 2 India / 2 total
{ company: 'cabotcorp', instance: 'wd12', site: 'careers', name: 'cabotcorp' },  // Added via discovery — 2 India / 2 total
{ company: 'cbcrc', instance: 'wd3', site: 'cbc_radio-canada_jobs', name: 'cbcrc' },  // Added via discovery — 2 India / 2 total
{ company: 'championx', instance: 'wd1', site: 'championx_external', name: 'championx' },  // Added via discovery — 2 India / 2 total
{ company: 'cloudera', instance: 'wd5', site: 'external_career', name: 'cloudera' },  // Added via discovery — 2 India / 2 total
{ company: 'corrohealth', instance: 'wd1', site: 'corrohealthindia', name: 'corrohealth' },  // Added via discovery — 2 India / 2 total
{ company: 'elekta', instance: 'wd3', site: 'elekta_careers', name: 'elekta' },  // Added via discovery — 2 India / 2 total
{ company: 'elliottgroup', instance: 'wd5', site: 'elliottcareers', name: 'elliottgroup' },  // Added via discovery — 2 India / 2 total
{ company: 'enzazaden', instance: 'wd103', site: 'vitalis-careers', name: 'enzazaden' },  // Added via discovery — 2 India / 2 total
{ company: 'eosgroup', instance: 'wd3', site: 'eos', name: 'eosgroup' },  // Added via discovery — 2 India / 2 total
{ company: 'erpa', instance: 'wd12', site: 'erpa', name: 'erpa' },  // Added via discovery — 2 India / 2 total
{ company: 'globalhr', instance: 'wd5', site: 'private_posting_no_tmp', name: 'globalhr' },  // Added via discovery — 2 India / 2 total
{ company: 'goto', instance: 'wd5', site: 'gotocareers', name: 'goto' },  // Added via discovery — 2 India / 2 total
{ company: 'hexcel', instance: 'wd5', site: 'hexcelcareers', name: 'hexcel' },  // Added via discovery — 2 India / 2 total
{ company: 'innocap', instance: 'wd10', site: 'innocap-external-career-site', name: 'innocap' },  // Added via discovery — 2 India / 2 total
{ company: 'integralads', instance: 'wd1', site: 'iascareers', name: 'integralads' },  // Added via discovery — 2 India / 2 total
{ company: 'juliusbaer', instance: 'wd3', site: 'legal_experts', name: 'juliusbaer' },  // Added via discovery — 2 India / 2 total
{ company: 'lgroup', instance: 'wd3', site: 'l-acoustics_group_career', name: 'lgroup' },  // Added via discovery — 2 India / 2 total
{ company: 'liveramp', instance: 'wd5', site: 'liverampcareers', name: 'liveramp' },  // Added via discovery — 2 India / 2 total
{ company: 'lnw', instance: 'wd5', site: 'sciplayexternalcareerssite', name: 'lnw' },  // Added via discovery — 2 India / 2 total
{ company: 'mastercard', instance: 'wd1', site: 'contractorconversion', name: 'mastercard' },  // Added via discovery — 2 India / 2 total
{ company: 'medable', instance: 'wd503', site: 'explore-career-opportunities', name: 'medable' },  // Added via discovery — 2 India / 2 total
{ company: 'metabo', instance: 'wd3', site: 'kokicareers', name: 'metabo' },  // Added via discovery — 2 India / 2 total
{ company: 'myhana', instance: 'wd5', site: 'mauijim', name: 'myhana' },  // Added via discovery — 2 India / 2 total
{ company: 'mymoose', instance: 'wd1', site: 'careers', name: 'mymoose' },  // Added via discovery — 2 India / 2 total
{ company: 'phcgroup', instance: 'wd3', site: 'scimed_careers', name: 'phcgroup' },  // Added via discovery — 2 India / 2 total
{ company: 'phcgroup', instance: 'wd3', site: 'ascensia_careers', name: 'phcgroup' },  // Added via discovery — 2 India / 2 total
{ company: 'rohlig', instance: 'wd103', site: 'rohlig_careers', name: 'rohlig' },  // Added via discovery — 2 India / 2 total
{ company: 'ryansg', instance: 'wd5', site: 'broadbean_external', name: 'ryansg' },  // Added via discovery — 2 India / 2 total
{ company: 'snapchat', instance: 'wd1', site: 'sourced', name: 'snapchat' },  // Added via discovery — 2 India / 2 total
{ company: 'sphera', instance: 'wd1', site: 'careers', name: 'sphera' },  // Added via discovery — 2 India / 2 total
{ company: 'suse', instance: 'wd3', site: 'jobsatsuse', name: 'suse' },  // Added via discovery — 2 India / 2 total
{ company: 'talentmanagementsolution', instance: 'wd3', site: 'vestaother', name: 'talentmanagementsolution' },  // Added via discovery — 2 India / 2 total
{ company: 'villeroyboch', instance: 'wd3', site: 'careers', name: 'villeroyboch' },  // Added via discovery — 2 India / 2 total
{ company: 'wilsonhcg', instance: 'wd5', site: 'wilson_careers', name: 'wilsonhcg' },  // Added via discovery — 2 India / 2 total
{ company: 'zoetis', instance: 'wd5', site: 'zoetis_intl', name: 'zoetis' },  // Added via discovery — 2 India / 2 total
{ company: 'virainsight', instance: 'wd108', site: 'Vira_Insight', name: 'virainsight' },  // Added via discovery — 2 India / 2 total
{ company: 'abbott', instance: 'wd5', site: 'agency', name: 'abbott' },  // Added via discovery — 1 India / 1 total
{ company: 'abglobal', instance: 'wd1', site: 'abcampuscareers', name: 'abglobal' },  // Added via discovery — 1 India / 1 total
{ company: 'accuray', instance: 'wd5', site: 'external', name: 'accuray' },  // Added via discovery — 1 India / 1 total
{ company: 'altusgroup', instance: 'wd3', site: 'altusgroup', name: 'altusgroup' },  // Added via discovery — 1 India / 1 total
{ company: 'aman', instance: 'wd103', site: 'amangroupexternal', name: 'aman' },  // Added via discovery — 1 India / 1 total
{ company: 'axis', instance: 'wd3', site: 'external_career_site', name: 'axis' },  // Added via discovery — 1 India / 1 total
{ company: 'bci', instance: 'wd10', site: 'bci_careers', name: 'bci' },  // Added via discovery — 1 India / 1 total
{ company: 'blackstone', instance: 'wd1', site: 'blackstone_careers', name: 'blackstone' },  // Added via discovery — 1 India / 1 total
{ company: 'bydeluxe', instance: 'wd5', site: 'deluxe_external', name: 'bydeluxe' },  // Added via discovery — 1 India / 1 total
{ company: 'cdpq', instance: 'wd10', site: 'cdpq-recrutement-universitaire', name: 'cdpq' },  // Added via discovery — 1 India / 1 total
{ company: 'cgg', instance: 'wd103', site: 'viridiencareers', name: 'cgg' },  // Added via discovery — 1 India / 1 total
{ company: 'chemours', instance: 'wd103', site: 'chemours', name: 'chemours' },  // Added via discovery — 1 India / 1 total
{ company: 'childrensplace', instance: 'wd1', site: 'tcp03', name: 'childrensplace' },  // Added via discovery — 1 India / 1 total
{ company: 'deepwater', instance: 'wd1', site: 'globalexternalcareersite', name: 'deepwater' },  // Added via discovery — 1 India / 1 total
{ company: 'diptyqueparis', instance: 'wd103', site: 'diptyquecareers', name: 'diptyqueparis' },  // Added via discovery — 1 India / 1 total
{ company: 'digitalturbine', instance: 'wd501', site: 'digital_turbine_external_careers', name: 'digitalturbine' },  // Added via discovery — 1 India / 1 total
{ company: 'dowjones', instance: 'wd1', site: 'wsj_external_career', name: 'dowjones' },  // Added via discovery — 1 India / 1 total
{ company: 'embecta', instance: 'wd1', site: 'embectacareers', name: 'embecta' },  // Added via discovery — 1 India / 1 total
{ company: 'equisoft', instance: 'wd10', site: 'external', name: 'equisoft' },  // Added via discovery — 1 India / 1 total
{ company: 'eset', instance: 'wd3', site: 'eset_external', name: 'eset' },  // Added via discovery — 1 India / 1 total
{ company: 'flexerasoftware', instance: 'wd1', site: 'prosperops', name: 'flexerasoftware' },  // Added via discovery — 1 India / 1 total
{ company: 'gadventures', instance: 'wd3', site: 'gadventures', name: 'gadventures' },  // Added via discovery — 1 India / 1 total
{ company: 'gensler', instance: 'wd1', site: 'genslercareers', name: 'gensler' },  // Added via discovery — 1 India / 1 total
{ company: 'kardex', instance: 'wd103', site: 'kardex', name: 'kardex' },  // Added via discovery — 1 India / 1 total
{ company: 'litera', instance: 'wd12', site: 'litera_careers', name: 'litera' },  // Added via discovery — 1 India / 1 total
{ company: 'luminegrp', instance: 'wd3', site: 'tomia', name: 'luminegrp' },  // Added via discovery — 1 India / 1 total
{ company: 'ngs', instance: 'wd1', site: 'ngs_external_career_site', name: 'ngs' },  // Added via discovery — 1 India / 1 total
{ company: 'pinebridge', instance: 'wd5', site: 'pinebridge_career_site', name: 'pinebridge' },  // Added via discovery — 1 India / 1 total
{ company: 'qualifacts', instance: 'wd5', site: 'qualifacts_external_careers', name: 'qualifacts' },  // Added via discovery — 1 India / 1 total
{ company: 'repligen', instance: 'wd108', site: 'repligen_careers', name: 'repligen' },  // Added via discovery — 1 India / 1 total
{ company: 'resmed', instance: 'wd3', site: 'matrixcare_external_careers', name: 'resmed' },  // Added via discovery — 1 India / 1 total
{ company: 'sabre', instance: 'wd1', site: 'confidential', name: 'sabre' },  // Added via discovery — 1 India / 1 total
{ company: 'super', instance: 'wd103', site: 'EXT', name: 'super' },  // Added via discovery — 1 India / 1 total
{ company: 'syniverse', instance: 'wd1', site: 'syniversecareers', name: 'syniverse' },  // Added via discovery — 1 India / 1 total
{ company: 'temenos', instance: 'wd103', site: 'temenoscareers', name: 'temenos' },  // Added via discovery — 1 India / 1 total
{ company: 'trumpf', instance: 'wd3', site: 'trumpf_apprenticeships', name: 'trumpf' },  // Added via discovery — 1 India / 1 total
{ company: 'veralto', instance: 'wd1', site: 'linxjobs', name: 'veralto' },  // Added via discovery — 1 India / 1 total
{ company: 'visa', instance: 'wd5', site: 'visa_early_careers', name: 'visa' },  // Added via discovery — 1 India / 1 total
{ company: 'weforum', instance: 'wd3', site: 'forum_careers', name: 'weforum' },  // Added via discovery — 1 India / 1 total
{ company: 'wfscorp', instance: 'wd5', site: 'wfscareers', name: 'wfscorp' },  // Added via discovery — 1 India / 1 total
{ company: 'fticonsulting', instance: 'wd108', site: 'FTIConsultingCareers', name: 'fticonsulting' },  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:04: verified ≥1 live India job ──
{ company: 'mmc', instance: 'wd1', site: 'careers', name: 'mmc' },  // Added via discovery — 104 India / 104 total
{ company: 'aampower', instance: 'wd1', site: 'AAM-Career-Site', name: 'aampower' },  // Added via discovery — 54 India / 54 total
{ company: 'statestreet', instance: 'wd1', site: 'eQuest', name: 'statestreet' },  // Added via discovery — 49 India / 49 total
{ company: 'ayvens', instance: 'wd3', site: 'SG-Ayvens', name: 'ayvens' },  // Added via discovery — 11 India / 11 total
{ company: 'ivlglobaliod', instance: 'wd1', site: 'Indovinya', name: 'ivlglobaliod' },  // Added via discovery — 6 India / 6 total
{ company: 'gh', instance: 'wd1', site: 'gh', name: 'gh' },  // Added via discovery — 3 India / 3 total
{ company: 'lifung', instance: 'wd3', site: 'NeoTangent', name: 'lifung' },  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:07: verified ≥1 live India job ──
{ company: 'usbank', instance: 'wd1', site: 'us_bank_careers', name: 'usbank' },  // Added via discovery — 69 India / 69 total
{ company: 'tiaa', instance: 'wd1', site: 'search', name: 'tiaa' },  // Added via discovery — 55 India / 55 total
{ company: 'tdwilliamson', instance: 'wd1', site: 'tdwcareers', name: 'tdwilliamson' },  // Added via discovery — 7 India / 7 total

// ── Discovery run 2026-09-15T10:12: verified ≥1 live India job ──
{ company: 'centific', instance: 'wd1', site: 'Centific_ECS_SEA', name: 'centific' },  // Added via discovery — 18 India / 18 total
{ company: 'genesys', instance: 'wd1', site: '2_genesys_jobs', name: 'genesys' },  // Added via discovery — 9 India / 9 total
{ company: 'lytx', instance: 'wd1', site: 'lytx', name: 'lytx' },  // Added via discovery — 4 India / 4 total
{ company: 'ryansg', instance: 'wd5', site: 'ryan_specialty_career_site', name: 'ryansg' },  // Added via discovery — 3 India / 3 total

// ── Discovery run 2026-09-15T10:36: verified ≥1 live India job ──
{ company: 'yokogawa', instance: 'wd3', site: 'yokogawa-career-site', name: 'yokogawa' },  // Added via discovery — 73 India / 73 total
{ company: 'chloe', instance: 'wd3', site: 'OpellaCareers', name: 'chloe' },  // Added via discovery — 66 India / 66 total
{ company: 'genpact', instance: 'wd108', site: 'campussite', name: 'genpact' },  // Added via discovery — 53 India / 53 total
{ company: 'vantive', instance: 'wd108', site: 'Vantive', name: 'vantive' },  // Added via discovery — 45 India / 45 total
{ company: 'pepperlfuchs', instance: 'wd103', site: 'PepperlFuchs', name: 'pepperlfuchs' },  // Added via discovery — 44 India / 44 total
{ company: 'nextracker', instance: 'wd5', site: 'nextpower_careers', name: 'nextracker' },  // Added via discovery — 44 India / 44 total
{ company: 'mdtkangaroo', instance: 'wd108', site: 'MiniMedCareers', name: 'mdtkangaroo' },  // Added via discovery — 40 India / 40 total
{ company: 'regalrexnord', instance: 'wd1', site: 'invitation', name: 'regalrexnord' },  // Added via discovery — 38 India / 38 total
{ company: 'zebra', instance: 'wd501', site: 'Zebra_careers', name: 'zebra' },  // Added via discovery — 37 India / 37 total
{ company: 'accendra', instance: 'wd504', site: 'AccendraCareers', name: 'accendra' },  // Added via discovery — 30 India / 30 total
{ company: 'vialto', instance: 'wd107', site: 'VialtoExternalCareers', name: 'vialto' },  // Added via discovery — 24 India / 24 total
{ company: 'vishay', instance: 'wd3', site: 'broadbean_external', name: 'vishay' },  // Added via discovery — 24 India / 24 total
{ company: 'expedia', instance: 'wd108', site: 'private', name: 'expedia' },  // Added via discovery — 19 India / 19 total
{ company: 'novonesis', instance: 'wd103', site: 'Novonesis_Careers', name: 'novonesis' },  // Added via discovery — 15 India / 15 total
{ company: 'blackline', instance: 'wd108', site: 'BlackLineCareers', name: 'blackline' },  // Added via discovery — 13 India / 13 total
{ company: 'richemont', instance: 'wd3', site: 'richemont', name: 'richemont' },  // Added via discovery — 9 India / 9 total
{ company: 'cisive', instance: 'wd108', site: 'Cisive', name: 'cisive' },  // Added via discovery — 8 India / 8 total
{ company: 'maksegroup', instance: 'wd12', site: 'openings', name: 'maksegroup' },  // Added via discovery — 7 India / 7 total
{ company: 'sagility', instance: 'wd1', site: 'sagility_careers_ind', name: 'sagility' },  // Added via discovery — 6 India / 6 total
{ company: 'tvh', instance: 'wd3', site: 'JobsatTVH', name: 'tvh' },  // Added via discovery — 6 India / 6 total
{ company: 'weg', instance: 'wd501', site: 'marathon', name: 'weg' },  // Added via discovery — 6 India / 6 total
{ company: 'veralto', instance: 'wd1', site: 'X-RiteJobs', name: 'veralto' },  // Added via discovery — 5 India / 5 total
{ company: 'wri', instance: 'wd501', site: 'WRI_India', name: 'wri' },  // Added via discovery — 5 India / 5 total
{ company: 'cppib', instance: 'wd10', site: 'cppinvestments', name: 'cppib' },  // Added via discovery — 4 India / 4 total
{ company: 'yougov', instance: 'wd103', site: 'LinkedIn', name: 'yougov' },  // Added via discovery — 4 India / 4 total
{ company: 'tibco', instance: 'wd5', site: 'Cloud_Software_Group', name: 'tibco' },  // Added via discovery — 4 India / 4 total
{ company: 'smithweb', instance: 'wd108', site: 'SMITH2', name: 'smithweb' },  // Added via discovery — 3 India / 3 total
{ company: 'fticonsulting', instance: 'wd108', site: 'FTIConsultingCareersPrivate', name: 'fticonsulting' },  // Added via discovery — 2 India / 2 total
{ company: 'redaptive', instance: 'wd12', site: 'Redaptive-Careers', name: 'redaptive' },  // Added via discovery — 2 India / 2 total
{ company: 'cgg', instance: 'wd103', site: 'viridiengraduate', name: 'cgg' },  // Added via discovery — 1 India / 1 total
{ company: 'prodege', instance: 'wd108', site: 'Prodege_Careers', name: 'prodege' },  // Added via discovery — 1 India / 1 total
{ company: 'modaxo', instance: 'wd3', site: 'elovate', name: 'modaxo' },  // Added via discovery — 1 India / 1 total
{ company: 'riotinto', instance: 'wd3', site: 'RioTinto_Careers', name: 'riotinto' },  // Added via discovery — 1 India / 1 total
];

export { companyBoards };
