'use client';
// FILE: admin/ai-usage/parts/AiUsageCharts.tsx
// The by-tier cards, the by-model table, and the CSS-only daily bar chart.
// No chart library: bar height is a percentage of the busiest day, and the
// exact numbers live in each bar's title tooltip.

import type { AiDayUsage, AiModelUsage, AiTier, AiTierUsage } from '@/types/admin-ai-usage';
import { TIER_COLOR, TIERS, compactNumber, tierForModel, shortDate } from './ai-usage-format';

const CARD = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14,
} as const;
const TH = {
  textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--ink-faint)', padding: '6px 10px',
} as const;
const TD = { padding: '8px 10px', fontSize: '0.85rem', color: 'var(--ink)' } as const;

export function TierCards({ byTier }: { byTier: Record<AiTier, AiTierUsage> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
      {TIERS.map((tier) => {
        const usage = byTier?.[tier] ?? { requests: 0, tokens: 0, errors: 0 };
        return (
          <div key={tier} data-testid={`tier-card-${tier}`} style={{ ...CARD, borderTop: `3px solid ${TIER_COLOR[tier]}` }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: TIER_COLOR[tier], textTransform: 'capitalize' }}>
              {tier}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>
              {usage.requests.toLocaleString()}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              {compactNumber(usage.tokens)} tokens · {usage.errors} error{usage.errors === 1 ? '' : 's'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function ModelTable({ byModel }: { byModel: AiModelUsage[] }) {
  if (byModel.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No model activity in this range.</p>;
  }
  return (
    <div style={{ ...CARD, padding: 0, overflowX: 'auto' }}>
      <table data-testid="model-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr style={{ background: 'var(--paper-2)' }}>
            <th style={TH}>Model</th><th style={TH}>Requests</th><th style={TH}>Tokens</th>
            <th style={TH}>Avg tokens/req</th><th style={TH}>Cache hits</th><th style={TH}>Errors</th>
          </tr>
        </thead>
        <tbody>
          {byModel.map((row) => (
            <tr key={row.model} data-testid="model-row" style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ ...TD, fontWeight: 600, color: TIER_COLOR[tierForModel(row.model)] }}>{row.model}</td>
              <td style={TD}>{row.requests.toLocaleString()}</td>
              <td style={TD}>{compactNumber(row.tokens)}</td>
              <td style={TD}>{row.avgTokensPerRequest.toLocaleString()}</td>
              <td style={TD}>{row.cacheHits.toLocaleString()}</td>
              <td style={{ ...TD, color: row.errors > 0 ? 'var(--danger)' : 'var(--ink)' }}>{row.errors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DailyBars({ byDay }: { byDay: AiDayUsage[] }) {
  if (byDay.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No daily activity in this range.</p>;
  }
  // Scale to the busiest day so the tallest bar always fills the plot.
  const peak = Math.max(...byDay.map((day) => day.requests), 1);
  return (
    <div style={{ ...CARD }}>
      <div data-testid="daily-bars" style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
        {byDay.map((day) => (
          <div key={day.date} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              data-testid="daily-bar"
              title={`${day.date} · ${day.requests} requests · ${compactNumber(day.tokens)} tokens · ${day.cacheHits} cache hits · ${day.errors} errors`}
              style={{
                width: '100%', height: `${Math.round((day.requests / peak) * 100)}%`, minHeight: 2,
                background: 'var(--accent)', borderRadius: '4px 4px 0 0',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {byDay.map((day) => (
          <span key={day.date} style={{
            flex: 1, minWidth: 0, textAlign: 'center', fontSize: '0.65rem',
            color: 'var(--ink-faint)', overflow: 'hidden', whiteSpace: 'nowrap',
          }}>
            {shortDate(day.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
