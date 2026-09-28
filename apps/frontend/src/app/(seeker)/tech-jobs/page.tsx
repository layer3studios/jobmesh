// FILE: src/app/(seeker)/tech-jobs/page.tsx
// Hub for the keyword landing pages: tech jobs by city, by role, remote and for
// freshers. Gives crawlers (and people) one page that links every landing page.
import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '../../../components/schema/JsonLd';
import { buildBreadcrumbListSchema } from '../../../lib/schema';
import { absoluteUrl } from '../../../lib/site-url';
import { TECH_JOB_PAGES, type TechJobPageKind } from '../../../lib/seo/tech-job-pages';

export const revalidate = 86400;

const TITLE = 'Tech jobs in India by city and role';
const DESCRIPTION = 'Browse IT and software jobs in Bangalore, Hyderabad, Pune, Chennai, Mumbai and Delhi NCR, remote roles and fresher jobs, by role. Updated daily.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/tech-jobs') },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/tech-jobs'), type: 'website', locale: 'en_IN' },
};

const GROUPS: { kind: TechJobPageKind; heading: string }[] = [
  { kind: 'city', heading: 'By city' },
  { kind: 'role', heading: 'By role' },
  { kind: 'mode', heading: 'Remote and freshers' },
];

export default function TechJobsHub() {
  return (
    <main style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 24px) 64px' }}>
      <JsonLd schema={buildBreadcrumbListSchema([{ name: 'Tech jobs', path: '/tech-jobs' }])} />
      <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.08 }}>
        {TITLE}
      </h1>
      <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-muted)', maxWidth: '68ch' }}>
        JobMesh collects tech openings straight from company careers pages every day. Pick a city or a role to see
        what is open right now, or <Link href="/jobs">search every job</Link> with filters for experience, salary and tech stack.
      </p>
      {GROUPS.map(group => (
        <section key={group.kind} style={{ marginTop: 36 }} aria-labelledby={`hub-${group.kind}`}>
          <h2 id={`hub-${group.kind}`} style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{group.heading}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {TECH_JOB_PAGES.filter(page => page.kind === group.kind).map(page => (
              <li key={page.slug}>
                <Link href={`/tech-jobs/${page.slug}`} className="glass jb-link-card" style={{ display: 'block', padding: '14px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--ink)' }}>
                  {page.heading}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p style={{ marginTop: 36 }}>
        Looking for a specific employer? <Link href="/directory">Browse companies hiring in India</Link> or read the <Link href="/blog">JobMesh blog</Link>.
      </p>
    </main>
  );
}
