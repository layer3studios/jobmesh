'use client';
// FILE: src/components/employer/jobs/CandidateTimeline.tsx
// Vertical candidate history: applied → scored → moves → interviews → notes,
// newest first (backend order). A 1px rail connects the dots; long feedback and
// note bodies expand on click. Scrolls internally past ~7 rows (panel-scroll),
// so the applicant page itself never grows.

import { useCallback, useEffect, useState } from 'react';
import {
  Inbox, Sparkles, ArrowRight, Calendar, CalendarCheck, CalendarX, Check, UserX, MessageSquare,
} from 'lucide-react';
import { Card, Button, Stack } from '@/components/ui';
import { fetchTimeline } from '@/api/employer-applicant-actions-api';
import type { TimelineEvent } from '@/types/employer-timeline';
import { formatCompactDuration } from './score-badge-helpers';
import { formatInterviewTimeShort } from '@/utils/format-interview-time';

const DOT: Record<TimelineEvent['type'], string> = {
  applied: 'var(--success)', scored: 'var(--success)', stage_move: 'var(--cat-blue)',
  interview_proposed: 'var(--cat-blue)', interview_booked: 'var(--cat-blue)',
  interview_completed: 'var(--success)', interview_no_show: 'var(--danger)',
  interview_cancelled: 'var(--warning)', note_added: 'var(--ink-faint)',
};

const ICON: Record<TimelineEvent['type'], typeof Inbox> = {
  applied: Inbox, scored: Sparkles, stage_move: ArrowRight,
  interview_proposed: Calendar, interview_booked: CalendarCheck,
  interview_completed: Check, interview_no_show: UserX,
  interview_cancelled: CalendarX, note_added: MessageSquare,
};

function eventLine(event: TimelineEvent, candidateName: string): { text: string; detail?: string } {
  switch (event.type) {
    case 'applied': return { text: `${candidateName} applied` };
    case 'scored': return { text: `AI scored ${event.score ?? '—'}/100` };
    case 'stage_move': return {
      text: `Moved to ${event.toStage ?? '—'}${event.actorName ? ` · ${event.actorName}` : ''}`,
    };
    case 'interview_proposed': return { text: 'Interview proposed' };
    case 'interview_booked': return {
      text: `Interview booked${event.bookedTime ? ` for ${formatInterviewTimeShort(event.bookedTime)}` : ''}`,
    };
    case 'interview_completed': return {
      text: `Interview completed${event.recommendation ? ` · ${event.recommendation.replace('_', ' ')}` : ''}`,
      detail: event.feedbackText ?? undefined,
    };
    case 'interview_no_show': return { text: 'No-show' };
    case 'interview_cancelled': return { text: 'Interview cancelled' };
    case 'note_added': return {
      text: `${event.authorName ?? 'Someone'}: ${event.text.length > 60 ? `${event.text.slice(0, 60)}…` : event.text}`,
      detail: event.text.length > 60 ? event.text : undefined,
    };
  }
}

function TimelineRow({ event, candidateName }: { event: TimelineEvent; candidateName: string }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON[event.type];
  const { text, detail } = eventLine(event, candidateName);
  return (
    <div data-testid={`timeline-${event.type}`} style={{ display: 'flex', gap: 10, position: 'relative', paddingBottom: 14 }}>
      <span aria-hidden style={{
        width: 8, height: 8, borderRadius: '50%', background: DOT[event.type],
        flexShrink: 0, marginTop: 4, marginLeft: -4.5, zIndex: 1,
      }} />
      <Icon size={13} aria-hidden style={{ color: 'var(--ink-faint)', flexShrink: 0, marginTop: 1.5 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink)' }}>{text}</p>
        {detail && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            style={{
              display: 'block', border: 0, background: 'transparent', padding: 0, marginTop: 2,
              cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem', color: 'var(--ink-2)',
              fontFamily: 'inherit', maxWidth: '100%',
              ...(expanded ? { whiteSpace: 'pre-wrap' } : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
            }}
          >
            {expanded ? detail : `${detail.slice(0, 80)}${detail.length > 80 ? '…' : ''}`}
          </button>
        )}
        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
          {formatCompactDuration(event.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function CandidateTimeline({ applicationId, candidateName }: {
  applicationId: string;
  candidateName: string | null;
}) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setEvents(await fetchTimeline(applicationId));
    } catch {
      setError(true);
    }
  }, [applicationId]);
  useEffect(() => { void load(); }, [load]);

  const name = candidateName?.trim() || 'Candidate';

  return (
    <Card>
      <Stack gap={12}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>Timeline</h3>
        {error && (
          <Stack dir="row" gap={10} align="center">
            <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load timeline</span>
            <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
          </Stack>
        )}
        {!error && events === null && (
          <div data-testid="timeline-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map((index) => (
              <div key={index} style={{ height: 14, borderRadius: 6, background: 'var(--paper-2)' }} />
            ))}
          </div>
        )}
        {!error && events?.length === 0 && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No activity yet</p>
        )}
        {!error && events && events.length > 0 && (
          <div
            className="panel-scroll"
            style={{
              borderLeft: '1px solid var(--border)', paddingLeft: 10, marginLeft: 4,
              maxHeight: 320, overflowY: 'auto',
            }}
          >
            {events.map((event, index) => (
              <TimelineRow key={`${event.type}-${event.timestamp}-${index}`} event={event} candidateName={name} />
            ))}
          </div>
        )}
      </Stack>
    </Card>
  );
}
