'use client';
// FILE: src/components/apply/useApplyDraft.ts
// Local draft persistence for take-home applications: the periodic and debounced
// saves, the restore prompt, and what restore is allowed to bring back.
//
// Every localStorage call lives in assignment-draft.ts and is wrapped in
// try/catch there; nothing here can throw when storage is unavailable.
//
// INERT FOR A PLAIN POSTING (rule 1): with no assignment there is no timer, no
// read on mount and nothing ever written.
//
// Split from ApplyFormClient for size (section 2).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApplyFormData, PublicAssignment } from '@/types/public-apply';
import { readDraft, writeDraft, clearDraft } from './assignment-draft';
import type { DraftPayload } from './assignment-draft';
import { trackEvent } from '@/lib/analytics-events';
import {
  DRAFT_BLUR_DEBOUNCE_MS, DRAFT_INTERVAL_MS, DRAFT_EVENT_THROTTLE_MS,
} from './apply-form-constants';

export interface UseApplyDraftOptions {
  assignment: PublicAssignment | null;
  jobId: string;
  data: ApplyFormData;
  links: string[];
  github: string;
  linkedin: string;
  notes: string;
  uploads: {
    doneFiles: Array<{ fileId?: string | null; originalName: string }>;
    restoreFromDraft: (files: DraftPayload['files']) => void;
  };
  /** Applied to the form's own state when a draft is restored. */
  onRestoreFields: (fields: Partial<ApplyFormData>) => void;
  onRestoreLinks: (links: string[]) => void;
  onRestoreProfile: (profile: { github: string; linkedin: string; notes: string }) => void;
  onRestoreNotice: (message: string) => void;
}

export function useApplyDraft({
  assignment, jobId, data, links, github, linkedin, notes, uploads,
  onRestoreFields, onRestoreLinks, onRestoreProfile, onRestoreNotice,
}: UseApplyDraftOptions) {
  const hasAssignment = assignment != null;
  const [draftPrompt, setDraftPrompt] = useState<DraftPayload | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDraftEventAt = useRef(0);

  const saveDraft = useCallback(() => {
    if (!assignment) return; // plain posting — never writes anything (rule 1)
    writeDraft(jobId, {
      // Stamped so a restore can tell whether the task itself changed underneath.
      assignmentId: assignment.id,
      fields: {
        firstName: data.firstName, lastName: data.lastName, email: data.email,
        phone: data.phone, coverNote: data.coverNote,
        links, github, linkedin, notes,
      },
      // The resume is NOT here and cannot be: it is a File object, which does not
      // survive JSON. See the restore prompt copy, which says so out loud.
      files: uploads.doneFiles
        .filter((row) => row.fileId)
        .map((row) => ({ fileId: row.fileId as string, originalName: row.originalName })),
    });
    const now = Date.now();
    if (now - lastDraftEventAt.current >= DRAFT_EVENT_THROTTLE_MS) {
      lastDraftEventAt.current = now;
      trackEvent('assignment_draft_saved', { postingId: jobId });
    }
  }, [assignment, jobId, data, links, github, linkedin, notes, uploads.doneFiles]);

  // The interval must not be torn down and rebuilt on every keystroke, so it reads
  // the latest saveDraft through a ref instead of depending on it.
  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;

  useEffect(() => {
    if (!hasAssignment) return; // no timer at all on a plain posting
    const id = setInterval(() => saveDraftRef.current(), DRAFT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasAssignment]);

  useEffect(() => () => { if (draftTimer.current) clearTimeout(draftTimer.current); }, []);

  const scheduleDraftSave = useCallback(() => {
    if (!hasAssignment) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => saveDraftRef.current(), DRAFT_BLUR_DEBOUNCE_MS);
  }, [hasAssignment]);

  // Read once on mount. NEVER auto-fills (rule 6): silently repopulating a form
  // someone walked away from — possibly on a shared machine — is hostile. We show
  // what we have and let them choose.
  useEffect(() => {
    if (!hasAssignment) return;
    const draft = readDraft(jobId);
    if (draft) setDraftPrompt(draft);
  }, [hasAssignment, jobId]);

  const restoreDraft = useCallback(() => {
    if (!draftPrompt || !assignment) return;
    const { fields, files } = draftPrompt;

    // Contact details are about the PERSON and survive any task change.
    onRestoreFields({
      firstName: fields.firstName ?? '', lastName: fields.lastName ?? '',
      email: fields.email ?? '', phone: fields.phone ?? '', coverNote: fields.coverNote ?? '',
      // resume stays null — it was never storable.
    });

    // The employer swapped the task while this draft sat on disk. The links, files
    // and notes answer the OLD task, so restoring them would silently hand the
    // candidate work that reads as wrong to the reviewer. Drop that half and say so
    // — losing it loudly is far better than submitting it unknowingly.
    const taskChanged = draftPrompt.assignmentId !== assignment.id;
    if (taskChanged) {
      onRestoreLinks(['']);
      // Profile links are about the person too, so they survive; notes do not.
      onRestoreProfile({ github: fields.github ?? '', linkedin: fields.linkedin ?? '', notes: '' });
      onRestoreNotice(
        'The task for this role changed. Your details were restored, but you\'ll need to redo the submission.',
      );
      // The stale draft is replaced on the next save; clearing it now stops a
      // reload from re-offering submission work we just told them is void.
      clearDraft(jobId);
    } else {
      const restoredLinks = Array.isArray(fields.links) && fields.links.length > 0 ? fields.links : [''];
      onRestoreLinks(restoredLinks);
      onRestoreProfile({
        github: fields.github ?? '', linkedin: fields.linkedin ?? '', notes: fields.notes ?? '',
      });
      uploads.restoreFromDraft(files);
    }

    trackEvent('assignment_draft_restored', {
      postingId: jobId,
      fileCount: taskChanged ? 0 : files.length,
      // Files dropped because the TASK changed, not because they aged out. Counting
      // them here keeps "work the candidate lost on restore" in one number.
      expiredFileCount: taskChanged ? files.length : 0,
    });
    setDraftPrompt(null);
  }, [draftPrompt, assignment, jobId, uploads, onRestoreFields, onRestoreLinks, onRestoreProfile, onRestoreNotice]);

  // "Start over" is a deletion, not a dismissal: the draft holds the candidate's
  // email, phone and notes in localStorage (rule 7), so declining it must remove it.
  const discardDraft = useCallback(() => {
    clearDraft(jobId);
    setDraftPrompt(null);
  }, [jobId]);

  return { draftPrompt, scheduleDraftSave, restoreDraft, discardDraft };
}

export default useApplyDraft;
