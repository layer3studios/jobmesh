'use client';
// FILE: admin/ai-usage/parts/CurrentLimitsTable.tsx
// The live budget view: one row per model × key, showing how much of each
// ceiling is spent RIGHT NOW. Unlike the historical sections this comes from
// the server's in-memory tracker, so it changes between polls.
//
// Keys are identified by INDEX only — the backend never sends key material.

import type { AiKeyLimits, AiLimitBucket, AiModelLimits } from '@/types/admin-ai-usage';
import { compactNumber } from './ai-usage-format';

const TH = {
  textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--ink-faint)', padding: '6px 10px',
} as const;
const TD = { padding: '8px 10px', fontSize: '0.85rem', color: 'var(--ink)' } as const;

/** "12 / 17" plus a thin fill bar — the ratio reads faster than the numbers. */
function BudgetCell({ bucket, compact = false }: { bucket?: AiLimitBucket; compact?: boolean }) {
  if (!bucket) return <td style={TD}>—</td>;
  const ratio = bucket.limit > 0 ? Math.min(bucket.used / bucket.limit, 1) : 0;
  const nearLimit = ratio >= 0.85;
  const format = compact ? compactNumber : (value: number) => value.toLocaleString();
  return (
    <td style={TD}>
      <span style={{ color: nearLimit ? 'var(--danger)' : 'var(--ink)' }}>
        {format(bucket.used)} / {format(bucket.limit)}
      </span>
      <span aria-hidden style={{ display: 'block', height: 3, marginTop: 3, borderRadius: 999, background: 'var(--paper-2)' }}>
        <span style={{
          display: 'block', height: '100%', width: `${Math.round(ratio * 100)}%`,
          borderRadius: 999, background: nearLimit ? 'var(--danger)' : 'var(--accent)',
        }} />
      </span>
    </td>
  );
}

function LimitRow({ model, row }: { model: string; row: AiKeyLimits }) {
  // Exhausted either explicitly or because a ceiling is already met.
  const exhausted = row.exhausted
    ?? (row.rpd.used >= row.rpd.limit || row.rpm.used >= row.rpm.limit);
  return (
    <tr
      data-testid="limit-row"
      style={{ borderTop: '1px solid var(--border)', background: exhausted ? 'var(--danger-soft)' : 'transparent' }}
    >
      <td style={{ ...TD, fontWeight: 600 }}>{model}</td>
      <td style={TD}>#{row.keyIndex}</td>
      <BudgetCell bucket={row.rpm} />
      <BudgetCell bucket={row.rpd} />
      <BudgetCell bucket={row.tpm} compact />
      <td style={{ ...TD, color: exhausted ? 'var(--danger)' : 'var(--ink-muted)', fontSize: '0.78rem' }}>
        {exhausted ? 'Exhausted' : 'Available'}
      </td>
    </tr>
  );
}

export default function CurrentLimitsTable({ models }: { models: AiModelLimits[] }) {
  const hasRows = models.some((model) => model.keys.length > 0);
  if (!hasRows) {
    return (
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
        No AI calls yet this process — limits appear once the first request is made.
      </p>
    );
  }
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflowX: 'auto',
    }}>
      <table data-testid="limits-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
        <thead>
          <tr style={{ background: 'var(--paper-2)' }}>
            <th style={TH}>Model</th><th style={TH}>Key</th>
            <th style={TH}>RPM</th><th style={TH}>RPD</th><th style={TH}>TPM</th><th style={TH}>Status</th>
          </tr>
        </thead>
        <tbody>
          {models.flatMap((model) =>
            model.keys.map((row) => (
              <LimitRow key={`${model.model}-${row.keyIndex}`} model={model.model} row={row} />
            )))}
        </tbody>
      </table>
    </div>
  );
}
