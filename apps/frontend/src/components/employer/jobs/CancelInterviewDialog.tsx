'use client';
// FILE: src/components/employer/jobs/CancelInterviewDialog.tsx
// Cancel with two paths: plain cancel (candidate notified, done) or cancel +
// immediately send a fresh pool scheduling link ("we freed up, try again").
// The resend path is disabled when the pool is empty or defaults are missing.
// The reason is required — it is emailed to the candidate. The dismiss control
// reads "Keep interview", never an ambiguous "Cancel". Same-day interviews get
// an extra are-you-sure warning (they may already be underway).

import { useEffect, useState } from 'react';
import { Modal, Button, Textarea, Stack, Alert, Tooltip, useToast } from '@/components/ui';
import { cancelInterview, EmployerInterviewsApiError } from '@/api/employer-interviews-api';
import { sendPoolSchedulingLink, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';

const REASON_MAX_LENGTH = 500;

export default function CancelInterviewDialog({
  open, interviewId, applicationId, candidateFirstName, isToday, canResend, resendDisabledReason, onKeep, onDone,
}: {
  open: boolean;
  interviewId: string;
  applicationId: string;
  candidateFirstName: string;
  /** Interview starts today (IST) — show the extra confirmation warning. */
  isToday: boolean;
  /** Pool has defaults + at least one available time. */
  canResend: boolean;
  resendDisabledReason: string;
  onKeep: () => void;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [cancelReason, setCancelReason] = useState('');
  const [busyAction, setBusyAction] = useState<'cancel' | 'resend' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setCancelReason(''); setError(null); }
  }, [open]);

  const busy = busyAction !== null;
  const reasonReady = cancelReason.trim().length > 0;

  async function runCancel(): Promise<boolean> {
    try {
      await cancelInterview(interviewId, { cancelReason: cancelReason.trim() });
      return true;
    } catch (caught) {
      setError(caught instanceof EmployerInterviewsApiError ? caught.message : 'Could not cancel. Try again.');
      return false;
    }
  }

  async function handleCancelOnly(): Promise<void> {
    if (busy || !reasonReady) return;
    setBusyAction('cancel'); setError(null);
    if (await runCancel()) {
      showToast('success', 'Interview cancelled.');
      onDone();
    }
    setBusyAction(null);
  }

  async function handleCancelAndResend(): Promise<void> {
    if (busy || !reasonReady || !canResend) return;
    setBusyAction('resend'); setError(null);
    if (!(await runCancel())) { setBusyAction(null); return; }
    try {
      await sendPoolSchedulingLink(applicationId);
      showToast('success', `Cancelled and new scheduling link sent to ${candidateFirstName}.`);
    } catch (caught) {
      if (caught instanceof EmployerInterviewTimesApiError && caught.code === 'POOL_EMPTY') {
        showToast('error', 'Interview cancelled. No available times to reschedule — add more on settings.');
      } else {
        showToast('error', 'Interview cancelled, but sending the new link failed. Use "Send scheduling link" to retry.');
      }
    }
    setBusyAction(null);
    onDone();
  }

  const resendButton = (
    <Button size="sm" loading={busyAction === 'resend'} disabled={busy || !reasonReady || !canResend} onClick={() => void handleCancelAndResend()}>
      Cancel and send new scheduling link
    </Button>
  );

  return (
    <Modal isOpen={open} onClose={() => { if (!busy) onKeep(); }} title="Cancel this interview?" footer={(
      <>
        <Button variant="secondary" size="sm" onClick={onKeep} disabled={busy}>Keep interview</Button>
        <Button variant="danger" size="sm" loading={busyAction === 'cancel'} disabled={busy || !reasonReady} onClick={() => void handleCancelOnly()}>
          Cancel interview
        </Button>
        {canResend ? resendButton : <Tooltip content={resendDisabledReason}>{resendButton}</Tooltip>}
      </>
    )}>
      <Stack gap={12}>
        {isToday && (
          <Alert type="warning">This interview is scheduled for today. Are you sure you want to cancel?</Alert>
        )}
        {error && <Alert type="error">{error}</Alert>}
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
          The candidate will be notified and the calendar entry will be removed.
        </p>
        <Textarea
          label="Reason"
          required
          hint="This reason is emailed to the candidate — keep it considerate."
          maxLength={REASON_MAX_LENGTH}
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
        />
      </Stack>
    </Modal>
  );
}
