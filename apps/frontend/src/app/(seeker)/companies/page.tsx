// FILE: src/app/(seeker)/companies/page.tsx
// The companies landing page reached from COMPANIES in the landing nav. NOT
// the directory — that is /directory. This page states who is on JobMesh,
// offers a company search that hands off to /directory?q=…, and shows the
// twelve companies with the most open roles. Server component.
import type { Metadata } from 'next';
import { getSeekerDirectoryServer, getSeekerTodayCountServer } from '../../../lib/server-api/seeker';
import { absoluteUrl } from '../../../lib/site-url';
import { BRAND, COPY } from '../../../theme/brand';
import CompaniesClient from '../../../components/seeker/companies/CompaniesClient';
import { LANDING_VIEWPORT } from '../../../components/seeker/home/landing-viewport';
import type { ICompany } from '../../../types';

export const revalidate = 300;

// Ink status bar on iOS — see landing-viewport.ts.
export const viewport = LANDING_VIEWPORT;

export const metadata: Metadata = {
  title: COPY.companies.metaTitle,
  description: COPY.companies.metaDescription,
  alternates: { canonical: absoluteUrl('/companies') },
  openGraph: {
    title: COPY.companies.metaTitle, description: COPY.companies.metaDescription,
    url: absoluteUrl('/companies'), siteName: BRAND.appName, type: 'website', locale: 'en_IN',
  },
};

export default async function CompaniesPage() {
  const [directoryResult, todayResult] = await Promise.allSettled([
    getSeekerDirectoryServer(), getSeekerTodayCountServer(),
  ]);
  const companies: ICompany[] = directoryResult.status === 'fulfilled' ? directoryResult.value : [];
  const todayCount = todayResult.status === 'fulfilled' ? todayResult.value : 0;

  const sorted = [...companies].sort((a, b) => (b.openRoles || 0) - (a.openRoles || 0));
  const jobCount = companies.reduce((sum, company) => sum + (company.openRoles || 0), 0);

  return (
    <CompaniesClient
      companies={sorted}
      jobCount={jobCount}
      companyCount={companies.length}
      todayCount={todayCount}
      topHiringNames={sorted.slice(0, 3).map(company => company.companyName)}
    />
  );
}
