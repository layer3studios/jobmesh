'use client';
// FILE: src/components/employer/jobs/InterviewCard.tsx
// Renders one interview's state inside the Interview section. Every time value
// goes through format-interview-time — no raw ISO strings in the UI. Actions
// (Reschedule / Cancel) appear only for active statuses AND only when the
// viewer may manage interviews (member or higher) — canManage is decided by the
// parent via team-permissions.

import { useState } from 'react';
import { Badge, Button, Stack } from '@/components/ui';
import type { Interview } from '@/types/employer-interviews';
import { formatInterviewTime, formatInterviewTimeShort } from '@/utils/format-interview-time';
import { recommendationLabel, recommendationBadgeStyle } from './interview-feedback-helpers';
import InterviewModeDetails from './InterviewModeDetails';

/** Completed with a verdict: badge in colour + expandable feedback text. */
function CompletedState({ interview }: { interview: Interview }) {
  const [expanded, setExpanded] = useState(false);
  const when = interview.completedAt ?? interview.startAtUtc;
  return (
    <Stack gap={8}>
      <Stack dir="row" gap={8} align="center" wrap>
        <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>Feedback submitted</span>
        {interview.recommendation && (
          <span style={recommendationBadgeStyle(interview.recommendation)}>
            {recommendationLabel(interview.recommendation)}
          </span>
        )}
        <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          {when ? formatInterviewTimeShort(when) : '—'}
        </span>
      </Stack>
      {interview.feedbackText && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          style={{
            border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left',
            fontSize: '0.82rem', color: 'var(--ink-2)', fontFamily: 'inherit',
            ...(expanded ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
          }}
        >
          {interview.feedbackText}
        </button>
      )}
    </Stack>
  );
}

const MODE_LABELS: Record<Interview['mode'], string> = {
  video: 'Video call', phone: 'Phone call', in_person: 'In person',
};

export default function InterviewCard({
  interview, canManage, candidatePhone = null, onReschedule, onCancel,
}: {
  interview: Interview;
  canManage: boolean;
  /** From the contact record — the "we call the candidate" phone display. */
  candidatePhone?: string | null;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const { status } = interview;
  // Same-day guard (Greenhouse rule): a PAST interview may already have
  // happened — hide Reschedule/Cancel entirely; mark-no-show / mark-completed
  // are the future actions there. (The today-warning lives in the dialog.)
  const isPastScheduled = status === 'scheduled'
    && interview.startAtUtc !== null
    && new Date(interview.startAtUtc) < new Date();
  const showActions = canManage && !isPastScheduled && (status === 'proposed' || status === 'scheduled');
  const actions = showActions ? (
    <Stack dir="row" gap={8}>
      <Button variant="secondary" size="sm" onClick={onReschedule}>Reschedule</Button>
      <Button variant="danger" size="sm" onClick={onCancel}>Cancel</Button>
    </Stack>
  ) : isPastScheduled && (
    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
      This interview&apos;s time has passed.
    </p>
  );

  if (status === 'proposed') {
    return (
      <Stack gap={10}>
        <div><Badge variant="warning">Awaiting candidate</Badge></div>
        <Stack gap={4}>
          {interview.proposedSlots.map((slot, index) => (
            <span key={index} style={{ fontSize: '0.85rem', color: 'var(--ink-2)' }}>{formatInterviewTimeShort(slot.startAtUtc)}</span>
          ))}
        </Stack>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
          The candidate has been emailed a booking link. It expires on {formatInterviewTimeShort(interview.bookingTokenExpiresAt)}.
        </p>
        {actions}
      </Stack>
    );
  }

  if (status === 'scheduled') {
    return (
      <Stack gap={10}>
        <div><Badge variant="success">Confirmed</Badge></div>
        <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)' }}>
          {interview.startAtUtc ? formatInterviewTime(interview.startAtUtc) : '—'}
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-2)' }}>
          {MODE_LABELS[interview.mode]}
        </p>
        <InterviewModeDetails interview={interview} candidatePhone={candidatePhone} />
        {actions}
      </Stack>
    );
  }

  if (status === 'cancelled') {
    return (
      <Stack gap={8}>
        <div><Badge variant="neutral">Cancelled</Badge></div>
        {interview.cancelReason && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>Reason: {interview.cancelReason}</p>
        )}
      </Stack>
    );
  }

  // completed / no_show — read-only historical state.
  return (
    <Stack gap={8}>
      <Stack dir="row" gap={8} align="center">
        <Badge variant={status === 'completed' ? 'success' : 'danger'}>
          {status === 'completed' ? 'Completed' : 'No-show'}
        </Badge>
        <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          {interview.startAtUtc ? formatInterviewTimeShort(interview.startAtUtc) : '—'}
        </span>
      </Stack>
      {status === 'completed' && <CompletedState interview={interview} />}
    </Stack>
  );
}
