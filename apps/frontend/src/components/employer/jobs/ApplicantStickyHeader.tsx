'use client';
// FILE: src/components/employer/jobs/ApplicantStickyHeader.tsx
// Desktop header rail for the applicant detail page: back-CTA + candidate identity +
// prev/next. On the fixed-viewport, no-scroll layout (P8+) the page never scrolls, so
// this is a plain top flex row — NOT position:sticky, which would float over the score
// and PDF toolbar below it. Pure presentational; the parent owns backHref/backLabel.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

const ICON_LINK_STYLE = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, borderRadius: 8, color: 'var(--ink)',
  border: '1px solid var(--border)', textDecoration: 'none',
} as const;

/** One prev/next control (PP2/D3): a Link when navigable, a disabled Button at the end. */
function NavIcon({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  if (href) return <Link href={href} aria-label={label} style={ICON_LINK_STYLE}>{children}</Link>;
  return <Button variant="ghost" size="sm" disabled aria-label={label}>{children}</Button>;
}

export default function ApplicantStickyHeader({
  backHref, backLabel, candidateName, candidateEmail,
  previousHref, nextHref, positionText, onBack,
}: {
  backHref: string;
  backLabel: string;
  candidateName: string;
  candidateEmail: string | null;
  previousHref?: string | null;
  nextHref?: string | null;
  positionText?: string;
  /** History-aware back. Intercepts the click; backHref stays the real fallback
   *  target so middle-click / open-in-new-tab still work. */
  onBack?: () => void;
}) {
  // Right cluster only when there's prev/next nav to show — otherwise render exactly
  // as P2 did (backward compat for callers that pass none of these).
  const hasNav = Boolean(previousHref || nextHref || positionText);
  return (
    <div
      style={{
        flexShrink: 0,
        background: 'var(--paper)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 4px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <Link
        href={backHref}
        onClick={onBack ? (event) => { event.preventDefault(); onBack(); } : undefined}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
          color: 'var(--ink-muted)', flexShrink: 0,
        }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {backLabel}
      </Link>
      <div style={{ minWidth: 0, textAlign: 'right', flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {candidateName}
        </div>
        {candidateEmail && (
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {candidateEmail}
          </div>
        )}
      </div>
      {hasNav && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <NavIcon href={previousHref ?? null} label="Previous applicant"><ChevronLeft size={16} aria-hidden="true" /></NavIcon>
          {positionText && <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>{positionText}</span>}
          <NavIcon href={nextHref ?? null} label="Next applicant"><ChevronRight size={16} aria-hidden="true" /></NavIcon>
        </div>
      )}
    </div>
  );
}
