'use client';
// FILE: src/components/employer/jobs/ScheduleInterviewModal.tsx
// Schedule / reschedule modal. All time entry is IST wall-clock via native
// datetime-local inputs (no picker library) and converted to UTC in the form
// hook. On failure the modal stays open with every entered value intact.

import { useId, useState } from 'react';
import { Modal, Button, Input, Textarea, Select, Radio, Stack, Alert } from '@/components/ui';
import { proposeInterview, rescheduleInterview, EmployerInterviewsApiError } from '@/api/employer-interviews-api';
import type { Interview } from '@/types/employer-interviews';
import { useScheduleInterviewForm, MINIMUM_SLOT_COUNT, MAXIMUM_SLOT_COUNT } from './useScheduleInterviewForm';

const GENERIC_ERROR = 'Something went wrong. Your entered times are kept — try again.';

const MODE_OPTIONS = [
  { value: 'video', label: 'Video call' },
  { value: 'phone', label: 'Phone call' },
  { value: 'in_person', label: 'In person' },
];
const DURATION_OPTIONS = [15, 30, 45, 60, 90].map((minutes) => ({ value: String(minutes), label: `${minutes} minutes` }));

export default function ScheduleInterviewModal({
  open, applicationId, candidateFirstName, rescheduleInterviewId = null, onClose, onSuccess, onViewExisting,
}: {
  open: boolean;
  applicationId: string;
  candidateFirstName: string;
  /** When set, the modal runs in reschedule mode against this interview. */
  rescheduleInterviewId?: string | null;
  onClose: () => void;
  onSuccess: (interview: Interview) => void;
  onViewExisting: () => void;
}) {
  const form = useScheduleInterviewForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadyActive, setAlreadyActive] = useState(false);
  const errorIdBase = useId();

  const isReschedule = rescheduleInterviewId !== null;
  const slotErrors = form.slotErrors();
  const errorForRow = (index: number) => slotErrors.find((error) => error.index === index)?.message ?? null;
  const fieldError = form.conditionalFieldError();
  // Reschedule sends only new times; the type/link fields are hidden and must
  // not gate submission.
  const canSubmit = form.times.filter((row) => row.value).length >= MINIMUM_SLOT_COUNT
    && slotErrors.length === 0
    && (isReschedule || fieldError === null);

  async function handleSubmit(): Promise<void> {
    if (submitting || !canSubmit) return;
    setSubmitting(true); setSubmitError(null); setAlreadyActive(false);
    try {
      const input = form.buildInput();
      const interview = isReschedule
        ? await rescheduleInterview(rescheduleInterviewId, { proposedSlots: input.proposedSlots })
        : await proposeInterview(applicationId, input);
      onSuccess(interview);
    } catch (caught) {
      if (caught instanceof EmployerInterviewsApiError && caught.code === 'INTERVIEW_ALREADY_ACTIVE') {
        setAlreadyActive(true);
      } else {
        setSubmitError(caught instanceof EmployerInterviewsApiError ? caught.message : GENERIC_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button>
      <Button size="sm" loading={submitting} disabled={!canSubmit || submitting} onClick={() => void handleSubmit()}>
        {isReschedule ? 'Send new times' : 'Send invitation'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={open}
      onClose={() => { if (!submitting) onClose(); }}
      title={isReschedule ? 'Reschedule interview' : `Schedule interview with ${candidateFirstName}`}
      footer={footer}
    >
      <Stack gap={16}>
        {isReschedule && (
          <Alert type="warning">
            The candidate&apos;s existing calendar entry will be cancelled and they will be asked to choose a new time.
          </Alert>
        )}
        {alreadyActive && (
          <Alert type="warning">
            <Stack gap={8}>
              <span>An interview is already active for this applicant.</span>
              <div><Button variant="secondary" size="sm" onClick={onViewExisting}>Close and view it</Button></div>
            </Stack>
          </Alert>
        )}
        {submitError && <Alert type="error">{submitError}</Alert>}

        {!isReschedule && (
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Interview type</legend>
            <Radio direction="horizontal" options={MODE_OPTIONS} value={form.mode} onChange={(value) => form.setMode(value as typeof form.mode)} />
          </fieldset>
        )}

        {!isReschedule && form.mode === 'video' && (
          <Input
            label="Meeting link"
            placeholder="https://meet.google.com/abc-defg-hij"
            hint="The candidate receives this link only after they confirm a time."
            error={form.meetingUrl ? fieldError ?? undefined : undefined}
            value={form.meetingUrl}
            onChange={(event) => form.setMeetingUrl(event.target.value)}
          />
        )}
        {!isReschedule && form.mode === 'phone' && (
          <>
            <Input
              label="Phone number" hint="The interviewer's number." value={form.phoneNumber}
              onChange={(event) => form.setPhoneNumber(event.target.value)}
            />
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Who calls whom?</legend>
              <Radio
                direction="horizontal"
                options={[{ value: 'we_call', label: 'We call candidate' }, { value: 'candidate_calls', label: 'Candidate calls us' }]}
                value={form.phoneCallDirection}
                onChange={(value) => form.setPhoneCallDirection(value as typeof form.phoneCallDirection)}
              />
            </fieldset>
          </>
        )}
        {!isReschedule && form.mode === 'in_person' && (
          <>
            <Textarea
              label="Address" value={form.address}
              hint="The candidate sees this before choosing a time, so they can judge travel."
              onChange={(event) => form.setAddress(event.target.value)}
            />
            <Textarea
              label="Arrival instructions (optional)" value={form.arrivalInstructions}
              placeholder="Floor, building name, ask for whom at reception, parking, etc."
              onChange={(event) => form.setArrivalInstructions(event.target.value)}
            />
          </>
        )}

        {!isReschedule && (
          <Select
            label="Duration"
            value={String(form.durationMinutes)}
            options={DURATION_OPTIONS}
            onChange={(event) => form.setDurationMinutes(Number(event.target.value))}
          />
        )}

        <Stack gap={8}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Proposed times</span>
          {form.times.map((row, index) => {
            const rowError = errorForRow(index);
            const errorId = `${errorIdBase}-slot-${index}`;
            // Keyed by the row's stable identity, NOT the index: removing a
            // middle row must not re-associate the surviving DOM inputs.
            return (
              <div key={row.rowId}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                    {`Option ${index + 1}`}
                    <input
                      type="datetime-local"
                      value={row.value}
                      aria-invalid={rowError ? true : undefined}
                      aria-describedby={rowError ? errorId : undefined}
                      onChange={(event) => form.setTimeAt(index, event.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', background: 'var(--surface-raised)', color: 'var(--ink)' }}
                    />
                  </label>
                  {index >= MINIMUM_SLOT_COUNT && (
                    <Button variant="ghost" size="sm" aria-label={`Remove option ${index + 1}`} onClick={() => form.removeTimeRow(index)}>Remove</Button>
                  )}
                </div>
                {rowError && <p id={errorId} role="alert" style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--danger)' }}>{rowError}</p>}
              </div>
            );
          })}
          {form.times.length < MAXIMUM_SLOT_COUNT && (
            <div><Button variant="ghost" size="sm" onClick={form.addTimeRow}>Add another time</Button></div>
          )}
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Times are in India Standard Time (IST).</p>
        </Stack>
      </Stack>
    </Modal>
  );
}
