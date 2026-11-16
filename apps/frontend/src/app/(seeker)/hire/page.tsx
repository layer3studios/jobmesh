// FILE: src/app/(seeker)/hire/page.tsx
// "Hire with JobMesh" — the public employer pitch, on the seeker host. A
// company that lands on jobmesh.in gets a page that shows the product before
// hire.jobmesh.in asks them to sign in. Server component: metadata + the
// same directory counts the landing advertises, then <HireClient/>.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeekerDirectoryServer } from '../../../lib/server-api/seeker';
import { isEmployerSideEnabled } from '../../../lib/server-api/flags';
import { absoluteUrl } from '../../../lib/site-url';
import { BRAND, COPY } from '../../../theme/brand';
import HireClient from '../../../components/seeker/hire/HireClient';
import { LANDING_VIEWPORT } from '../../../components/seeker/home/landing-viewport';
import type { ICompany } from '../../../types';

// force-dynamic, NOT revalidate. employerSideEnabled is a runtime switch an
// admin flips at /admin/flags, and a statically prerendered page cannot honour
// it: this route was generated at build time, when the gate said "off", and was
// then served as 200 with the not-found body — a soft 404, which Google treats
// worse than an honest one. It also meant turning the flag ON would not have
// revealed the page until the cache expired, or at all. Rendering per request
// makes the flag mean what it says in both directions; the page is a handful of
// company logos over cached directory data, so the cost is small.
export const dynamic = 'force-dynamic';

// Ink status bar on iOS — see landing-viewport.ts.
export const viewport = LANDING_VIEWPORT;

/**
 * Metadata has to be a function for the same reason: while the hire half is
 * off, this page must not advertise itself. A static export described the live
 * pitch page even as the body 404'd, so a crawler saw "Hire with JobMesh" as
 * the title of a page that does not exist.
 */
export async function generateMetadata(): Promise<Metadata> {
  if (!(await isEmployerSideEnabled())) {
    return { title: 'Not found', robots: { index: false, follow: false } };
  }
  return {
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
}

export default async function HirePage() {
  // The hire half is written and working but not launched. Until an admin
  // turns it on at /admin/flags this page does not exist to a visitor — a 404
  // rather than a redirect, so nothing is indexed and no link half-works.
  if (!(await isEmployerSideEnabled())) notFound();

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
