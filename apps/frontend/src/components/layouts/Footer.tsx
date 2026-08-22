'use client';
// FILE: src/components/layouts/Footer.tsx
// Verbatim port of the Vite FooterModern (Footer.tsx re-exported it). Client
// component because the footer links carry hover handlers.
import Link from 'next/link';
import { BRAND, COPY } from '../../theme/brand';
import BrandLogo from '../BrandLogo';
import { useAnalyticsConsent } from '../../hooks/useAnalyticsConsent';

export default function Footer() {
  const year = new Date().getFullYear();
  const { openPreferences } = useAnalyticsConsent();

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--paper)',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 32px' }}>
        <div style={{
          display: 'grid',
          gap: 32,
          gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))',
        }}>
          <div>
            <BrandLogo size="sm" />
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              lineHeight: 1.65,
              marginTop: 14,
              maxWidth: 380,
            }}>
              {BRAND.description}
            </p>
          </div>

          <FooterColumn
            title={COPY.footer.navigateTitle}
            links={[
              ['/jobs', COPY.footer.jobFeedLink],
              ['/directory', COPY.footer.companiesLink],
              ['/progress', COPY.nav.myProgress],
            ]}
          />
          <FooterColumn
            title={COPY.footer.legalTitle}
            links={[
              ['/legal', COPY.footer.legalInfoLink],
              ['/legal/privacy', COPY.footer.privacyLink],
              ['/legal', COPY.footer.contactLink],
            ]}
          />
        </div>

        <div style={{
          marginTop: 32,
          paddingTop: 20,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', lineHeight: 1.6, maxWidth: 600 }}>
            {COPY.footer.disclaimer}
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={openPreferences}
              style={{
                fontSize: '0.75rem',
                color: 'var(--ink-muted)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Cookie preferences
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
              © {year} {BRAND.fullName}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--ink)',
        marginBottom: 12,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(([to, label]) => (
          <Link
            key={`${to}-${label}`}
            href={to}
            style={{
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              lineHeight: 1.5,
              transition: 'color 160ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
