'use client';
// FILE: src/components/employer/jobs/PostingForm.tsx
// Reusable create/edit posting form. Owns local field state, validates client-
// side (mirroring the backend), maps server error codes per field, and calls
// onSubmit with the typed payload. Double submit is blocked both visually
// (disabled button) and logically (a synchronous ref guard — state is stale in
// the click closure during a rapid double-click) (R1).

import { useMemo, useRef, useState } from 'react';
import { Input, Button, Alert, Stack, Checkbox } from '@/components/ui';
import { PillToggleGroup } from './PillToggle';
import { TYPE } from '@/theme/tokens';
import { JobDescriptionTextarea } from '@/components/employer/JobDescriptionTextarea';
import { EmployerJobsApiError, setPostingAssignment } from '@/api/employer-jobs-api';
import type { PostingCreateInput } from '@/types/employer-jobs';
import type { EmployerAssignment } from '@/types/employer-assignments';
import {
  validatePostingFormValues, validateSalaryStrings, buildPostingInput, mapServerErrorToFields,
  isoToDeadlineInput, minimumDeadlineDate, deadlineError,
} from '@/components/employer/jobs/posting-form-helpers';
import type { PostingFormValues, PostingFormErrors } from '@/components/employer/jobs/posting-form-helpers';
import AssignmentSection from '@/components/employer/jobs/parts/AssignmentSection';
import type { AssignmentSectionState } from '@/components/employer/jobs/parts/AssignmentSection';
import AssignmentSwapDialog from '@/components/employer/jobs/parts/AssignmentSwapDialog';
import { useEmployer } from '@/context/employer/EmployerContext';
import { trackEvent } from '@/lib/analytics-events';
import { needsConfirm, buildConfirmCopy } from '@/components/employer/jobs/parts/assignment-section-helpers';
import type { ConfirmCopy } from '@/components/employer/jobs/parts/assignment-section-helpers';

interface Props {
  initialValues?: Partial<PostingCreateInput>;
  submitLabel: string;
  /**
   * Returning the saved posting is optional and only the CREATE surface needs to:
   * the form uses the new id to attach the assignment. Existing callers returning
   * Promise<void> still satisfy this.
   */
  onSubmit: (input: PostingCreateInput) => Promise<{ id: string } | void>;
  onCancel?: () => void;
  /** Fired on every field change — feeds the New page's live preview. */
  onValuesChange?: (values: PostingFormValues) => void;
  /**
   * Present only on the EDIT surface. Its absence is what tells the assignment
   * section it is on create — where there is no posting to attach to yet and
   * therefore nobody who could have applied. One form, two surfaces (rule 1).
   */
  postingId?: string;
  /** Optional override; the section reads it from the server when omitted. */
  applicationCount?: number;
  initialAssignmentId?: string | null;
  /**
   * Called once the WHOLE save succeeded, including the assignment attach. The
   * create surface navigates away here rather than inside onSubmit: navigating on
   * posting-created would unmount the form mid-flight and strand the attach.
   */
  onSubmitted?: (result: { id: string } | void) => void;
}

const WORKPLACE_OPTIONS = [
  { value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'On-site' },
];
// Internship stays as a fourth pill — dropping it would remove the ability to
// create internship postings (the API value set is unchanged).
const EMPLOYMENT_OPTIONS = [
  { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
];

const TWO_COLUMN_ROW = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
} as const;

