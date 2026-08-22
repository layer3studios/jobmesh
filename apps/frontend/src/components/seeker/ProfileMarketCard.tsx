'use client';
// FILE: src/components/seeker/ProfileMarketCard.tsx
// Live market snapshot on /profile (D9): how many postings match the seeker
// right now (+ top-5 location/role breakdown) and a salary band. Each endpoint
// renders independently — a failed match block never hides a loaded salary band
// and vice versa (D4). Salary is shown in LPA (₹X L), the Indian CTC convention
// (R1); below MIN_SAMPLE_SIZE the backend returns null percentiles and we show
// "Not enough data" rather than a misleading number.

import { Card, Spinner, Stack } from '../ui';
import { useProfileMarketData } from '../../hooks/seeker/useProfileMarketData';
import type { MatchBreakdownItem, MatchCount, SalaryBenchmark } from '../../types/seeker-profile';

// Backend rounds to 0.5 L, so we see at most one decimal (D10).
function formatLpa(value: number | null): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? `₹${value}L` : `₹${value.toFixed(1)}L`;
}

function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`;
}

function BreakdownList({ heading, items }: { heading: string; items: MatchBreakdownItem[] }) {
  return (
    <div style={{ flex: '1 1 140px' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 4 }}>{heading}</p>
      <Stack gap={2}>
        {items.slice(0, 5).map((item) => (
          <p key={item.key} style={{ fontSize: '0.82rem', color: 'var(--ink-2)' }}>{item.key} · {item.count}</p>
        ))}
      </Stack>
    </div>
  );
}

function MatchBlock({ matchCount, errorCode }: { matchCount: MatchCount | null; errorCode: string | null }) {
  if (!matchCount) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
      {errorCode ? "Couldn't load matching postings right now." : ''}
    </p>;
  }
  if (matchCount.count === 0) {
    return <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>No matching postings yet. Check back soon.</p>;
  }
  return (
    <Stack gap={10}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ink)' }}>{matchCount.count}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>postings match your profile right now</span>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <BreakdownList heading="Top locations" items={matchCount.breakdown.byLocation} />
        <BreakdownList heading="Top roles" items={matchCount.breakdown.byRoleCategory} />
      </div>
    </Stack>
  );
}

function SalaryBlock({ benchmark, errorCode }: { benchmark: SalaryBenchmark | null; errorCode: string | null }) {
  if (!benchmark) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
      {errorCode ? "Couldn't load the salary benchmark right now." : ''}
    </p>;
  }
  if (benchmark.p50 === null) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Not enough matching postings yet to benchmark salary.</p>;
  }
  return (
    <div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>
        {formatLpa(benchmark.p25)} – {formatLpa(benchmark.p75)} (median {formatLpa(benchmark.p50)})
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 2 }}>
        Based on {benchmark.sampleSize} matching postings.
      </p>
    </div>
  );
}

function pickUpdatedAt(matchCount: MatchCount | null, benchmark: SalaryBenchmark | null): string | null {
  const stamps = [matchCount?.asOf, benchmark?.asOf].filter((s): s is string => Boolean(s));
  if (stamps.length === 0) return null;
  return stamps.reduce((oldest, s) => (new Date(s).getTime() < new Date(oldest).getTime() ? s : oldest));
}

export default function ProfileMarketCard() {
  const { matchCount, salaryBenchmark, matchErrorCode, salaryErrorCode, status } = useProfileMarketData();

  if (status === 'idle' || status === 'loading') {
    return (
      <Card>
        <Stack gap={10} dir="row" align="center">
          <Spinner size={18} />
          <span style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>Loading market snapshot…</span>
        </Stack>
      </Card>
    );
  }

  const updatedAt = pickUpdatedAt(matchCount, salaryBenchmark);
  return (
    <Card>
      <Stack gap={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Market snapshot</h3>
          {updatedAt && <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Updated {relativeTime(updatedAt)}</span>}
        </div>
        <MatchBlock matchCount={matchCount} errorCode={matchErrorCode} />
        <SalaryBlock benchmark={salaryBenchmark} errorCode={salaryErrorCode} />
      </Stack>
    </Card>
  );
}
