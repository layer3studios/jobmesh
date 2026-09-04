'use client';
// FILE: src/components/seeker/home/LandingFooter.tsx
// The landing page's own footer, replacing the shared Footer on "/": monogram
// and wordmark, the one-line tagline, mono links, and the legal row. Client
// only because the cookie-preferences control needs the consent hook.
import Link from 'next/link';
import BrandMark from '../../BrandMark';
import { BRAND, COPY } from '../../../theme/brand';
import { useAnalyticsConsent } from '../../../hooks/useAnalyticsConsent';

const LINKS = [
  { href: '/jobs', label: COPY.home.footerJobs },
  { href: '/directory', label: COPY.home.footerCompanies },
  { href: '/legal/privacy', label: COPY.home.footerPrivacy },
  { href: '/legal', label: COPY.home.footerTerms },
] as const;

export default function LandingFooter() {
  const year = new Date().getFullYear();
  const { openPreferences } = useAnalyticsConsent();

  return (
    <footer className="hm-section hm-footer">
      <div className="hm-wrap">
        <div className="hm-footer__row">
          <div>
            <div className="hm-nav__brand">
              <BrandMark size={22} />
              <span className="hm-nav__word hm-mono">{BRAND.appName}</span>
            </div>
            <p className="hm-footer__tag">{BRAND.tagline}</p>
          </div>

          <nav className="hm-footer__links" aria-label="Footer">
            {LINKS.map(link => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className="hm-footer__link hm-mono">
                {link.label}
              </Link>
            ))}
            <button type="button" className="hm-footer__link hm-mono" onClick={openPreferences}>
              Cookies
            </button>
          </nav>
        </div>

        <div className="hm-footer__legal hm-mono">
          <span>© {year} {BRAND.fullName}. {COPY.home.footerRights}.</span>
          <span>{COPY.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
