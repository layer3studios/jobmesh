'use client';
// FILE: src/components/apply/ApplyFormClient.tsx
// Public apply form (/apply/:companySlug/:jobSlug). Owns the core form state,
// wires the hooks that do the work, and composes the two-column page. No
// auth/contexts (C9). The server shell provides {company, job}.
//
// TAKE-HOME POSTINGS (7b). When `assignment` is non-null the form additionally
// collects submission links, staged files, profile links and notes, and keeps a
// local draft. When it is NULL every one of those paths is skipped — `hasAssignment`
// guards each effect, callback and FormData append, so a plain posting submits
// byte-identically to a form built before take-homes existed.

import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ApplyStickyBar from './ApplyStickyBar';
import ApplyJobDetails from './ApplyJobDetails';
import ApplyFormCard from './ApplyFormCard';
import { fieldError } from './apply-form-helpers';
import type { ApplyErrors } from './apply-form-helpers';
import { useAssignmentFiles } from './useAssignmentFiles';
import { useApplyProgress } from './useApplyProgress';
import { useApplyLinks } from './useApplyLinks';
import { useApplyDraft } from './useApplyDraft';
import { useApplySubmit } from './useApplySubmit';
import { useApplyScreening } from './useApplyScreening';
import { useApplyFields } from './useApplyFields';
import { useApplyTelemetry } from './useApplyTelemetry';
import { sourceFromQuery } from './apply-source';
import { useReferralToken, REFERRAL_QUERY_KEY } from './useReferralToken';
import { formatDeadline } from '@/components/employer/jobs/deadline-helpers';
import type { ApplyFormData } from '@/types/public-apply';
import {
  APPLY_PAGE_MAX_WIDTH_PIXELS, APPLY_PAGE_HORIZONTAL_PADDING_PIXELS,
} from './apply-form-constants';
import type { ApplyFormClientProps } from './apply-form-constants';

