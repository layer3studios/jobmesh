'use client';
// FILE: src/components/employer/jobs/usePostingAssignment.ts
// The assignment attachment half of PostingForm: which assignment is selected,
// whether that differs from what is stored, and the attach/swap/detach call.
//
// SEPARATE FROM THE POSTING SAVE because the attachment has its OWN endpoint —
// the posting PATCH rejects an assignmentId key outright. That is also why a
// failed attach never rolls the posting back: the posting exists and is valid,
// and throwing away a form full of good work over a failed second request would
// be the worse outcome.
//
// Extracted from PostingForm for size (section 2). Entirely inert while the
// toggle is off.

import { useState } from 'react';
import { EmployerJobsApiError, setPostingAssignment } from '@/api/employer-jobs-api';
import type { EmployerAssignment } from '@/types/employer-assignments';
import type { AssignmentSectionState } from '@/components/employer/jobs/parts/AssignmentSection';
import { needsConfirm, buildConfirmCopy } from '@/components/employer/jobs/parts/assignment-section-helpers';
import type { ConfirmCopy } from '@/components/employer/jobs/parts/assignment-section-helpers';
import type { PostingFormErrors } from './posting-form-helpers';
import { trackEvent } from '@/lib/analytics-events';

export interface UsePostingAssignmentOptions {
  postingId?: string;
  initialAssignmentId: string | null;
  applicationCount?: number;
  companyId: string;
  setErrors: React.Dispatch<React.SetStateAction<PostingFormErrors>>;
}

export function usePostingAssignment({
  postingId, initialAssignmentId, applicationCount, companyId, setErrors,
}: UsePostingAssignmentOptions) {
  const isEdit = postingId != null;
  const [assignment, setAssignment] = useState<AssignmentSectionState>({
    enabled: initialAssignmentId != null,
    assignmentId: initialAssignmentId,
    assignmentTitle: null,
  });
  // The server's view, filled in by the section's own read on the edit surface.
  const [serverCount, setServerCount] = useState<number>(applicationCount ?? 0);
  const [attachedAssignment, setAttachedAssignment] = useState<EmployerAssignment | null>(null);
  // A create that succeeded but whose attach failed. The posting EXISTS — this is
  // a retry affordance, never a rollback.
  const [attachRetry, setAttachRetry] = useState<{ postingId: string; assignmentId: string | null } | null>(null);

  const nextAssignmentId = assignment.enabled ? assignment.assignmentId : null;
  const assignmentChanged = nextAssignmentId !== initialAssignmentId;

  /** Attach / swap / detach. Returns whether it succeeded. */
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
      // The posting itself is fine. Say so, keep every field the employer typed,
      // and offer the one action that fixes it.
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

  /**
   * The confirm copy owed before saving, or null when none is.
   * A confirm is owed only when real applicants are affected — never on create,
   * never at zero applicants, never when the choice did not change (rule 3).
   */
  const confirmCopyForSave = (): ConfirmCopy | null => {
    if (!assignmentChanged) return null;
    if (!needsConfirm({
      isEdit, applicationCount: serverCount, currentId: initialAssignmentId, nextId: nextAssignmentId,
    })) return null;
    return buildConfirmCopy({
      currentTitle: attachedAssignment?.title ?? 'the current assignment',
      nextTitle: nextAssignmentId === null ? null : (assignment.assignmentTitle ?? 'the new assignment'),
      applicationCount: serverCount,
    });
  };

  const handleContextLoaded = ({ applicationCount: count, attached }:
  { applicationCount: number; attached: EmployerAssignment | null }) => {
    // Only used when the caller did not already know the count — see the prop
    // comment on AssignmentSection.
    if (applicationCount == null) setServerCount(count);
    setAttachedAssignment(attached);
  };

  return {
    isEdit,
    serverCount,
    setAssignment,
    nextAssignmentId,
    assignmentChanged,
    attachRetry,
    applyAssignment,
    confirmCopyForSave,
    handleContextLoaded,
  };
}

export default usePostingAssignment;
