// FILE: src/app/(seeker)/tech-jobs/[slug]/page.tsx
// Keyword landing page: "IT jobs in Bangalore", "Remote tech jobs in India",
// "Java developer jobs in India" ... one per entry in lib/seo/tech-job-pages.ts.
// Live jobs from the backend feed (filtered server-side), a unique intro, links
// to sibling pages, and ItemList + BreadcrumbList JSON-LD. A page with too few
// live jobs stays reachable but asks not to be indexed, so Google never sees a
// thin, near-empty version of it.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '../../../../components/schema/JsonLd';
import SeoJobList from '../../../../components/seo/SeoJobList';
import { buildBreadcrumbListSchema, buildItemListSchema } from '../../../../lib/schema';
import { getSeekerJobsPageServer, type SeekerJobsPage } from '../../../../lib/server-api/seeker';
import { absoluteUrl } from '../../../../lib/site-url';
import { buildFaqPageSchema, buildTechJobFaq } from '../../../../lib/seo/tech-job-faq';
import { MIN_JOBS_TO_INDEX, TECH_JOB_PAGES, findTechJobPage, type TechJobPage } from '../../../../lib/seo/tech-job-pages';

export const revalidate = 3600;
// Only the slugs in TECH_JOB_PAGES exist; anything else is a real 404.
export const dynamicParams = false;

const JOBS_SHOWN = 50;
const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';
const labelStyle = { fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--ink-muted)' };

export function generateStaticParams() {
  return TECH_JOB_PAGES.map(page => ({ slug: page.slug }));
}

async function loadJobs(page: TechJobPage): Promise<SeekerJobsPage> {
  try {
    return await getSeekerJobsPageServer({ ...page.query, limit: JOBS_SHOWN });
  } catch {
    return { jobs: [], totalJobs: 0, totalPages: 0 };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = findTechJobPage(slug);
  if (!page) return { title: 'Page not found', robots: { index: false } };
  const { totalJobs } = await loadJobs(page);
  const title = `${page.heading} — ${totalJobs > 0 ? `${totalJobs} open roles` : 'updated daily'}`;
  const description = page.description.replace('{count}', totalJobs > 0 ? String(totalJobs) : 'Fresh');
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/tech-jobs/${slug}`) },
    openGraph: { title, description, url: absoluteUrl(`/tech-jobs/${slug}`), type: 'website', locale: 'en_IN' },
    ...(totalJobs < MIN_JOBS_TO_INDEX ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function TechJobsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = findTechJobPage(slug);
  if (!page) notFound();

  const { jobs, totalJobs } = await loadJobs(page);
  const companies = [...new Set(jobs.map(job => job.Company))].slice(0, 8);
  const siblings = TECH_JOB_PAGES.filter(other => other.slug !== page.slug);
  const asOf = new Date();
  const faq = buildTechJobFaq(page, jobs, totalJobs, asOf);

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Tech jobs', path: '/tech-jobs' },
    { name: page.heading, path: `/tech-jobs/${page.slug}` },
  ]);
  const itemListSchema = buildItemListSchema(jobs.map(job => ({ path: `/jobs/${job._id}`, name: job.JobTitle })));

  return (
    <main style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 24px) 64px' }}>
      <JsonLd schema={breadcrumbSchema} />
      {jobs.length > 0 && <JsonLd schema={itemListSchema} />}
      <JsonLd schema={buildFaqPageSchema(faq)} />

      <nav aria-label="Breadcrumb" style={{ ...labelStyle, marginBottom: 16 }}>
        <Link href="/tech-jobs" style={{ color: 'inherit', textDecoration: 'none' }}>Tech jobs</Link> / {page.label}
      </nav>

      <header style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.08 }}>
          {page.heading}
        </h1>
        <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-muted)', maxWidth: '68ch' }}>
          {totalJobs > 0
            ? `${totalJobs} open ${totalJobs === 1 ? 'role' : 'roles'} right now${companies.length ? `, from companies including ${companies.slice(0, 5).join(', ')}` : ''}. `
            : ''}
          {page.intro} Every listing comes from the employer&apos;s own careers page and links straight to their application — no recruiters, no reposts.
        </p>
      </header>

      <SeoJobList jobs={jobs} />
      {totalJobs > jobs.length && (
        <p style={{ marginTop: 16 }}>
          <Link href="/jobs">See all {totalJobs} roles with filters →</Link>
        </p>
      )}

      <section aria-labelledby="faq-heading" style={{ marginTop: 48 }}>
        <h2 id="faq-heading" style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{page.heading}: common questions</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 16 }}>
          Updated <time dateTime={asOf.toISOString()}>{asOf.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time> from live listings.
        </p>
        <dl style={{ display: 'grid', gap: 16, margin: 0 }}>
          {faq.map(item => (
            <div key={item.question}>
              <dt style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.question}</dt>
              <dd style={{ margin: '4px 0 0', lineHeight: 1.6, color: 'var(--ink-muted)' }}>{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="related-heading" style={{ marginTop: 48 }}>
        <h2 id="related-heading" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>More tech jobs in India</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {siblings.map(other => (
            <li key={other.slug}>
              <Link href={`/tech-jobs/${other.slug}`} className="jb-tag" style={{ textDecoration: 'none' }}>{other.heading}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
