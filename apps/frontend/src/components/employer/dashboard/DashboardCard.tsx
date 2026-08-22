'use client';
// FILE: src/components/employer/dashboard/DashboardCard.tsx
// Shared card shell for the dashboard: title + optional right-aligned action
// link, then the card body. Also home to the KPI tile row.

import Link from 'next/link';
import type { ReactNode } from 'react';

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
    <section aria-label={title} style={{
      background: 'var(--surface-sunken)', border: '0.5px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
      // Non-fill cards keep their natural height inside a flex column (the
      // column scrolls instead of squashing them).
      ...(fill ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : { flexShrink: 0 }),
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0,
      }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{title}</h2>
        {action && (
          <Link href={action.href} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
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
      style={{
        background: 'var(--surface-raised)', border: '0.5px solid var(--border)', borderRadius: 10,
        padding: '12px 14px', cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>{value}</p>
    </div>
  );
}

/** null-safe KPI display: null/NaN → "—". */
export function kpiValue(value: number | null, suffix = ''): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value}${suffix}`;
}
