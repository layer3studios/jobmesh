// FILE: src/components/seeker/today/shared.tsx
// Shared types, styles, and small leaf components used across the Today sections.

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const eyebrowStyle: CSSProperties = {
  fontSize: '0.75rem', color: 'var(--ink-muted)',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  fontWeight: 600, marginBottom: 6,
};

export function SectionHead({ eyebrow, title, linkLabel, linkTo }: {
  eyebrow: string; title: string; linkLabel: string; linkTo: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
      <div>
        <p style={eyebrowStyle}>{eyebrow}</p>
        <h2 className="font-display" style={{
          fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.02em',
        }}>{title}</h2>
      </div>
      <Link href={linkTo} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: '0.82rem', color: 'var(--ink-muted)',
        textDecoration: 'none', fontWeight: 500,
      }}>{linkLabel} <ArrowRight size={12} /></Link>
    </div>
  );
}

export function MiniStat({ icon, value, label, accent }: {
  icon: ReactNode; value: ReactNode; label: string; accent: 'success' | 'warning' | 'neutral';
}) {
  const color = accent === 'success' ? 'var(--success)' : accent === 'warning' ? 'var(--warning)' : 'var(--ink-muted)';
  const bg = accent === 'success' ? 'var(--success-soft)' : accent === 'warning' ? 'var(--warning-soft)' : 'var(--paper-2)';
  return (
    <div style={{
      padding: '10px 12px', background: 'var(--paper-2)',
      borderRadius: 10, border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 6,
          background: bg, color,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</span>
        <span style={{
          fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
        }}>{value}</span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 3 }}>{label}</p>
    </div>
  );
}
