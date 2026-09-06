'use client';
// FILE: src/components/layouts/Footer.tsx
// The app footer for every audience: wordmark + one-line pitch, a Navigate
// column, a Legal column, then the disclaimer, cookie preferences and
// copyright. `audience` swaps the pitch, the navigation links and the
// disclaimer; the frame is identical so every product reads as one company.
// Legal pages live on the seeker origin, so employer and admin link across.
import Link from 'next/link';
import { BRAND, COPY } from '../../theme/brand';
import BrandLogo from '../BrandLogo';
import { useAnalyticsConsent } from '../../hooks/useAnalyticsConsent';
import { getSeekerUrl } from '../../lib/subdomain-urls';

type Audience = 'seeker' | 'employer' | 'admin';
type FooterLink = [href: string, label: string, external?: boolean];

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

const EMPLOYER = {
  description: 'Post once. Rank every applicant. Hire from one list.',
  disclaimer: 'Applicant data follows your retention schedule — candidates can request or erase it any time.',
  navigate: [
    ['/employer', 'Dashboard'],
    ['/employer/jobs', 'Postings'],
    ['/employer/assignments', 'Assignments'],
  ] as FooterLink[],
} as const;

const ADMIN = {
  description: 'Operations for the JobMesh board: scrapers, queues, companies and flags.',
  disclaimer: 'Internal tooling. Every action here is written to the audit log.',
  navigate: [
    ['/admin/scraper-health', 'Scraper'],
    ['/admin/queues', 'Queues'],
    ['/admin/companies', 'Companies'],
    ['/admin/audit-log', 'Audit log'],
  ] as FooterLink[],
} as const;

export default function Footer({ audience = 'seeker' }: { audience?: Audience }) {
  const year = new Date().getFullYear();
  const { openPreferences } = useAnalyticsConsent();
  const employer = audience === 'employer';
  const admin = audience === 'admin';
  // Employer and admin live on their own origins in production.
  const crossOrigin = employer || admin;
  const copy = employer ? EMPLOYER : admin ? ADMIN : null;

  const navigate: FooterLink[] = copy ? copy.navigate : [
    ['/jobs', COPY.footer.jobFeedLink],
    ['/directory', COPY.footer.companiesLink],
    ['/today', 'Today'],
  ];
  // Cross-origin from hire.jobmesh.in in production; same-origin in dev.
  const legal: FooterLink[] = [
    [crossOrigin ? getSeekerUrl('/legal') : '/legal', COPY.footer.legalInfoLink, crossOrigin],
    [crossOrigin ? getSeekerUrl('/legal/privacy') : '/legal/privacy', COPY.footer.privacyLink, crossOrigin],
    [crossOrigin ? getSeekerUrl('/legal') : '/legal', COPY.footer.contactLink, crossOrigin],
  ];

  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'auto', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 32px' }}>
        <div className="app-footer__grid">
          <div>
            <BrandLogo size="sm" />
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.65, marginTop: 14, maxWidth: 380 }}>
              {copy ? copy.description : BRAND.description}
            </p>
          </div>
          <FooterColumn title={COPY.footer.navigateTitle} links={navigate} />
          <FooterColumn title={COPY.footer.legalTitle} links={legal} />
        </div>

        <div style={{
          marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', lineHeight: 1.6, maxWidth: 600 }}>
            {copy ? copy.disclaimer : COPY.footer.disclaimer}
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={openPreferences}
              style={{
                fontSize: '0.75rem', color: 'var(--ink-muted)', background: 'none', border: 'none',
                padding: 0, cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Cookie preferences
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>© {year} {BRAND.fullName}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const linkStyle = { fontSize: '0.875rem', color: 'var(--ink-muted)', textDecoration: 'none', lineHeight: 1.5 } as const;
  return (
    <div>
      <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: 'var(--ink)', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(([to, label, external]) => external
          ? <a key={`${to}-${label}`} href={to} className="eb-crumb" style={linkStyle}>{label}</a>
          : <Link key={`${to}-${label}`} href={to} className="eb-crumb" style={linkStyle}>{label}</Link>)}
      </div>
    </div>
  );
}
