'use client';
// FILE: admin/email-log/EmailLogClient.tsx
// Resend delivery events. Read-only — the rows are written by the webhook.
//
// Refresh is a button, not a poll: this is a log you come to read, and rows
// shifting under the cursor mid-read helps nobody.

import { useCallback, useEffect, useState } from 'react';
import { fetchEmailLog } from '@/api/admin-email-log-api';
import type { EmailEvent } from '@/types/admin-email-log';
import { relativeTime } from '../parts/mission-format';

const LIMIT = 100;

/** Resend's delivery outcomes. 'unknown' covers anything new they add. */
const TYPES = ['sent', 'delivered', 'delivery_delayed', 'bounced', 'complained', 'opened', 'clicked'];

/** Bounced and complained are failures; the word carries it, colour reinforces. */
const BAD_TYPES = new Set(['bounced', 'complained', 'delivery_delayed']);

const CONTROL = {
  padding: '7px 10px', borderRadius: 8, fontSize: '0.85rem',
  border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
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

const humanize = (type: string) => type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function TypeBadge({ type }: { type: string }) {
  const bad = BAD_TYPES.has(type);
  const color = bad ? 'var(--danger)' : 'var(--ink-2)';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
      color, border: `1px solid ${bad ? 'var(--danger)' : 'var(--border)'}`,
      background: bad ? 'transparent' : 'var(--paper-2)',
    }}>
      {humanize(type)}
    </span>
  );
}

function Skeletons() {
  return (
    <div data-testid="email-log-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="anim-pulse" style={{ height: 44, borderRadius: 10, background: 'var(--paper-2)' }} />
      ))}
    </div>
  );
}

export default function EmailLogClient() {
  const [events, setEvents] = useState<EmailEvent[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [recipient, setRecipient] = useState('');
  const [debouncedRecipient, setDebouncedRecipient] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRecipient(recipient), 300);
    return () => clearTimeout(timer);
  }, [recipient]);

  const load = useCallback(async (type: string, to: string) => {
    setError(false);
    setIsRefreshing(true);
    try {
      const payload = await fetchEmailLog({ type: type || undefined, to: to || undefined, limit: LIMIT });
      setEvents(payload.events);
      setConfigured(payload.configured);
    } catch {
      setError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(typeFilter, debouncedRecipient); }, [load, typeFilter, debouncedRecipient]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Email Log</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            {events ? `${events.length} most recent ${events.length === 1 ? 'event' : 'events'} (max ${LIMIT})` : 'Loading…'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(typeFilter, debouncedRecipient)}
          disabled={isRefreshing}
          style={{ ...CONTROL, fontWeight: 600, cursor: isRefreshing ? 'not-allowed' : 'pointer', opacity: isRefreshing ? 0.6 : 1 }}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {!configured && (
        <div role="status" style={{
          padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem',
          border: '1px solid var(--cat-amber)', color: 'var(--ink-2)', background: 'var(--paper-2)',
        }}>
          <strong>Webhook not configured.</strong> RESEND_WEBHOOK_SECRET is unset, so the
          receiver refuses every event and nothing is being recorded. An empty log here
          means the webhook was never wired up — not that no mail was sent.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="search"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          placeholder="Filter by recipient…"
          aria-label="Filter by recipient"
          style={{ ...CONTROL, flex: '1 1 220px', minWidth: 180 }}
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Event type"
          style={CONTROL}
        >
          <option value="">All types</option>
          {TYPES.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
        </select>
      </div>

      {error && !events && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load the email log.</span>
          <button type="button" onClick={() => void load(typeFilter, debouncedRecipient)} style={{ ...CONTROL, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {!events && !error && <Skeletons />}

      {events && (events.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No email events recorded.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={TH} scope="col">When</th>
                <th style={TH} scope="col">To</th>
                <th style={TH} scope="col">Subject</th>
                <th style={TH} scope="col">Event</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} data-testid="email-row">
                  <td style={TD} title={event.occurredAt ?? ''}>{relativeTime(event.occurredAt)}</td>
                  <td style={TD}>{event.to ?? '—'}</td>
                  <td style={{ ...TD, maxWidth: 320 }} title={event.subject ?? ''}>{event.subject ?? '—'}</td>
                  <td style={TD}><TypeBadge type={event.type} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
