// FILE: src/components/seeker/today/shared.tsx
// Shared styles and small leaf components used across the Today sections.

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
