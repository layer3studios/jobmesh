'use client';
// FILE: src/components/apply/useApplyProgress.ts
// The apply form's progress indicator state.
//
// THE INDICATOR READS A SNAPSHOT, NOT `data`. A counter driven straight off the
// live form re-evaluates on every keystroke, so the bar twitches forward and back
// while an email is half-typed and the whole indicator reads as unstable. The
// snapshot is committed on blur (text fields) and on change (file/checkbox, where
// there is no half-typed state to be wrong about).
//
// Split from ApplyFormClient for size (section 2).

import { useMemo, useRef, useState } from 'react';
import type { ApplyFormData } from '@/types/public-apply';
import { fieldError } from './apply-form-helpers';
import { validateSubmissionLink } from './assignment-validation';
import { EMPTY } from './apply-form-constants';

export function useApplyProgress({ uploadsDoneCount, hasAssignment }: {
  uploadsDoneCount: number;
  hasAssignment: boolean;
}) {
  const [progressData, setProgressData] = useState<ApplyFormData>(EMPTY);
  // The last COMMITTED snapshot, mirrored in a ref. Text fields fold in on blur;
  // a discrete field (file, checkbox) folds in only itself, so clicking a
  // checkbox cannot drag a half-typed email in with it.
  const progressRef = useRef<ApplyFormData>(EMPTY);
  // Same reasoning for the submission links: settled on blur, not mid-URL.
  const [progressLinks, setProgressLinks] = useState<string[]>(['']);

  /** A file or a checkbox: a discrete act, so it folds in immediately. */
  const commitDiscrete = <K extends keyof ApplyFormData>(field: K, value: ApplyFormData[K]) => {
    progressRef.current = { ...progressRef.current, [field]: value };
    setProgressData(progressRef.current);
  };

  /** A blur: take the whole live snapshot, but keep the resume already committed. */
  const commitFromData = (live: ApplyFormData) => {
    progressRef.current = { ...live, resume: progressRef.current.resume };
    setProgressData(progressRef.current);
  };

  /** A restore: a bulk change with no typing involved, so it lands immediately. */
  const commitPartial = (partial: Partial<ApplyFormData>) => {
    progressRef.current = { ...progressRef.current, ...partial };
    setProgressData(progressRef.current);
  };

  // A section is complete when its REQUIRED fields validate — optional fields
  // (phone, cover note, the GitHub/LinkedIn profiles, notes) are not counted, so
  // filling only optional fields never moves the bar and skipping them never
  // holds it back. `fieldError` is the same validator the form itself uses, so
  // the indicator can never claim a section is done that the form would reject.
  const progressSections = useMemo(() => {
    const detailsComplete = progressData.firstName.trim() !== ''
      && progressData.lastName.trim() !== ''
      && progressData.email.trim() !== ''
      && fieldError('email', progressData) === undefined;
    const submissionComplete = progressLinks
      .map((link) => link.trim())
      .filter((link) => link !== '' && validateSubmissionLink(link) === null).length
      + uploadsDoneCount > 0;

    return [
      { id: 'details', complete: detailsComplete },
      { id: 'resume', complete: progressData.resume !== null },
      // RULE 3: a plain posting has no submission section at all, so it counts
      // three sections, not four with one permanently unreachable. Guarded once,
      // here, rather than branching inside the indicator.
      ...(hasAssignment ? [{ id: 'submission', complete: submissionComplete }] : []),
      { id: 'consent', complete: progressData.consent_dpdp },
    ];
  }, [progressData, progressLinks, uploadsDoneCount, hasAssignment]);

  return {
    progressSections, setProgressLinks,
    commitDiscrete, commitFromData, commitPartial,
  };
}

export default useApplyProgress;
