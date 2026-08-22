'use client';
// FILE: src/components/employer/jobs/InterviewSection.tsx
// The "Interview" section of the applicant detail sidebar. Members and above
// can schedule; an interviewer sees the section (and any existing interview)
// but never an action they cannot take — no disabled button, no tooltip.
// The backend 403s regardless; this gate only keeps the UI honest.

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Alert, Stack, Tooltip, useToast } from '@/components/ui';
import { sendPoolSchedulingLink, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import { useSchedulingPool } from './useSchedulingPool';
import { useApplicantInterviews } from '@/hooks/employer/useApplicantInterviews';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canScheduleInterview } from '@/lib/team-permissions';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import InterviewCard from './InterviewCard';
import InterviewFeedbackPrompt from './InterviewFeedbackPrompt';
import CancelInterviewDialog from './CancelInterviewDialog';
import PoolReschedulePanel from './PoolReschedulePanel';
import FeedbackArchiveDialog from './FeedbackArchiveDialog';
import { isAwaitingFeedback } from './interview-feedback-helpers';
import type { Interview } from '@/types/employer-interviews';
import type { Stage, ArchiveReason } from '@/types/employer-applicants';
import { utcIsoToIstLocal } from '@/utils/ist-datetime';

/** Pool interviews carry source 'pool'; older payloads lack the field, but a
 *  pool interview is also the only kind with an empty proposedSlots. */
const isPoolInterview = (interview: Interview): boolean =>
  interview.source === 'pool' || interview.proposedSlots.length === 0;

/** True when the interview's start falls on today's IST calendar day. */
const startsTodayIst = (interview: Interview): boolean =>
  interview.startAtUtc !== null
  && utcIsoToIstLocal(interview.startAtUtc).slice(0, 10) === utcIsoToIstLocal(new Date().toISOString()).slice(0, 10);

