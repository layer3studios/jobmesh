'use client';
// FILE: src/app/(seeker)/profile/mock/page.tsx
// DEV ONLY — the profile page fed with a realistic sample so the layout can
// be reviewed without parsing a real resume. Shims window.fetch for the
// profile endpoints and renders the real <Profile />. 404s in production.
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Profile from '../../../../components/seeker/profile/Profile';
import type { ParsedProfile } from '../../../../types/seeker-profile';

const SAMPLE: ParsedProfile = {
  fullName: 'Piyush Kumar', email: 'whynotpiyush@gmail.com', phone: '+91 98765 43210',
  currentLocation: { city: 'Mumbai', state: 'Maharashtra' }, linkedinUrl: 'https://linkedin.com/in/piyush',
  summary: 'I build the load-bearing parts of web products — auth, billing, queues — in TypeScript and Go, and I like them to stay boring. Shipped payments for 400k users at Kulfi; looking for a backend or platform role in Bengaluru or remote.',
  experience: [
    { company: 'Kulfi', title: 'Software Engineer II', startDate: 'Jan 2024', endDate: null, isCurrent: true, responsibilities: ['Owned the payments service (UPI, cards) — 99.98% success rate across 1.2M monthly transactions.', 'Cut p95 API latency from 480ms to 140ms by moving hot reads to a Redis cache with write-through invalidation.', 'Mentored two interns; both converted.'], technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'] },
    { company: 'Razorpay', title: 'Backend Intern', startDate: 'Jun 2023', endDate: 'Dec 2023', isCurrent: false, responsibilities: ['Built the internal reconciliation dashboard used by the finance team daily.'], technologies: ['Go', 'React', 'MySQL'] },
  ],
  education: [{ institution: 'IIT Bombay', degree: 'B.Tech', field: 'Computer Science', startDate: '2019', endDate: '2023', collegeTier: 'Tier-1', cgpa: 8.7, percentage: null }],
  skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'Go', 'React', 'Kubernetes'].map(name => ({ name, category: null, proficiency: null })),
  totalExperienceYears: 2, seniorityLevel: 'Mid', domain: 'Backend', subDomain: 'Engineering',
  currentCTC: { amount: 18, currency: 'INR' }, expectedCTC: { amount: 26, currency: 'INR' }, noticePeriod: '30 days',
  languages: [], certifications: [{ name: 'AWS Solutions Architect – Associate', issuer: 'Amazon' }], projects: [],
  parsedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
};

const SETTINGS = {
  profileSlug: 'piyush', profilePublic: true, profileViewCount: 27, profileUrl: 'https://jobmesh.in/u/piyush',
  hasResume: true, hasLeetCode: true, hasGitHub: true,
  settings: { headline: 'Backend engineer who ships payments at scale', openToWork: true, showSkills: true, showExperience: true, showLeetCode: true, showGitHub: true, showResume: true, showEmail: false, showPhone: false },
};

let profile: ParsedProfile = SAMPLE;
let installed = false;

function installShim() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const real = window.fetch.bind(window);
  const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? 'GET').toUpperCase();
    if (url.includes('/seeker/profile') && !url.includes('profile-settings')) {
      if (method === 'PATCH' && init?.body) { profile = { ...profile, ...(JSON.parse(String(init.body)) as Partial<ParsedProfile>) }; }
      return json({ profile });
    }
    if (url.includes('/seeker/me/profile-settings')) return json(SETTINGS);
    if (url.includes('/seeker/me/github')) return json({ connected: true, available: true, data: {
      username: 'piyush', name: 'Piyush Kumar', bio: null, company: 'Kulfi', location: 'Mumbai', followers: 88, following: 40,
      publicRepoCount: 24, totalStars: 310, totalForks: 41, totalContributions: 1420, totalCommits: 1180, totalPullRequests: 160, totalIssues: 44, totalReviews: 36, privateContributions: 0,
      languages: [{ name: 'TypeScript', repoCount: 14, color: '#3178c6' }, { name: 'Go', repoCount: 6, color: '#00ADD8' }, { name: 'Python', repoCount: 4, color: '#3572A5' }],
      topRepos: [{ name: 'ledger', description: 'Double-entry ledger service with idempotent writes.', stars: 140, forks: 18, language: 'TypeScript', languageColor: '#3178c6', url: 'https://github.com/piyush/ledger' }, { name: 'queuectl', description: 'CLI for inspecting BullMQ queues.', stars: 96, forks: 12, language: 'Go', languageColor: '#00ADD8', url: 'https://github.com/piyush/queuectl' }],
      pinnedRepos: null, contributionCalendar: '{}', fetchedAt: new Date().toISOString(), isStale: false,
    } });
    if (url.includes('/seeker/me/leetcode')) return json({ connected: true, data: {
      username: 'piyush', ranking: 48213, totalSolved: 412, easySolved: 160, mediumSolved: 210, hardSolved: 42, contestRating: 1780, contestsAttended: 22, contestGlobalRanking: 30500, contestTopPercentage: 12.4,
      contestHistory: [], topSkills: [{ name: 'Dynamic Programming', count: 60 }, { name: 'Graphs', count: 44 }], languages: [{ name: 'TypeScript', count: 300 }, { name: 'Python', count: 112 }], submissionCalendar: '{}', badges: [], fetchedAt: new Date().toISOString(), isStale: false,
    } });
    if (url.includes('/seeker/resume/review')) return json({ review: null });
    if (url.includes('/seeker/market/match-count')) return json({ count: 138, asOf: new Date().toISOString(), breakdown: { byLocation: [{ key: 'Bengaluru', count: 61 }, { key: 'Remote', count: 40 }], byRoleCategory: [{ key: 'Backend', count: 90 }] } });
    if (url.includes('/seeker/market/salary-benchmark')) return json({ p25: 18, p50: 24, p75: 32, sampleSize: 88, asOf: new Date().toISOString() });
    return real(input, init);
  };
}

export default function ProfileMockPage() {
  const [ready, setReady] = useState(false);
  if (process.env.NODE_ENV === 'production') notFound();
  useEffect(() => { installShim(); setReady(true); }, []);
  if (!ready) return null;
  return <Profile />;
}
