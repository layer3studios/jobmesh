'use client';
// FILE: src/components/seeker/home/LandingNav.tsx
// The landing page's own header. Guests only (page.tsx redirects signed-in
// seekers to /jobs), so there is no user menu, no theme toggle, no quick stat:
// a monogram, two mono links, "Sign in" and one white pill. It replaces the
// shared TopNav on "/" — SeekerAppShell hands the chrome to the landing there.
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandMark from '../../BrandMark';
import { BRAND, COPY } from '../../../theme/brand';

// Landing pages, not the app: JOBS and COMPANIES open the /find-work and
// /companies pitches, each of which hands off to the real board or directory.
const LINKS = [
  { href: '/find-work', label: COPY.home.navJobs },
  { href: '/companies', label: COPY.home.navCompanies },
] as const;

export default function LandingNav() {
  const pathname = usePathname();

  // iOS Safari paints the overscroll and status-bar areas with <html>'s own
  // background, which the app sets to parchment. While a landing page is
  // mounted the document itself goes ink, and is restored on the way out so
  // the app pages keep their theme.
  useEffect(() => {
    const root = document.documentElement;
    const previous = { background: root.style.background, colorScheme: root.style.colorScheme };
    root.style.background = '#09090B';
    root.style.colorScheme = 'dark';
    return () => {
      root.style.background = previous.background;
      root.style.colorScheme = previous.colorScheme;
    };
  }, []);

  return (
    <header className="hm-nav">
      <div className="hm-nav__inner">
        <Link href="/" className="hm-nav__brand" aria-label={BRAND.appName}>
          <BrandMark size={22} />
          <span className="hm-nav__word hm-mono">{BRAND.appName}</span>
        </Link>

        <nav className="hm-nav__links" aria-label="Primary">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="hm-nav__link hm-mono"
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hm-nav__spacer" />

        {/* The employer path is in the chrome, not only in the body: a company
            that lands here must be able to leave for hire.jobmesh.in at once. */}
        <Link href="/hire" className="hm-nav__link hm-mono" aria-current={pathname === '/hire' ? 'page' : undefined}>
          {COPY.home.navHire}
        </Link>
        <Link href="/login" className="hm-nav__signin hm-mono">{COPY.home.navSignIn}</Link>
        <Link href="/jobs" className="hm-pill hm-pill--solid hm-pill--sm">{COPY.home.navGetStarted}</Link>
      </div>
    </header>
  );
}
