// FILE: src/app/(seeker)/hire/page.tsx
// "Hire with JobMesh" — the public employer pitch, on the seeker host. A
// company that lands on jobmesh.in gets a page that shows the product before
// hire.jobmesh.in asks them to sign in. Server component: metadata + the
// same directory counts the landing advertises, then <HireClient/>.
import type { Metadata } from 'next';
import { getSeekerDirectoryServer } from '../../../lib/server-api/seeker';
import { absoluteUrl } from '../../../lib/site-url';
import { BRAND, COPY } from '../../../theme/brand';
import HireClient from '../../../components/seeker/hire/HireClient';
import { LANDING_VIEWPORT } from '../../../components/seeker/home/landing-viewport';
import type { ICompany } from '../../../types';

export const revalidate = 300;

// Ink status bar on iOS — see landing-viewport.ts.
export const viewport = LANDING_VIEWPORT;

export const metadata: Metadata = {
  title: COPY.hire.metaTitle,
  description: COPY.hire.metaDescription,
  alternates: { canonical: absoluteUrl('/hire') },
  openGraph: {
    title: COPY.hire.metaTitle,
    description: COPY.hire.metaDescription,
    url: absoluteUrl('/hire'),
    siteName: BRAND.appName,
    type: 'website',
    locale: 'en_IN',
  },
};

export default async function HirePage() {
  let companies: ICompany[] = [];
  try {
    companies = await getSeekerDirectoryServer();
  } catch {
    // A backend hiccup must not break the public pitch; the logo wall hides itself.
  }
  const companyCount = companies.length;
  const jobCount = companies.reduce((sum, company) => sum + (company.openRoles || 0), 0);

  return <HireClient companies={companies.slice(0, 10)} companyCount={companyCount} jobCount={jobCount} />;
}
