'use client';
// FILE: src/components/apply/useApplyFields.ts
// The core form values and the two writers every field goes through.
//
// Split from ApplyFormClient for size (section 2). `onBlur` stays in the form
// itself because it also schedules a draft save, and the draft hook is built
// AFTER this one — it needs `data`, which this hook owns.

import { useCallback, useRef, useState } from 'react';
import type { ApplyFormData } from '@/types/public-apply';
import type { ApplyErrors } from './apply-form-helpers';
import { trackEvent } from '@/lib/analytics-events';
import { EMPTY } from './apply-form-constants';

export function useApplyFields({ querySource, jobId, setErrors, commitDiscrete }: {
  querySource: string | null;
  jobId: string;
  setErrors: React.Dispatch<React.SetStateAction<ApplyErrors>>;
  commitDiscrete: <K extends keyof ApplyFormData>(field: K, value: ApplyFormData[K]) => void;
}) {
  const [data, setData] = useState<ApplyFormData>(
    () => (querySource ? { ...EMPTY, source: querySource } : EMPTY),
  );
  const dataRef = useRef(data);
  dataRef.current = data;
  // First-focus-per-field dedup (session-scoped, per form instance — not global).
  const focusedFields = useRef<Set<string>>(new Set());

  const onFieldFocus = useCallback((field: string) => {
    if (focusedFields.current.has(field)) return;
    focusedFields.current.add(field);
    trackEvent('apply_form_field_focused', { jobId, fieldName: field });
  }, [jobId]);

  const set = useCallback(<K extends keyof ApplyFormData>(field: K, value: ApplyFormData[K]) => {
    // dataRef is advanced SYNCHRONOUSLY, ahead of the re-render. The file input
    // calls set('resume', …) and onBlur('resume') back to back in one handler; if
    // the ref only caught up on render, the blur would read a pre-file snapshot
    // and undo the commit the set just made.
    dataRef.current = { ...dataRef.current, [field]: value };
    setData((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, _form: undefined }));
    // Attaching a file and ticking a consent box are discrete acts, not typing —
    // there is no intermediate state to flicker through, so the progress
    // indicator can move immediately rather than waiting for a blur.
    if (field === 'resume' || field === 'consent_dpdp') commitDiscrete(field, value);
  }, [setErrors, commitDiscrete]);

  return { data, setData, dataRef, set, onFieldFocus };
}

export default useApplyFields;
