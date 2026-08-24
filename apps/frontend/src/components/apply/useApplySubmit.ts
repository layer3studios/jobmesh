'use client';
// FILE: src/components/apply/useApplySubmit.ts
// The apply form's submit path: validate, build the multipart body, post it, and
// turn every failure into something the candidate can act on.
//
// THE ONE SUBMIT PATH. The in-form button and the sticky bar call this same
// handler, and the `inFlight` ref guards both entry points — a click in each
// cannot both get through. The disabled attribute alone LOSES a fast double-click:
// React has not re-rendered by the time the second click lands, so the button is
// still enabled in the DOM. Both guards are required (rule 10).
//
// Split from ApplyFormClient for size (section 2).

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplyFormData, PublicAssignment, PublicCompany, PublicJob } from '@/types/public-apply';
import { submitApplication, PublicApiError, expiredFilesFrom } from '@/api/public-api';
import { validateApplyForm, mapServerError, validateScreeningAnswers } from './apply-form-helpers';
import type { ApplyErrors } from './apply-form-helpers';
import { clearDraft } from './assignment-draft';
import { copyToClipboard } from '@/lib/clipboard';
import { trackEvent } from '@/lib/analytics-events';
import type { BlockingNotice } from './apply-form-constants';
import { buildApplyFormData } from './apply-submit-payload';

type Uploads = {
  files: Array<{ fileId?: string | null; originalName: string }>;
  doneFiles: Array<{ fileId?: string | null; originalName: string }>;
  markExpired: (fileIds: string[]) => void;
};

export interface UseApplySubmitOptions {
  company: PublicCompany;
  job: PublicJob;
  companySlug: string;
  jobSlug: string;
  assignment: PublicAssignment | null;
  data: ApplyFormData;
  screeningQuestions: NonNullable<PublicJob['screeningQuestions']>;
  screeningAnswers: Record<string, string>;
  setScreeningErrors: (errors: Record<string, string>) => void;
  referralToken: string | null;
  links: string[];
  validLinks: string[];
  notes: string;
  github: string;
  linkedin: string;
  uploads: Uploads;
  /**
   * Owned by the form, not by this hook: the link editor clears assignmentLinks
   * on every keystroke, and it has to be constructed BEFORE submit so submit can
   * read its rows. Sharing the setter is what keeps that order possible.
   */
  setErrors: React.Dispatch<React.SetStateAction<ApplyErrors>>;
}

export function useApplySubmit(o: UseApplySubmitOptions) {
  const router = useRouter();
  const { setErrors } = o;
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<BlockingNotice | null>(null);
  const [expiredNotice, setExpiredNotice] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const inFlight = useRef(false);

  const { assignment, data, job, company, uploads } = o;
  const hasAssignment = assignment != null;

  /** Returns true when the error was fully handled and the draft must stay intact. */
  const handleFailure = (err: unknown): boolean => {
    // The deadline passed between page load and submit. Applies to every posting,
    // assignment or not, so it is handled before the assignment-only branch.
    if (err instanceof PublicApiError && err.code === 'POSTING_DEADLINE_PASSED') {
      setNotice({
        kind: 'deadline_passed',
        message: 'This posting has closed since you opened the page. Your application was not submitted.',
      });
      return true;
    }
    if (err instanceof PublicApiError && assignment) {
      // Each of these leaves the DRAFT INTACT. The candidate's work is the whole
      // point of the feature; none of these outcomes means it should be thrown away.
      if (err.code === 'STAGED_FILES_EXPIRED') {
        const expired = expiredFilesFrom(err);
        uploads.markExpired(expired.map((file) => file.fileId));
        const names = expired
          .map((file, index) => file.originalName
            ?? uploads.files.find((row) => row.fileId === file.fileId)?.originalName
            ?? `file ${index + 1}`)
          .join(', ');
        setExpiredNotice(
          `${expired.length} ${expired.length === 1 ? 'file' : 'files'} expired and `
          + `${expired.length === 1 ? 'needs' : 'need'} re-uploading: ${names}`,
        );
        return true;
      }
      if (err.code === 'ASSIGNMENT_CHANGED') {
        setNotice({ kind: 'assignment_changed', message: err.message });
        return true;
      }
      if (err.code === 'POSTING_CLOSED_DURING_APPLY') {
        setNotice({ kind: 'posting_closed', message: err.message });
        return true;
      }
    }
    return false;
  };

  const buildForm = () => buildApplyFormData(o);

  const handleSubmit = async () => {
    if (inFlight.current) return; // synchronous double-click guard (rule 10)
    const validation = validateApplyForm(data);
    const screeningValidation = validateScreeningAnswers(o.screeningQuestions, o.screeningAnswers);
    o.setScreeningErrors(screeningValidation);
    if (Object.keys(validation).length > 0 || Object.keys(screeningValidation).length > 0) {
      setErrors(validation);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setErrors({});
    setExpiredNotice(null);
    try {
      await submitApplication(o.companySlug, o.jobSlug, buildForm());
      trackEvent('apply_submitted', {
        jobId: job.id, companyId: company.slug, applyMethod: 'public',
        hasResume: data.resume !== null, hasCoverNote: data.coverNote.trim() !== '',
        // Sent for BOTH populations — it is the numerator half of the ratio.
        hasAssignment,
        ...(assignment ? {
          linkCount: o.validLinks.length,
          fileCount: uploads.doneFiles.length,
          hasGithubProfile: o.github.trim() !== '',
          hasLinkedinProfile: o.linkedin.trim() !== '',
        } : {}),
      });
      // The work is committed server-side, so the local copy of the candidate's
      // email, phone and notes has no reason to keep existing (rule 7).
      if (assignment) clearDraft(job.id);
      const query = new URLSearchParams();
      if (company.name) query.set('company', company.name);
      if (job.title) query.set('job', job.title);
      query.set('jid', job.id);
      router.replace(`/apply/${o.companySlug}/${o.jobSlug}/success?${query.toString()}`);
    } catch (err) {
      if (handleFailure(err)) return;
      setErrors(err instanceof PublicApiError
        ? mapServerError(err.code, err.message)
        : { _form: 'Could not submit your application. Please try again.' });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  /** Plain-text dump of everything the candidate typed, for the closed-posting path. */
  const myWorkAsText = useCallback((): string => {
    const lines: string[] = [];
    const typedLinks = o.links.map((link) => link.trim()).filter(Boolean);
    if (typedLinks.length > 0) lines.push('Links:', ...typedLinks.map((link) => `- ${link}`));
    if (uploads.files.length > 0) {
      lines.push('', 'Files:', ...uploads.files.map((row) => `- ${row.originalName}`));
    }
    if (o.notes.trim()) lines.push('', 'Notes:', o.notes.trim());
    return lines.join('\n');
  }, [o.links, o.notes, uploads.files]);

  // copyToClipboard returns false on a blocked permission, an insecure origin where
  // execCommand is also gone, or an embedded webview. This is the ONE action a
  // candidate whose posting just closed cannot afford to have fail quietly, so a
  // false answer reveals the text for manual selection instead of doing nothing.
  const copyMyWork = useCallback(async () => {
    const ok = await copyToClipboard(myWorkAsText());
    setCopyState(ok ? 'copied' : 'failed');
  }, [myWorkAsText]);

  return {
    submitting, notice, expiredNotice,
    copyState, handleSubmit, myWorkAsText, copyMyWork,
  };
}

export default useApplySubmit;
