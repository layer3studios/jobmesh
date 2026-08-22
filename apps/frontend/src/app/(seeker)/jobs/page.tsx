// FILE: src/app/(seeker)/jobs/page.tsx
// Jobs feed — Hybrid. This Server Component renders the initial jobs + ItemList
// JSON-LD (crawler-visible) and per-route metadata, then hands off to the client
// <Dashboard /> (verbatim Vite port: filters, split-view, infinite scroll, mobile
// sheets). Dashboard uses useSearchParams, so it is wrapped in Suspense (Next 15).
// Public + indexable.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JsonLd } from '../../../components/schema/JsonLd';
import { buildItemListSchema } from '../../../lib/schema';
import { getSeekerJobsServer } from '../../../lib/server-api/seeker';
import { absoluteUrl } from '../../../lib/site-url';
import { COPY } from '../../../theme/brand';
import Dashboard from '../../../components/seeker/dashboard';
import type { IJob } from '../../../types';

export const revalidate = 300;

const JOBS_DESCRIPTION =
  'All tech jobs from top Indian companies, updated daily. Filter by role, experience, salary, location, work mode and tech stack.';

export const metadata: Metadata = {
  title: COPY.site.documentTitleJobs,
  description: JOBS_DESCRIPTION,
  // Filtered views live on query params; canonical keeps crawl equity on /jobs.
  alternates: { canonical: absoluteUrl('/jobs') },
  openGraph: {
    title: COPY.site.documentTitleJobs,
    description: JOBS_DESCRIPTION,
    url: absoluteUrl('/jobs'),
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: COPY.site.documentTitleJobs,
    description: JOBS_DESCRIPTION,
  },
};

export default async function JobsPage() {
  let jobs: IJob[] = [];
  try {
    jobs = await getSeekerJobsServer();
  } catch {
    // empty feed on backend hiccup — the client Dashboard re-fetches on mount
  }

  const itemListSchema = buildItemListSchema(
    jobs.map((job) => ({ path: `/jobs/${job._id}`, name: job.JobTitle })),
  );

  return (
    <>
      <JsonLd schema={itemListSchema} />
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    </>
  );
}
