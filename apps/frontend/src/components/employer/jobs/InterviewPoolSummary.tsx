'use client';
// FILE: src/components/employer/jobs/InterviewPoolSummary.tsx
// Left-panel summary card: availability at a glance, per the calendar mockup.

import type { InterviewTime } from '@/types/employer-interviews';
import { summarizeTimes } from './interview-time-grouping-helpers';
import { utcIsoToIstLocal } from '@/utils/ist-datetime';

export default function InterviewPoolSummary({ times }: { times: InterviewTime[] }) {
  const summary = summarizeTimes(times);
  const dayCount = new Set(
    times
      .filter((time) => time.status === 'available' || time.status === 'booked')
      .map((time) => utcIsoToIstLocal(time.startAtUtc).slice(0, 10)),
  ).size;

  if (summary.total === 0) return null;
  return (
    <div style={{ background: 'var(--surface-raised)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 10 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
        {summary.available} available
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-2)' }}>
        {summary.booked} booked · across {dayCount} day{dayCount === 1 ? '' : 's'}
      </p>
    </div>
  );
}
