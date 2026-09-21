// FILE: src/components/seeker/today/shared.tsx
// Shared styles and small leaf components used across the Today sections and
// the other account pages.

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
  fontSize: 11, color: 'var(--ink-muted)',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  fontWeight: 500, marginBottom: 8,
};

/** A glass section with a mono label, an optional subtitle and an optional link. */
export function Section({ id, label, sub, linkLabel, linkTo, className, children }: {
  id?: string; label: string; sub?: string; linkLabel?: string; linkTo?: string; className?: string; children: ReactNode;
}) {
  return (
    <section id={id} className={`glass ws-section td-anchor${className ? ` ${className}` : ''}`}>
      <div className="ws-section__head">
        <div>
          <p className="ws-section__label">{label}</p>
          {sub && <p className="ws-section__sub">{sub}</p>}
        </div>
        {linkLabel && linkTo && (
          <Link href={linkTo} className="ws-link-more">{linkLabel} <ArrowRight size={12} /></Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** An editorial section for Today: a hairline rule, a mono kicker with a running number, a serif title. */
export function EdSection({ id, number, kicker, title, link, children, className }: {
  id?: string; number: string; kicker: string; title?: string; link?: { label: string; to: string; external?: boolean }; children: ReactNode; className?: string;
}) {
  return (
    <section id={id} className={`ed${className ? ` ${className}` : ''}`} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="ed__head">
        <p className="ed__kicker"><span className="ed__num">{number}</span>{kicker}</p>
        {title && <h2 id={id ? `${id}-title` : undefined} className="font-display ed__title">{title}</h2>}
        {link && (
          link.external
            ? <a href={link.to} target="_blank" rel="noopener noreferrer" className="ed__more">{link.label} <ArrowRight size={12} /></a>
            : <Link href={link.to} className="ed__more">{link.label} <ArrowRight size={12} /></Link>
        )}
      </div>
      {children}
    </section>
  );
}
