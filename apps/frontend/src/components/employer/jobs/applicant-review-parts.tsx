'use client';
// FILE: src/components/employer/jobs/applicant-review-parts.tsx
// Presentational pieces of ApplicantReviewPanel, split out to keep that file under the
// line cap (C1). Pure display — no data fetching, no gating.
import type { ReactNode } from 'react';
import { Badge, Button } from '@/components/ui';

const EMPTY_VALUE = '—';

// Tier → the accent colour that tints the score hero + meter fill.
export const TIER_COLOR: Record<string, string> = {
  strong: 'var(--success)', good: 'var(--accent)', partial: 'var(--warning)', weak: 'var(--warning)', poor: 'var(--danger)',
};

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{children}</div>;
}

export function SkillRow({ label, skills, variant }: { label: string; skills: string[]; variant: 'success' | 'warning' | 'info' }) {
  if (skills.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-muted)', minWidth: 58 }}>{label}</span>
      {skills.map((skill) => <Badge key={skill} variant={variant}>{skill}</Badge>)}
    </div>
  );
}

/** Tertiary action in the score hero. Reads "Rescoring…" and locks while a job is in flight. */
export function RescoreButton({ isRescoring, disabled, onClick }: { isRescoring: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" disabled={disabled} onClick={onClick} style={{ padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>
      {isRescoring ? 'Rescoring…' : 'Rescore'}
    </Button>
  );
}

export function FitTile({ icon, label, value }: { icon: ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-faint)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {icon}{label}
      </div>
      <div style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || EMPTY_VALUE}</div>
    </div>
  );
}
