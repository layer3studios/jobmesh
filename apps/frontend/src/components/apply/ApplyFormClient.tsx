'use client';
// FILE: src/components/apply/ApplyFormClient.tsx
// Public apply form (/apply/:companySlug/:jobSlug). Renders the field block
// (ApplyFormFields), validates client-side (mirroring the backend), submits
// multipart FormData, and routes to the success page. No auth/contexts (C9).
// The server shell provides {company, job}; this island owns form state + submit.
//
// TAKE-HOME POSTINGS (7b). When `assignment` is non-null the form additionally
// collects submission links, staged files, profile links and notes, and keeps a
// local draft. When it is NULL every one of those paths is skipped at the top —
// `hasAssignment` guards each new effect, callback and FormData append, so a plain
// posting submits byte-identically to before this chunk.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Alert, Stack } from '@/components/ui';
import ApplyFormFields from './ApplyFormFields';
import AssignmentSection from './AssignmentSection';
import ApplyProgress from './ApplyProgress';
import ApplyStickyBar from './ApplyStickyBar';
import { submitApplication, PublicApiError, expiredFilesFrom } from '@/api/public-api';
import { validateApplyForm, fieldError, mapServerError } from './apply-form-helpers';
import type { ApplyErrors } from './apply-form-helpers';
import { validateSubmissionLink, MAX_SUBMISSION_LINKS } from './assignment-validation';
import { useAssignmentFiles } from './useAssignmentFiles';
import { readDraft, writeDraft, clearDraft } from './assignment-draft';
import type { DraftPayload } from './assignment-draft';
import { copyToClipboard } from '@/lib/clipboard';
import CompanyLogoMark from '@/components/company/CompanyLogoMark';
import { sourceFromQuery } from './apply-source';
import { formatDeadline } from '@/components/employer/jobs/deadline-helpers';
import type { ApplyFormData, PublicCompany, PublicJob, PublicAssignment } from '@/types/public-apply';
import { trackEvent } from '@/lib/analytics-events';

const EMPTY: ApplyFormData = {
  firstName: '', lastName: '', email: '', phone: '', coverNote: '',
  consent_dpdp: false, consent_futureOpportunities: false, resume: null,
  source: '', honeypot: '',
};

// Every major ATS (LinkedIn, Greenhouse, Lever, Ashby) puts the JD on the left and
// keeps the form visible on the right (R1). We opt out of Container size="sm" (640px,
// which wastes ~1280px on desktop) for a wider centred wrapper (P-APPLY.1).
const APPLY_PAGE_MAX_WIDTH_PIXELS = 1400;
const APPLY_PAGE_HORIZONTAL_PADDING_PIXELS = 24;
// The two-column breakpoint (900px) and the sticky offset are NOT constants here
// any more — they live in src/styles/apply.css as a real media query. They used to
// be a JS width branch that rendered two different trees, which remounted the form
// (and dropped staged uploads) when a resize crossed the boundary.

// Blur saves are debounced so typing through five fields writes once, not five
// times. The interval is 30s rather than the 60s originally specced: someone can sit
// in a take-home form for hours, and a minute of lost work after a browser crash is
// more than this feature is worth.
const DRAFT_BLUR_DEBOUNCE_MS = 2000;
const DRAFT_INTERVAL_MS = 30_000;
// One analytics event per 5 minutes. The saves themselves stay frequent; only the
// telemetry is throttled, so a two-hour session is a handful of events, not 240.
const DRAFT_EVENT_THROTTLE_MS = 5 * 60 * 1000;

// Indian job postings show salary in lakhs-per-annum with a ₹ prefix (R5). Only render
// when at least one bound is present (P-APPLY.2).
function formatSalaryLPA(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `₹${min}-${max} LPA`;
  if (min != null) return `₹${min}+ LPA`;
  return `up to ₹${max} LPA`;
}