export default function InterviewSection({
  applicationId, candidateName, candidatePhone = null, stages = [], reasons = [], onApplicantChanged,
}: {
  applicationId: string;
  candidateName: string | null;
  candidatePhone?: string | null; // contact's number — phone-mode "call candidate at"
  // stages/reasons feed the post-feedback move/archive nudges; onApplicantChanged
  // fires after either lands so the parent reloads. All optional for old callers.
  stages?: Stage[];
  reasons?: ArchiveReason[];
  onApplicantChanged?: () => void;
}) {
  const { interviews, loading, error, refetch, activeInterview, hasActiveInterview } = useApplicantInterviews(applicationId);
  const { viewerRole } = useEmployer();
  const { showToast } = useToast();
  const params = useParams<{ postingId: string }>();
  const postingId = typeof params?.postingId === 'string' ? params.postingId : '';
  const { hasDefaults, availableCount, refetchPool } = useSchedulingPool(postingId);
  const [sendingLink, setSendingLink] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [poolRescheduleOpen, setPoolRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // UX gate only — the backend enforces truth. Unknown role → allow.
  const allowManage = viewerRole ? canScheduleInterview(viewerRole) : true;
  const candidateFirstName = candidateName?.trim().split(/\s+/)[0] || 'the candidate';
  const latestInterview = interviews[0] ?? null;
  const displayInterview = activeInterview ?? latestInterview;

  function closeModals(): void {
    setScheduleOpen(false);
    setRescheduleId(null);
  }

  async function handleSendSchedulingLink(): Promise<void> {
    if (sendingLink) return;
    setSendingLink(true); setActionError(null);
    try {
      await sendPoolSchedulingLink(applicationId);
      showToast('success', `Scheduling link sent to ${candidateFirstName}`);
    } catch (caught) {
      if (caught instanceof EmployerInterviewTimesApiError && caught.code === 'INTERVIEW_ALREADY_ACTIVE') {
        showToast('error', 'An interview is already active for this applicant.');
      } else if (caught instanceof EmployerInterviewTimesApiError && caught.code === 'NO_INTERVIEW_DEFAULTS') {
        showToast('error', 'Set up interview details on the posting settings first.');
      } else if (caught instanceof EmployerInterviewTimesApiError && caught.code === 'POOL_EMPTY') {
        showToast('error', 'No available times remaining.');
      } else {
        showToast('error', 'Could not send the scheduling link. Try again.');
      }
    } finally {
      setSendingLink(false);
      await refetch();
      await refetchPool();
    }
  }

  return (
    <Card>
      <Stack gap={12}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>Interview</h3>
        {error && <Alert type="error">{error}</Alert>}
        {actionError && <Alert type="error">{actionError}</Alert>}
        {/* Ended but never marked → the feedback prompt (managers only). */}
        {!loading && displayInterview && allowManage && isAwaitingFeedback(displayInterview) ? (
          <InterviewFeedbackPrompt
            interview={displayInterview} candidateName={candidateName} stages={stages}
            onOutcome={() => { void refetch(); onApplicantChanged?.(); }}
            onArchiveRequested={() => setArchiveOpen(true)}
          />
        ) : !loading && displayInterview && (
          <InterviewCard
            interview={displayInterview} canManage={allowManage} candidatePhone={candidatePhone}
            // Pool interviews reschedule via cancel + fresh link (no manual
            // time entry); per-candidate ones keep the manual-slots modal.
            onReschedule={() => (isPoolInterview(displayInterview)
              ? setPoolRescheduleOpen(true)
              : setRescheduleId(displayInterview.id))}
            onCancel={() => setCancelOpen(true)}
          />
        )}
        {!loading && !hasActiveInterview && allowManage && (
          <Stack dir="row" gap={8}>
            {/* Pool fast-path (primary). When defaults were never configured the
                button shows disabled with a pointer to the settings tab — telling
                the employer what to do instead of hiding the feature. */}
            {!hasDefaults ? (
              <Tooltip content="Set up interview scheduling on the posting settings tab.">
                <Button size="sm" disabled>Send scheduling link</Button>
              </Tooltip>
            ) : availableCount === 0 ? (
              <Tooltip content="No available times — add more on the posting settings">
                <Button size="sm" disabled>Send scheduling link</Button>
              </Tooltip>
            ) : (
              <Button
                size="sm"
                loading={sendingLink}
                disabled={sendingLink}
                onClick={() => void handleSendSchedulingLink()}
              >
                Send scheduling link
              </Button>
            )}
            {/* Manual escape hatch (secondary). */}
            <Button variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}>Schedule interview</Button>
          </Stack>
        )}
      </Stack>

      {(scheduleOpen || rescheduleId !== null) && (
        <ScheduleInterviewModal
          open
          applicationId={applicationId}
          candidateFirstName={candidateFirstName}
          rescheduleInterviewId={rescheduleId}
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            showToast('success', rescheduleId ? `New times sent to ${candidateFirstName}` : `Invitation sent to ${candidateFirstName}`);
            void refetch();
          }}
          onViewExisting={() => { closeModals(); void refetch(); }}
        />
      )}
      {activeInterview && (
        <CancelInterviewDialog
          open={cancelOpen}
          interviewId={activeInterview.id}
          applicationId={applicationId}
          candidateFirstName={candidateFirstName}
          isToday={startsTodayIst(activeInterview)}
          canResend={hasDefaults && availableCount > 0}
          resendDisabledReason={!hasDefaults
            ? 'Set up interview scheduling on the posting settings tab.'
            : 'No available times — add more on the posting settings'}
          onKeep={() => setCancelOpen(false)}
          onDone={() => { setCancelOpen(false); void refetch(); void refetchPool(); }}
        />
      )}
      {/* Post-feedback archive nudge — wraps the shared archive dialog. */}
      <FeedbackArchiveDialog
        open={archiveOpen} applicationId={applicationId} reasons={reasons}
        candidateFirstName={candidateFirstName}
        onClose={() => setArchiveOpen(false)} onArchived={() => onApplicantChanged?.()}
      />
      {activeInterview && (
        <PoolReschedulePanel
          open={poolRescheduleOpen}
          postingId={postingId}
          interviewId={activeInterview.id}
          applicationId={applicationId}
          candidateName={candidateFirstName}
          onKeep={() => setPoolRescheduleOpen(false)}
          onDone={() => { setPoolRescheduleOpen(false); void refetch(); void refetchPool(); }}
        />
      )}
    </Card>
  );
}
