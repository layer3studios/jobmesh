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
    
// -- Verified live India jobs via web search (2026-09-15) --
'roku',
'deepwatchindia',
'officehours',
'easyship',
'flix',
'appsflyer',
'c3iot',
'codeandtheory',
'chargepoint',
'wizinc',
'ensono',
'togetherai',
'mthreerecruitingportal',
'razorpaysoftwareprivatelimited',
'headoutcareers',
'oliverseapac',
'workato',
'nextiva',
'india1',
'wppproduction',
'aviatrix',
'harnessinc',
'digicert',
'bursonglobalcareers',
'apolloio',
'agoda',
'aqr',
'monks',
'gruve',
'phdata',
'orioninnovationnaukri',
'netskope',
'sumologic',
'truefoundry',
'cloudsek',
'devrev',
'truecaller',
    
// ── Discovery run 2026-09-15: verified ≥1 live India job ──
'capco',  // Added via discovery — 164 India / 697 total
'wppmedia',  // Added via discovery — 91 India / 1015 total
'purestorage',  // Added via discovery — 80 India / 327 total
'wpp',  // Added via discovery — 67 India / 210 total
'vmlenterprisesolutions',  // Added via discovery — 62 India / 149 total
'wundermanthompson',  // Added via discovery — 61 India / 547 total
'agency',  // Added via discovery — 52 India / 831 total
'valtech',  // Added via discovery — 51 India / 125 total
'alphasense',  // Added via discovery — 49 India / 222 total
'payoneer',  // Added via discovery — 47 India / 121 total
'alphasenseindia',  // Added via discovery — 44 India / 44 total
'coherehealth',  // Added via discovery — 41 India / 79 total
'coupang',  // Added via discovery — 40 India / 710 total
'point72',  // Added via discovery — 39 India / 230 total
'digitalocean98',  // Added via discovery — 38 India / 132 total
'zetaglobal',  // Added via discovery — 38 India / 146 total
'five9',  // Added via discovery — 37 India / 118 total
'amtechsoftware',  // Added via discovery — 35 India / 37 total
'ethoslife',  // Added via discovery — 34 India / 66 total
'pubmatic',  // Added via discovery — 34 India / 81 total
'fictiv',  // Added via discovery — 32 India / 92 total
'speechify',  // Added via discovery — 32 India / 1080 total
'appian',  // Added via discovery — 30 India / 176 total
'instawork',  // Added via discovery — 30 India / 55 total
'sonicwall',  // Added via discovery — 29 India / 43 total
'zinnov',  // Added via discovery — 29 India / 29 total
'anaplan',  // Added via discovery — 28 India / 132 total
'onetrust',  // Added via discovery — 28 India / 93 total
'picoquantitativetrading',  // Added via discovery — 28 India / 57 total
'coupanginternal',  // Added via discovery — 26 India / 475 total
'openfx',  // Added via discovery — 26 India / 40 total
'azuritypharmaceuticalsindia',  // Added via discovery — 25 India / 25 total
'squarepointcapital',  // Added via discovery — 25 India / 95 total
'emergentlabsinc',  // Added via discovery — 24 India / 33 total
'freshprints',  // Added via discovery — 24 India / 41 total
'Tide',  // Added via discovery — 23 India / 82 total
'arcesiumllc',  // Added via discovery — 23 India / 44 total
'gleanwork',  // Added via discovery — 23 India / 118 total
'konradgroup',  // Added via discovery — 23 India / 98 total
'stage',  // Added via discovery — 23 India / 139 total
'kaseya',  // Added via discovery — 22 India / 90 total
'mitsogoinc',  // Added via discovery — 22 India / 36 total
'moniepoint',  // Added via discovery — 22 India / 205 total
'arcanaanalytics',  // Added via discovery — 21 India / 26 total
'atomicwork',  // Added via discovery — 21 India / 27 total
'bitwarden',  // Added via discovery — 21 India / 44 total
'gersonlehrmangroup',  // Added via discovery — 21 India / 92 total
'graphcore',  // Added via discovery — 21 India / 181 total
'livecareer',  // Added via discovery — 21 India / 33 total
'doordashindia',  // Added via discovery — 20 India / 21 total
'nice',  // Added via discovery — 20 India / 173 total
'truveta',  // Added via discovery — 19 India / 41 total
'zinnia',  // Added via discovery — 19 India / 26 total
'eclinicalsolutions',  // Added via discovery — 18 India / 34 total
'energyexemplarllc',  // Added via discovery — 18 India / 32 total
'orioninnovation',  // Added via discovery — 18 India / 72 total
'cognite',  // Added via discovery — 17 India / 46 total
'quince',  // Added via discovery — 17 India / 129 total
'smartsheet',  // Added via discovery — 17 India / 92 total
'winhomeinspection',  // Added via discovery — 17 India / 19 total
'66degrees',  // Added via discovery — 16 India / 26 total
'avathon',  // Added via discovery — 16 India / 35 total
'globalhealthcareexchangeinc',  // Added via discovery — 16 India / 37 total
'kraftonindia',  // Added via discovery — 16 India / 16 total
'precisionmedicinegroup',  // Added via discovery — 16 India / 140 total
'zind-erprogram',  // Added via discovery — 16 India / 16 total
'cialfo',  // Added via discovery — 15 India / 17 total
'enchargeai36',  // Added via discovery — 15 India / 26 total
'gravitonresearchcapital',  // Added via discovery — 15 India / 20 total
'netradyne',  // Added via discovery — 15 India / 29 total
'particle41llc',  // Added via discovery — 15 India / 26 total
'project44',  // Added via discovery — 15 India / 33 total
'yipitdatajobs',  // Added via discovery — 15 India / 51 total
'zafinlabsamericasinc',  // Added via discovery — 15 India / 31 total
'Ethernovia',  // Added via discovery — 14 India / 27 total
'addepar1',  // Added via discovery — 14 India / 103 total
'ashfieldadvisory',  // Added via discovery — 14 India / 30 total
'astspacemobile',  // Added via discovery — 14 India / 224 total
'asteralabs',  // Added via discovery — 14 India / 168 total
'blackduck',  // Added via discovery — 14 India / 57 total
'guidepoint',  // Added via discovery — 14 India / 117 total
'invoicecloud',  // Added via discovery — 14 India / 21 total
'karya',  // Added via discovery — 14 India / 15 total
'mediabrands',  // Added via discovery — 14 India / 213 total
'neweratech',  // Added via discovery — 14 India / 75 total
'roboyo',  // Added via discovery — 14 India / 29 total
'thirdbridge',  // Added via discovery — 14 India / 130 total
'axicorpfinancialservicesptyltd',  // Added via discovery — 13 India / 32 total
'connectwise',  // Added via discovery — 13 India / 54 total
'diligentcorporation',  // Added via discovery — 13 India / 114 total
'khanacademy',  // Added via discovery — 13 India / 20 total
'redwoodsoftware',  // Added via discovery — 13 India / 29 total
'scopely',  // Added via discovery — 13 India / 174 total
'skildai-careers',  // Added via discovery — 13 India / 62 total
'vaynermedia',  // Added via discovery — 13 India / 97 total
'neuraflash',  // Added via discovery — 12 India / 71 total
'pfm',  // Added via discovery — 12 India / 100 total
'plume',  // Added via discovery — 12 India / 21 total
'prodigal',  // Added via discovery — 12 India / 13 total
'reltio',  // Added via discovery — 12 India / 27 total
'skillzinc',  // Added via discovery — 12 India / 18 total
'spauldingridge',  // Added via discovery — 12 India / 43 total
'starrez',  // Added via discovery — 12 India / 23 total
'teachforall',  // Added via discovery — 12 India / 15 total
'towerresearchcapital',  // Added via discovery — 12 India / 87 total
'endorlabs',  // Added via discovery — 11 India / 30 total
'headoutlinkedin',  // Added via discovery — 11 India / 16 total
'imc',  // Added via discovery — 11 India / 170 total
'inizio',  // Added via discovery — 11 India / 25 total
'landor',  // Added via discovery — 11 India / 49 total
'pay2dc',  // Added via discovery — 11 India / 11 total
'sentinellabs',  // Added via discovery — 11 India / 196 total
'stockx',  // Added via discovery — 11 India / 33 total
'xometry',  // Added via discovery — 11 India / 191 total
'zocdoc',  // Added via discovery — 11 India / 52 total
'abnormalsecurity',  // Added via discovery — 10 India / 71 total
'anchanto',  // Added via discovery — 10 India / 11 total
'blinkhealth',  // Added via discovery — 10 India / 80 total
'brandtechplus',  // Added via discovery — 10 India / 38 total
'jumio',  // Added via discovery — 10 India / 27 total
'konovo',  // Added via discovery — 10 India / 14 total
'litmos',  // Added via discovery — 10 India / 18 total
'logicmonitor',  // Added via discovery — 10 India / 47 total
'psg',  // Added via discovery — 10 India / 10 total
'showpad',  // Added via discovery — 10 India / 38 total
'syndigo',  // Added via discovery — 10 India / 28 total
'taboola',  // Added via discovery — 10 India / 87 total
'tracelinkinc',  // Added via discovery — 10 India / 25 total
'yipitdata',  // Added via discovery — 10 India / 52 total
'clearviewhealthcarepartners',  // Added via discovery — 9 India / 32 total
'crunchyroll',  // Added via discovery — 9 India / 73 total
'definitivehcindia',  // Added via discovery — 9 India / 9 total
'icapitalnetwork',  // Added via discovery — 9 India / 213 total
'madisonlogicinc',  // Added via discovery — 9 India / 12 total
'sohohouseco',  // Added via discovery — 9 India / 429 total
'unispace',  // Added via discovery — 9 India / 45 total
'adyen',  // Added via discovery — 8 India / 225 total
'billtrust1',  // Added via discovery — 8 India / 8 total
'bluevineindia',  // Added via discovery — 8 India / 8 total
'britive',  // Added via discovery — 8 India / 15 total
'disco',  // Added via discovery — 8 India / 34 total
'fanaticscommerce',  // Added via discovery — 8 India / 223 total
'gokenamericallc',  // Added via discovery — 8 India / 31 total
'greenlandinvestmentmanagement',  // Added via discovery — 8 India / 8 total
'herewithgmbh',  // Added via discovery — 8 India / 613 total
'jazzx-ai',  // Added via discovery — 8 India / 13 total
'komodohealth',  // Added via discovery — 8 India / 29 total
'putnamassociatesllc',  // Added via discovery — 8 India / 13 total
'rzr',  // Added via discovery — 8 India / 58 total
'sambanovasystems',  // Added via discovery — 8 India / 57 total
'smartbear',  // Added via discovery — 8 India / 23 total
'studycontractors',  // Added via discovery — 8 India / 26 total
'thoughtworksreferral',  // Added via discovery — 8 India / 41 total
'alphagrepsecurities',  // Added via discovery — 7 India / 15 total
'branchmetrics',  // Added via discovery — 7 India / 16 total
'couchbaseinc',  // Added via discovery — 7 India / 14 total
'enterpret',  // Added via discovery — 7 India / 15 total
'getwellnetwork',  // Added via discovery — 7 India / 7 total
'gomotive',  // Added via discovery — 7 India / 151 total
'india',  // Added via discovery — 7 India / 7 total
'modulrfinance',  // Added via discovery — 7 India / 23 total
'nebius',  // Added via discovery — 7 India / 376 total
'netbrain',  // Added via discovery — 7 India / 38 total
'veeamsoftware',  // Added via discovery — 7 India / 239 total
'wekatest',  // Added via discovery — 7 India / 45 total
'eltropyinc',  // Added via discovery — 7 India / 15 total
'acurussolutions',  // Added via discovery — 6 India / 6 total
'adasiaholdings',  // Added via discovery — 6 India / 227 total
'aidashinc',  // Added via discovery — 6 India / 8 total
'airtrunk',  // Added via discovery — 6 India / 79 total
'appviewx',  // Added via discovery — 6 India / 13 total
'armada',  // Added via discovery — 6 India / 51 total
'artefact',  // Added via discovery — 6 India / 120 total
'bayasystems',  // Added via discovery — 6 India / 22 total
'cannondesign',  // Added via discovery — 6 India / 136 total
'commerceiq',  // Added via discovery — 6 India / 14 total
'conga',  // Added via discovery — 6 India / 40 total
'fourkites',  // Added via discovery — 6 India / 14 total
'galaxydigitalservices',  // Added via discovery — 6 India / 46 total
'godaddy',  // Added via discovery — 6 India / 32 total
'hginsights',  // Added via discovery — 6 India / 8 total
'janes',  // Added via discovery — 6 India / 9 total
'legion',  // Added via discovery — 6 India / 16 total
'phizenix',  // Added via discovery — 6 India / 12 total
'pingidentity',  // Added via discovery — 6 India / 79 total
'quberesearchandtechnologies',  // Added via discovery — 6 India / 200 total
'solarwinds',  // Added via discovery — 6 India / 58 total
'techholding',  // Added via discovery — 6 India / 17 total
'theeconomistgroup',  // Added via discovery — 6 India / 26 total
'twinhealth',  // Added via discovery — 6 India / 34 total
'worldquant',  // Added via discovery — 6 India / 102 total
'zuora',  // Added via discovery — 6 India / 31 total
'zyngacareers',  // Added via discovery — 6 India / 40 total
'2k',  // Added via discovery — 5 India / 121 total
'atlasxhm',  // Added via discovery — 5 India / 27 total
'cision',  // Added via discovery — 5 India / 48 total
'codalinc',  // Added via discovery — 5 India / 24 total
'dscout',  // Added via discovery — 5 India / 10 total
'envoyglobalinc',  // Added via discovery — 5 India / 21 total
'equalexperts',  // Added via discovery — 5 India / 15 total
'globalizationpartners',  // Added via discovery — 5 India / 37 total
'highmetric',  // Added via discovery — 5 India / 46 total
'innophaseiot',  // Added via discovery — 5 India / 13 total
'meltplan',  // Added via discovery — 5 India / 5 total
'opswat',  // Added via discovery — 5 India / 94 total
'platformscience',  // Added via discovery — 5 India / 23 total
'precisionaq',  // Added via discovery — 5 India / 41 total
'quantboxresearchpte',  // Added via discovery — 5 India / 7 total
'researchpartnership',  // Added via discovery — 5 India / 18 total
'saucelabs',  // Added via discovery — 5 India / 11 total
'schrdinger',  // Added via discovery — 5 India / 23 total
'sezzle',  // Added via discovery — 5 India / 203 total
'southstarcareers',  // Added via discovery — 5 India / 5 total
'startree',  // Added via discovery — 5 India / 6 total
'taketwo',  // Added via discovery — 5 India / 38 total
'telnyx54',  // Added via discovery — 5 India / 55 total
'tenstorrent',  // Added via discovery — 5 India / 124 total
'Vercel',  // Added via discovery — 4 India / 87 total
'abacus',  // Added via discovery — 4 India / 57 total
'akko',  // Added via discovery — 4 India / 8 total
'blenheimchalcotindia',  // Added via discovery — 4 India / 4 total
'bloomreach',  // Added via discovery — 4 India / 77 total
'bottomlinetechnologies',  // Added via discovery — 4 India / 29 total
'cleoindia',  // Added via discovery — 4 India / 4 total
'crashplan',  // Added via discovery — 4 India / 4 total
'earnin',  // Added via discovery — 4 India / 19 total
'episodesix',  // Added via discovery — 4 India / 22 total
'episodesixlinkedin',  // Added via discovery — 4 India / 24 total
'eudia',  // Added via discovery — 4 India / 19 total
'falconx',  // Added via discovery — 4 India / 19 total
'formaaiinc',  // Added via discovery — 4 India / 22 total
'forwardnetworks',  // Added via discovery — 4 India / 19 total
'futurestandard',  // Added via discovery — 4 India / 15 total
'gallup',  // Added via discovery — 4 India / 52 total
'groupon',  // Added via discovery — 4 India / 20 total
'instead',  // Added via discovery — 4 India / 11 total
'jfrog',  // Added via discovery — 4 India / 59 total
'kulficollective',  // Added via discovery — 4 India / 4 total
'kayzen',  // Added via discovery — 4 India / 13 total
'plootocareers',  // Added via discovery — 4 India / 8 total
'poppulo',  // Added via discovery — 4 India / 11 total
'preciselyinternationaljobs',  // Added via discovery — 4 India / 22 total
'quinstreet',  // Added via discovery — 4 India / 32 total
'rhombuspower',  // Added via discovery — 4 India / 13 total
'spacexglobal',  // Added via discovery — 4 India / 18 total
'suki',  // Added via discovery — 4 India / 10 total
'supplyhouse',  // Added via discovery — 4 India / 29 total
'trgscreen',  // Added via discovery — 4 India / 8 total
'waymo',  // Added via discovery — 4 India / 326 total
'workatbackbase',  // Added via discovery — 4 India / 43 total
'xohealthinc',  // Added via discovery — 4 India / 6 total
'yext',  // Added via discovery — 4 India / 20 total
'acryldata',  // Added via discovery — 3 India / 8 total
'aiviq',  // Added via discovery — 3 India / 5 total
'appfire',  // Added via discovery — 3 India / 15 total
'armissecurity',  // Added via discovery — 3 India / 8 total
'blueconic',  // Added via discovery — 3 India / 3 total
'britishasiantrust',  // Added via discovery — 3 India / 4 total
'bswiftindia',  // Added via discovery — 3 India / 3 total
'castaigroupinc',  // Added via discovery — 3 India / 28 total
'chainguard',  // Added via discovery — 3 India / 85 total
'clinchoice',  // Added via discovery — 3 India / 45 total
'convera',  // Added via discovery — 3 India / 54 total
'currenciesdirect',  // Added via discovery — 3 India / 18 total
'deepintent',  // Added via discovery — 3 India / 12 total
'definian',  // Added via discovery — 3 India / 8 total
'dialpad',  // Added via discovery — 3 India / 78 total
'dominodatalab',  // Added via discovery — 3 India / 22 total
'encora10',  // Added via discovery — 3 India / 199 total
'eositsolutions',  // Added via discovery — 3 India / 153 total
'etec',  // Added via discovery — 3 India / 3 total
'gatherai',  // Added via discovery — 3 India / 12 total
'globalli',  // Added via discovery — 3 India / 12 total
'goguardian',  // Added via discovery — 3 India / 13 total
'inizioevoke',  // Added via discovery — 3 India / 58 total
'ivalua',  // Added via discovery — 3 India / 47 total
'jensenhughes',  // Added via discovery — 3 India / 132 total
'jumptrading',  // Added via discovery — 3 India / 107 total
'justanswer',  // Added via discovery — 3 India / 12 total
'karat',  // Added via discovery — 3 India / 9 total
'knowbe4',  // Added via discovery — 3 India / 65 total
'map',  // Added via discovery — 3 India / 60 total
'mariadbplc',  // Added via discovery — 3 India / 16 total
'metropolis',  // Added via discovery — 3 India / 90 total
'micoworks',  // Added via discovery — 3 India / 3 total
'miqdigital',  // Added via discovery — 3 India / 46 total
'momentumfinancialservicesgroup',  // Added via discovery — 3 India / 25 total
'nexla',  // Added via discovery — 3 India / 4 total
'optiverus',  // Added via discovery — 3 India / 161 total
'prathaminternational',  // Added via discovery — 3 India / 4 total
'prophecysimpledatalabs',  // Added via discovery — 3 India / 9 total
'recordedfuture',  // Added via discovery — 3 India / 39 total
'securly13',  // Added via discovery — 3 India / 10 total
'simpplr',  // Added via discovery — 3 India / 4 total
'sonymusicentertainment',  // Added via discovery — 3 India / 154 total
'talkdesk2',  // Added via discovery — 3 India / 44 total
'tamara',  // Added via discovery — 3 India / 30 total
'teads1',  // Added via discovery — 3 India / 67 total
'technologyadvice',  // Added via discovery — 3 India / 24 total
'theknotworldwide',  // Added via discovery — 3 India / 29 total
'toradex',  // Added via discovery — 3 India / 19 total
'utt',  // Added via discovery — 3 India / 26 total
'vectranetworks',  // Added via discovery — 3 India / 27 total
'verantos',  // Added via discovery — 3 India / 8 total
'verifone',  // Added via discovery — 3 India / 38 total
'sportygroup',  // Added via discovery — 3 India / 43 total
'abacusinsights',  // Added via discovery — 2 India / 7 total
'abc',  // Added via discovery — 2 India / 24 total
'abbyy',  // Added via discovery — 2 India / 11 total
'aisquared',  // Added via discovery — 2 India / 8 total
'align',  // Added via discovery — 2 India / 24 total
'anteriad',  // Added via discovery — 2 India / 8 total
'anthropic',  // Added via discovery — 2 India / 595 total
'armorcode',  // Added via discovery — 2 India / 4 total
'arkoselabs',  // Added via discovery — 2 India / 4 total
'atariinc',  // Added via discovery — 2 India / 12 total
'atolls',  // Added via discovery — 2 India / 23 total
'augury',  // Added via discovery — 2 India / 17 total
'backblaze',  // Added via discovery — 2 India / 36 total
'beelinemedicines',  // Added via discovery — 2 India / 43 total
'bugcrowd',  // Added via discovery — 2 India / 12 total
'celigo',  // Added via discovery — 2 India / 24 total
'cresta',  // Added via discovery — 2 India / 94 total
'dept',  // Added via discovery — 2 India / 215 total
'drivewealth',  // Added via discovery — 2 India / 13 total
'dunnhumby',  // Added via discovery — 2 India / 36 total
'efihr',  // Added via discovery — 2 India / 39 total
'enboarder',  // Added via discovery — 2 India / 5 total
'eplusinc',  // Added via discovery — 2 India / 70 total
'esri',  // Added via discovery — 2 India / 457 total
'examplecorpsandbox',  // Added via discovery — 2 India / 219 total
'formaaiinc3',  // Added via discovery — 2 India / 2 total
'fusionworldwide',  // Added via discovery — 2 India / 29 total
'genea',  // Added via discovery — 2 India / 4 total
'globalenergyallianceforpeopleandplanetgeappllc',  // Added via discovery — 2 India / 5 total
'harborglobal',  // Added via discovery — 2 India / 43 total
'hearcomin',  // Added via discovery — 2 India / 2 total
'homeward',  // Added via discovery — 2 India / 3 total
'hunterdouglas',  // Added via discovery — 2 India / 68 total
'iterativehealth',  // Added via discovery — 2 India / 53 total
'liberis',  // Added via discovery — 2 India / 23 total
'linkedin',  // Added via discovery — 2 India / 53 total
'lumimeds',  // Added via discovery — 2 India / 33 total
'lynxanalytics',  // Added via discovery — 2 India / 8 total
'mhi',  // Added via discovery — 2 India / 21 total
'minio',  // Added via discovery — 2 India / 18 total
'mintel',  // Added via discovery — 2 India / 19 total
'mitratech',  // Added via discovery — 2 India / 18 total
'nitricity',  // Added via discovery — 2 India / 3 total
'northpointtechnology',  // Added via discovery — 2 India / 84 total
'numerix',  // Added via discovery — 2 India / 7 total
'ocrolusinc',  // Added via discovery — 2 India / 11 total
'olivai',  // Added via discovery — 2 India / 2 total
'referralsuseonly',  // Added via discovery — 2 India / 113 total
'rockstargames',  // Added via discovery — 2 India / 57 total
'samainc',  // Added via discovery — 2 India / 3 total
'scaleai',  // Added via discovery — 2 India / 227 total
'selling',  // Added via discovery — 2 India / 2 total
'singlestore-linkedin',  // Added via discovery — 2 India / 12 total
'storable',  // Added via discovery — 2 India / 16 total
'stratainformationgroup',  // Added via discovery — 2 India / 11 total
'studycareers',  // Added via discovery — 2 India / 8 total
'synerg',  // Added via discovery — 2 India / 38 total
'systemiq',  // Added via discovery — 2 India / 23 total
'thetradedesk',  // Added via discovery — 2 India / 126 total
'triplelift',  // Added via discovery — 2 India / 32 total
'turing',  // Added via discovery — 2 India / 19 total
'venturatravel',  // Added via discovery — 2 India / 32 total
'veramed',  // Added via discovery — 2 India / 9 total
'verve',  // Added via discovery — 2 India / 58 total
'wk',  // Added via discovery — 2 India / 15 total
'acutechgroupinc',  // Added via discovery — 1 India / 12 total
'adjustjobs',  // Added via discovery — 1 India / 24 total
'affinidi',  // Added via discovery — 1 India / 10 total
'agilisys',  // Added via discovery — 1 India / 5 total
'aiven36',  // Added via discovery — 1 India / 37 total
'ajboggs',  // Added via discovery — 1 India / 6 total
'akqa',  // Added via discovery — 1 India / 41 total
'alpaca',  // Added via discovery — 1 India / 67 total
'anydesk',  // Added via discovery — 1 India / 11 total
'aottechnologies',  // Added via discovery — 1 India / 8 total
'aptportfolio',  // Added via discovery — 1 India / 1 total
'b12',  // Added via discovery — 1 India / 4 total
'biorasillc',  // Added via discovery — 1 India / 1 total
'boomilp',  // Added via discovery — 1 India / 28 total
'brave',  // Added via discovery — 1 India / 16 total
'bryantparkconsulting',  // Added via discovery — 1 India / 12 total
'buzzfeed',  // Added via discovery — 1 India / 5 total
'cambridgemobiletelematics',  // Added via discovery — 1 India / 14 total
'carrotfertility',  // Added via discovery — 1 India / 15 total
'catawiki',  // Added via discovery — 1 India / 43 total
'clariness',  // Added via discovery — 1 India / 34 total
'coefficient',  // Added via discovery — 1 India / 6 total
'coeo',  // Added via discovery — 1 India / 3 total
'contentstack',  // Added via discovery — 1 India / 4 total
'convoso',  // Added via discovery — 1 India / 4 total
'conviva',  // Added via discovery — 1 India / 8 total
'crewmeister',  // Added via discovery — 1 India / 4 total
'currentglobal',  // Added via discovery — 1 India / 1 total
'davinciderivatives',  // Added via discovery — 1 India / 14 total
'dotmatics',  // Added via discovery — 1 India / 29 total
'ebanx',  // Added via discovery — 1 India / 34 total
'edgeconnex',  // Added via discovery — 1 India / 19 total
'epickids',  // Added via discovery — 1 India / 6 total
'eqtpartners',  // Added via discovery — 1 India / 25 total
'eulerity',  // Added via discovery — 1 India / 16 total
'evolver',  // Added via discovery — 1 India / 18 total
'extenteam',  // Added via discovery — 1 India / 20 total
'fieldwire',  // Added via discovery — 1 India / 24 total
'feverup',  // Added via discovery — 1 India / 607 total
'financialtechnologypartners',  // Added via discovery — 1 India / 24 total
'formativgroup',  // Added via discovery — 1 India / 21 total
'fosphamarketing',  // Added via discovery — 1 India / 11 total
'genscript',  // Added via discovery — 1 India / 81 total
'grafanalabs',  // Added via discovery — 1 India / 117 total
'hightouch',  // Added via discovery — 1 India / 83 total
'high-volume',  // Added via discovery — 1 India / 173 total
'hootsuite',  // Added via discovery — 1 India / 18 total
'hostanalytics',  // Added via discovery — 1 India / 12 total
'hubspotjobs',  // Added via discovery — 1 India / 139 total
'hudlindia',  // Added via discovery — 1 India / 1 total
'ibuglobal',  // Added via discovery — 1 India / 1 total
'imcsandbox33',  // Added via discovery — 1 India / 8 total
'impinjexternal',  // Added via discovery — 1 India / 19 total
'invgate',  // Added via discovery — 1 India / 11 total
'invisibletech',  // Added via discovery — 1 India / 15 total
'itd',  // Added via discovery — 1 India / 28 total
'just-global',  // Added via discovery — 1 India / 5 total
'knit',  // Added via discovery — 1 India / 12 total
'leapwork',  // Added via discovery — 1 India / 3 total
'learneo',  // Added via discovery — 1 India / 1 total
'lighthouse',  // Added via discovery — 1 India / 53 total
'mastercontrol',  // Added via discovery — 1 India / 9 total
'merqube',  // Added via discovery — 1 India / 3 total
'newsweek',  // Added via discovery — 1 India / 18 total
'nirmata',  // Added via discovery — 1 India / 2 total
'nothing',  // Added via discovery — 1 India / 10 total
'onarchipelago',  // Added via discovery — 1 India / 3 total
'opentable',  // Added via discovery — 1 India / 113 total
'orcasecurity',  // Added via discovery — 1 India / 8 total
'ownwell',  // Added via discovery — 1 India / 14 total
'pippintitleindia',  // Added via discovery — 1 India / 1 total
'pistontechnologies',  // Added via discovery — 1 India / 17 total
'pointwild',  // Added via discovery — 1 India / 16 total
'quillbot',  // Added via discovery — 1 India / 1 total
'remotepeople',  // Added via discovery — 1 India / 16 total
'sandler',  // Added via discovery — 1 India / 1 total
'sercante',  // Added via discovery — 1 India / 3 total
'shipbobinc',  // Added via discovery — 1 India / 63 total
'shorelightllc',  // Added via discovery — 1 India / 3 total
'simplisafe',  // Added via discovery — 1 India / 45 total
'smartlyio',  // Added via discovery — 1 India / 79 total
'sonatus',  // Added via discovery — 1 India / 23 total
'spinnakersupport',  // Added via discovery — 1 India / 5 total
'stemhealthcare',  // Added via discovery — 1 India / 7 total
'striiminc',  // Added via discovery — 1 India / 9 total
'timeleft',  // Added via discovery — 1 India / 5 total
'vonage',  // Added via discovery — 1 India / 20 total
'vynamic',  // Added via discovery — 1 India / 14 total
'wallstreetprep',  // Added via discovery — 1 India / 8 total
'wellthy',  // Added via discovery — 1 India / 13 total
'wongdoody',  // Added via discovery — 1 India / 25 total
'xometryeurope',  // Added via discovery — 1 India / 20 total
'xebiaapac',  // Added via discovery — 1 India / 2 total
'yieldmo',  // Added via discovery — 1 India / 1 total
'xendit',  // Added via discovery — 1 India / 31 total