export default function ApplyFormClient({
  company, job, companySlug, jobSlug, assignment = null, assignmentPreview = null,
}: ApplyFormClientProps) {
  // Resolved once, from the URL the candidate actually arrived on. When it maps to
  // a known channel the dropdown is pre-answered and hidden.
  const searchParams = useSearchParams();
  const querySource = sourceFromQuery(searchParams.get('source'));
  // Survives a refresh mid-form; resolves the banner name from an uncached endpoint.
  const referral = useReferralToken(jobSlug, searchParams.get(REFERRAL_QUERY_KEY));
  const screening = useApplyScreening(job.screeningQuestions ?? []);

  // The in-form submit button. The sticky bar observes it and hides while it is
  // on screen — it is not read for anything else.
  const inFormSubmitRef = useRef<HTMLDivElement>(null);

  // ── Assignment state. Inert for a plain posting (rule 1). ──────────────────
  const hasAssignment = assignment != null;
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [notes, setNotes] = useState('');
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const uploads = useAssignmentFiles({
    postingId: job.id,
    allowedFileTypes: assignment?.allowedFileTypes ?? [],
    enabled: hasAssignment,
  });

  const progress = useApplyProgress({ uploadsDoneCount: uploads.doneFiles.length, hasAssignment });
  useApplyTelemetry({ jobId: job.id, companySlug: company.slug, assignment });

  // Owned here rather than inside useApplySubmit: the link editor clears
  // assignmentLinks as you type, and it must be constructed BEFORE submit so
  // submit can read its rows.
  const [errors, setErrors] = useState<ApplyErrors>({});

  const { data, setData, dataRef, set, onFieldFocus } = useApplyFields({
    querySource, jobId: job.id, setErrors, commitDiscrete: progress.commitDiscrete,
  });

  const links = useApplyLinks({
    onLinksSettled: progress.setProgressLinks,
    onClearLinkError: useCallback(
      () => setErrors((e) => ({ ...e, assignmentLinks: undefined, _form: undefined })), [],
    ),
  });

  const submit = useApplySubmit({
    company, job, companySlug, jobSlug, assignment, data,
    screeningQuestions: screening.questions,
    screeningAnswers: screening.answers,
    setScreeningErrors: screening.setErrors,
    referralToken: referral.token,
    links: links.links, validLinks: links.validLinks,
    notes, github, linkedin, uploads, setErrors,
  });

  const draft = useApplyDraft({
    assignment, jobId: job.id, data, links: links.links, github, linkedin, notes, uploads,
    onRestoreFields: useCallback((fields: Partial<ApplyFormData>) => {
      setData((d) => ({ ...d, ...fields }));
      progress.commitPartial(fields);
    }, [progress]),
    onRestoreLinks: useCallback((rows: string[]) => {
      links.setLinks(rows);
      links.setLinkErrors(rows.map(() => null));
      progress.setProgressLinks(rows);
    }, [links, progress]),
    onRestoreProfile: useCallback((profile: { github: string; linkedin: string; notes: string }) => {
      setGithub(profile.github); setLinkedin(profile.linkedin); setNotes(profile.notes);
    }, []),
    onRestoreNotice: setRestoreNotice,
  });

  const onBlur = useCallback((field: keyof ApplyFormData) => {
    setData((d) => { setErrors((e) => ({ ...e, [field]: fieldError(field, d) })); return d; });
    progress.commitFromData(dataRef.current);
    draft.scheduleDraftSave();
  }, [progress, draft]);

  // An assignment posting needs at least one link OR one FINISHED upload. A file
  // still in flight does not count — its fileId does not exist yet.
  const assignmentReady = !hasAssignment || links.validLinks.length + uploads.doneFiles.length > 0;

  const canSubmit = useMemo(() => (
    data.firstName.trim() !== '' && data.lastName.trim() !== '' && data.email.trim() !== ''
    && data.resume !== null && data.consent_dpdp && !submit.submitting && assignmentReady
  ), [data, submit.submitting, assignmentReady]);

  // A disabled button with no explanation is a dead end — the candidate cannot tell
  // whether the form is broken or they missed something. Say which.
  const blockedReason = hasAssignment && !assignmentReady
    ? (uploads.uploading
      ? 'Waiting for your upload to finish.'
      : 'Add at least one submission link or file.')
    : null;

  return (
    <div
      className="apply-page"
      style={{
        maxWidth: APPLY_PAGE_MAX_WIDTH_PIXELS, margin: '0 auto',
        paddingLeft: APPLY_PAGE_HORIZONTAL_PADDING_PIXELS, paddingRight: APPLY_PAGE_HORIZONTAL_PADDING_PIXELS,
        paddingTop: 24, boxSizing: 'border-box',
      }}
    >
      {/* ONE tree, both layouts. The grid, the stacking below 900px and the
          sticky JD column are all in apply.css. Source order is job content then
          form, which is exactly the stacked reading order — so the mobile layout
          needs no reordering, and no width is measured in JavaScript. */}
      <div className="apply-grid">
        <div className="apply-jd-column">
          <ApplyJobDetails company={company} job={job} assignmentPreview={assignmentPreview} />
        </div>
        <div tabIndex={0} className="apply-form-column">
          <ApplyFormCard
            companyName={company.name}
            companySlug={companySlug}
            assignment={assignment}
            data={data}
            errors={errors}
            set={set}
            onBlur={onBlur}
            onFieldFocus={onFieldFocus}
            showSourceField={querySource === null}
            progressSections={progress.progressSections}
            referrerName={referral.referrerName}
            // The server already refused to render this page on a PASSED deadline,
            // so any label here is necessarily for a future date.
            deadlineLabel={formatDeadline(job.applicationDeadline)}
            restoreNotice={restoreNotice}
            screening={screening}
            links={links}
            draft={draft}
            submit={submit}
            uploads={uploads}
            github={github}
            linkedin={linkedin}
            notes={notes}
            onGithubChange={setGithub}
            onLinkedinChange={setLinkedin}
            onNotesChange={setNotes}
            canSubmit={canSubmit}
            blockedReason={blockedReason}
            inFormSubmitRef={inFormSubmitRef}
          />
        </div>
      </div>

      <ApplyStickyBar
        jobTitle={job.title}
        submitButtonRef={inFormSubmitRef}
        submitting={submit.submitting}
        disabled={!canSubmit}
        blockedReason={blockedReason}
        onSubmit={submit.handleSubmit}
      />
    </div>
  );
}
