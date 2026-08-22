'use client';
// FILE: admin/ai-usage/AdminAiUsageClient.tsx
// AI spend dashboard. Two clocks in one page: the historical sections change
// only when the range changes, while currentLimits is a live view of the
// server's in-memory budget — so the whole report is re-polled every 60s.
//
// A poll must never blank the page: refreshes keep the last good report on
// screen and only the first load shows skeletons.

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAiUsage } from '@/api/admin-ai-usage-api';
import type { AiUsageRange, AiUsageReport } from '@/types/admin-ai-usage';
import { compactNumber, percent } from './parts/ai-usage-format';
import { TierCards, ModelTable, DailyBars } from './parts/AiUsageCharts';
import CurrentLimitsTable from './parts/CurrentLimitsTable';

const RANGES: AiUsageRange[] = ['7d', '14d', '30d', '90d'];
const POLL_INTERVAL_MS = 60_000;

const SECTION_TITLE = {
  margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)',
} as const;

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div data-testid="kpi-tile" style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '12px 14px', minWidth: 0,
    }}>
      <div style={{
        fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
        color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginTop: 4, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

function Skeletons() {
  return (
    <div data-testid="ai-usage-skeleton" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} style={{ height: 78, borderRadius: 12, background: 'var(--paper-2)' }} />
      ))}
    </div>
  );
}

export default function AdminAiUsageClient() {
  const [range, setRange] = useState<AiUsageRange>('7d');
  const [report, setReport] = useState<AiUsageReport | null>(null);
  const [error, setError] = useState(false);
  // Ref, not state: the poll closure must read the CURRENT range without
  // resubscribing the interval on every render.
  const rangeRef = useRef<AiUsageRange>(range);
  rangeRef.current = range;

  const load = useCallback(async (next: AiUsageRange, { silent = false } = {}) => {
    if (!silent) setError(false);
    try {
      setReport(await fetchAiUsage(next));
      setError(false);
    } catch {
      // A failed background poll keeps the last good data on screen.
      if (!silent) setError(true);
    }
  }, []);

  useEffect(() => { void load(range); }, [load, range]);

  useEffect(() => {
    const timer = setInterval(() => { void load(rangeRef.current, { silent: true }); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const summary = report?.summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>AI Usage</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            Spend and live rate-limit budget. Refreshes every 60s.
          </p>
        </div>
        <div role="group" aria-label="Range" style={{
          display: 'inline-flex', gap: 2, padding: 3, borderRadius: 10,
          background: 'var(--paper-2)', border: '1px solid var(--border)',
        }}>
          {RANGES.map((option) => {
            const active = option === range;
            return (
              <button
                key={option} type="button" aria-pressed={active}
                onClick={() => setRange(option)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: active ? 600 : 500,
                  color: active ? 'var(--ink)' : 'var(--ink-muted)',
                  background: active ? 'var(--surface)' : 'transparent',
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {error && !report && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load AI usage.</span>
          <button
            type="button" onClick={() => void load(range)}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!report && !error && <Skeletons />}

      {report && summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            <KpiTile label="Total requests" value={summary.totalRequests.toLocaleString()} />
            <KpiTile label="Total tokens" value={compactNumber(summary.totalTokens)} />
            <KpiTile label="Cache hits" value={summary.totalCacheHits.toLocaleString()} />
            <KpiTile label="Cache hit rate" value={percent(summary.cacheHitRate)} />
            <KpiTile label="Total errors" value={summary.totalErrors.toLocaleString()} />
            <KpiTile label="Error rate" value={percent(summary.errorRate)} />
          </div>

          <section>
            <h2 style={SECTION_TITLE}>By tier</h2>
            <TierCards byTier={report.byTier} />
          </section>

          <section>
            <h2 style={SECTION_TITLE}>By model</h2>
            <ModelTable byModel={report.byModel} />
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Requests per day</h2>
            <DailyBars byDay={report.byDay} />
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Current limits (live)</h2>
            <CurrentLimitsTable models={report.currentLimits?.models ?? []} />
          </section>
        </>
      )}
    </div>
  );
}
