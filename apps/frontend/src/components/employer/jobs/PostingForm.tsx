'use client';
// FILE: src/components/employer/jobs/PostingForm.tsx
// Reusable create/edit posting form. Owns field state and the submit lifecycle,
// validates client-side (mirroring the backend), maps server error codes per
// field, and calls onSubmit with the typed payload. Double submit is blocked both
// visually (disabled button) and logically (a synchronous ref guard — state is
// stale in the click closure during a rapid double-click) (R1).
//
// The fields live in sibling Posting*Field components and the assignment
// attachment in usePostingAssignment; this file is state and composition.

import { useMemo, useRef, useState } from 'react';
import { Button, Alert, Stack } from '@/components/ui';
import { EmployerJobsApiError } from '@/api/employer-jobs-api';
import {
  validatePostingFormValues, validateSalaryStrings, buildPostingInput, mapServerErrorToFields,
  isoToDeadlineInput,
} from '@/components/employer/jobs/posting-form-helpers';
import type { PostingFormValues, PostingFormErrors } from '@/components/employer/jobs/posting-form-helpers';
import ScreeningQuestionsEditor from '@/components/employer/jobs/parts/ScreeningQuestionsEditor';
import AssignmentSection from '@/components/employer/jobs/parts/AssignmentSection';
import AssignmentSwapDialog from '@/components/employer/jobs/parts/AssignmentSwapDialog';
import type { ConfirmCopy } from '@/components/employer/jobs/parts/assignment-section-helpers';
import PostingBasicFields from './PostingBasicFields';
import PostingSalaryFields from './PostingSalaryFields';
import PostingDescriptionField from './PostingDescriptionField';
import PostingDeadlineField from './PostingDeadlineField';
import { usePostingAssignment } from './usePostingAssignment';
import { useEmployer } from '@/context/employer/EmployerContext';
import type { PostingFormProps } from './posting-form-props';

export default function PostingForm({
  initialValues, submitLabel, onSubmit, onCancel, onValuesChange,
  postingId, applicationCount, initialAssignmentId = null, onSubmitted,
}: PostingFormProps) {
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
    screeningQuestions: initialValues?.screeningQuestions ?? [],
  }));
  const [errors, setErrors] = useState<PostingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmCopy | null>(null);
  const submittingRef = useRef(false);
  const { company } = useEmployer();

  const asg = usePostingAssignment({
    postingId, initialAssignmentId, applicationCount, companyId: company?.id ?? '', setErrors,
  });

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

  const performSubmit = async () => {
    submittingRef.current = true;
    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await onSubmit(buildPostingInput(values));
      // On create the id only exists now; on edit we have had it all along.
      const targetPostingId = postingId ?? (result && 'id' in result ? result.id : undefined);

      if (asg.assignmentChanged && targetPostingId) {
        const attached = await asg.applyAssignment(targetPostingId, asg.nextAssignmentId);
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

    const confirmCopy = asg.confirmCopyForSave();
    if (confirmCopy) { setPendingConfirm(confirmCopy); return; }
    await performSubmit();
  };

  const retryAttach = async () => {
    if (!asg.attachRetry) return;
    setIsSubmitting(true);
    try {
      const ok = await asg.applyAssignment(asg.attachRetry.postingId, asg.attachRetry.assignmentId);
      if (ok) {
        setErrors((previous) => ({ ...previous, _assignment: undefined }));
        onSubmitted?.({ id: asg.attachRetry.postingId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOnEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') { event.preventDefault(); void handleSubmit(); }
  };

  return (
    <Stack gap={12}>
      {errors._form && <Alert type="error">{errors._form}</Alert>}

      <PostingBasicFields values={values} errors={errors} setField={setField} onKeyDown={submitOnEnter} />
      <PostingSalaryFields
        values={values} errors={errors} setField={setField}
        onKeyDown={submitOnEnter} onBlur={handleSalaryBlur}
      />
      <PostingDescriptionField values={values} errors={errors} setField={setField} />

      {/* After the JD, before the deadline: these are part of what the candidate
          fills in, so they belong beside the description rather than among the
          posting's scheduling settings. */}
      <ScreeningQuestionsEditor
        questions={values.screeningQuestions}
        onChange={(next) => setField('screeningQuestions', next)}
      />

      <PostingDeadlineField values={values} errors={errors} setField={setField} setErrors={setErrors} />

      <AssignmentSection
        postingId={postingId}
        initialAssignmentId={initialAssignmentId}
        applicationCount={applicationCount ?? (asg.isEdit ? asg.serverCount : undefined)}
        disabled={isSubmitting}
        onChange={asg.setAssignment}
        onContextLoaded={asg.handleContextLoaded}
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
