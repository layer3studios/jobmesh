// FILE: src/app/(seeker)/page.tsx
// Home — Server Component (SEO-critical). Server-fetches latest jobs, the company
// directory and the 24h role count, derives the aggregate counters the landing
// page advertises, renders Organization + WebSite + ItemList JSON-LD inline (R4),
// and redirects signed-in users to /jobs (mirrors the Vite <Navigate to="/jobs">).
// This is the GUEST landing page; <HomeClient/> composes everything below the nav.
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { JsonLd } from '../../components/schema/JsonLd';
import { buildOrganizationSchema, buildWebSiteSchema, buildItemListSchema } from '../../lib/schema';
import {
  getSeekerMeServer, getSeekerJobsServer, getSeekerDirectoryServer, getSeekerTodayCountServer,
} from '../../lib/server-api/seeker';
import { absoluteUrl } from '../../lib/site-url';
import { BRAND } from '../../theme/brand';
import HomeClient from '../../components/seeker/home/HomeClient';
import type { IJob, ICompany } from '../../types';

export const revalidate = 300; // D_impl_3

const TITLE = `${BRAND.appName} — ${BRAND.tagline}`;
const JOBS_SHOWN = 12;
const COMPANIES_SHOWN = 10;

export const metadata: Metadata = {
  title: TITLE,
  description: BRAND.description,
  keywords: [
    'tech jobs India', 'software engineer jobs India', 'IT jobs India',
    'remote tech jobs India', 'fresher tech jobs', 'developer jobs Bangalore',
    'startup jobs India', 'hiring companies India',
  ],
  alternates: { canonical: absoluteUrl('/') },
  openGraph: {
    title: TITLE,
    description: BRAND.description,
    url: absoluteUrl('/'),
    siteName: BRAND.appName,
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: BRAND.description,
  },
};

export default async function HomePage() {
  const me = await getSeekerMeServer();
  if (me) redirect('/jobs');

  let jobs: IJob[] = [];
  let companies: ICompany[] = [];
  let todayCount = 0;
  try {
    [jobs, companies, todayCount] = await Promise.all([
      getSeekerJobsServer(JOBS_SHOWN),
      getSeekerDirectoryServer(),
      getSeekerTodayCountServer(),
    ]);
  } catch {
    // A backend hiccup must not break the public shell; the sections that need
    // data hide themselves and the page still renders hero + trust + CTA.
  }

  // Derived from the FULL directory, before it is sliced for display. jobCount
  // sums openRoles rather than counting the fetched page — the feed request only
  // returns one page, so jobs.length would advertise the page size, not the
  // catalogue.
  const jobCount = companies.reduce((sum, c) => sum + (c.openRoles || 0), 0);
  const companyCount = companies.length;
  const topHiringNames = [...companies]
    .sort((a, b) => (b.openRoles || 0) - (a.openRoles || 0))
    .slice(0, 3)
    .map(c => c.companyName);

  const displayJobs = jobs.slice(0, JOBS_SHOWN);
  const displayCompanies = companies.slice(0, COMPANIES_SHOWN);

  const itemListSchema = buildItemListSchema(
    displayJobs.map((job) => ({ path: `/jobs/${job._id}`, name: job.JobTitle })),
  );

  return (
    <>
      <JsonLd schema={buildOrganizationSchema()} />
      <JsonLd schema={buildWebSiteSchema()} />
      <JsonLd schema={itemListSchema} />
      <HomeClient
        jobs={displayJobs}
        companies={displayCompanies}
        jobCount={jobCount}
        companyCount={companyCount}
        todayCount={todayCount}
        topHiringNames={topHiringNames}
      />
    </>
  );
}
