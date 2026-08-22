'use client';
// FILE: src/app/(admin)/admin/(app)/analytics/parts/AssignmentAnalyticsSection.tsx
// Take-home feature health.
//
// TWO SOURCES, TWO FAILURE MODES, ONE SECTION. The stats block is Mongo-backed and
// renders whether or not POSTHOG_PERSONAL_API_KEY is configured. The abandonment
// block is HogQL and 503s without it. They are fetched independently and fail
// independently: a missing analytics key degrades the second block to a notice and
// leaves the first fully populated. Bundling them would blank the whole section for
// a reason that only applies to half of it.

import { useCallback, useEffect, useState } from 'react';
import {
  fetchAssignmentStats, fetchAssignmentFunnel, isAnalyticsDisabled,
} from '@/api/admin-analytics-api';
import type {
  AssignmentStatsResponse, AssignmentFunnelResponse, AbandonmentSide,
} from '@/api/admin-analytics-api';
import type { SinceRange } from '@/types/admin-analytics';
import KpiTile from './KpiTile';
import SectionHeader from './SectionHeader';

const gridStyle: React.CSSProperties = {
  display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))',
};

/** "—" for a null median: no sample. 0 would read as "instantly", which is a lie. */
const orDash = (value: number | null, suffix = ''): string =>
  (value == null ? '—' : `${value}${suffix}`);

const percent = (ratio: number | null): string =>
  (ratio == null ? '—' : `${Math.round(ratio * 100)}%`);

/** One population's completion, with the RAW COUNTS that give it meaning. */
function CompletionRow({ label, side }: { label: string; side: AbandonmentSide }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--ink-2)' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
        {/* The counts are shown, always. A ratio without its denominator cannot be
            judged: 40% off 5 views is noise, 40% off 5,000 is the verdict. */}
        {`${side.submitted} / ${side.viewed} `}
        <strong style={{ color: 'var(--ink)' }}>{percent(side.completionRatio)}</strong>
      </span>
    </div>
  );
}

export default function AssignmentAnalyticsSection({ since }: { since: SinceRange }) {
  const [stats, setStats] = useState<AssignmentStatsResponse | null>(null);
  const [funnel, setFunnel] = useState<AssignmentFunnelResponse | null>(null);
  const [funnelDisabled, setFunnelDisabled] = useState(false);
  const [statsFailed, setStatsFailed] = useState(false);

  const load = useCallback(() => {
    // Separate promises, separate catches — neither can take the other down.
    fetchAssignmentStats(since)
      .then((result) => { setStats(result); setStatsFailed(false); })
      .catch(() => setStatsFailed(true));

    fetchAssignmentFunnel(since)
      .then((result) => { setFunnel(result); setFunnelDisabled(false); })
      .catch((error) => { setFunnel(null); setFunnelDisabled(isAnalyticsDisabled(error)); });
  }, [since]);

  useEffect(() => { load(); }, [load]);

  return (
    <section aria-label="Take-home assignments" style={{ marginTop: 28 }}>
      <SectionHeader title="Take-home assignments" cachedAt={funnel?.cachedAt ?? ''} />

      {/* ── Mongo-backed: always rendered ─────────────────────────────────── */}
      {statsFailed ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Could not load assignment stats.</p>
      ) : stats ? (
        <div style={gridStyle} data-testid="assignment-stats-block">
          <KpiTile label="Postings with a task" value={stats.postingsWithAssignments} />
          <KpiTile label="Assignments in libraries" value={stats.totalAssignments} />
          <KpiTile label={`Submissions (${stats.windowDays}d)`} value={stats.submissionsLast30Days} />
          <KpiTile label={`Reviews (${stats.windowDays}d)`} value={stats.reviewsLast30Days} />
          <KpiTile label="Median time to review" value={orDash(stats.medianSubmissionToReviewHours, 'h')} />
          <KpiTile label="Median links / submission" value={orDash(stats.medianLinksPerSubmission)} />
          <KpiTile label="Median files / submission" value={orDash(stats.medianFilesPerSubmission)} />
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Loading…</p>
      )}

      {/* ── PostHog-backed: degrades alone ────────────────────────────────── */}
      <div style={{ marginTop: 16 }} data-testid="assignment-funnel-block">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>
          Apply completion
        </h3>
        {funnelDisabled ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', margin: 0 }}>
            Event analytics is not configured, so completion rates are unavailable.
            The figures above come from the database and are unaffected.
          </p>
        ) : funnel ? (
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
              Forms opened versus applications submitted. The plain-posting row is the
              control — the gap between the two is what a take-home costs you.
            </p>
            <CompletionRow label="Postings with a take-home" side={funnel.assignment} />
            <CompletionRow label="Plain postings" side={funnel.plain} />
            <div style={{ ...gridStyle, marginTop: 12 }}>
              <KpiTile label="Assignments created" value={funnel.assignmentsCreated} />
              <KpiTile label="Reviews submitted" value={funnel.reviewsSubmitted} />
              <KpiTile label="Review conflicts" value={funnel.reviewConflicts} />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: 0 }}>Loading…</p>
        )}
      </div>
    </section>
  );
}
