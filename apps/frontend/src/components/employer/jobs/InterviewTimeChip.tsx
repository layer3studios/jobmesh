'use client';
// FILE: src/components/employer/jobs/InterviewTimeChip.tsx
// One existing time as a compact inline chip (replaces the old full-width
// row). Chips flow in a wrap row, so two times take one line instead of two
// full-width rows. The meeting link is NOT repeated per chip — it belongs to
// the date and renders once below the grid.

import { X } from 'lucide-react';
import type { InterviewTime } from '@/types/employer-interviews';
import { formatInterviewClockTime } from '@/utils/format-interview-time';

const AVAILABLE = { bg: 'var(--status-success-bg)', border: 'var(--success)', dot: 'var(--cat-green)' };

export default function InterviewTimeChip({ time, onRemove, readOnly = false }: {
  time: InterviewTime;
  onRemove: (timeId: string) => void;
  /** Past dates: view only, no remove affordance. */
  readOnly?: boolean;
}) {
  const isBooked = time.status === 'booked';
  const clock = formatInterviewClockTime(time.startAtUtc);

  return (
    <span
      data-testid={`time-chip-${time.status}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 7px', borderRadius: 999, fontSize: 11, whiteSpace: 'nowrap',
        background: isBooked ? 'var(--accent-soft)' : AVAILABLE.bg,
        border: `0.5px solid ${isBooked ? 'var(--accent)' : AVAILABLE.border}`,
        color: isBooked ? 'var(--accent)' : 'var(--ink)',
      }}
    >
      <span aria-hidden style={{
        width: 5, height: 5, borderRadius: 999, flexShrink: 0,
        background: isBooked ? 'var(--accent)' : AVAILABLE.dot,
      }} />
      {clock}
      {isBooked ? (
        <span style={{ fontSize: 10, opacity: 0.85 }}>booked</span>
      ) : !readOnly && (
        <button
          type="button"
          aria-label={`Remove ${clock}`}
          onClick={() => onRemove(time.id)}
          style={{
            display: 'inline-flex', alignItems: 'center', border: 0, background: 'transparent',
            padding: 0, marginLeft: 1, cursor: 'pointer', color: 'var(--ink-2)',
          }}
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
}
