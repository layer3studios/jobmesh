'use client';
// FILE: src/components/layouts/Footer.tsx
// The app footer for both signed-in audiences: wordmark + one-line pitch, a
// Navigate column, a Legal column, then the disclaimer, cookie preferences
// and copyright. `audience` swaps the pitch, the navigation links and the
// disclaimer; the frame is identical so the two products read as one company.
// Legal pages live on the seeker origin, so the employer variant links across.
import Link from 'next/link';
import { BRAND, COPY } from '../../theme/brand';
import BrandLogo from '../BrandLogo';
import { useAnalyticsConsent } from '../../hooks/useAnalyticsConsent';
import { getSeekerUrl } from '../../lib/subdomain-urls';

type Audience = 'seeker' | 'employer';
type FooterLink = [href: string, label: string, external?: boolean];

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

const EMPLOYER = {
  description: 'Post once. Rank every applicant. Hire from one list.',
  disclaimer: 'Applicant data is kept on the retention schedule you set in Settings, and candidates can request or erase it at any time.',
  navigate: [
    ['/employer', 'Dashboard'],
    ['/employer/jobs', 'Postings'],
    ['/employer/assignments', 'Assignments'],
    ['/employer/settings/personal', 'Personal settings'],
  ] as FooterLink[],
} as const;

export default function Footer({ audience = 'seeker' }: { audience?: Audience }) {
  const year = new Date().getFullYear();
  const { openPreferences } = useAnalyticsConsent();
  const employer = audience === 'employer';

  const navigate: FooterLink[] = employer ? EMPLOYER.navigate : [
    ['/jobs', COPY.footer.jobFeedLink],
    ['/directory', COPY.footer.companiesLink],
    ['/progress', COPY.nav.myProgress],
  ];
  // Cross-origin from hire.jobmesh.in in production; same-origin in dev.
  const legal: FooterLink[] = [
    [employer ? getSeekerUrl('/legal') : '/legal', COPY.footer.legalInfoLink, employer],
    [employer ? getSeekerUrl('/legal/privacy') : '/legal/privacy', COPY.footer.privacyLink, employer],
    [employer ? getSeekerUrl('/legal') : '/legal', COPY.footer.contactLink, employer],
  ];

  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'auto', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 32px' }}>
        <div style={{ display: 'grid', gap: 32, gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))' }}>
          <div>
            <BrandLogo size="sm" />
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.65, marginTop: 14, maxWidth: 380 }}>
              {employer ? EMPLOYER.description : BRAND.description}
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
            {employer ? EMPLOYER.disclaimer : COPY.footer.disclaimer}
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
