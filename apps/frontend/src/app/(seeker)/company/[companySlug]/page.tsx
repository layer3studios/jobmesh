// FILE: src/app/(seeker)/company/[companySlug]/page.tsx
// Individual company page — Server Component, public + indexable. Resolves the
// company from the directory by its slug, fetches its active listings, and
// renders Organization + ItemList + BreadcrumbList JSON-LD. Glass masthead
// (logo tile, serif name, mono facts) over the open roles as JobCards.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '../../../../components/schema/JsonLd';
import { buildOrganizationSchema, buildItemListSchema, buildBreadcrumbListSchema } from '../../../../lib/schema';
import { getSeekerDirectoryServer, getSeekerJobsByCompanyServer } from '../../../../lib/server-api/seeker';
import { slugifyCompanyName } from '../../../../utils/slugify-company';
import { absoluteUrl } from '../../../../lib/site-url';
import JobCard from '../../../../components/seeker/JobCard';
import CompanyLogo from '../../../../components/seeker/CompanyLogo';
import type { ICompany, IJob } from '../../../../types';

export const revalidate = 3600;

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';
const labelStyle = { fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--ink-muted)' };

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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={{ fontSize: 15, color: 'var(--ink)', marginTop: 4, fontWeight: 500 }}>{value}</p>
    </div>
  );
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
  const itemListSchema = buildItemListSchema(jobs.map((job) => ({ path: `/jobs/${job._id}`, name: job.JobTitle })));
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Companies', path: '/directory' },
    { name: company.companyName, path: `/company/${companySlug}` },
  ]);
  const careers = company.careersUrl || (company.domain ? `https://${company.domain}/careers` : null);

  return (
    <main style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 24px) 64px' }}>
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={itemListSchema} />
      <JsonLd schema={breadcrumbSchema} />

      <Link href="/directory" style={{ ...labelStyle, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Companies</Link>

      <header className="glass" style={{ borderRadius: 16, padding: 'clamp(20px, 3vw, 32px)', marginBottom: 'var(--gutter)' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <CompanyLogo name={company.companyName} domain={company.domain} size={64} borderRadius={14} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={labelStyle}>{company.industry || 'Company'}</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, marginTop: 6 }}>
              {company.companyName}
            </h1>
          </div>
          {careers && (
            <a href={careers} target="_blank" rel="noopener noreferrer" className="an-solid" style={{
              display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 18px', borderRadius: 10,
              background: 'var(--ink)', color: 'var(--paper)', textDecoration: 'none', fontSize: 14, fontWeight: 500,
            }}>Careers site ↗</a>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <Fact label="Open roles" value={String(company.openRoles)} />
          {company.cities.length > 0 && <Fact label="Locations" value={company.cities.slice(0, 4).join(' · ') + (company.cities.length > 4 ? ` +${company.cities.length - 4}` : '')} />}
          {company.domain && <Fact label="Site" value={company.domain.replace(/^https?:\/\//, '')} />}
        </div>
      </header>

      <p style={{ ...labelStyle, margin: '24px 0 12px' }}>Open roles · {jobs.length}</p>
      <div style={{ display: 'grid', gap: 'var(--gutter)' }}>
        {jobs.map((job) => <JobCard key={job._id} job={job} domain={company.domain} />)}
        {jobs.length === 0 && (
          <p className="glass" style={{ color: 'var(--ink-muted)', padding: 24, borderRadius: 12, textAlign: 'center' }}>No open roles listed right now.</p>
        )}
      </div>
    </main>
  );
}
