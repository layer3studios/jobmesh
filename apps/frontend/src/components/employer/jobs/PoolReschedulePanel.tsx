'use client';
// FILE: src/components/employer/jobs/PoolReschedulePanel.tsx
// Pool reschedule with control over WHICH times the candidate sees. All times
// selected (default) → cancel + resend the pool link (candidate sees the live
// pool). A subset → cancel + per-candidate propose with exactly those times
// (candidate sees only them). The backend's per-candidate flow accepts 2–4
// slots, so a partial selection must be 2–4; select-all has no such limit.

import { useEffect, useState } from 'react';
import { Modal, Button, Stack, Alert, useToast } from '@/components/ui';
import { cancelInterview, proposeInterview } from '@/api/employer-interviews-api';
import { listInterviewTimes, sendPoolSchedulingLink, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import type { InterviewTime } from '@/types/employer-interviews';
import { groupTimesByIstDate } from './interview-time-grouping-helpers';
import { formatInterviewClockTime } from '@/utils/format-interview-time';

const RESCHEDULE_CANCEL_REASON = 'Rescheduled to new times';

export default function PoolReschedulePanel({
  open, postingId, interviewId, applicationId, candidateName, onKeep, onDone,
}: {
  open: boolean;
  postingId: string;
  interviewId: string;
  applicationId: string;
  candidateName: string;
  onKeep: () => void;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [times, setTimes] = useState<InterviewTime[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    listInterviewTimes(postingId, { status: 'available' })
      .then((rows) => {
        const future = rows.filter((row) => new Date(row.startAtUtc) > new Date());
        setTimes(future);
        setSelected(new Set(future.map((row) => row.id))); // default: everything
      })
      .catch(() => setError('Could not load available times.'));
  }, [open, postingId]);

  const allSelected = times.length > 0 && selected.size === times.length;
  const isPartial = selected.size > 0 && !allSelected;
  const partialOutOfRange = isPartial && (selected.size < 2 || selected.size > 4);
  const canSend = selected.size > 0 && !partialOutOfRange;

  function toggle(timeId: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(timeId)) next.delete(timeId);
      else next.add(timeId);
      return next;
    });
  }

  async function handleConfirm(): Promise<void> {
    if (submitting || !canSend) return;
    setSubmitting(true); setError(null);
    try {
      await cancelInterview(interviewId, { cancelReason: RESCHEDULE_CANCEL_REASON });
    } catch {
      setError('Could not reschedule. Try again.');
      setSubmitting(false);
      return;
    }
    try {
      if (allSelected) {
        await sendPoolSchedulingLink(applicationId);
      } else {
        const chosen = times.filter((time) => selected.has(time.id));
        await proposeInterview(applicationId, {
          proposedSlots: chosen.map((time) => ({ startAtUtc: time.startAtUtc, durationMinutes: time.durationMinutes })),
          durationMinutes: chosen[0].durationMinutes,
          mode: chosen[0].mode,
          meetingUrl: chosen[0].meetingUrl,
          locationText: chosen[0].locationText,
          interviewerEmployerUserIds: [],
          timezoneId: chosen[0].timezoneId,
        });
      }
      showToast('success', `Rescheduled — new invitation sent to ${candidateName}.`);
    } catch (caught) {
      if (caught instanceof EmployerInterviewTimesApiError && caught.code === 'POOL_EMPTY') {
        showToast('error', 'Interview cancelled but no available times to reschedule. Add more times on the posting settings.');
      } else {
        showToast('error', 'Interview cancelled, but sending the new invitation failed. Use "Send scheduling link" to retry.');
      }
    }
    setSubmitting(false);
    onDone();
  }

  return (
    <Modal isOpen={open} onClose={() => { if (!submitting) onKeep(); }} title={`Reschedule interview with ${candidateName}`} footer={(
      <>
        <Button variant="secondary" size="sm" onClick={onKeep} disabled={submitting}>Keep interview</Button>
        <Button size="sm" loading={submitting} disabled={submitting || !canSend} onClick={() => void handleConfirm()}>
          Send {selected.size} time{selected.size === 1 ? '' : 's'}
        </Button>
      </>
    )}>
      <Stack gap={12}>
        <Alert type="warning">The candidate&apos;s current calendar entry will be cancelled.</Alert>
        {error && <Alert type="error">{error}</Alert>}
        {times.length === 0 && !error && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No available times in the pool.</p>
        )}
        {groupTimesByIstDate(times).map((group) => (
          <div key={group.dateIso}>
            <p style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)' }}>{group.heading}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {group.activeTimes.map((time) => (
                <label key={time.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--ink)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected.has(time.id)} onChange={() => toggle(time.id)} />
                  {formatInterviewClockTime(time.startAtUtc)}
                </label>
              ))}
            </div>
          </div>
        ))}
        {times.length > 0 && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(times.map((time) => time.id)))}
            />
            Select all ({times.length} available)
          </label>
        )}
        {partialOutOfRange && (
          <p role="alert" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--danger)' }}>
            Pick 2–4 specific times, or select all to send the whole pool.
          </p>
        )}
      </Stack>
    </Modal>
  );
}
