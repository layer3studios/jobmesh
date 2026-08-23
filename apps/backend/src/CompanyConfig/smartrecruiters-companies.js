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
    ];

export { companyIdentifiers };
