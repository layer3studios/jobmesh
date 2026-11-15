// FILE: src/CompanyConfig/smartrecruiters-companies.js
// The SmartRecruiters company identifiers this scraper walks. Split out of
// smartRecruitersConfig.js (section 2).

// ─── Company identifiers ──────────────────────────────────────────────
// Feed URL: https://api.smartrecruiters.com/v1/companies/{id}/postings
// To verify: hit
//   https://api.smartrecruiters.com/v1/companies/{ID}/postings?country=in&limit=1
// If totalFound > 0 and HTTP 200, add it.
//
// To find new ones: visit careers.smartrecruiters.com/{id} in a browser.
const companyIdentifiers = [
        // ─── BIG ENTERPRISE (known India offices, high volume) ──────────
        'BoschGroup',          // Bosch India (Bangalore, Pune, Coimbatore)
        'ServiceNow',          // Hyderabad office
        'Visa',                // Bangalore office
        'LinkedIn3',           // LinkedIn India
        'SIXT',                // India tech center
        'Endava',              // DACH + India delivery

        // ─── INDIAN COMPANIES on SmartRecruiters ────────────────────────
        'TechMahindraLtd1',    // Tech Mahindra
        'WNSGlobalServices144', // WNS (Mumbai, Pune, Bangalore)
        'T-SystemsICTIndiaPvtLtd1', // T-Systems India

        // ─── MID-SIZE (10-50 India jobs each) ──────────────────────────
        'StepStoneGroup',      // Some India roles
        'ifs1',                // Enterprise software, India engineering
        'Flink3',              // Some India remote roles
        'ecovadis',            // India office

        // ─── ADDITIONAL (low-volume but worth keeping) ─────────────────
        'aboutyougmbh',        // Remote roles open to India
        'ScalableGmbH',        // Scalable Capital, some India roles
        'smartrecruiters',     // SR's own India engineering
        'Meta1',               // Meta India roles
        'alten',               // Alten India engineering
        'Bosch-HomeComfort',   // Bosch subsidiary India

        // ─── Add more here as you find them ─────────────────────────────
        'AtlassianCareers',
'canva',
'ubisoft',
'Zurich5',
'PublicisGroupe',
'Publicis-Sapient',
'PublicisSapient1',
'Sanofi5',
'DeutscheBank2',
'CommerzbankAG',
'AllianzGroup',
'AXA',
'ING',
'Zurich',
'JLL2',
'HSBC',
'StandardChartered',
'BarclaysBank',
'DeutscheTelekomAG',
'Ericsson2',
'NokiaSolutions',
'Nokia',
'Ubisoft',
'ubi',
'Bosch-HomeAppliances',
'Bosch-Automotive',
'BoschRexroth',
'JobsatBAT',
'BritishAmericanTobacco',
'GetYourGuide',
'Delivery-Hero1',
'MediaSaturn',
'MediaMarktSaturn',
'Zalando1',
'HelloFresh',
'AboutYou',
'AboutYouGmbH',
'Personio1',
'HotelBeds',
'Trivago',
'Booking',
'BookingHoldings',
'BasfSE',
'BASF',
'Continental6',
'Heidelberg',
'HeidelbergCement',
'HenkelAG',
'Beiersdorf',
'Adidas1',
'Adidas',
'PumaSE',
'Puma',
'Puma1',
'HugoBoss',
'Zara',
'Inditex',
    
// ── Discovery run 2026-09-15: verified ≥1 live India job ──
'adeebaeservicespvtltd',  // Added via discovery — 23795 India / 23795 total
'EndeavorITSolution',  // Added via discovery — 8476 India / 8476 total
'WebleeTechnologies',  // Added via discovery — 3861 India / 3861 total
'SQUIRCLEITCONSULTINGSERVICESPVTLTD',  // Added via discovery — 1782 India / 1782 total
'AccorHotel',  // Added via discovery — 724 India / 724 total
'nagarro1',  // Added via discovery — 476 India / 476 total
'oceanStarShips',  // Added via discovery — 462 India / 462 total
'aecom2',  // Added via discovery — 352 India / 352 total
'eurofins',  // Added via discovery — 332 India / 332 total
'AarnaHRSolutionsPvtLtd',  // Added via discovery — 315 India / 315 total
'jobsforhumanity',  // Added via discovery — 290 India / 290 total
'FiniteHRConsulting',  // Added via discovery — 249 India / 249 total
'taurushardsoftsolutionspvtltd',  // Added via discovery — 213 India / 213 total
'EgisGroup',  // Added via discovery — 211 India / 211 total
'assystem',  // Added via discovery — 186 India / 186 total
'oceanstarshipscom',  // Added via discovery — 165 India / 165 total
'jobnath',  // Added via discovery — 162 India / 162 total
'bringleexcellence',  // Added via discovery — 158 India / 158 total
'linuxbeansolutionpvtltd',  // Added via discovery — 145 India / 145 total
'renesaselectronics',  // Added via discovery — 145 India / 145 total
'RHG',  // Added via discovery — 130 India / 130 total
'turnertownsend',  // Added via discovery — 128 India / 128 total
'wabtec',  // Added via discovery — 112 India / 112 total
'HMGroup',  // Added via discovery — 109 India / 109 total
'SopraSteria1',  // Added via discovery — 107 India / 107 total
'ramboll3',  // Added via discovery — 96 India / 96 total
'swiggy',  // Added via discovery — 82 India / 82 total
'AccorCorpo',  // Added via discovery — 74 India / 74 total
'altisource',  // Added via discovery — 72 India / 72 total
'mattelinc',  // Added via discovery — 71 India / 71 total
'sandisk',  // Added via discovery — 71 India / 71 total
'VeoliaEnvironnementSA',  // Added via discovery — 71 India / 71 total
'qima',  // Added via discovery — 66 India / 66 total
'Intersoftkk1',  // Added via discovery — 65 India / 65 total
'Konecranes',  // Added via discovery — 63 India / 63 total
'SikaAG',  // Added via discovery — 63 India / 63 total
'miratech1',  // Added via discovery — 61 India / 61 total
'intuitive',  // Added via discovery — 60 India / 60 total
'metromakro',  // Added via discovery — 56 India / 56 total
'thenielsencompany',  // Added via discovery — 55 India / 55 total
'msxinternational',  // Added via discovery — 54 India / 54 total
'drreddyslaboratorieslimited',  // Added via discovery — 53 India / 53 total
'nielseniq',  // Added via discovery — 53 India / 53 total
'sutherland',  // Added via discovery — 53 India / 53 total
'continental',  // Added via discovery — 50 India / 50 total
'experian',  // Added via discovery — 48 India / 48 total
'necsws',  // Added via discovery — 47 India / 47 total
'smithsgroup2',  // Added via discovery — 46 India / 46 total
'freshworks',  // Added via discovery — 40 India / 40 total
'Wise',  // Added via discovery — 40 India / 40 total
'enviricorporation',  // Added via discovery — 38 India / 38 total
'Colliers1',  // Added via discovery — 38 India / 38 total
'huaweitechnologies2',  // Added via discovery — 34 India / 34 total
'Tieto2',  // Added via discovery — 33 India / 33 total
'ph7',  // Added via discovery — 33 India / 33 total
'CheckPointSoftwareTechnologies2',  // Added via discovery — 31 India / 31 total
'RootshellEnterpriseTechnologies',  // Added via discovery — 31 India / 31 total
'averydennison',  // Added via discovery — 30 India / 30 total
'qadinc',  // Added via discovery — 30 India / 30 total
'version1',  // Added via discovery — 30 India / 30 total
'vams',  // Added via discovery — 28 India / 28 total
'SyngentaGroup',  // Added via discovery — 27 India / 27 total
'aristanetworks',  // Added via discovery — 26 India / 26 total
'eversana1',  // Added via discovery — 26 India / 26 total
'ContinentalGroupSectorContiTech',  // Added via discovery — 26 India / 26 total
'afry',  // Added via discovery — 25 India / 25 total
'aumovio',  // Added via discovery — 25 India / 25 total
'sia',  // Added via discovery — 25 India / 25 total
'AarnaHRSolutions1',  // Added via discovery — 25 India / 25 total
'JAGSAR',  // Added via discovery — 24 India / 24 total
'rexel1',  // Added via discovery — 22 India / 22 total
'sgs',  // Added via discovery — 22 India / 22 total
'IQEQ',  // Added via discovery — 21 India / 21 total
'OutpostVFX',  // Added via discovery — 20 India / 20 total
'informagroupplc',  // Added via discovery — 18 India / 18 total
'avaloq1',  // Added via discovery — 17 India / 17 total
'axiado',  // Added via discovery — 17 India / 17 total
'FacilityPerformanceConsultingLimited',  // Added via discovery — 17 India / 17 total
'betsol',  // Added via discovery — 16 India / 16 total
'blend360',  // Added via discovery — 16 India / 16 total
'joveosandbox',  // Added via discovery — 16 India / 16 total
'IdeafarmsAUnitOfConfidignSolutio',  // Added via discovery — 16 India / 16 total
'tapi',  // Added via discovery — 15 India / 15 total
'abbvie',  // Added via discovery — 14 India / 14 total
'allegisglobalsolutions',  // Added via discovery — 13 India / 13 total
'louisdreyfuscompany',  // Added via discovery — 13 India / 13 total
'nexthink',  // Added via discovery — 13 India / 13 total
'applusidiada1',  // Added via discovery — 12 India / 12 total
'sectigo',  // Added via discovery — 12 India / 12 total
'MicroStrategy1',  // Added via discovery — 12 India / 12 total
'SeniorPlc1',  // Added via discovery — 12 India / 12 total
'intuit2',  // Added via discovery — 11 India / 11 total
'SibzSolutions',  // Added via discovery — 11 India / 11 total
'ienergizeritservicespvtltd',  // Added via discovery — 10 India / 10 total
'infracloud',  // Added via discovery — 10 India / 10 total
'liftedanupworkcompany',  // Added via discovery — 10 India / 10 total
'ra2',  // Added via discovery — 10 India / 10 total
'shreevenkateshfilmspvtltd',  // Added via discovery — 10 India / 10 total
'GenZSRecruitmentSolutions',  // Added via discovery — 10 India / 10 total
'Acedezines',  // Added via discovery — 10 India / 10 total
'CRUX1',  // Added via discovery — 10 India / 10 total
'EndeavorItSolutionsPvtLtd1',  // Added via discovery — 10 India / 10 total
'KoiReaderTechnologies',  // Added via discovery — 10 India / 10 total
'Onedirect1',  // Added via discovery — 10 India / 10 total
'ParkhyaSolutionsPvtLtd',  // Added via discovery — 10 India / 10 total
'PrometteurSolutionsPvtLtd',  // Added via discovery — 10 India / 10 total
'RaksITSolutionsPvtLtd',  // Added via discovery — 10 India / 10 total
'StarClinch',  // Added via discovery — 10 India / 10 total
'TRSFormsServicesPvtLtd',  // Added via discovery — 10 India / 10 total
'VivifyHealthcarePvtLtd',  // Added via discovery — 10 India / 10 total
'Vroutes',  // Added via discovery — 10 India / 10 total
'ib-vogt-GmbH',  // Added via discovery — 10 India / 10 total
'brainwonders',  // Added via discovery — 9 India / 9 total
'cielo2',  // Added via discovery — 9 India / 9 total
'm3usa',  // Added via discovery — 9 India / 9 total
'mindtickle',  // Added via discovery — 9 India / 9 total
'mountfitchetgroup',  // Added via discovery — 9 India / 9 total
'Believe',  // Added via discovery — 9 India / 9 total
'ParkerDrilling1',  // Added via discovery — 9 India / 9 total
'Jitterbit',  // Added via discovery — 9 India / 9 total
'HungryBirdResources1',  // Added via discovery — 9 India / 9 total
'Increasingly',  // Added via discovery — 9 India / 9 total
'Lokal',  // Added via discovery — 9 India / 9 total
'Markeeterscom',  // Added via discovery — 9 India / 9 total
'PentozTechnology',  // Added via discovery — 9 India / 9 total
'TalentAnywhere1',  // Added via discovery — 9 India / 9 total
'Techmagnate',  // Added via discovery — 9 India / 9 total
'Vegrow',  // Added via discovery — 9 India / 9 total
'skillate',  // Added via discovery — 9 India / 9 total
'cieloprojects',  // Added via discovery — 8 India / 8 total
'kredx',  // Added via discovery — 8 India / 8 total
'playtolabs',  // Added via discovery — 8 India / 8 total
'rotork1',  // Added via discovery — 8 India / 8 total
'umdaschgroup',  // Added via discovery — 8 India / 8 total
'AntonPaar1',  // Added via discovery — 8 India / 8 total
'CrabsAssociatesPrivateLimited',  // Added via discovery — 8 India / 8 total
'fusionconsulting',  // Added via discovery — 8 India / 8 total
'IntegriChain1',  // Added via discovery — 8 India / 8 total
'ixigo',  // Added via discovery — 8 India / 8 total
'maskoidtechnologies',  // Added via discovery — 8 India / 8 total
'AltenCalsoftLabs1',  // Added via discovery — 8 India / 8 total
'DConsumerISolutions',  // Added via discovery — 8 India / 8 total
'ICore3',  // Added via discovery — 8 India / 8 total
'InstaTalentRecruitLLP1',  // Added via discovery — 8 India / 8 total
'MovingWallsIndiaPvtLtd',  // Added via discovery — 8 India / 8 total
'WCube',  // Added via discovery — 8 India / 8 total
'acigroup',  // Added via discovery — 7 India / 7 total
'assent',  // Added via discovery — 7 India / 7 total
'grab',  // Added via discovery — 7 India / 7 total
'hashtagtalent',  // Added via discovery — 7 India / 7 total
'AMOLTECHNOLOGIES',  // Added via discovery — 7 India / 7 total
'CliffordChance',  // Added via discovery — 7 India / 7 total
'DevelopeanConsultancyServices',  // Added via discovery — 7 India / 7 total
'EProInc',  // Added via discovery — 7 India / 7 total
'GetMyUni',  // Added via discovery — 7 India / 7 total
'KITSPvtLtd',  // Added via discovery — 7 India / 7 total
'KarmickSolutionsPvtLtd',  // Added via discovery — 7 India / 7 total
'MastersIndiaPrivateLimited',  // Added via discovery — 7 India / 7 total
'NitorInfotech1',  // Added via discovery — 7 India / 7 total
'QuantAIs',  // Added via discovery — 7 India / 7 total
'RSConsultants',  // Added via discovery — 7 India / 7 total
'Vyaparin',  // Added via discovery — 7 India / 7 total
'mercermettl',  // Added via discovery — 7 India / 7 total
'quantazone',  // Added via discovery — 7 India / 7 total
'flywire1',  // Added via discovery — 6 India / 6 total
'gerresheimer',  // Added via discovery — 6 India / 6 total
'hitachisolutions',  // Added via discovery — 6 India / 6 total
'sensia',  // Added via discovery — 6 India / 6 total
'techvedika',  // Added via discovery — 6 India / 6 total
'BeamStacks',  // Added via discovery — 6 India / 6 total
'CorporateRecruiters2',  // Added via discovery — 6 India / 6 total
'Fastjobsio1',  // Added via discovery — 6 India / 6 total
'JindalBiotechPrivateLimited',  // Added via discovery — 6 India / 6 total
'Jobsbridge1',  // Added via discovery — 6 India / 6 total
'demandmatrix',  // Added via discovery — 6 India / 6 total
'adobe1',  // Added via discovery — 5 India / 5 total
'btranz',  // Added via discovery — 5 India / 5 total
'collabera2',  // Added via discovery — 5 India / 5 total
'datazymes',  // Added via discovery — 5 India / 5 total
'ghobashgroup',  // Added via discovery — 5 India / 5 total
'hackerrank',  // Added via discovery — 5 India / 5 total
'psicro',  // Added via discovery — 5 India / 5 total
'rolandassociates',  // Added via discovery — 5 India / 5 total
'telefonicatech',  // Added via discovery — 5 India / 5 total
'texau',  // Added via discovery — 5 India / 5 total
'BEUMERGroup1',  // Added via discovery — 5 India / 5 total
'SYNTEGON',  // Added via discovery — 5 India / 5 total
'AutonomIQ',  // Added via discovery — 5 India / 5 total
'CustomizedEnergySolutions',  // Added via discovery — 5 India / 5 total
'HappiestMindsTechnologies1',  // Added via discovery — 5 India / 5 total
'SaraInfowayin',  // Added via discovery — 5 India / 5 total
'shipsy',  // Added via discovery — 5 India / 5 total
'blueoptima',  // Added via discovery — 4 India / 4 total
'cermaticom',  // Added via discovery — 4 India / 4 total
'dev2',  // Added via discovery — 4 India / 4 total
'VVents',  // Added via discovery — 4 India / 4 total
'AppliedCloudComputing',  // Added via discovery — 4 India / 4 total
'CarmatecITSolutions1',  // Added via discovery — 4 India / 4 total
'Contxtio',  // Added via discovery — 4 India / 4 total
'GroupeCanam',  // Added via discovery — 4 India / 4 total
'NewPageSolutionsInc',  // Added via discovery — 4 India / 4 total
'Petsfolio2',  // Added via discovery — 4 India / 4 total
'Techjockeycom',  // Added via discovery — 4 India / 4 total
'irissoftware',  // Added via discovery — 4 India / 4 total
'worldhealthpartners',  // Added via discovery — 4 India / 4 total
'interviewkickstart',  // Added via discovery — 3 India / 3 total
'inventureacademy',  // Added via discovery — 3 India / 3 total
'jsheldllc',  // Added via discovery — 3 India / 3 total
'kimohatechnologies',  // Added via discovery — 3 India / 3 total
'oetiker',  // Added via discovery — 3 India / 3 total
'tssconsultancypvtltd',  // Added via discovery — 3 India / 3 total
'ubisoft2',  // Added via discovery — 3 India / 3 total
'vernacularai',  // Added via discovery — 3 India / 3 total
'xplor',  // Added via discovery — 3 India / 3 total
'AireSpring1',  // Added via discovery — 3 India / 3 total
'Ergomed',  // Added via discovery — 3 India / 3 total
'Luceats',  // Added via discovery — 3 India / 3 total
'Shippeo',  // Added via discovery — 3 India / 3 total
'Wizikey',  // Added via discovery — 3 India / 3 total
'IMarketManage',  // Added via discovery — 3 India / 3 total
'InviaPrivateLimited',  // Added via discovery — 3 India / 3 total
'MigrateCorp',  // Added via discovery — 3 India / 3 total
'PetroBotTechnologiesPvtLtd',  // Added via discovery — 3 India / 3 total
'PrayagHealth',  // Added via discovery — 3 India / 3 total
'PrepSmarterInc',  // Added via discovery — 3 India / 3 total
'STAGECatchUpTechnologiesPvtLtd',  // Added via discovery — 3 India / 3 total
'STICSoftSolutions',  // Added via discovery — 3 India / 3 total
'SalesboxAi',  // Added via discovery — 3 India / 3 total
'SimplonaSolutions1',  // Added via discovery — 3 India / 3 total
'StemXpert1',  // Added via discovery — 3 India / 3 total
'TokyoTechie',  // Added via discovery — 3 India / 3 total
'amazaticsolutions',  // Added via discovery — 3 India / 3 total
'crosschq',  // Added via discovery — 3 India / 3 total
'purplerain',  // Added via discovery — 3 India / 3 total
'techfayainnovationspvtltd',  // Added via discovery — 3 India / 3 total
'unacademy',  // Added via discovery — 3 India / 3 total
'acumatica',  // Added via discovery — 2 India / 2 total
'cint',  // Added via discovery — 2 India / 2 total
'expeditors',  // Added via discovery — 2 India / 2 total
'integratedresourcesinc',  // Added via discovery — 2 India / 2 total
'keenfinity',  // Added via discovery — 2 India / 2 total
'kombo',  // Added via discovery — 2 India / 2 total
'massiverocket',  // Added via discovery — 2 India / 2 total
'mirantis',  // Added via discovery — 2 India / 2 total
'mitresource',  // Added via discovery — 2 India / 2 total
'redicasystems',  // Added via discovery — 2 India / 2 total
'staubligroup',  // Added via discovery — 2 India / 2 total
'swgroup',  // Added via discovery — 2 India / 2 total
'xppower2',  // Added via discovery — 2 India / 2 total
'zinierinc',  // Added via discovery — 2 India / 2 total
'Entain',  // Added via discovery — 2 India / 2 total
'HuskPowerSystems',  // Added via discovery — 2 India / 2 total
'Pirsonal',  // Added via discovery — 2 India / 2 total
'RedBull',  // Added via discovery — 2 India / 2 total
'UnifyDots',  // Added via discovery — 2 India / 2 total
'AccionLabs',  // Added via discovery — 2 India / 2 total
'BestLessTravelPtyLTd',  // Added via discovery — 2 India / 2 total
'BigBinary',  // Added via discovery — 2 India / 2 total
'CharterGlobal4',  // Added via discovery — 2 India / 2 total
'DhanesvariCommoditiesPvtLtd',  // Added via discovery — 2 India / 2 total
'Hortonworks2',  // Added via discovery — 2 India / 2 total
'InfowayGroup',  // Added via discovery — 2 India / 2 total
'Insidea1',  // Added via discovery — 2 India / 2 total
'Lesaffre',  // Added via discovery — 2 India / 2 total
'PayReview',  // Added via discovery — 2 India / 2 total
'TelliantSystemsIndiaPrivateLimited',  // Added via discovery — 2 India / 2 total
'ThinkBizTechnologyPvtLtd',  // Added via discovery — 2 India / 2 total
'UtilityHubIndiaLLP',  // Added via discovery — 2 India / 2 total
'VantageOrganicFoodsPvtLtd',  // Added via discovery — 2 India / 2 total
'Winbold',  // Added via discovery — 2 India / 2 total
'WitmatesTechnologiesPvtLtd',  // Added via discovery — 2 India / 2 total
'metroguild',  // Added via discovery — 2 India / 2 total
'systemCanadaTechnologies',  // Added via discovery — 2 India / 2 total
'NoBroker',  // Added via discovery — 1 India / 1 total
'archirodongroup',  // Added via discovery — 1 India / 1 total
'cars24',  // Added via discovery — 1 India / 1 total
'coface',  // Added via discovery — 1 India / 1 total
'e2',  // Added via discovery — 1 India / 1 total
'esourcecorp',  // Added via discovery — 1 India / 1 total
'exinity',  // Added via discovery — 1 India / 1 total
'hireright1',  // Added via discovery — 1 India / 1 total
'idiq',  // Added via discovery — 1 India / 1 total
'indsoftinc',  // Added via discovery — 1 India / 1 total
'krgtechnologyinc',  // Added via discovery — 1 India / 1 total
'loginext',  // Added via discovery — 1 India / 1 total
'mindlance2',  // Added via discovery — 1 India / 1 total
'movingpicturecompany',  // Added via discovery — 1 India / 1 total
'procdna',  // Added via discovery — 1 India / 1 total
'repurposeglobal',  // Added via discovery — 1 India / 1 total
'socure',  // Added via discovery — 1 India / 1 total
'stackone',  // Added via discovery — 1 India / 1 total
'sutherland1',  // Added via discovery — 1 India / 1 total
'triipme',  // Added via discovery — 1 India / 1 total
'usm2',  // Added via discovery — 1 India / 1 total
'vamsystems',  // Added via discovery — 1 India / 1 total
'westerndigital',  // Added via discovery — 1 India / 1 total
'zomato1',  // Added via discovery — 1 India / 1 total
'AbhiBus',  // Added via discovery — 1 India / 1 total
'Averna1',  // Added via discovery — 1 India / 1 total
'CAVISTA',  // Added via discovery — 1 India / 1 total
'EdviconInternational',  // Added via discovery — 1 India / 1 total
'InterIKEAGroup',  // Added via discovery — 1 India / 1 total
'KIABI',  // Added via discovery — 1 India / 1 total
'somfygroup',  // Added via discovery — 1 India / 1 total
'TeamworkCorporate',  // Added via discovery — 1 India / 1 total
'Veremark',  // Added via discovery — 1 India / 1 total
'EtihadAirways5',  // Added via discovery — 1 India / 1 total
'LVMH2',  // Added via discovery — 1 India / 1 total
'Silvaco1',  // Added via discovery — 1 India / 1 total
'360ITProfessionals1',  // Added via discovery — 1 India / 1 total
'31west',  // Added via discovery — 1 India / 1 total
'AskITConsulting',  // Added via discovery — 1 India / 1 total
'Assembly1',  // Added via discovery — 1 India / 1 total
'AvanceConsultingServices2',  // Added via discovery — 1 India / 1 total
'ChabezTech',  // Added via discovery — 1 India / 1 total
'DataKrewPvtLtd',  // Added via discovery — 1 India / 1 total
'DigitalCrew1',  // Added via discovery — 1 India / 1 total
'GrantekSystemsIntegration',  // Added via discovery — 1 India / 1 total
'HeliozSolutionsINC',  // Added via discovery — 1 India / 1 total
'IGRAFTGLOBALHAIRSERVICESPVTLTD2',  // Added via discovery — 1 India / 1 total
'IGNITECHANGECONSULTANCY-FZCO',  // Added via discovery — 1 India / 1 total
'InfojiniInc1',  // Added via discovery — 1 India / 1 total
'LanceSoftInc2',  // Added via discovery — 1 India / 1 total
'LovCash',  // Added via discovery — 1 India / 1 total
'M3BI',  // Added via discovery — 1 India / 1 total
'MCSAMPvtLtd',  // Added via discovery — 1 India / 1 total
'MitajaCorporation1',  // Added via discovery — 1 India / 1 total
'NetSoftersLLP',  // Added via discovery — 1 India / 1 total
'Ollion',  // Added via discovery — 1 India / 1 total
'PramiraInc',  // Added via discovery — 1 India / 1 total
'Primark',  // Added via discovery — 1 India / 1 total
'RightMatchHRServicesPvtLtd',  // Added via discovery — 1 India / 1 total
'RoxilerSystemsPvtLtd',  // Added via discovery — 1 India / 1 total
'SaxonGlobal',  // Added via discovery — 1 India / 1 total
'SoulOfPlutoTechLLP',  // Added via discovery — 1 India / 1 total
'SpinOnWebPvtLtd',  // Added via discovery — 1 India / 1 total
'SpinOnWebPvtLtd1',  // Added via discovery — 1 India / 1 total
'TecTammina',  // Added via discovery — 1 India / 1 total
'TechspawnSolutionsPrivateLimited',  // Added via discovery — 1 India / 1 total
'USITSolutionsInc',  // Added via discovery — 1 India / 1 total
'USTechSolutions2',  // Added via discovery — 1 India / 1 total
'bebo',  // Added via discovery — 1 India / 1 total
'bytedance',  // Added via discovery — 1 India / 1 total
'ellicium',  // Added via discovery — 1 India / 1 total
'freecharge',  // Added via discovery — 1 India / 1 total
'modernloop',  // Added via discovery — 1 India / 1 total
'nimblechapps',  // Added via discovery — 1 India / 1 total
'picsart',  // Added via discovery — 1 India / 1 total
'pramata',  // Added via discovery — 1 India / 1 total
'rockyou',  // Added via discovery — 1 India / 1 total
'vimana',  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:04: verified ≥1 live India job ──
'CapitalAimFinancialAdvisoryPvtLtd',  // Added via discovery — 474 India / 474 total
'Connectionphase',  // Added via discovery — 97 India / 97 total
'BlueberryLabsPrivateLimited',  // Added via discovery — 91 India / 91 total
'anteelo',  // Added via discovery — 10 India / 10 total
'Ateeca',  // Added via discovery — 10 India / 10 total
'CamiAI',  // Added via discovery — 10 India / 10 total
'consultadd4',  // Added via discovery — 10 India / 10 total
'AjitVidialaySenSecSchool',  // Added via discovery — 9 India / 9 total
'Ally-eXecutiveHRConsulting',  // Added via discovery — 9 India / 9 total
'AltruistTechnologiesPvtLtd1',  // Added via discovery — 8 India / 8 total
'AriseSoftwareSolutions',  // Added via discovery — 8 India / 8 total
'BerryWorks',  // Added via discovery — 7 India / 7 total
'AahanQuickgharInfratechPvtLtd',  // Added via discovery — 6 India / 6 total
'BlurbpointMedia',  // Added via discovery — 6 India / 6 total
'caseyfoodsopcprivatelimited',  // Added via discovery — 6 India / 6 total
'Infasta',  // Added via discovery — 5 India / 5 total
'BlockDeliver',  // Added via discovery — 5 India / 5 total
'CogitateTechnology',  // Added via discovery — 5 India / 5 total
'AddonSolutionsPvtLtd',  // Added via discovery — 4 India / 4 total
'Ally1',  // Added via discovery — 4 India / 4 total
'CaptainFresh',  // Added via discovery — 4 India / 4 total
'CompanyX3',  // Added via discovery — 4 India / 4 total
'EclickSoftwaresAndSolutionsPvtLtd',  // Added via discovery — 3 India / 3 total
'AnikaInternational',  // Added via discovery — 3 India / 3 total
'CairnMartin',  // Added via discovery — 3 India / 3 total
'AcrocedeTechnology',  // Added via discovery — 2 India / 2 total
'Attain1',  // Added via discovery — 2 India / 2 total
'BusinessIntegra1',  // Added via discovery — 2 India / 2 total
'ComputechCorporation1',  // Added via discovery — 2 India / 2 total
'CoralFuture',  // Added via discovery — 2 India / 2 total
'CypressGlobalServicesInc',  // Added via discovery — 2 India / 2 total
'toplegal',  // Added via discovery — 1 India / 1 total
'AcrobyteTechnologies',  // Added via discovery — 1 India / 1 total
'AnalyzeData',  // Added via discovery — 1 India / 1 total
'ANTECHMICROSYSTEMSPLTD',  // Added via discovery — 1 India / 1 total
'ApertumOnlinePvtLtd',  // Added via discovery — 1 India / 1 total
'AppnowTechnologies',  // Added via discovery — 1 India / 1 total
'AVrecruit',  // Added via discovery — 1 India / 1 total
'AXISCADESENGINEERINGTECHNOLOGIESLIMITED',  // Added via discovery — 1 India / 1 total
'BajajAllianzLifeInsurance',  // Added via discovery — 1 India / 1 total
'BetaCraftTechnologies',  // Added via discovery — 1 India / 1 total
'Blinqlabs',  // Added via discovery — 1 India / 1 total
'ByteFum',  // Added via discovery — 1 India / 1 total
'ContractWrangler',  // Added via discovery — 1 India / 1 total
'CrimsonAndCo',  // Added via discovery — 1 India / 1 total
'Crunch2',  // Added via discovery — 1 India / 1 total
'DatamaticsGlobalServicesInc',  // Added via discovery — 1 India / 1 total
'DMI3',  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:07: verified ≥1 live India job ──
'AdeebaEServicesPvtLtd3',  // Added via discovery — 5718 India / 5718 total
'EndeavorITSolution10',  // Added via discovery — 808 India / 808 total
'EndeavorItSolution9',  // Added via discovery — 158 India / 158 total
'LinkTag',  // Added via discovery — 123 India / 123 total
'Etag',  // Added via discovery — 39 India / 39 total
'SanmaxInc',  // Added via discovery — 36 India / 36 total
'divinepixelcodespvtltd',  // Added via discovery — 16 India / 16 total
'SBServiceNow',  // Added via discovery — 11 India / 11 total
'ValuestreamBusinessSolutionsPvtLtd',  // Added via discovery — 10 India / 10 total
'HAMMOQ',  // Added via discovery — 10 India / 10 total
'ProValTechnologies',  // Added via discovery — 10 India / 10 total
'IPrimed',  // Added via discovery — 10 India / 10 total
'ewargames',  // Added via discovery — 10 India / 10 total
'Esyconnect',  // Added via discovery — 10 India / 10 total
'TBMTechnologiesPvtLtd',  // Added via discovery — 10 India / 10 total
'DrReddysFoundation',  // Added via discovery — 9 India / 9 total
'InfiwebTechnologiesPrivateLimited',  // Added via discovery — 8 India / 8 total
'GSBResearchConsulting',  // Added via discovery — 8 India / 8 total
'WisdomleafTechnologies',  // Added via discovery — 8 India / 8 total
'Quantanite',  // Added via discovery — 8 India / 8 total
'XcellenceIT',  // Added via discovery — 8 India / 8 total
'HemitzMediaPvtLtd',  // Added via discovery — 7 India / 7 total
'MicroPyramidInformaticsPvtLtd',  // Added via discovery — 7 India / 7 total
'EnthralltechPrivateLimited',  // Added via discovery — 7 India / 7 total
'EgnifyTechnologies',  // Added via discovery — 7 India / 7 total
'MeeTaaNBusinessSolutionsPvtLtd',  // Added via discovery — 6 India / 6 total
'AcmeCorp091614',  // Added via discovery — 6 India / 6 total
'RMgXTechnologiesLLP',  // Added via discovery — 6 India / 6 total
'RostanTechnoloiges',  // Added via discovery — 6 India / 6 total
'BoringBrandsPrivateLimited',  // Added via discovery — 5 India / 5 total
'RhaegalSandbox',  // Added via discovery — 5 India / 5 total
'RedeConsultingServices',  // Added via discovery — 4 India / 4 total
'SISLInfotechPvtLtd',  // Added via discovery — 4 India / 4 total
'WorldTechnologiesPvtLtd',  // Added via discovery — 4 India / 4 total
'Etag2',  // Added via discovery — 4 India / 4 total
'SemiDotInfotech',  // Added via discovery — 4 India / 4 total
'SkynetSecureSolutions',  // Added via discovery — 4 India / 4 total
'Spalette',  // Added via discovery — 4 India / 4 total
'ZapFinTeknologiesPvtLtdDocBoyz',  // Added via discovery — 3 India / 3 total
'MastersIndiaPrivateLimited1',  // Added via discovery — 3 India / 3 total
'QuantumAsiaPvtLtd',  // Added via discovery — 3 India / 3 total
'AspireSystems1',  // Added via discovery — 3 India / 3 total
'ImpelsysIndiaPrivateLimited',  // Added via discovery — 3 India / 3 total
'AnaxeeDigitalRunnersPrivateLimited',  // Added via discovery — 3 India / 3 total
'ElevateK-12',  // Added via discovery — 3 India / 3 total
'HemitzMediaPvtLtd2',  // Added via discovery — 3 India / 3 total
'JobsForLebanon',  // Added via discovery — 3 India / 3 total
'questglobaltechnologies',  // Added via discovery — 3 India / 3 total
'SiliconCompany',  // Added via discovery — 3 India / 3 total
'SrimatrixInc',  // Added via discovery — 2 India / 2 total
'CognitiveCloudsSoftwarePrivateLimited',  // Added via discovery — 2 India / 2 total
'Edge2',  // Added via discovery — 2 India / 2 total
'EncoreConsulting',  // Added via discovery — 2 India / 2 total
'Fernwehker',  // Added via discovery — 2 India / 2 total
'gamecloudtechnologiespvtltd',  // Added via discovery — 2 India / 2 total
'IncubXpertsTechnoConsultingPvtLtd',  // Added via discovery — 2 India / 2 total
'Infoya',  // Added via discovery — 2 India / 2 total
'InnovaSolutions2',  // Added via discovery — 2 India / 2 total
'lastminutecom',  // Added via discovery — 2 India / 2 total
'Mydilseorg',  // Added via discovery — 2 India / 2 total
'OteemoInc',  // Added via discovery — 2 India / 2 total
'schoolapply',  // Added via discovery — 2 India / 2 total
'Talhive',  // Added via discovery — 2 India / 2 total
'TOPSInfosolutions1',  // Added via discovery — 2 India / 2 total
'ConativeITSolutionsPvtLtd',  // Added via discovery — 1 India / 1 total
'YeasiTechPvtLtd',  // Added via discovery — 1 India / 1 total
'JaseirTechnologiesPrivateLimited',  // Added via discovery — 1 India / 1 total
'DishaNitishTechnologiesPrivateLimited',  // Added via discovery — 1 India / 1 total
'ArnoldConsultingPrivateLimited',  // Added via discovery — 1 India / 1 total
'AarikaProductionsPrivateLimited',  // Added via discovery — 1 India / 1 total
'VoiceocInnovationsPrivateLimited',  // Added via discovery — 1 India / 1 total
'CIELHRServicesPrivateLimited',  // Added via discovery — 1 India / 1 total
'NablasolDigitalServicesPrivateLimited',  // Added via discovery — 1 India / 1 total
'HubiloSoftechPrivateLimited',  // Added via discovery — 1 India / 1 total
'SpectrumArtcommPrivateLimited',  // Added via discovery — 1 India / 1 total
'ShiplystSystemsPrivateLimited',  // Added via discovery — 1 India / 1 total
'MistMindsTechnologiesPrivateLimited',  // Added via discovery — 1 India / 1 total
'TowertalksITesPrivateLimited',  // Added via discovery — 1 India / 1 total
'DattusPrivateLimited1',  // Added via discovery — 1 India / 1 total
'DellInternationalServices',  // Added via discovery — 1 India / 1 total
'GetaaiLabs',  // Added via discovery — 1 India / 1 total
'MerkleInc',  // Added via discovery — 1 India / 1 total
'Promptcloud',  // Added via discovery — 1 India / 1 total
'pullskil1',  // Added via discovery — 1 India / 1 total
'RobertBosch',  // Added via discovery — 1 India / 1 total
'Skillhai',  // Added via discovery — 1 India / 1 total
'SolviosTechnology1',  // Added via discovery — 1 India / 1 total
'Turtlemint',  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:12: verified ≥1 live India job ──
'Guest-tekIndia',  // Added via discovery — 10 India / 10 total
'PramiraTech',  // Added via discovery — 5 India / 5 total
'ZinfyTechWebSolutions',  // Added via discovery — 5 India / 5 total
'NscriptWebStudio',  // Added via discovery — 4 India / 4 total
'AHInfotech',  // Added via discovery — 3 India / 3 total
'BonviveIndiaLimited',  // Added via discovery — 3 India / 3 total
'SynergyMachines',  // Added via discovery — 2 India / 2 total
'YellowClass',  // Added via discovery — 2 India / 2 total
'NopAdvanceLLP',  // Added via discovery — 1 India / 1 total
'FretronPrivateLtd',  // Added via discovery — 1 India / 1 total

// ── Discovery run 2026-09-15T10:36: verified ≥1 live India job ──
'AdeebaEServicesPvtLtd2',  // Added via discovery — 1016 India / 1016 total
'InnoMindTechnologies',  // Added via discovery — 47 India / 47 total
'GSdigitalWebSolutions',  // Added via discovery — 47 India / 47 total
'HighCater',  // Added via discovery — 46 India / 46 total
'EJOBS',  // Added via discovery — 42 India / 42 total
'GHSPtL',  // Added via discovery — 40 India / 40 total
'FiddichConsulting',  // Added via discovery — 36 India / 36 total
'JATGlobalPvtLtd',  // Added via discovery — 26 India / 26 total
'Narmadatech',  // Added via discovery — 26 India / 26 total
'KaaryaConsultingServices',  // Added via discovery — 21 India / 21 total
'OaklandSystemsPvtLtd',  // Added via discovery — 21 India / 21 total
'VizExperts',  // Added via discovery — 19 India / 19 total
'tminetwork2',  // Added via discovery — 19 India / 19 total
'InterviewMaster',  // Added via discovery — 16 India / 16 total
'HrRoll',  // Added via discovery — 14 India / 14 total
'FizzySoftwarePvtLtd',  // Added via discovery — 13 India / 13 total
'VMaxIndiaPvtLtd',  // Added via discovery — 12 India / 12 total
'MountTalentConsulting2',  // Added via discovery — 12 India / 12 total
'Speakwell',  // Added via discovery — 11 India / 11 total
'ExcelGlobalSolutions1',  // Added via discovery — 11 India / 11 total
'VernoinTechnologySolutions',  // Added via discovery — 11 India / 11 total
'LOGOSCORPORATESOLUTIONS',  // Added via discovery — 11 India / 11 total
'24x7PCTechies',  // Added via discovery — 10 India / 10 total
'HGS2',  // Added via discovery — 10 India / 10 total
'AdeebaBPO',  // Added via discovery — 10 India / 10 total
'360HRSERVICES',  // Added via discovery — 10 India / 10 total
'BhartiSoftTechPvtLtd',  // Added via discovery — 10 India / 10 total
'ControlismItSolutionsPvtLtd',  // Added via discovery — 10 India / 10 total
'STRATEGICALLIANCEMANAGEMENTSERVICESPVTLTD',  // Added via discovery — 10 India / 10 total
'Custom-Soft',  // Added via discovery — 10 India / 10 total
'Refyne',  // Added via discovery — 10 India / 10 total
'ZynomTechnologiesPvtLtd',  // Added via discovery — 10 India / 10 total
'MeatMaestroPvtLtd',  // Added via discovery — 10 India / 10 total
'Y-Axis1',  // Added via discovery — 10 India / 10 total
'CaribouMediaPvtLtd',  // Added via discovery — 10 India / 10 total
'Nichetech1',  // Added via discovery — 10 India / 10 total
'VirohaaInternetMedia',  // Added via discovery — 10 India / 10 total
'AnyLinuxWorkPvtLtd',  // Added via discovery — 10 India / 10 total
'MyOwnEcoEnergyPvtLtd1',  // Added via discovery — 10 India / 10 total
'CatenonIndia1',  // Added via discovery — 10 India / 10 total
'ExpertGlobalSolutionsPvtLtd',  // Added via discovery — 9 India / 9 total
'DRecruitmentCompany',  // Added via discovery — 9 India / 9 total
'TechnorizenSoftwareSolution',  // Added via discovery — 9 India / 9 total
'SysToolsSoftwaresPvtLtd',  // Added via discovery — 9 India / 9 total
'EminentLand',  // Added via discovery — 9 India / 9 total
'VolansysTechmnologies',  // Added via discovery — 9 India / 9 total
'CreatingValues',  // Added via discovery — 9 India / 9 total
'MarkTeQ',  // Added via discovery — 9 India / 9 total
'Nexithon',  // Added via discovery — 8 India / 8 total
'MindNudge',  // Added via discovery — 8 India / 8 total
'KGTiger2',  // Added via discovery — 8 India / 8 total
'HRblogging',  // Added via discovery — 8 India / 8 total
'SolwinInfotech',  // Added via discovery — 8 India / 8 total
'ResourceQServices',  // Added via discovery — 8 India / 8 total
'BlueberryDigitalLabs',  // Added via discovery — 8 India / 8 total
'CognitechWebSolutions',  // Added via discovery — 8 India / 8 total
'SquircleITConsultingServices1',  // Added via discovery — 8 India / 8 total
'KPowerManagementServices',  // Added via discovery — 8 India / 8 total
'VreedhiFinancialServices1',  // Added via discovery — 8 India / 8 total
'MenschenConsulting',  // Added via discovery — 8 India / 8 total
'ProconnectConsulting',  // Added via discovery — 8 India / 8 total
'RectitudeWorkforceSolutions',  // Added via discovery — 8 India / 8 total
'Lucideus1',  // Added via discovery — 8 India / 8 total
'Paperstalk',  // Added via discovery — 7 India / 7 total
'StackAvenueTechnologies',  // Added via discovery — 7 India / 7 total
'Catenon2',  // Added via discovery — 7 India / 7 total
'IndiaRush',  // Added via discovery — 7 India / 7 total
'EnjoyTrip',  // Added via discovery — 7 India / 7 total
'AbbieITMartPvtLtd',  // Added via discovery — 7 India / 7 total
'GVPR',  // Added via discovery — 7 India / 7 total
'MCMLProjectsPvtLtd',  // Added via discovery — 7 India / 7 total
'Jupitorconsulting',  // Added via discovery — 6 India / 6 total
'CairnMartinExecutiveSearch',  // Added via discovery — 6 India / 6 total
'GuybroChemicalPLtd1',  // Added via discovery — 6 India / 6 total
'AccusterTechnologiesPvtLtd',  // Added via discovery — 6 India / 6 total
'NeoCredenceConsultancy',  // Added via discovery — 6 India / 6 total
'V-Comply',  // Added via discovery — 6 India / 6 total
'SpringerNature',  // Added via discovery — 6 India / 6 total
'WhimsicalEvents',  // Added via discovery — 6 India / 6 total
'DayInDayOutTechnologiesPvtLtd',  // Added via discovery — 6 India / 6 total
'Hackveda',  // Added via discovery — 6 India / 6 total
'VizzMedia1',  // Added via discovery — 6 India / 6 total
'Indusa',  // Added via discovery — 6 India / 6 total
'SurajTechnologies',  // Added via discovery — 5 India / 5 total
'GeeksRecruiting',  // Added via discovery — 5 India / 5 total
'TwarakInfotechPvtLtd',  // Added via discovery — 5 India / 5 total
'MobisoftTechnologyIndiaPvtLtd',  // Added via discovery — 5 India / 5 total
'HuptechConsultancyServices1',  // Added via discovery — 5 India / 5 total
'RajyugITSolutionsPvtLtd',  // Added via discovery — 5 India / 5 total
'KnackStudios',  // Added via discovery — 5 India / 5 total
'GPIndia',  // Added via discovery — 5 India / 5 total
'SuperdocApp',  // Added via discovery — 5 India / 5 total
'ClamourTechnologies',  // Added via discovery — 5 India / 5 total
'Knimbus',  // Added via discovery — 5 India / 5 total
'DivinePixelCodesPvtLtd1',  // Added via discovery — 5 India / 5 total
'BlueBerryE-ServicesPvtLtd',  // Added via discovery — 5 India / 5 total
'Xprezto',  // Added via discovery — 5 India / 5 total
'NxtgenProjectsManagementSolutions',  // Added via discovery — 5 India / 5 total
'CarmelOrganicsPvtLtd',  // Added via discovery — 5 India / 5 total
'TransHRStaffingSolutions',  // Added via discovery — 4 India / 4 total
'JobnathHRServices',  // Added via discovery — 4 India / 4 total
'Kovaico',  // Added via discovery — 4 India / 4 total
'Hubfly2',  // Added via discovery — 4 India / 4 total
'ParkhyaSolutionPvtLtd',  // Added via discovery — 4 India / 4 total
'OrangeSpikeLLP',  // Added via discovery — 4 India / 4 total
'MatchpointSolutions2',  // Added via discovery — 4 India / 4 total
'AvisoAI',  // Added via discovery — 4 India / 4 total
'ZensarkTecnologiesPvtLtd',  // Added via discovery — 4 India / 4 total
'XigmaproSoftwarePvtLtd',  // Added via discovery — 4 India / 4 total
'Ignatiuzcom',  // Added via discovery — 4 India / 4 total
'Useready',  // Added via discovery — 4 India / 4 total
'CatenonWorldwideExecutiveSearch1',  // Added via discovery — 4 India / 4 total
'DELTAHRCONSULTANTS',  // Added via discovery — 4 India / 4 total
'Webdimensions',  // Added via discovery — 4 India / 4 total
'CcerebrateBusinessConsulting',  // Added via discovery — 4 India / 4 total
'DigiGrapesTechnologies',  // Added via discovery — 4 India / 4 total
'GetMyParking',  // Added via discovery — 4 India / 4 total
'TheIntect',  // Added via discovery — 4 India / 4 total
'DeviceDeveloper',  // Added via discovery — 4 India / 4 total
'StandardRailTechnologies',  // Added via discovery — 4 India / 4 total
'Mazkara',  // Added via discovery — 4 India / 4 total
'HCLAmericaInc',  // Added via discovery — 4 India / 4 total
'SolarHitechSolutions',  // Added via discovery — 3 India / 3 total
'IvanWebSolutions',  // Added via discovery — 3 India / 3 total
'Firstsource3',  // Added via discovery — 3 India / 3 total
'PinnacleSevenTechnologies',  // Added via discovery — 3 India / 3 total
'CrazyWebDesigners',  // Added via discovery — 3 India / 3 total
'Whirlwind',  // Added via discovery — 3 India / 3 total
'ShasvatCommunications',  // Added via discovery — 3 India / 3 total
'ZewiaSoftwareSolutionsPvtLtd',  // Added via discovery — 3 India / 3 total
'TIMConsultantsPvtLtd',  // Added via discovery — 3 India / 3 total
'GrassikSearchPvtLtd',  // Added via discovery — 3 India / 3 total
'IELTSMaterialcom',  // Added via discovery — 3 India / 3 total
'OmamConsultantServicesPvtLtd',  // Added via discovery — 3 India / 3 total
'PSInternationalInfoservicesPvtLtd',  // Added via discovery — 3 India / 3 total
'ANRISolutionsHRServicesPvtLtd1',  // Added via discovery — 3 India / 3 total
'CareerBricksLearningSolutions',  // Added via discovery — 3 India / 3 total
'Custiv',  // Added via discovery — 3 India / 3 total
'ArbeitIndia',  // Added via discovery — 3 India / 3 total
'BharjaTechnologies',  // Added via discovery — 3 India / 3 total
'Krinotek',  // Added via discovery — 3 India / 3 total
'JanyaITTechnologiesPvtLtd',  // Added via discovery — 3 India / 3 total
'StaffingSolutions5',  // Added via discovery — 3 India / 3 total
'ProvostSolutions',  // Added via discovery — 3 India / 3 total
'BlueSpireInc1',  // Added via discovery — 3 India / 3 total
'CocoTechoes',  // Added via discovery — 3 India / 3 total
'Typesetio',  // Added via discovery — 3 India / 3 total
'Solutions4BusinessInc',  // Added via discovery — 3 India / 3 total
'ATTOTechnologySolutionsInc',  // Added via discovery — 3 India / 3 total
'Skill-lync',  // Added via discovery — 3 India / 3 total
'AblysoftPvtLtd',  // Added via discovery — 3 India / 3 total
'ShikshaTriangle',  // Added via discovery — 3 India / 3 total
'Workspend',  // Added via discovery — 3 India / 3 total
'ThinksurfMedia',  // Added via discovery — 3 India / 3 total
'Inkcadre',  // Added via discovery — 3 India / 3 total
'BookapropEstatesPvtLtd',  // Added via discovery — 3 India / 3 total
'SpruceInfotechInc',  // Added via discovery — 3 India / 3 total
'YUJDesigns',  // Added via discovery — 3 India / 3 total
'Mahentechnologies',  // Added via discovery — 2 India / 2 total
'WinningEdgeSolutionsLLC',  // Added via discovery — 2 India / 2 total
'DataFlairWebServicesPvtLtd',  // Added via discovery — 2 India / 2 total
'ITExcelLLC',  // Added via discovery — 2 India / 2 total
'GreenInitiatives',  // Added via discovery — 2 India / 2 total
'IntelehealthInc',  // Added via discovery — 2 India / 2 total
'RigelNetworksPvtLtd',  // Added via discovery — 2 India / 2 total
'ShiplystSystemsPvtLtd',  // Added via discovery — 2 India / 2 total
'LeadingITSolutionsFirm',  // Added via discovery — 2 India / 2 total
'Mobikon',  // Added via discovery — 2 India / 2 total
'AccernTechnologies',  // Added via discovery — 2 India / 2 total
'AdaptNXTTechnologySolutions',  // Added via discovery — 2 India / 2 total
'RepliconSoftware',  // Added via discovery — 2 India / 2 total
'AvoorNetworksPvtLtd',  // Added via discovery — 2 India / 2 total
'SkyInstantSolutions',  // Added via discovery — 2 India / 2 total
'AkuvaInfotechPvtLtd',  // Added via discovery — 2 India / 2 total
'IINTRIS1',  // Added via discovery — 2 India / 2 total
'NoonAcademy',  // Added via discovery — 2 India / 2 total
'Superset',  // Added via discovery — 2 India / 2 total
'MakwizTechnologies',  // Added via discovery — 2 India / 2 total
'DataScienceLab',  // Added via discovery — 2 India / 2 total
'TalentPundits',  // Added via discovery — 2 India / 2 total
'HireITPeople2',  // Added via discovery — 2 India / 2 total
'BrillicoConsultantsInc',  // Added via discovery — 2 India / 2 total
'LiveHealth',  // Added via discovery — 2 India / 2 total
'WEQTechnologies',  // Added via discovery — 2 India / 2 total
'SwappitWebSoftwareSolutions',  // Added via discovery — 2 India / 2 total
'AmanziTechnologiesPvtLtd',  // Added via discovery — 2 India / 2 total
'GB1',  // Added via discovery — 2 India / 2 total
'WekancodeTechnologies',  // Added via discovery — 2 India / 2 total
'ZatakSoftechPvtLtd',  // Added via discovery — 2 India / 2 total
'OnActuate',  // Added via discovery — 2 India / 2 total
'Clikai',  // Added via discovery — 2 India / 2 total
'OnSumayeWebSolutions',  // Added via discovery — 2 India / 2 total
'CybertecInc1',  // Added via discovery — 2 India / 2 total
'Gyanwave',  // Added via discovery — 2 India / 2 total
'UMZTechnologiescom',  // Added via discovery — 2 India / 2 total
'AIMDekTechnologiesPvtLTd',  // Added via discovery — 2 India / 2 total
'TheJGIGroup',  // Added via discovery — 2 India / 2 total
'CreativePersonnel',  // Added via discovery — 2 India / 2 total
'Apex-LinkedInACOne',  // Added via discovery — 2 India / 2 total
'narayanahealth',  // Added via discovery — 2 India / 2 total
'coditationsystems',  // Added via discovery — 2 India / 2 total
'PusatInovasiGlobal',  // Added via discovery — 1 India / 1 total
'XCLARSConsultancyServices',  // Added via discovery — 1 India / 1 total
'EXAWEDDINGCOMPANY',  // Added via discovery — 1 India / 1 total
'RedPanthersSoftwareSolutionsPvtLtd',  // Added via discovery — 1 India / 1 total
'DatamarkBPO',  // Added via discovery — 1 India / 1 total
'RigelSoftTechnologies',  // Added via discovery — 1 India / 1 total
'ALGOTechnosoft',  // Added via discovery — 1 India / 1 total
'KGTiger',  // Added via discovery — 1 India / 1 total
'AugustaHitechSoftSolutionsPvtLtd',  // Added via discovery — 1 India / 1 total
'TimesysTechnologiesIndiaLLP',  // Added via discovery — 1 India / 1 total
'DarwinsBussinessDevelopers',  // Added via discovery — 1 India / 1 total
'MModalGlobalServicesInc',  // Added via discovery — 1 India / 1 total
'GoQuoTechnicalServicesPrivateLimited',  // Added via discovery — 1 India / 1 total
'GNP1',  // Added via discovery — 1 India / 1 total
'EworkplaceApps',  // Added via discovery — 1 India / 1 total
'IMDesigns',  // Added via discovery — 1 India / 1 total
'InvestmentBulls',  // Added via discovery — 1 India / 1 total
'Ctzapp',  // Added via discovery — 1 India / 1 total
'EndeavorITSolutionsPvtLtd2',  // Added via discovery — 1 India / 1 total
'InvetechSolutionsLLP',  // Added via discovery — 1 India / 1 total
'CentroxySolutionPvtLtd',  // Added via discovery — 1 India / 1 total
'BasAiseHi',  // Added via discovery — 1 India / 1 total
'UVHomesPvtLtd',  // Added via discovery — 1 India / 1 total
'CardinalTechnologySolutions2',  // Added via discovery — 1 India / 1 total
'PegasusCorporateSolutions1',  // Added via discovery — 1 India / 1 total
'TechmatesSolutions',  // Added via discovery — 1 India / 1 total
'Samvadatacom',  // Added via discovery — 1 India / 1 total
'FluentgridLimited',  // Added via discovery — 1 India / 1 total
'PrutectSolutions',  // Added via discovery — 1 India / 1 total
'GigabitTecnologiesPvtLtd',  // Added via discovery — 1 India / 1 total
'MNRSolutionsPvtltd',  // Added via discovery — 1 India / 1 total
'MaaKamakhyaHrConsultantPrivateLimited',  // Added via discovery — 1 India / 1 total
'WebingoInfotechSolutionsLLP',  // Added via discovery — 1 India / 1 total
'PropertySimplifyLLP',  // Added via discovery — 1 India / 1 total
'WealdenHRSolutionsIndiaLLP',  // Added via discovery — 1 India / 1 total
'MINDITPROMOTIONSLLP',  // Added via discovery — 1 India / 1 total
'MansaInfotechPvtLtd',  // Added via discovery — 1 India / 1 total
'SalemInfotech',  // Added via discovery — 1 India / 1 total
'TupleTechnologies',  // Added via discovery — 1 India / 1 total
'RRVGlobalInfotechPvtLtd',  // Added via discovery — 1 India / 1 total
'OptimizedInfotech',  // Added via discovery — 1 India / 1 total
'KRealmInfotechPvtLtd',  // Added via discovery — 1 India / 1 total
'FreshBoxMediaPvtLtd',  // Added via discovery — 1 India / 1 total
'SKYGOALHRSERVICES',  // Added via discovery — 1 India / 1 total
'RecomInfosolution',  // Added via discovery — 1 India / 1 total
'ImaginariumIndiaPvtLtd',  // Added via discovery — 1 India / 1 total
'EduonixLearningSolutionsPvtLtd',  // Added via discovery — 1 India / 1 total
'LoonkerCreativeSolutionsOPCPvtLtd',  // Added via discovery — 1 India / 1 total
'MarketPulseTechnologiesPvtLtd',  // Added via discovery — 1 India / 1 total
'PNPPolytexPvtLtd',  // Added via discovery — 1 India / 1 total
'RosestoneJobServicesPvtLtd',  // Added via discovery — 1 India / 1 total
'UfaberEdutechPvtLtd',  // Added via discovery — 1 India / 1 total
'AroojHealthcarePvtLtd',  // Added via discovery — 1 India / 1 total
'DreamInvestmentSolutions',  // Added via discovery — 1 India / 1 total
'KyzerSoftware',  // Added via discovery — 1 India / 1 total
'CyberindigoNetPvtLtd',  // Added via discovery — 1 India / 1 total
'ShujaBITSInfortechSolutions',  // Added via discovery — 1 India / 1 total
'ErysonHandelPLtd',  // Added via discovery — 1 India / 1 total
'WhiteCrossClinic',  // Added via discovery — 1 India / 1 total
'Spacebar',  // Added via discovery — 1 India / 1 total
'GreyniumTechnologiesPvtLtd',  // Added via discovery — 1 India / 1 total
'ACMO1',  // Added via discovery — 1 India / 1 total
'Digipercept',  // Added via discovery — 1 India / 1 total
'Affine2',  // Added via discovery — 1 India / 1 total
'Netradyne',  // Added via discovery — 1 India / 1 total
'FloCareerCompanyPvtLtd',  // Added via discovery — 1 India / 1 total
'AthamasTechnologiesPvtLtd',  // Added via discovery — 1 India / 1 total
'LitehiresGlobal',  // Added via discovery — 1 India / 1 total
'AccelPadINC',  // Added via discovery — 1 India / 1 total
'E2MSolutionsPvtLtd',  // Added via discovery — 1 India / 1 total
'JobskeyPro',  // Added via discovery — 1 India / 1 total
'Smart4Talent1',  // Added via discovery — 1 India / 1 total
'CampusMarg',  // Added via discovery — 1 India / 1 total
'DataAngleTechnologies',  // Added via discovery — 1 India / 1 total
'Wudbox',  // Added via discovery — 1 India / 1 total
'CareatorTechnologies',  // Added via discovery — 1 India / 1 total
'TrellisITInc',  // Added via discovery — 1 India / 1 total
'IxoraGlobalServicesPLtd',  // Added via discovery — 1 India / 1 total
'MegabyteITServices',  // Added via discovery — 1 India / 1 total
'KonnectivResources',  // Added via discovery — 1 India / 1 total
'WonderPointSoftwarePvtLtd',  // Added via discovery — 1 India / 1 total
'Kiyaai',  // Added via discovery — 1 India / 1 total
'Stratagem1',  // Added via discovery — 1 India / 1 total
'MedvarsityOnlineLimited',  // Added via discovery — 1 India / 1 total
'GreyCampus',  // Added via discovery — 1 India / 1 total
'VerticalSoftware',  // Added via discovery — 1 India / 1 total
'HardcastleGisUsaInc',  // Added via discovery — 1 India / 1 total
'GirdTechnologiesOutsoursingServices',  // Added via discovery — 1 India / 1 total
'Drinkwell',  // Added via discovery — 1 India / 1 total
'OcherTechnologyGroup',  // Added via discovery — 1 India / 1 total
'SkyworldCharterServices',  // Added via discovery — 1 India / 1 total
'AmanaAsiaPteLtd',  // Added via discovery — 1 India / 1 total
'CybrainSoftwareSolutions',  // Added via discovery — 1 India / 1 total
'Uneva',  // Added via discovery — 1 India / 1 total
'Fuereer',  // Added via discovery — 1 India / 1 total
'TVSTrainingAndServices',  // Added via discovery — 1 India / 1 total
'BODConsulting',  // Added via discovery — 1 India / 1 total
'OdiceaDistributionTechnologiesPvtLtd',  // Added via discovery — 1 India / 1 total
'PeopleZHR',  // Added via discovery — 1 India / 1 total
'EdunextTechnologiesPvtLtd',  // Added via discovery — 1 India / 1 total
'DominionTechnologyServicesPvtLtd',  // Added via discovery — 1 India / 1 total
'HikeQA',  // Added via discovery — 1 India / 1 total
'TolexoOnlinePrivateLtd',  // Added via discovery — 1 India / 1 total
'SpeedXInfotech',  // Added via discovery — 1 India / 1 total
'ShineWebServices',  // Added via discovery — 1 India / 1 total
'AmityUniversity',  // Added via discovery — 1 India / 1 total
'CivilgeoInc',  // Added via discovery — 1 India / 1 total
'MMEnterprises',  // Added via discovery — 1 India / 1 total
'CareerNetTechnologiesPvtLtd1',  // Added via discovery — 1 India / 1 total
'SykeLegalEngineering',  // Added via discovery — 1 India / 1 total
'JanRobertExecutiveSearch',  // Added via discovery — 1 India / 1 total
'NayanIndiaScienceAndTechnologies1',  // Added via discovery — 1 India / 1 total
'ElmechEngineers',  // Added via discovery — 1 India / 1 total
'PSTAG',  // Added via discovery — 1 India / 1 total
'ZentekInfosoft',  // Added via discovery — 1 India / 1 total
'HRMind1',  // Added via discovery — 1 India / 1 total
'InfytricsBuisnessSolutionsPvtLtd',  // Added via discovery — 1 India / 1 total
'NewSovaTravels',  // Added via discovery — 1 India / 1 total
'SaturncubeTechnologies',  // Added via discovery — 1 India / 1 total
'SevenBitsTechnologies',  // Added via discovery — 1 India / 1 total
'SnapwizEdutechIndiaPvtLtd',  // Added via discovery — 1 India / 1 total
'SoftvanPvtLtd',  // Added via discovery — 1 India / 1 total
'IteanzTechnologiesServices',  // Added via discovery — 1 India / 1 total
'EndeavourSystems',  // Added via discovery — 1 India / 1 total
'MaduraFashionLifestyle1',  // Added via discovery — 1 India / 1 total
'TekkiWebSolutionsPvtLimited',  // Added via discovery — 1 India / 1 total
'AngarosIndiaPvtLtd',  // Added via discovery — 1 India / 1 total
'RDPWorkstationsPvtLtd',  // Added via discovery — 1 India / 1 total
'SwasthyaSewak',  // Added via discovery — 1 India / 1 total
'AmberStudent',  // Added via discovery — 1 India / 1 total
'NeilsoftLtd1',  // Added via discovery — 1 India / 1 total
'BringOnBoardSolutions',  // Added via discovery — 1 India / 1 total
'BrandAndBeyond',  // Added via discovery — 1 India / 1 total
'ZingHR',  // Added via discovery — 1 India / 1 total
'RoltaIndiaLtd1',  // Added via discovery — 1 India / 1 total
'Smart4Talent',  // Added via discovery — 1 India / 1 total
'OrientalCuisinesPvtLtd',  // Added via discovery — 1 India / 1 total
'ShadeSixInteractive',  // Added via discovery — 1 India / 1 total
'AdeptConsultingPartners',  // Added via discovery — 1 India / 1 total
'GainersInfotech',  // Added via discovery — 1 India / 1 total
'KLA-Tencor',  // Added via discovery — 1 India / 1 total
'StoryProcess',  // Added via discovery — 1 India / 1 total
'NoisyLion',  // Added via discovery — 1 India / 1 total
'ThinkPeopleSolutions',  // Added via discovery — 1 India / 1 total
'whatfix',  // Added via discovery — 1 India / 1 total
'upstox',  // Added via discovery — 1 India / 1 total
];

export { companyIdentifiers };
