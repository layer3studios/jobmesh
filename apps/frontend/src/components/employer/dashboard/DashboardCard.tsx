'use client';
// FILE: src/components/employer/dashboard/DashboardCard.tsx
// Shared card shell for the dashboard: a glass panel with a hairline header —
// title + optional right-aligned action link — then the card body. Also home
// to the KPI tile: a mono label over a display figure, as on the seeker
// workspace sidebar, so both audiences count the same way.

import Link from 'next/link';
import type { ReactNode } from 'react';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export function DashboardCard({ title, action, fill, bodyMaxHeight, children }: {
  title: string;
  action?: { label: string; href: string };
  /** Grow to fill the column and scroll the BODY internally — the header stays
   *  put. Sized by the flex parent. */
  fill?: boolean;
  /** Hard cap on the scrolling body. Belt-and-braces alongside `fill`: this
   *  guarantees a scrollbar even if an ancestor fails to supply a definite
   *  height, since max-height depends on nothing but the viewport. */
  bodyMaxHeight?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="glass" style={{
      borderRadius: 14, overflow: 'hidden',
      // Non-fill cards keep their natural height inside a flex column (the
      // column scrolls instead of squashing them).
      ...(fill ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : { flexShrink: 0 }),
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h2>
        {action && (
          <Link href={action.href} className="ws-link" style={{
            fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--ink-muted)', textDecoration: 'none', padding: '4px 8px', borderRadius: 6,
          }}>
            {action.label}
          </Link>
        )}
      </div>
      {fill
        ? (
          <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxHeight: bodyMaxHeight }}>
            {children}
          </div>
        )
        : children}
    </section>
  );
}

export function KpiTile({ label, value, onClick }: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <div
      data-testid="kpi-tile"
      onClick={onClick}
      className={onClick ? 'glass jb-link-card' : 'glass'}
      style={{ borderRadius: 12, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default' }}
    >
      <p className="font-display" style={{ margin: 0, fontSize: 30, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--ink)' }}>{value}</p>
      <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{label}</p>
    </div>
  );
}

/** null-safe KPI display: null/NaN → "—". */
export function kpiValue(value: number | null, suffix = ''): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value}${suffix}`;
}
