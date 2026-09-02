// FILE: admin/audit-log/parts/AuditTable.tsx
// The append-only audit trail, newest first. Read-only by design: audit_log has
// no update or delete path anywhere, and this table offers no action.

import type { AuditEntry } from '@/types/admin-audit-log';
import { relativeTime } from '../../parts/mission-format';

const TH = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
} as const;

const TD = {
  padding: '8px 10px', fontSize: '0.82rem', color: 'var(--ink)',
  borderBottom: '1px solid var(--border)', verticalAlign: 'top',
} as const;

const MONO = { fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem' } as const;

/** "admin_role_changed" → "admin role changed". */
export const humanizeEvent = (event: string): string => event.replace(/_/g, ' ');

function EventBadge({ event }: { event: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
      color: 'var(--ink-2)', border: '1px solid var(--border)', background: 'var(--paper-2)',
    }}>
      {humanizeEvent(event)}
    </span>
  );
}

/** Compact key=value rendering; objects fall back to JSON so nothing is hidden. */
function Details({ metadata }: { metadata: Record<string, unknown> }) {
  const pairs = Object.entries(metadata ?? {});
  if (pairs.length === 0) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
      {pairs.map(([key, value]) => (
        <span key={key} style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--ink-faint)' }}>{key}=</span>
          <span style={{ color: 'var(--ink)' }}>
            {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
          </span>
        </span>
      ))}
    </span>
  );
}

export default function AuditTable({ entries, now }: { entries: AuditEntry[]; now?: Date }) {
  if (entries.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No audit entries.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
        <thead>
          <tr>
            <th style={TH} scope="col">When</th>
            <th style={TH} scope="col">Event</th>
            <th style={TH} scope="col">Actor</th>
            <th style={TH} scope="col">Target</th>
            <th style={TH} scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} data-testid="audit-row">
              <td style={TD} title={entry.createdAt ?? ''}>{relativeTime(entry.createdAt, now)}</td>
              <td style={TD}><EventBadge event={entry.event} /></td>
              <td style={TD}>
                <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>{entry.actorType ?? '—'}</div>
                <div style={MONO}>{entry.actorId ?? '—'}</div>
              </td>
              <td style={TD}>
                <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>{entry.targetType ?? '—'}</div>
                <div style={MONO}>{entry.targetId ?? '—'}</div>
              </td>
              <td style={{ ...TD, maxWidth: 380 }}><Details metadata={entry.metadata} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
