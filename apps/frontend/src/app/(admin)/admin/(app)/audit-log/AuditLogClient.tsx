'use client';
// FILE: admin/audit-log/AuditLogClient.tsx
// The admin audit trail. Read-only — the collection has no update or delete
// path, and this page adds none.
//
// Refresh is a button rather than a poll: an audit trail is something you come
// to read, and rows shifting under the cursor mid-read helps nobody.

import { useCallback, useEffect, useState } from 'react';
import { fetchAuditLog } from '@/api/admin-audit-log-api';
import type { AuditEntry } from '@/types/admin-audit-log';
import AuditTable, { humanizeEvent } from './parts/AuditTable';

const LIMIT = 100;

function Skeletons() {
  return (
    <div data-testid="audit-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="anim-pulse" style={{ height: 44, borderRadius: 10, background: 'var(--paper-2)' }} />
      ))}
    </div>
  );
}

export default function AuditLogClient() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [eventFilter, setEventFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (event: string, { silent = false } = {}) => {
    if (!silent) setError(false);
    setIsRefreshing(true);
    try {
      const payload = await fetchAuditLog(event || undefined, LIMIT);
      setEntries(payload.entries);
      // The event list is the backend's enum; keep whatever it last told us.
      if (payload.events.length > 0) setEvents(payload.events);
      setError(false);
    } catch {
      if (!silent) setError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(eventFilter); }, [load, eventFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Audit Log</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            {entries
              ? `${entries.length} most recent ${entries.length === 1 ? 'entry' : 'entries'} (max ${LIMIT})`
              : 'Loading…'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="audit-event-filter" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            Event
          </label>
          <select
            id="audit-event-filter"
            value={eventFilter}
            onChange={(changeEvent) => setEventFilter(changeEvent.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event} value={event}>{humanizeEvent(event)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load(eventFilter)}
            disabled={isRefreshing}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
              cursor: isRefreshing ? 'not-allowed' : 'pointer', opacity: isRefreshing ? 0.6 : 1,
            }}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && !entries && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load the audit log.</span>
          <button
            type="button" onClick={() => void load(eventFilter)}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!entries && !error && <Skeletons />}

      {entries && <AuditTable entries={entries} />}
    </div>
  );
}
