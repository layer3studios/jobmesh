// FILE: src/theme/copy-seeker-home.ts
// The marketing homepage: hero, how-it-works, trust strip and the employer
// cross-sell. Split out of copy-seeker.ts (section 2) -- this is the one seeker
// surface whose copy is written for persuasion rather than for navigation.

export const SEEKER_HOME_COPY = {
  home: {
    heroLabel: 'Tech jobs in India — without the fluff',
    heroTitle1: 'Find your next',
    heroTitle2: 'tech role in India',
    heroSubtitle: 'Fresh roles from top Indian tech companies, updated daily. Direct apply links, no middlemen.',
    heroCTA: 'Browse jobs',
    heroSecondaryCTA: 'View companies',
    stat1Value: '50+',
    stat1Label: 'Companies',
    stat2Value: 'Daily',
    stat2Label: 'Fresh updates',
    companiesSectionLabel: 'Hiring now',
    companiesSectionTitle1: 'Top companies in',
    companiesSectionTitle2: 'India',
    scrollLeft: 'Scroll left',
    scrollRight: 'Scroll right',
    fullDirectory: 'Full directory',
    jobsSectionLabel: 'Fresh picks',
    jobsSectionTitle: 'Latest opportunities',
    viewAll: 'View all',
    loadMore: 'Load more',

    // ── Guest landing page ──────────────────────────────────────────
    // Section 1 — ticker. `newRolesToday` is used when at least one role landed
    // in the last 24h; `rolesAddedDaily` is the evergreen zero-state fallback.
    newRolesToday: 'new roles added today',
    tickerDaily: 'Roles added daily',
    tickerHiring: 'are hiring',
    tickerActivePrefix: 'active positions across',
    tickerCompaniesSuffix: 'companies',
    tickerSuffix: 'No account needed to apply',

    // Section 2 — hero
    rolesAddedToday: 'roles added today',
    rolesAddedDaily: 'New roles daily',
    heroHeadPrefix: 'Find your next',
    heroHeadAccent: 'tech role',
    heroHeadSuffix: 'in India',
    heroSubtitleBase:
      'Fresh roles from top Indian tech companies, updated daily. Direct apply links, no middlemen',
    noAccountRequired: 'no account required',
    searchPlaceholder: 'Job title, skill, or company…',
    searchAriaLabel: 'Search tech jobs',
    searchButton: 'Search',
    locationDefault: 'All India',
    locationAriaLabel: 'Change location — currently all of India',
    quickFiltersLabel: 'Try',
    quickFilters: ['React', 'Python', 'Data analyst', 'Remote', 'Fresher / Entry', 'DevOps', 'Backend'],

    // Section 3 — trust metrics
    trustHeading: 'JobMesh at a glance',
    metricRolesLabel: 'Active roles',
    metricCompaniesLabel: 'Companies',
    metricFreshValue: 'Daily',
    metricFreshLabel: 'Fresh updates',
    metricDirectValue: 'Direct',
    metricDirectLabel: 'Apply links',

    // Section 4 — logo strip
    logoStripLabel: 'Trusted by teams at',

    // Section 5 — how it works
    howItWorksLabel: 'How it works',
    step1Title: 'Browse or search',
    step1Desc: 'Filter by skill, location, experience, or company. No signup wall.',
    step2Title: 'Read the details',
    step2Desc: 'Full job description, salary when listed, workplace type and department.',
    step3Title: 'Apply directly',
    step3Desc: "Every link goes to the company's career page. No middlemen, ever.",

    // Sections 6 + 7 — headings and the feed's trailing CTA
    companiesHeading: 'Top companies',
    jobsHeading: 'Latest opportunities',
    openRole: 'open role',
    openRoles: 'open roles',
    browseAllPrefix: 'Browse all',
    browseAllSuffix: 'roles',

    // Section 8 — employer cross-sell
    employerCTATitle: 'Hiring for your team?',
    employerCTASubtitle: 'Post jobs, manage applicants, and schedule interviews — free.',
    employerCTAButton: 'Employer portal',
  },
} as const;