// ── Discovery run 2026-09-15T10:04: verified ≥1 live India job ──
'shubhashrayhousingcareers',  // Added via discovery — 9 India / 9 total
'sagentindia',  // Added via discovery — 6 India / 6 total
'akidointernal',  // Added via discovery — 2 India / 11 total
'astoundcommerce',  // Added via discovery — 2 India / 14 total
'acceleratepeople',  // Added via discovery — 1 India / 2 total
'appviewxall',  // Added via discovery — 1 India / 1 total
'appviewxforwomen',  // Added via discovery — 1 India / 1 total
'frazierdeeter',  // Added via discovery — 1 India / 150 total
'indiareferral',  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:07: verified ≥1 live India job ──
'cclfg',  // Added via discovery — 16 India / 80 total
'quince-careers',  // Added via discovery — 4 India / 7 total
'axiad',  // Added via discovery — 3 India / 8 total
'beaconfunding',  // Added via discovery — 2 India / 6 total
'greenwaveradios',  // Added via discovery — 2 India / 8 total
'quantiq',  // Added via discovery — 2 India / 11 total
'bgbx',  // Added via discovery — 1 India / 36 total
'rhythmx-ai',  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:12: verified ≥1 live India job ──
'tegnaindia',  // Added via discovery — 7 India / 7 total
'storableindia',  // Added via discovery — 1 India / 1 total
];

export { companyBoardTokens };
