// FILE: src/components/layouts/AuthLayout.tsx
// The one sign-in frame, for every audience (seeker, employer, admin): the
// landing's ink photograph with a serif statement bleeding under the whole
// page, and a glass card floating to its right. On narrow windows the
// photograph becomes a dim ground behind one centred card. Server-renderable:
// the split is a CSS grid with a media query (auth.css), not a viewport hook.
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
  image = '/landing/ink-companies.jpg',
  cardAction,
}: {
  children?: ReactNode;
  /** Mono label above the statement on the photograph pane. */
  eyebrow?: string;
  /** The serif statement on the photograph pane. */
  statement?: string;
  /** Where the brand mark links. */
  homeHref?: string;
  /** The ink photograph behind the page. */
  image?: string;
  /** Optional control in the card's top-right corner (a close link, say). */
  cardAction?: ReactNode;
}) {
  return (
    <div className="auth-root">
      <div className="auth-pane">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" aria-hidden className="auth-ink" />
        <div className="auth-scrim" />
        <div className="auth-pane__copy">
          <Link href={homeHref} aria-label={BRAND.appName} className="press" style={{ textDecoration: 'none', display: 'inline-flex', width: 'fit-content' }}>
            <BrandLogo size="md" />
          </Link>
          <div>
            <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 14 }}>{eyebrow}</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.02, maxWidth: 520, textWrap: 'balance' }}>
              {statement}
            </h2>
          </div>
        </div>
      </div>

      <div className="auth-card-wrap">
        <div className="glass glass--strong auth-card">
          {cardAction && <div className="auth-card__action">{cardAction}</div>}
          <div className="auth-card__brand"><BrandLogo size="md" /></div>
          {children}
        </div>
      </div>
    </div>
  );
}