/** A blocking, non-dismissible outcome that must survive on screen (7b). */
interface BlockingNotice {
  kind: 'assignment_changed' | 'posting_closed' | 'deadline_passed';
  message: string;
}

interface Props {
  company: PublicCompany;
  job: PublicJob;
  companySlug: string;
  jobSlug: string;
  /** Plain data — drives the form logic (which fields exist, what to submit). */
  assignment?: PublicAssignment | null;
  /**
   * The rendered <AssignmentPreview> element. AssignmentPreview is a Server
   * Component and cannot be passed as a component prop to a client island — it has
   * to arrive already rendered, through this slot, so it stays on the server and
   * ships no markdown JavaScript to the browser. It renders inside the JD column.
   */
  assignmentPreview?: React.ReactNode;
}

export default function ApplyFormClient({
  company, job, companySlug, jobSlug, assignment = null, assignmentPreview = null,
}: Props) {
  const router = useRouter();
  // Resolved once, from the URL the candidate actually arrived on. When it maps to
  // a known channel the dropdown is pre-answered and hidden.
  const querySource = sourceFromQuery(useSearchParams().get('source'));
  const [data, setData] = useState<ApplyFormData>(
    () => (querySource ? { ...EMPTY, source: querySource } : EMPTY),
  );
  const [errors, setErrors] = useState<ApplyErrors>({});
  const [submitting, setSubmitting] = useState(false);
  // First-focus-per-field dedup (session-scoped, per form instance — not global).
  const focusedFields = useRef<Set<string>>(new Set());

  // ── Progress snapshot ──────────────────────────────────────────────────────
  // The progress indicator reads THIS, not `data`. A counter driven straight off
  // `data` re-evaluates on every keystroke, so the bar twitches forward and back
  // while an email is half-typed and the whole indicator reads as unstable. This
  // snapshot is committed on blur (text fields) and on change (file/checkbox,
  // where there is no half-typed state to be wrong about).
  const [progressData, setProgressData] = useState<ApplyFormData>(EMPTY);
  const dataRef = useRef(data);
  dataRef.current = data;
  // The last COMMITTED snapshot, mirrored in a ref. Text fields fold in on blur;
  // a discrete field (file, checkbox) folds in only itself, so clicking a
  // checkbox cannot drag a half-typed email in with it.
  const progressRef = useRef<ApplyFormData>(EMPTY);
  // Same reasoning for the submission links: settled on blur, not mid-URL.
  const [progressLinks, setProgressLinks] = useState<string[]>(['']);
  // The in-form submit button. The sticky bar observes it and hides while it is
  // on screen — it is not read for anything else.
  const inFormSubmitRef = useRef<HTMLDivElement>(null);

  // ── Assignment state. Inert for a plain posting (rule 1). ──────────────────
  const hasAssignment = assignment != null;
  const [links, setLinks] = useState<string[]>(['']);
  const [linkErrors, setLinkErrors] = useState<Array<string | null>>([null]);
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [notes, setNotes] = useState('');
  const [draftPrompt, setDraftPrompt] = useState<DraftPayload | null>(null);
  const [notice, setNotice] = useState<BlockingNotice | null>(null);
  const [expiredNotice, setExpiredNotice] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const uploads = useAssignmentFiles({
    postingId: job.id,
    allowedFileTypes: assignment?.allowedFileTypes ?? [],
    enabled: hasAssignment,
  });

  // The disabled attribute alone LOSES a fast double-click: React has not re-rendered
  // by the time the second click lands, so the button is still enabled in the DOM.
  // This ref closes that window synchronously (rule 10) — both guards are required.
  const inFlight = useRef(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDraftEventAt = useRef(0);

  // Reaching the apply form = the seeker started applying (public, unauthenticated
  // flow). hasAssignment is the denominator half of the abandonment ratio: this
  // event fires for BOTH populations, so the flag is what lets the two be compared.
  useEffect(() => {
    trackEvent('apply_started', {
      jobId: job.id, companyId: company.slug, applyMethod: 'public', hasAssignment,
    });
  }, [job.id, company.slug, hasAssignment]);

  useEffect(() => {
    if (!assignment) return; // plain posting — no assignment telemetry at all
    trackEvent('assignment_apply_form_viewed', { postingId: job.id, assignmentId: assignment.id });
  }, [assignment, job.id]);

  const onFieldFocus = useCallback((field: string) => {
    if (focusedFields.current.has(field)) return;
    focusedFields.current.add(field);
    trackEvent('apply_form_field_focused', { jobId: job.id, fieldName: field });
  }, [job.id]);

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
    if (field === 'resume' || field === 'consent_dpdp') {
      progressRef.current = { ...progressRef.current, [field]: value };
      setProgressData(progressRef.current);
    }
  }, []);

  // ── Draft persistence ─────────────────────────────────────────────────────
  // Every localStorage call lives in assignment-draft.ts and is wrapped in
  // try/catch there; nothing below can throw when storage is unavailable.
  const saveDraft = useCallback(() => {
    if (!assignment) return; // plain posting — never writes anything (rule 1)
    writeDraft(job.id, {
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
      trackEvent('assignment_draft_saved', { postingId: job.id });
    }
  }, [assignment, job.id, data, links, github, linkedin, notes, uploads.doneFiles]);

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
    const draft = readDraft(job.id);
    if (draft) setDraftPrompt(draft);
  }, [hasAssignment, job.id]);

  const restoreDraft = useCallback(() => {
    if (!draftPrompt || !assignment) return;
    const { fields, files } = draftPrompt;

    // Contact details are about the PERSON and survive any task change.
    setData((d) => ({
      ...d,
      firstName: fields.firstName ?? '', lastName: fields.lastName ?? '',
      email: fields.email ?? '', phone: fields.phone ?? '', coverNote: fields.coverNote ?? '',
      // resume stays null — it was never storable.
    }));

    // The employer swapped the task while this draft sat on disk. The links, files
    // and notes answer the OLD task, so restoring them would silently hand the
    // candidate work that reads as wrong to the reviewer. Drop that half and say so
    // — losing it loudly is far better than submitting it unknowingly.
    const taskChanged = draftPrompt.assignmentId !== assignment.id;
    if (taskChanged) {
      setLinks(['']);
      setLinkErrors([null]);
      setGithub(fields.github ?? '');   // profile links are about the person too
      setLinkedin(fields.linkedin ?? '');
      setNotes('');
      setRestoreNotice(
        'The task for this role changed. Your details were restored, but you\'ll need to redo the submission.',
      );
      // The stale draft is replaced on the next save; clearing it now stops a
      // reload from re-offering submission work we just told them is void.
      clearDraft(job.id);
    } else {
      const restoredLinks = Array.isArray(fields.links) && fields.links.length > 0 ? fields.links : [''];
      setLinks(restoredLinks);
      setLinkErrors(restoredLinks.map(() => null));
      setGithub(fields.github ?? '');
      setLinkedin(fields.linkedin ?? '');
      setNotes(fields.notes ?? '');
      uploads.restoreFromDraft(files);
    }

    // A restore is a bulk change with no typing involved, so the indicator should
    // reflect it immediately rather than waiting for the first blur.
    progressRef.current = {
      ...progressRef.current,
      firstName: fields.firstName ?? '', lastName: fields.lastName ?? '',
      email: fields.email ?? '', phone: fields.phone ?? '', coverNote: fields.coverNote ?? '',
    };
    setProgressData(progressRef.current);
    setProgressLinks(taskChanged || !Array.isArray(fields.links) || fields.links.length === 0
      ? [''] : fields.links);

    trackEvent('assignment_draft_restored', {
      postingId: job.id,
      fileCount: taskChanged ? 0 : files.length,
      // Files dropped because the TASK changed, not because they aged out. Counting
      // them here keeps "work the candidate lost on restore" in one number.
      expiredFileCount: taskChanged ? files.length : 0,
    });
    setDraftPrompt(null);
  }, [draftPrompt, assignment, job.id, uploads]);

  // "Start over" is a deletion, not a dismissal: the draft holds the candidate's
  // email, phone and notes in localStorage (rule 7), so declining it must remove it.
  const discardDraft = useCallback(() => {
    clearDraft(job.id);
    setDraftPrompt(null);
  }, [job.id]);

  // ── Link rows ─────────────────────────────────────────────────────────────
  const onLinkChange = useCallback((index: number, value: string) => {
    setLinks((rows) => rows.map((row, i) => (i === index ? value : row)));
    setLinkErrors((rows) => rows.map((row, i) => (i === index ? null : row)));
    setErrors((e) => ({ ...e, assignmentLinks: undefined, _form: undefined }));
  }, []);

  const onLinkBlur = useCallback((index: number) => {
    setLinks((rows) => {
      setLinkErrors((errs) => errs.map((err, i) => (i === index ? validateSubmissionLink(rows[i] ?? '') : err)));
      setProgressLinks(rows);
      return rows;
    });
  }, []);

  const onAddLink = useCallback(() => {
    setLinks((rows) => (rows.length >= MAX_SUBMISSION_LINKS ? rows : [...rows, '']));
    setLinkErrors((rows) => (rows.length >= MAX_SUBMISSION_LINKS ? rows : [...rows, null]));
  }, []);

  const onRemoveLink = useCallback((index: number) => {
    setLinks((rows) => {
      const next = rows.length <= 1 ? [''] : rows.filter((_, i) => i !== index);
      setProgressLinks(next);
      return next;
    });
    setLinkErrors((rows) => (rows.length <= 1 ? [null] : rows.filter((_, i) => i !== index)));
  }, []);

  const onBlur = useCallback((field: keyof ApplyFormData) => {
    setData((d) => { setErrors((e) => ({ ...e, [field]: fieldError(field, d) })); return d; });
    progressRef.current = { ...dataRef.current, resume: progressRef.current.resume };
    setProgressData(progressRef.current);
    scheduleDraftSave();
  }, [scheduleDraftSave]);

  // ── Progress sections ──────────────────────────────────────────────────────
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
      + uploads.doneFiles.length > 0;

    return [
      { id: 'details', complete: detailsComplete },
      { id: 'resume', complete: progressData.resume !== null },
      // RULE 3: a plain posting has no submission section at all, so it counts
      // three sections, not four with one permanently unreachable. Guarded once,
      // here, rather than branching inside the indicator.
      ...(hasAssignment ? [{ id: 'submission', complete: submissionComplete }] : []),
      { id: 'consent', complete: progressData.consent_dpdp },
    ];
  }, [progressData, progressLinks, uploads.doneFiles.length, hasAssignment]);

  const validLinks = useMemo(
    () => links.map((link) => link.trim()).filter((link) => link !== '' && validateSubmissionLink(link) === null),
    [links],
  );
  const submissionCount = validLinks.length + uploads.doneFiles.length;
  // An assignment posting needs at least one link OR one FINISHED upload. A file
  // still in flight does not count — its fileId does not exist yet.
  const assignmentReady = !hasAssignment || submissionCount > 0;

  const canSubmit = useMemo(() => (
    data.firstName.trim() !== '' && data.lastName.trim() !== '' && data.email.trim() !== ''
    && data.resume !== null && data.consent_dpdp && !submitting && assignmentReady
  ), [data, submitting, assignmentReady]);

  // A disabled button with no explanation is a dead end — the candidate cannot tell
  // whether the form is broken or they missed something. Say which.
  const blockedReason = hasAssignment && !assignmentReady
    ? (uploads.uploading
      ? 'Waiting for your upload to finish.'
      : 'Add at least one submission link or file.')
    : null;

  const handleSubmit = async () => {
    if (inFlight.current) return; // synchronous double-click guard (rule 10)
    const validation = validateApplyForm(data);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    inFlight.current = true;
    setSubmitting(true);
    setErrors({});
    setExpiredNotice(null);
    try {
      const form = new FormData();
      form.append('firstName', data.firstName.trim());
      form.append('lastName', data.lastName.trim());
      form.append('email', data.email.trim());
      form.append('phone', data.phone.trim());
      form.append('coverNote', data.coverNote.trim());
      form.append('consent_dpdp', String(data.consent_dpdp));
      form.append('consent_futureOpportunities', String(data.consent_futureOpportunities));
      form.append('website_url', data.honeypot);
      // Sent as utm_source: apply-service already reads that key into
      // application.sourceDetail, so this needs no new backend field.
      if (data.source) form.append('utm_source', data.source);
      if (data.resume) form.append('resume', data.resume);

      if (assignment) {
        // assignmentId is REQUIRED. The backend's drift check compares it against
        // posting.assignmentId; omitting it fails every assignment apply with
        // MISSING_ASSIGNMENT_ID before anything else is read.
        form.append('assignmentId', assignment.id);
        for (const link of validLinks) form.append('assignmentLinks[]', link);
        for (const row of uploads.doneFiles) {
          if (row.fileId) form.append('assignmentFileIds[]', row.fileId);
        }
        form.append('assignmentNotesMarkdown', notes.trim());
        form.append('githubUrl', github.trim());
        form.append('linkedinUrl', linkedin.trim());
      }

      await submitApplication(companySlug, jobSlug, form);
      trackEvent('apply_submitted', {
        jobId: job.id, companyId: company.slug, applyMethod: 'public',
        hasResume: data.resume !== null, hasCoverNote: data.coverNote.trim() !== '',
        // Sent for BOTH populations — it is the numerator half of the ratio.
        hasAssignment,
        ...(assignment ? {
          linkCount: validLinks.length,
          fileCount: uploads.doneFiles.length,
          hasGithubProfile: github.trim() !== '',
          hasLinkedinProfile: linkedin.trim() !== '',
        } : {}),
      });
      // The work is committed server-side, so the local copy of the candidate's
      // email, phone and notes has no reason to keep existing (rule 7).
      if (assignment) clearDraft(job.id);
      const query = new URLSearchParams();
      if (company.name) query.set('company', company.name);
      if (job.title) query.set('job', job.title);
      query.set('jid', job.id);
      router.replace(`/apply/${companySlug}/${jobSlug}/success?${query.toString()}`);
    } catch (err) {
      // The deadline passed between page load and submit. Applies to every posting,
      // assignment or not, so it is handled before the assignment-only branch.
      if (err instanceof PublicApiError && err.code === 'POSTING_DEADLINE_PASSED') {
        setNotice({
          kind: 'deadline_passed',
          message: 'This posting has closed since you opened the page. Your application was not submitted.',
        });
        return;
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
          return;
        }
        if (err.code === 'ASSIGNMENT_CHANGED') {
          setNotice({ kind: 'assignment_changed', message: err.message });
          return;
        }
        if (err.code === 'POSTING_CLOSED_DURING_APPLY') {
          setNotice({ kind: 'posting_closed', message: err.message });
          return;
        }
      }
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
    const typedLinks = links.map((link) => link.trim()).filter(Boolean);
    if (typedLinks.length > 0) lines.push('Links:', ...typedLinks.map((link) => `- ${link}`));
    if (uploads.files.length > 0) {
      lines.push('', 'Files:', ...uploads.files.map((row) => `- ${row.originalName}`));
    }
    if (notes.trim()) lines.push('', 'Notes:', notes.trim());
    return lines.join('\n');
  }, [links, notes, uploads.files]);

  // copyToClipboard returns false on a blocked permission, an insecure origin where
  // execCommand is also gone, or an embedded webview. This is the ONE action a
  // candidate whose posting just closed cannot afford to have fail quietly, so a
  // false answer reveals the text for manual selection instead of doing nothing.
  const copyMyWork = useCallback(async () => {
    const ok = await copyToClipboard(myWorkAsText());
    setCopyState(ok ? 'copied' : 'failed');
  }, [myWorkAsText]);

  // The server already refused to render this page on a PASSED deadline, so any
  // label here is necessarily for a future date.
  const deadlineLabel = formatDeadline(job.applicationDeadline);

  const jdBlock = (
    <div>
      {/* The employer's own mark, so the page reads as THEIR careers surface rather
          than a generic form. Falls back to initials when no logo is uploaded. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <CompanyLogoMark name={company.name} logoUrl={company.logoUrl} size={44} borderRadius={10} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{company.name}</p>
          {company.tagline && (
            <p style={{ margin: '1px 0 0', fontSize: '0.825rem', color: 'var(--ink-muted)' }}>{company.tagline}</p>
          )}
        </div>
      </div>
      <h1 className="font-display" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 600, color: 'var(--ink)' }}>{job.title}</h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginTop: 4 }}>
        {[job.location, job.employmentType, formatSalaryLPA(job.salaryMin, job.salaryMax)].filter(Boolean).join(' · ')}
      </p>
      {/* ABOVE the description, deliberately. A take-home is the single largest
          cost a candidate is being asked to accept, and burying that disclosure
          under 500 words of job description means they commit to reading before
          they know what they are committing to. It goes directly under the
          header — title, company, location, salary — and before the JD.

          Still a Server Component: it arrives already rendered through the
          assignmentPreview slot and ships no markdown JavaScript to the browser.
          Moving it is a change of position, not of ownership. */}
      {assignmentPreview && <div style={{ marginTop: 16 }}>{assignmentPreview}</div>}
      <p className="apply-jd-description" style={{ fontSize: '0.875rem', color: 'var(--ink)', marginTop: 12, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{job.description}</p>
    </div>
  );

  const draftBanner = draftPrompt && (
    <div
      style={{
        padding: '12px 14px', borderRadius: 10,
        background: 'var(--info-soft)', color: 'var(--ink)', fontSize: '0.85rem', lineHeight: 1.55,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>You have unfinished work on this application.</p>
      <p style={{ marginBottom: 4 }}>
        We saved your links, notes and uploads on this device.
      </p>
      {/* Said explicitly, because it is guaranteed to be true: the resume is a File
          and cannot be serialized, so EVERY restored draft has an empty resume slot.
          Leaving this out means restore → submit → "resume required", and the draft
          feature reads as a lie. */}
      <p style={{ marginBottom: 10, color: 'var(--ink-muted)' }}>
        You&apos;ll need to attach your resume again — files like that can&apos;t be saved in your browser.
      </p>
      <Stack gap={8} dir="row" wrap>
        <Button type="button" size="sm" onClick={restoreDraft}>Resume</Button>
        <Button type="button" size="sm" variant="secondary" onClick={discardDraft}>Start over</Button>
      </Stack>
    </div>
  );

  const formCard = (
    <Card className="apply-card" style={{ padding: 20, borderRadius: 10 }}>
      <Stack gap={16}>
        {/* Pinned at the top of the card, above every notice — it describes the
            form as a whole, so it should not move as banners come and go. */}
        <ApplyProgress sections={progressSections} />

        {draftBanner}

        {/* Non-dismissible: refreshing is the only correct action, and letting this
            be closed leaves someone submitting against a task that no longer exists. */}
        {notice?.kind === 'assignment_changed' && (
          <Alert type="warning">
            <p>{notice.message}</p>
            <div style={{ marginTop: 8 }}>
              <Button type="button" size="sm" variant="secondary" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>
          </Alert>
        )}

        {/* The posting closed while they were working. No redirect and no draft
            clear — they may have spent hours on this, and the least we can do is
            let them take the work with them. */}
        {notice?.kind === 'posting_closed' && (
          <Alert type="error">
            <p>{notice.message}</p>
            <div style={{ marginTop: 8 }}>
              <Button type="button" size="sm" variant="secondary" onClick={copyMyWork}>
                {copyState === 'copied' ? 'Copied' : 'Copy my work'}
              </Button>
            </div>
            {/* The clipboard was refused. Never leave them pressing a button that
                does nothing — put the text on screen so they can select it. */}
            {copyState === 'failed' && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                  Your browser blocked the clipboard. Copy your work from here:
                </p>
                <textarea
                  readOnly
                  aria-label="Your submission, ready to copy"
                  value={myWorkAsText()}
                  rows={6}
                  style={{ width: '100%', fontSize: '0.78rem', fontFamily: 'inherit', padding: 8, borderRadius: 8 }}
                />
              </div>
            )}
          </Alert>
        )}

        {/* Lost the race: the deadline passed while they were filling the form.
            Says plainly that nothing was submitted, and offers the one useful
            next step rather than leaving them on a dead form. */}
        {notice?.kind === 'deadline_passed' && (
          <Alert type="error">
            <p>{notice.message}</p>
            <div style={{ marginTop: 8 }}>
              <Link href={`/apply/${companySlug}`}>
                <Button type="button" size="sm" variant="secondary">See other roles</Button>
              </Link>
            </div>
          </Alert>
        )}

        {/* Stated before the form, not after: the cost of finding out late is a
            filled-in form that cannot be submitted. */}
        {deadlineLabel && !notice && (
          <p style={{
            margin: 0, padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: 'var(--warning-soft)', color: 'var(--warning)',
          }}>
            Applications close on {deadlineLabel}
          </p>
        )}

        {restoreNotice && <Alert type="warning">{restoreNotice}</Alert>}
        {expiredNotice && <Alert type="warning">{expiredNotice}</Alert>}
        {errors._form && <Alert type="error">{errors._form}</Alert>}

        {/* The submission block is passed INTO the field component as a slot so it
            lands between the cover note and the consent checkboxes. It used to
            render after the whole field block, which put the most important part
            of a take-home application underneath a legal checkbox. */}
        <ApplyFormFields
          data={data} errors={errors} companyName={company.name}
          set={set} onBlur={onBlur} onFieldFocus={onFieldFocus}
          showSourceField={querySource === null}
          submissionSlot={assignment && (
          <>
            <AssignmentSection
              title={assignment.title}
              estimatedHours={assignment.estimatedHours}
              allowedFileTypes={assignment.allowedFileTypes}
              links={links}
              linkErrors={linkErrors}
              github={github}
              linkedin={linkedin}
              notes={notes}
              uploads={uploads}
              disabled={submitting}
              onLinkChange={onLinkChange}
              onLinkBlur={onLinkBlur}
              onAddLink={onAddLink}
              onRemoveLink={onRemoveLink}
              onGithubChange={setGithub}
              onLinkedinChange={setLinkedin}
              onNotesChange={setNotes}
              onFieldBlur={scheduleDraftSave}
            />
            {errors.assignmentLinks && (
              <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.assignmentLinks}</p>
            )}
          </>
          )}
        />

        {/* The ONE submit path. The sticky bar calls this exact handler — there is
            no second submit function, and `inFlight` in handleSubmit guards both
            entry points, so a click here and a click there cannot both get through. */}
        <div ref={inFormSubmitRef}>
          <Button loading={submitting} disabled={!canSubmit} onClick={handleSubmit}>Submit application</Button>
          {blockedReason && (
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 6 }}>{blockedReason}</p>
          )}
        </div>
      </Stack>
    </Card>
  );

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
        <div className="apply-jd-column">{jdBlock}</div>
        <div tabIndex={0} className="apply-form-column">
          {formCard}
        </div>
      </div>

      <ApplyStickyBar
        jobTitle={job.title}
        submitButtonRef={inFormSubmitRef}
        submitting={submitting}
        disabled={!canSubmit}
        blockedReason={blockedReason}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
