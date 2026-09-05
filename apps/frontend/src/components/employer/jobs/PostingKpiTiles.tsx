'use client';
// FILE: src/components/employer/jobs/PostingKpiTiles.tsx
// The Overview KPI tiles: a display figure over a mono label, the same shape
// as the dashboard tiles. Unknowable numbers render "—".

import { Eye } from 'lucide-react';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

function Tile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="glass" style={{ borderRadius: 12, padding: '14px 16px' }}>
      <p className="font-display" style={{ margin: 0, fontSize: 30, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--ink)' }}>{value}</p>
      <p style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        {icon}{label}
      </p>
    </div>
  );
}

export default function PostingKpiTiles({
  totalApplicants, averageScore, interviewsScheduled, daysOpen, viewCount = null,
}: {
  totalApplicants: number | null;
  averageScore: number | null;
  interviewsScheduled: number | null;
  daysOpen: number;
  /** Public apply-page views. Employer and bot visits are excluded server-side. */
  viewCount?: number | null;
}) {
  const show = (value: number | null): string => (value == null ? '—' : String(value));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
      <Tile label="Views" value={show(viewCount)} icon={<Eye size={12} aria-hidden="true" />} />
      <Tile label="Total applicants" value={show(totalApplicants)} />
      <Tile label="Avg. AI score" value={show(averageScore)} />
      <Tile label="Interviews scheduled" value={show(interviewsScheduled)} />
      <Tile label="Days open" value={String(daysOpen)} />
    </div>
  );
}
