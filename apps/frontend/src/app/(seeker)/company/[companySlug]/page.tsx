// FILE: src/app/(seeker)/company/[companySlug]/page.tsx
// Individual company page — Server Component, public + indexable (SEO addition; no
// verbatim Vite route). Resolves the company from the directory by its slug (the only
// known read for scraped companies), fetches its active listings, and renders
// Organization + ItemList (of JobPostings) + BreadcrumbList JSON-LD, with the open
// roles listed via the shared JobCard.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '../../../../components/schema/JsonLd';
import { buildOrganizationSchema, buildItemListSchema, buildBreadcrumbListSchema } from '../../../../lib/schema';
import { getSeekerDirectoryServer, getSeekerJobsByCompanyServer } from '../../../../lib/server-api/seeker';
import { slugifyCompanyName } from '../../../../utils/slugify-company';
import { absoluteUrl } from '../../../../lib/site-url';
import JobCard from '../../../../components/seeker/JobCard';
import type { ICompany, IJob } from '../../../../types';

export const revalidate = 3600;

async function findCompany(companySlug: string): Promise<ICompany | null> {
  const companies = await getSeekerDirectoryServer().catch(() => [] as ICompany[]);
  return companies.find((company) => slugifyCompanyName(company.companyName) === companySlug) ?? null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ companySlug: string }> },
): Promise<Metadata> {
  const { companySlug } = await params;
  const company = await findCompany(companySlug);
  if (!company) return { title: 'Company not found' };
  return {
    title: `${company.companyName} — open roles`,
    description: `Open tech roles at ${company.companyName}. ${company.openRoles} positions hiring now.`,
    alternates: { canonical: absoluteUrl(`/company/${companySlug}`) },
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params;
  const company = await findCompany(companySlug);
  if (!company) notFound();

  let jobs: IJob[] = [];
  try {
    jobs = await getSeekerJobsByCompanyServer(company.companyName);
  } catch {
    // A backend hiccup must not break the page; render the header with no listings.
  }

  const organizationSchema = buildOrganizationSchema({
    name: company.companyName,
    logoPath: company.logo,
    description: `Tech roles at ${company.companyName}, hiring across ${company.cities.join(', ')}.`,
  });
  const itemListSchema = buildItemListSchema(
    jobs.map((job) => ({ path: `/jobs/${job._id}`, name: job.JobTitle })),
  );
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Companies', path: '/directory' },
    { name: company.companyName, path: `/company/${companySlug}` },
  ]);

  return (
    <main className="container-lg" style={{ padding: '48px 16px' }}>
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={itemListSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <h1 className="font-display" style={{ fontSize: '1.875rem', marginBottom: 4 }}>{company.companyName}</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 24 }}>
        {company.openRoles} open role{company.openRoles === 1 ? '' : 's'}
        {company.cities.length > 0 ? ` · ${company.cities.join(', ')}` : ''}
      </p>
      <div className="stagger" style={{ display: 'grid', gap: 10 }}>
        {jobs.map((job) => <JobCard key={job._id} job={job} />)}
        {jobs.length === 0 && (
          <p style={{ color: 'var(--ink-muted)' }}>No open roles listed right now.</p>
        )}
      </div>
    </main>
  );
}
