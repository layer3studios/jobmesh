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

    // ── Landing nav + hero (monochrome landing) ────────────────────
    navJobs: 'Jobs',
    navCompanies: 'Companies',
    navHire: 'Hire',
    navSignIn: 'Sign in',
    navGetStarted: 'Get started',
    heroStatement: 'Where talent finds its next chapter',
    heroLede: 'One mesh for both sides of hiring. Seekers get their work scored before they apply. Companies get every applicant ranked before they look.',
    heroPrimaryCTA: 'Find roles',
    heroSecondaryCTA2: 'Hire talent',
    scrollCue: 'Scroll',

    // ── For seekers — the product, shown ────────────────────────────
    seekerLabel: 'For seekers',
    seekerTitle: 'Optimize your trajectory.',
    seekerFeatures: [
      { title: 'AI-powered resume reviews', body: 'Scored on 4 dimensions before you apply.' },
      { title: 'Real-time salary benchmarks', body: 'P25, P50, P75 in LPA for your seniority.' },
      { title: 'GitHub & LeetCode integration', body: 'Your commits and contest ratings speak for you.' },
    ],
    seekerCardLabel: 'Resume analysis',
    seekerCardScore: 'Score',
    seekerCTA: 'See your score',

    // ── For companies — the product, shown ──────────────────────────
    companyLabel: 'For companies',
    companyTitle: 'Build elite teams with granular clarity.',
    companyFeatures: [
      { title: 'Objective AI scoring', body: 'Every resume ranked against your JD automatically.' },
      { title: 'Frictionless kanban pipeline', body: 'Drag candidates through stages. See who’s stuck.' },
      { title: 'Automated scheduling', body: 'Shared time pool. One click sends a booking link.' },
    ],
    companyCardLabel: 'Pipeline view',
    companyCTA: 'Start hiring',

    // ── The spine: "what happens inside the mesh" ───────────────────
    spineHeading: 'What happens inside the mesh',
    spineSeekers: 'Seekers',
    spineCompanies: 'Companies',
    spine1Title: 'Resume. Scored. Before you apply.',
    spine1Body: 'Four dimensions. Line-by-line evidence. No guesswork.',
    spine1Label: 'Resume score',
    spine1Bars: ['Parseability', 'Content strength', 'India market fit', 'Skills depth'],
    spine2Title: 'Your market value. Live.',
    spine2Body: 'Matching roles and P25–P75 salary bands for your seniority. Updated daily.',
    spine2Label: 'Roles match you',
    spine3Title: 'Proof of work. Not words.',
    spine3Body: 'GitHub commits. LeetCode ratings. Connected in one click.',
    spine3Commits: 'Commits',
    spine3Prs: 'PRs',
    spine4Title: 'Ranked. Before you look.',
    spine4Body: 'AI scores every applicant against your description automatically.',
    spine5Title: 'Pipeline. Not paperwork.',
    spine5Body: 'Drag. Drop. Hire. Screening, assignments, scheduling — one view.',
    spine5Stages: ['Screening', 'Interview', 'Offer'],
    spine6Title: 'Interviews. One click.',
    spine6Body: 'Shared time pool. The candidate picks a slot. Done.',
    spine6Days: ['M', 'T', 'W', 'T', 'F'],

    // ── Final CTA + landing footer ──────────────────────────────────
    finalTitle: 'Your next chapter is waiting.',
    finalButton: 'Enter the mesh',
    finalNote: 'No account required to browse',
    footerPrivacy: 'Privacy',
    footerTerms: 'Legal',
    footerCompanies: 'Companies',
    footerJobs: 'Jobs',
    footerRights: 'All rights reserved',
  },
} as const;