export default function PostingForm({
  initialValues, submitLabel, onSubmit, onCancel, onValuesChange,
  postingId, applicationCount, initialAssignmentId = null, onSubmitted,
}: Props) {
  const [values, setValues] = useState<PostingFormValues>(() => ({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    location: initialValues?.location ?? '',
    workplaceType: initialValues?.workplaceType ?? '',
    employmentType: initialValues?.employmentType ?? '',
    salaryMinStr: initialValues?.salaryMin != null ? String(initialValues.salaryMin) : '',
    salaryMaxStr: initialValues?.salaryMax != null ? String(initialValues.salaryMax) : '',
    applicationDeadline: isoToDeadlineInput(initialValues?.applicationDeadline),
    autoCloseOnDeadline: initialValues?.autoCloseOnDeadline === true,
  }));
  // Computed once per mount: "tomorrow" only has to be right when the form opens.
  const minimumDeadline = useMemo(() => minimumDeadlineDate(), []);
  const [errors, setErrors] = useState<PostingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const submittingRef = useRef(false);
  const { company } = useEmployer();
  const companyId = company?.id ?? '';

  // ── Assignment attachment. Entirely inert while the toggle is off. ──────────
  const isEdit = postingId != null;
  const [assignment, setAssignment] = useState<AssignmentSectionState>({
    enabled: initialAssignmentId != null,
    assignmentId: initialAssignmentId,
    assignmentTitle: null,
  });
  // The server's view, filled in by the section's own read on the edit surface.
  const [serverCount, setServerCount] = useState<number>(applicationCount ?? 0);
  const [attachedAssignment, setAttachedAssignment] = useState<EmployerAssignment | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmCopy | null>(null);
  // A create that succeeded but whose attach failed. The posting EXISTS — this is a
  // retry affordance, never a rollback.
  const [attachRetry, setAttachRetry] = useState<{ postingId: string; assignmentId: string | null } | null>(null);

  const nextAssignmentId = assignment.enabled ? assignment.assignmentId : null;
  const assignmentChanged = nextAssignmentId !== initialAssignmentId;

  const setField = <K extends keyof PostingFormValues>(key: K, value: PostingFormValues[K]) =>
    setValues((previous) => {
      const next = { ...previous, [key]: value };
      onValuesChange?.(next);
      return next;
    });

  const canSubmit = useMemo(() => (
    values.title.trim().length >= 2 && values.description.trim().length >= 50
    && values.location.trim().length >= 1 && values.workplaceType !== ''
    && values.employmentType !== '' && !isSubmitting
  ), [values, isSubmitting]);

  const handleSalaryBlur = () => {
    const { error } = validateSalaryStrings(values.salaryMinStr, values.salaryMaxStr);
    setErrors((previous) => ({ ...previous, salary: error }));
  };

  /**
   * Attach / swap / detach. Separated from the posting save because the attachment
   * has its OWN endpoint — the posting PATCH rejects an assignmentId key outright.
   * Returns whether it succeeded so the caller can decide what to do next.
   */
  const applyAssignment = async (targetPostingId: string, assignmentId: string | null): Promise<boolean> => {
    try {
      const result = await setPostingAssignment(targetPostingId, assignmentId);
      // Ids and counts only. Detach carries the applicant count because that number
      // is the whole reason the confirm existed — it says how much work was already
      // riding on the task that was just removed.
      if (assignmentId === null) {
        trackEvent('assignment_detached', {
          companyId, postingId: targetPostingId, applicationCount: result.applicationCount,
        });
      } else {
        trackEvent('assignment_attached', { companyId, postingId: targetPostingId, assignmentId });
      }
      setAttachRetry(null);
      return true;
    } catch (error) {
      // The posting itself is fine. Say so, keep every field the employer typed, and
      // offer the one action that fixes it. Rolling the posting back — or throwing
      // the form away — would destroy good work over a failed second request.
      setAttachRetry({ postingId: targetPostingId, assignmentId });
      setErrors((previous) => ({
        ...previous,
        _assignment: error instanceof EmployerJobsApiError
          ? error.message
          : 'The posting was saved, but the assignment could not be attached.',
      }));
      return false;
    }
  };

  const performSubmit = async () => {
    submittingRef.current = true;
    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await onSubmit(buildPostingInput(values));
      // On create the id only exists now; on edit we have had it all along.
      const targetPostingId = postingId ?? (result && 'id' in result ? result.id : undefined);

      if (assignmentChanged && targetPostingId) {
        const attached = await applyAssignment(targetPostingId, nextAssignmentId);
        // Attach failed: stay on the form with everything intact so Retry is
        // one click away. The posting is NOT rolled back — it exists and is valid.
        if (!attached) return;
      }
      onSubmitted?.(result);
    } catch (error) {
      setErrors(error instanceof EmployerJobsApiError
        ? mapServerErrorToFields(error.code, error.message)
        : { _form: 'Could not save posting. Please try again.' });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return; // logical double-submit guard (R1)
    const validationErrors = validatePostingFormValues(values);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    // A confirm is owed only when real applicants are affected — never on create,
    // never at zero applicants, never when the choice did not change (rule 3).
    if (assignmentChanged && needsConfirm({
      isEdit, applicationCount: serverCount, currentId: initialAssignmentId, nextId: nextAssignmentId,
    })) {
      setPendingConfirm(buildConfirmCopy({
        currentTitle: attachedAssignment?.title ?? 'the current assignment',
        nextTitle: nextAssignmentId === null ? null : (assignment.assignmentTitle ?? 'the new assignment'),
        applicationCount: serverCount,
      }));
      return;
    }
    await performSubmit();
  };

  const retryAttach = async () => {
    if (!attachRetry) return;
    setIsSubmitting(true);
    try {
      const ok = await applyAssignment(attachRetry.postingId, attachRetry.assignmentId);
      if (ok) {
        setErrors((previous) => ({ ...previous, _assignment: undefined }));
        onSubmitted?.({ id: attachRetry.postingId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOnEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') { event.preventDefault(); void handleSubmit(); }
  };

  const descriptionHint = isDescriptionFocused
    ? `${values.description.length} characters — aim for at least 50.`
    : 'Aim for at least 50 characters.';

  return (
    <Stack gap={12}>
      {errors._form && <Alert type="error">{errors._form}</Alert>}

      {/* Two short text inputs share a row; auto-fit collapses them back to one
          column once the form column is too narrow to hold both. */}
      <div style={TWO_COLUMN_ROW}>
        <Input
          label="Job title" required maxLength={200} value={values.title} error={errors.title}
          onKeyDown={submitOnEnter} onChange={(event) => setField('title', event.target.value)}
        />
        <Input
          label="Location" required maxLength={200} value={values.location} error={errors.location}
          onKeyDown={submitOnEnter} onChange={(event) => setField('location', event.target.value)}
        />
      </div>

      <Stack gap={12} dir="row" wrap>
        <PillToggleGroup
          label="Workplace" options={WORKPLACE_OPTIONS} value={values.workplaceType} error={errors.workplaceType}
          onChange={(value) => setField('workplaceType', value as PostingFormValues['workplaceType'])}
        />
        <PillToggleGroup
          label="Employment type" options={EMPLOYMENT_OPTIONS} value={values.employmentType} error={errors.employmentType}
          onChange={(value) => setField('employmentType', value as PostingFormValues['employmentType'])}
        />
      </Stack>

      <div>
        <p style={{ fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>
          Salary (₹ LPA, optional)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            type="number" placeholder="Min" inputMode="numeric" aria-label="Salary minimum" value={values.salaryMinStr}
            onKeyDown={submitOnEnter} onBlur={handleSalaryBlur}
            onChange={(event) => setField('salaryMinStr', event.target.value)}
          />
          <Input
            type="number" placeholder="Max" inputMode="numeric" aria-label="Salary maximum" value={values.salaryMaxStr}
            onKeyDown={submitOnEnter} onBlur={handleSalaryBlur}
            onChange={(event) => setField('salaryMaxStr', event.target.value)}
          />
        </div>
        {errors.salary && (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: TYPE.xs, marginTop: 5, fontWeight: 500 }}>
            {errors.salary}
          </p>
        )}
      </div>

      {/* The one full-width field. maxRows caps growth at ~200px so a long JD scrolls
          inside the textarea instead of pushing the submit button below the fold (R2).
          The cap must be expressed as maxRows — TextareaAutosize rejects style.maxHeight. */}
      <JobDescriptionTextarea
        label="Job description" required value={values.description} error={errors.description}
        hint={descriptionHint}
        style={{ resize: 'vertical' }}
        placeholder="Describe the role, responsibilities, requirements, and what you offer..."
        minRows={5} maxRows={8}
        onFocus={() => setIsDescriptionFocused(true)} onBlur={() => setIsDescriptionFocused(false)}
        onChange={(event) => setField('description', event.target.value)}
      />

      {/* Optional. Candidates see the date on the apply page, and the apply
          endpoint refuses submissions past it whether or not auto-close is on. */}
      <div>
        <p style={{ fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>
          Application deadline (optional)
        </p>
        <input
          type="date"
          aria-label="Application deadline"
          value={values.applicationDeadline}
          min={minimumDeadline}
          onChange={(event) => {
            const next = event.target.value;
            setField('applicationDeadline', next);
            // Clearing the date disarms auto-close: a flag with no date to fire on
            // is a rule that can never run. The backend enforces this too.
            if (next === '') setField('autoCloseOnDeadline', false);
            setErrors((previous) => ({ ...previous, applicationDeadline: deadlineError(next) }));
          }}
          style={{
            fontSize: TYPE.sm, padding: '8px 10px', borderRadius: 8, colorScheme: 'light dark',
            border: `1px solid ${errors.applicationDeadline ? 'var(--danger)' : 'var(--border)'}`,
            background: 'var(--surface-raised)', color: 'var(--ink)',
          }}
        />
        {values.applicationDeadline !== '' && (
          <div style={{ marginTop: 8 }}>
            <Checkbox
              checked={values.autoCloseOnDeadline}
              onChange={(checked) => setField('autoCloseOnDeadline', checked)}
              label="Auto-close posting on this date"
            />
          </div>
        )}
        {errors.applicationDeadline ? (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: TYPE.xs, marginTop: 5, fontWeight: 500 }}>
            {errors.applicationDeadline}
          </p>
        ) : (
          <p style={{ fontSize: TYPE.xs, color: 'var(--ink-faint)', marginTop: 5 }}>
            Shown to candidates on the apply page (IST). With auto-close, the posting
            closes itself on this date.
          </p>
        )}
      </div>

      <AssignmentSection
        postingId={postingId}
        initialAssignmentId={initialAssignmentId}
        applicationCount={applicationCount ?? (isEdit ? serverCount : undefined)}
        disabled={isSubmitting}
        onChange={setAssignment}
        onContextLoaded={({ applicationCount: count, attached }) => {
          // Only used when the caller did not already know the count — see the prop
          // comment on AssignmentSection.
          if (applicationCount == null) setServerCount(count);
          setAttachedAssignment(attached);
        }}
      />

      {/* The posting saved; only the attach failed. Distinct from _form on purpose —
          this must never read as "nothing was saved". */}
      {errors._assignment && (
        <Alert type="warning">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{errors._assignment}</span>
            <Button variant="secondary" size="sm" loading={isSubmitting} onClick={retryAttach}>
              Retry attaching
            </Button>
          </Stack>
        </Alert>
      )}

      <Stack gap={8} dir="row" wrap>
        <Button onClick={handleSubmit} loading={isSubmitting} disabled={!canSubmit}>{submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </Stack>

      <AssignmentSwapDialog
        copy={pendingConfirm}
        isMutating={isSubmitting}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={async () => { setPendingConfirm(null); await performSubmit(); }}
      />
    </Stack>
  );
}
