// FILE: admin/seo/parts/SeoPanels.tsx
// Presentational pieces of the SEO panel. Every problem state is a WORD next to
// the colour — a count of postings missing salary is useless if the only cue is
// that the number is red.

import { Button } from '@/components/ui';
import type { SchemaHealth, IndexingStats, StaleUrl } from '@/types/admin-seo';
import { relativeTime } from '../../parts/mission-format';

const CARD = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 12, padding: '12px 14px', minWidth: 0,
} as const;

const LABEL = {
  fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--ink-faint)',
} as const;

const TH = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
} as const;

const TD = {
  padding: '8px 10px', fontSize: '0.82rem', color: 'var(--ink)',
  borderBottom: '1px solid var(--border)', verticalAlign: 'top',
} as const;

/** A gap tile: the count plus the word "missing" when there is anything to fix. */
function GapTile({ label, value, total }: { label: string; value: number; total: number }) {
  const bad = value > 0;
  return (
    <div style={{ ...CARD, borderColor: bad ? 'var(--danger)' : 'var(--border)' }}>
      <div style={LABEL}>{label}</div>
      <div style={{
        fontSize: '1.5rem', fontWeight: 700, marginTop: 4, lineHeight: 1.1,
        color: bad ? 'var(--danger)' : 'var(--ink)',
      }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>
        {bad ? `missing of ${total}` : 'all complete'}
      </div>
    </div>
  );
}

export function SchemaHealthPanel({ schema }: { schema: SchemaHealth }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
      <div style={CARD}>
        <div style={LABEL}>Live postings</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginTop: 4, lineHeight: 1.1 }}>
          {schema.total.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>with a public page</div>
      </div>
      <GapTile label="No salary" value={schema.missingSalary} total={schema.total} />
      <GapTile label="No location" value={schema.missingLocation} total={schema.total} />
      <GapTile label="No job type" value={schema.missingEmploymentType} total={schema.total} />
    </div>
  );
}

export function QuotaBar({ indexing }: { indexing: IndexingStats }) {
  const used = Math.min(indexing.submittedToday, indexing.dailyQuota);
  const ratio = indexing.dailyQuota > 0 ? used / indexing.dailyQuota : 0;
  const nearLimit = ratio >= 0.9;
  return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={LABEL}>Submitted today</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: nearLimit ? 'var(--danger)' : 'var(--ink)' }}>
          {indexing.submittedToday} / {indexing.dailyQuota}
          {nearLimit && ' · Near limit'}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={used} aria-valuemin={0} aria-valuemax={indexing.dailyQuota}
        aria-label="Daily indexing quota used"
        style={{ height: 8, borderRadius: 999, background: 'var(--paper-2)', marginTop: 8, overflow: 'hidden' }}
      >
        <div style={{
          width: `${Math.round(ratio * 100)}%`, height: '100%',
          background: nearLimit ? 'var(--danger)' : 'var(--accent)',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        {Object.entries(indexing.counts).map(([status, count]) => (
          <span key={status} style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
            {status}: <strong style={{ color: 'var(--ink)' }}>{count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export function FailuresTable({ failures, busyId, onRetry }: {
  failures: IndexingStats['recentFailures'];
  busyId: string | null;
  onRetry: (jobId: string) => void;
}) {
  if (failures.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No failed submissions.</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
        <thead>
          <tr>
            <th style={TH} scope="col">When</th>
            <th style={TH} scope="col">URL</th>
            <th style={TH} scope="col">Action</th>
            <th style={TH} scope="col">Error</th>
            <th style={TH} scope="col">Retry</th>
          </tr>
        </thead>
        <tbody>
          {failures.map((failure) => (
            <tr key={failure.id} data-testid="failure-row">
              <td style={TD}>{relativeTime(failure.completedAt)}</td>
              <td style={{ ...TD, maxWidth: 260, wordBreak: 'break-all', fontSize: '0.75rem' }}>{failure.url ?? '—'}</td>
              <td style={TD}>{failure.action === 'URL_DELETED' ? 'Removal' : 'Update'}</td>
              <td style={{ ...TD, color: 'var(--danger)', maxWidth: 240 }} title={failure.lastError ?? ''}>
                {failure.lastError ?? '—'}
              </td>
              <td style={TD}>
                <Button
                  size="sm" variant="secondary"
                  loading={busyId === failure.id} disabled={busyId !== null}
                  onClick={() => onRetry(failure.id)}
                >
                  Retry
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StaleUrlsTable({ rows, busyId, onSubmitRemoval }: {
  rows: StaleUrl[];
  busyId: string | null;
  onSubmitRemoval: (postingId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
        Every closed posting has had its removal submitted.
      </p>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
        <thead>
          <tr>
            <th style={TH} scope="col">Posting</th>
            <th style={TH} scope="col">Status</th>
            <th style={TH} scope="col">Closed</th>
            <th style={TH} scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.postingId} data-testid="stale-row">
              <td style={{ ...TD, fontWeight: 600 }}>{row.title ?? '(untitled)'}</td>
              <td style={TD}>{row.status ?? '—'}</td>
              <td style={TD} title={row.closedAt ?? ''}>{relativeTime(row.closedAt)}</td>
              <td style={TD}>
                <Button
                  size="sm" variant="secondary"
                  loading={busyId === row.postingId} disabled={busyId !== null}
                  onClick={() => onSubmitRemoval(row.postingId)}
                >
                  Submit removal
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
