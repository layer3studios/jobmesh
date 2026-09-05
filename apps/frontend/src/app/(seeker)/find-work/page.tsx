// FILE: src/app/(seeker)/find-work/page.tsx
// The seeker landing page reached from JOBS in the landing nav. NOT the job
// board — that is /jobs. This page states what the board is, offers a search
// that hands the query to /jobs?q=…, and shows the seeker product. Server
// component: metadata + the same aggregate counts the landing advertises.
import type { Metadata } from 'next';
import { getSeekerDirectoryServer, getSeekerTodayCountServer } from '../../../lib/server-api/seeker';
import { absoluteUrl } from '../../../lib/site-url';
import { BRAND, COPY } from '../../../theme/brand';
import FindWorkClient from '../../../components/seeker/find-work/FindWorkClient';
import { LANDING_VIEWPORT } from '../../../components/seeker/home/landing-viewport';
import type { ICompany } from '../../../types';

export const revalidate = 300;

// Ink status bar on iOS — see landing-viewport.ts.
export const viewport = LANDING_VIEWPORT;

export const metadata: Metadata = {
  title: COPY.findWork.metaTitle,
  description: COPY.findWork.metaDescription,
  alternates: { canonical: absoluteUrl('/find-work') },
  openGraph: {
    title: COPY.findWork.metaTitle, description: COPY.findWork.metaDescription,
    url: absoluteUrl('/find-work'), siteName: BRAND.appName, type: 'website', locale: 'en_IN',
  },
};

export default async function FindWorkPage() {
  // allSettled: the counters are decoration; one failing must not blank the page.
  const [directoryResult, todayResult] = await Promise.allSettled([
    getSeekerDirectoryServer(), getSeekerTodayCountServer(),
  ]);
  const companies: ICompany[] = directoryResult.status === 'fulfilled' ? directoryResult.value : [];
  const todayCount = todayResult.status === 'fulfilled' ? todayResult.value : 0;

  const jobCount = companies.reduce((sum, company) => sum + (company.openRoles || 0), 0);
  const topHiringNames = [...companies]
    .sort((a, b) => (b.openRoles || 0) - (a.openRoles || 0))
    .slice(0, 3)
    .map(company => company.companyName);

  return (
    <FindWorkClient
      companies={companies.slice(0, 10)}
      jobCount={jobCount}
      companyCount={companies.length}
      todayCount={todayCount}
      topHiringNames={topHiringNames}
    />
  );
}
