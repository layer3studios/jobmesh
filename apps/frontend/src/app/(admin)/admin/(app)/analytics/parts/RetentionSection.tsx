'use client';
// FILE: src/app/(admin)/admin/(app)/analytics/parts/RetentionSection.tsx
// Retention & stickiness.
//
// W1 IS APPROXIMATE AND THE UI SAYS SO. The backend cannot express exact W1
// retention without a JOIN, so it ships "still active 7+ days after first seen".
// The column is labelled "approx." and the method is printed under the table —
// a retention number that looks exact but is not is worse than no number.
//
// Two populations are shown side by side and never divided into each other:
// `cohortSize` counts everyone first seen that week, `signups` counts seeker
// signups. The percentage uses cohortSize, which is its actual denominator.

import { useCallback, useEffect, useState } from 'react';
import { fetchRetention, isAnalyticsDisabled } from '@/api/admin-analytics-api';
import type { RetentionResponse } from '@/api/admin-analytics-api';
import type { SinceRange } from '@/types/admin-analytics';
import KpiTile from './KpiTile';
import SectionHeader from './SectionHeader';
import EmptyStateNotice from './EmptyStateNotice';

const gridStyle: React.CSSProperties = {
  display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))',
};

const th: React.CSSProperties = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '8px 10px', fontSize: '0.82rem', color: 'var(--ink)',
  borderBottom: '1px solid var(--border)',
};

const oneDecimal = (value: number): string => `${value.toFixed(1)}%`;

/**
 * SectionHeader always prints "Refreshed <cachedAt>", which would read as
 * "just now" for a section that has no data yet or failed to load. Those states
 * get a plain title instead rather than claiming a freshness they do not have.
 */
function PlainHeader({ title }: { title: string }) {
  return (
    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', margin: '24px 0 10px' }}>
      {title}
    </h2>
  );
}

export default function RetentionSection({ since }: { since: SinceRange }) {
  const [data, setData] = useState<RetentionResponse | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    fetchRetention(since)
      .then((response) => { setData(response); setDisabled(false); })
      .catch((error: unknown) => {
        // A missing PostHog key degrades this section to the same notice the rest
        // of the page uses, rather than reading as a crash.
        if (isAnalyticsDisabled(error)) setDisabled(true);
        else setFailed(true);
      });
  }, [since]);

  useEffect(() => { load(); }, [load]);

  if (disabled) {
    return (
      <section style={{ marginTop: 28 }}>
        <PlainHeader title="Retention & stickiness" />
        <EmptyStateNotice
          title="Analytics not configured"
          body="Retention needs the PostHog analytics key. Set POSTHOG_PERSONAL_API_KEY to enable this section."
        />
      </section>
    );
  }

  if (failed) {
    return (
      <section style={{ marginTop: 28 }}>
        <PlainHeader title="Retention & stickiness" />
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load retention.</span>
          <button
            type="button" onClick={load}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section style={{ marginTop: 28 }}>
        <PlainHeader title="Retention & stickiness" />
        <div style={gridStyle}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="anim-pulse" style={{ height: 90, borderRadius: 12, background: 'var(--paper-2)' }} />
          ))}
        </div>
      </section>
    );
  }

  const { stickiness, cohorts } = data;

  return (
    <section style={{ marginTop: 28 }}>
      <SectionHeader title="Retention & stickiness" cachedAt={data.cachedAt} />

      <div style={gridStyle}>
        {/* Windows are fixed at 1/7/30 days by definition — they do not follow the
            page's range selector, and the hints say so. */}
        <KpiTile label="DAU" value={stickiness.dau} hint="last 24 hours" />
        <KpiTile label="WAU" value={stickiness.wau} hint="last 7 days" />
        <KpiTile label="MAU" value={stickiness.mau} hint="last 30 days" />
        <KpiTile label="DAU / MAU" value={oneDecimal(stickiness.dauMauPct)} hint="stickiness" />
      </div>

      <div style={{ marginTop: 20, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={th} scope="col">Week</th>
              <th style={th} scope="col">New people</th>
              <th style={th} scope="col">Signups</th>
              <th style={th} scope="col">
                Returned {data.w1IsApproximate && <em style={{ textTransform: 'none', fontWeight: 500 }}>(approx.)</em>}
              </th>
              <th style={th} scope="col">Rate</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.length === 0 ? (
              <tr>
                <td style={{ ...td, color: 'var(--ink-muted)' }} colSpan={5}>No cohort data yet.</td>
              </tr>
            ) : cohorts.map((cohort) => (
              <tr key={cohort.week} data-testid="cohort-row">
                <td style={td}>{cohort.week}</td>
                <td style={td}>{cohort.cohortSize.toLocaleString()}</td>
                <td style={td}>{cohort.signups.toLocaleString()}</td>
                <td style={td}>{cohort.approxW1Returns.toLocaleString()}</td>
                <td style={{ ...td, color: cohort.isLowSample ? 'var(--ink-faint)' : 'var(--ink)' }}>
                  {oneDecimal(cohort.approxW1Pct)}
                  {/* Dimming alone would not survive a greyscale print; the words carry it. */}
                  {cohort.isLowSample && (
                    <span style={{ marginLeft: 6, fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                      low sample
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ margin: '10px 0 0', fontSize: '0.76rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
        {data.w1IsApproximate && (
          <>
            <strong>Approximate.</strong> &ldquo;Returned&rdquo; means {data.w1Method} — not the
            textbook 7–14 day window, which needs a join this query layer does not do.
            Someone active again on day 20 counts here; a strict W1 figure would exclude them.{' '}
          </>
        )}
        Rate is returned ÷ new people. Cohorts under {data.lowSampleThreshold} people are
        marked low sample. &ldquo;Signups&rdquo; is a different population, shown for context only.
      </p>
    </section>
  );
}
