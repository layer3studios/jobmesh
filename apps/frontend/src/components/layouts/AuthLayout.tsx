// FILE: src/components/layouts/AuthLayout.tsx
// The sign-in frame for the employer and admin audiences — the same split the
// seeker LoginScreen uses: the landing's ink photograph with a serif statement
// on the left, a glass card on the right. On narrow windows the photograph
// becomes a dim ground behind one centred card. Server-renderable: the split
// is a CSS grid with a media query (auth.css), not a viewport hook.
import type { ReactNode } from 'react';
import Link from 'next/link';
import BrandLogo from '../BrandLogo';
import { BRAND } from '@/theme/brand';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function AuthLayout({
  children,
  eyebrow = 'For companies that hire',
  statement = 'Post once. Rank every applicant. Hire from one list.',
  homeHref = '/',
}: {
  children?: ReactNode;
  /** Mono label above the statement on the photograph pane. */
  eyebrow?: string;
  /** The serif statement on the photograph pane. */
  statement?: string;
  /** Where the brand mark links. */
  homeHref?: string;
}) {
  return (
    <div className="auth-root">
      <div className="auth-pane">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/ink-companies.jpg" alt="" aria-hidden className="auth-ink" />
        <div className="auth-scrim" />
        <div className="auth-pane__copy">
          <Link href={homeHref} aria-label={BRAND.appName} style={{ textDecoration: 'none' }}>
            <BrandLogo size="md" />
          </Link>
          <div>
            <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 14 }}>{eyebrow}</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.02, maxWidth: 520 }}>
              {statement}
            </h2>
          </div>
        </div>
      </div>

      <div className="auth-card-wrap">
        <div className="glass glass--strong auth-card">
          <div className="auth-card__brand"><BrandLogo size="md" /></div>
          {children}
        </div>
      </div>
    </div>
  );
}
