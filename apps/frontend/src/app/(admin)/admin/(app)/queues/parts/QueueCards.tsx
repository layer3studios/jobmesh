// FILE: admin/queues/parts/QueueCards.tsx
// One card per worker queue. A stall is stated with the WORD "Stalled" beside
// the colour, so the state survives without colour perception. The failed count
// is a button: it opens that queue's failed-job table.

import type { QueueSummary } from '@/types/admin-queue-monitor';
import { formatAge, isStalled, formatTimestamp } from './queue-format';

const CARD = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 12, padding: '14px 16px', minWidth: 0,
} as const;

const LABEL = {
  fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--ink-faint)',
} as const;

function StalledBadge() {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
      color: 'var(--danger)', border: '1px solid var(--danger)', background: 'transparent',
    }}>
      Stalled
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={LABEL}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

interface Props {
  queues: QueueSummary[];
  selectedKey: string | null;
  onSelect: (queueKey: string) => void;
}

export default function QueueCards({ queues, selectedKey, onSelect }: Props) {
  if (queues.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No queues reported.</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
      {queues.map((queue) => {
        const stalled = isStalled(queue.oldestPendingAgeMs);
        const selected = queue.key === selectedKey;
        return (
          <article
            key={queue.key}
            data-testid="queue-card"
            data-queue={queue.key}
            style={{
              ...CARD,
              borderColor: stalled ? 'var(--danger)' : 'var(--border)',
              boxShadow: selected ? '0 0 0 2px var(--ink-faint) inset' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{queue.label}</h3>
              {stalled && <StalledBadge />}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
              gap: 10, marginTop: 12,
            }}>
              {Object.entries(queue.counts).map(([status, count]) => (
                <Stat key={status} label={status} value={count.toLocaleString()} />
              ))}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
            }}>
              <Stat label="Oldest pending" value={formatAge(queue.oldestPendingAgeMs)} />
              <Stat label="Last completed" value={formatTimestamp(queue.lastCompletedAt)} />
            </div>

            {stalled && (
              <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: 'var(--danger)' }}>
                Stalled: work has been waiting {formatAge(queue.oldestPendingAgeMs)} for a worker.
              </p>
            )}

            <button
              type="button"
              onClick={() => onSelect(queue.key)}
              disabled={queue.failedCount === 0}
              aria-pressed={selected}
              style={{
                marginTop: 12, padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: queue.failedCount > 0 ? 'var(--danger)' : 'var(--ink-muted)',
                cursor: queue.failedCount > 0 ? 'pointer' : 'default',
              }}
            >
              {queue.failedCount > 0
                ? `${queue.failedCount} failed — view`
                : 'No failed jobs'}
            </button>
          </article>
        );
      })}
    </div>
  );
}
