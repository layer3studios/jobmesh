'use client';
// FILE: src/components/employer/jobs/parts/AssignmentReviewPanel.tsx
// The take-home section of the applicant detail page.
//
// ORDER IS THE DESIGN: task (collapsed) → submission → score form. Scoring before
// reading is the failure mode this whole panel is arranged against, so the form is
// last and nothing above it can be skipped past. The task itself is collapsed
// because a reviewer working a queue has read it several times already.

import { useMemo, useState } from 'react';
import Markdown from '@/components/shared/Markdown';
import { Alert, Badge, Button, Card, Spinner, Stack, Textarea, useToast } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import {
  submitAssignmentReview, getAssignmentFileDownloadUrl, EmployerAssignmentReviewsApiError,
} from '@/api/employer-assignment-reviews-api';
import type { ConflictingReviewer } from '@/api/employer-assignment-reviews-api';
import type { AssignmentReview, AssignmentSubmission } from '@/types/employer-applicants';
import { useEmployer } from '@/context/employer/EmployerContext';
import { trackEvent } from '@/lib/analytics-events';
import { formatRelativeTime, anchorFor } from './review-helpers';
import ScoreSelector from './ScoreSelector';
import ReviewConflictDialog from './ReviewConflictDialog';
import type { PendingReview } from './ReviewConflictDialog';

const NOTES_MAX = 5000;
const labelStyle: React.CSSProperties = { fontSize: TYPE.xs, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' };
const helperStyle: React.CSSProperties = { fontSize: TYPE.xs, color: 'var(--ink-muted)', margin: '6px 0 0', lineHeight: 1.5 };

function formatSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  submission: AssignmentSubmission;
  /** The stored review, or null when nobody has reviewed yet. */
  review: AssignmentReview | null;
  /** Used only to tell "my review" from "a teammate's" — see the anchoring note. */
  currentEmployerUserId: string | null;
  onSaved?: () => void | Promise<void>;
}

export default function AssignmentReviewPanel({
  submission, review: initialReview, currentEmployerUserId, onSaved,
}: Props) {
  const { showToast } = useToast();
  const { company } = useEmployer();
  const companyId = company?.id ?? '';
  // The submission carries its own jobId, so the panel does not need it threaded in.
  const postingId = submission.jobId ?? '';
  const [review, setReview] = useState<AssignmentReview | null>(initialReview);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isTeammateReviewOpen, setIsTeammateReviewOpen] = useState(false);

  const isOwnReview = review != null
    && currentEmployerUserId != null
    && review.reviewedByEmployerUserId === currentEmployerUserId;

  /**
   * ANCHORING. A second reviewer who reads "3/5, doesn't clear the bar" before
   * forming their own view will land near 3 — sequential evaluations converge on
   * whatever was seen first, and the second opinion stops being independent, which
   * is the only reason to collect it. So a TEAMMATE's review is collapsed behind a
   * disclosure until this reviewer has saved their own. Their OWN prior review is
   * shown normally: there is nothing to anchor to that they did not already think.
   *
   * Do not "improve" this by surfacing the teammate's score inline.
   */
  const hideTeammateReview = review != null && !isOwnReview;

  // The form starts from the reviewer's own prior review, never from a teammate's.
  const [score, setScore] = useState<number | null>(isOwnReview ? review?.overallScore ?? null : null);
  const [passesBar, setPassesBar] = useState<boolean | null>(isOwnReview ? review?.passesBar ?? null : null);
  const [notes, setNotes] = useState(isOwnReview ? review?.reviewNotesMarkdown ?? '' : '');
  const [isEditing, setIsEditing] = useState(!isOwnReview);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Per-file, so one download never blocks or spins another.
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [conflict, setConflict] = useState<{
    currentReview: AssignmentReview; reviewer: ConflictingReviewer | null; pending: PendingReview;
  } | null>(null);

  const snapshot = submission.assignmentSnapshot;
  const filesDeleted = submission.filesDeletedAt != null;
  const canSubmit = score != null && passesBar != null && !isSubmitting;

  /**
   * DOWNLOADS ARE MINTED ON CLICK, NEVER ON MOUNT. The signed token lives about 15
   * minutes. Anyone who actually reads a take-home before downloading its files will
   * blow through that, so a URL minted when the panel opened would 401 for precisely
   * the reviewer doing the job properly. There is deliberately no effect fetching
   * these — the round trip happens here, with a per-file spinner.
   */
  async function handleDownload(fileId: string | null) {
    if (!fileId) return;
    setDownloadingFileId(fileId);
    setFileError(null);
    try {
      const { url } = await getAssignmentFileDownloadUrl(submission.id, fileId);
      window.open(url, '_blank', 'noopener');
    } catch (error) {
      // 410 means retention removed the bytes between the page load and this click.
      const gone = error instanceof EmployerAssignmentReviewsApiError && error.status === 410;
      setFileError(gone ? 'Files were deleted.' : 'Could not prepare that download. Try again.');
    } finally {
      setDownloadingFileId(null);
    }
  }

  async function save(expectedReviewedAt: string | null, pending: PendingReview) {
    // A resolved conflict is in flight when we are re-submitting from the dialog.
    const isConflictReplace = conflict !== null;
    const isEdit = isOwnReview && !isConflictReplace;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const saved = await submitAssignmentReview(submission.id, {
        overallScore: pending.overallScore,
        passesBar: pending.passesBar,
        reviewNotesMarkdown: pending.reviewNotesMarkdown,
        expectedReviewedAt,
      });
      setReview(saved);
      setConflict(null);
      setIsEditing(false);
      // Score and verdict are numbers/booleans; the notes never leave the browser.
      if (isConflictReplace) {
        trackEvent('assignment_review_conflicted', { companyId, postingId, resolution: 'replaced' });
      }
      if (isEdit) trackEvent('assignment_review_edited', { companyId, postingId });
      else {
        trackEvent('assignment_review_submitted', {
          companyId, postingId, overallScore: pending.overallScore, passesBar: pending.passesBar,
        });
      }
      showToast('success', 'Review saved.');
      await onSaved?.();
    } catch (error) {
      if (error instanceof EmployerAssignmentReviewsApiError && error.isConflict && error.currentReview) {
        // Not an error state — a decision. The form keeps every keystroke.
        setConflict({
          currentReview: error.currentReview,
          reviewer: error.conflictingReviewer,
          pending,
        });
        return;
      }
      setFormError(error instanceof EmployerAssignmentReviewsApiError
        ? error.message
        : 'Could not save your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const pendingFromForm = (): PendingReview | null => (
    score == null || passesBar == null
      ? null
      : { overallScore: score, passesBar, reviewNotesMarkdown: notes }
  );

  async function handleSave() {
    const pending = pendingFromForm();
    if (!pending) return;
    // The version we believe we are writing against: our own stored review's
    // reviewedAt, or null meaning "I believe nobody has reviewed this".
    await save(isOwnReview ? review?.reviewedAt ?? null : null, pending);
  }

  const reviewedAgo = review?.reviewedAt ? formatRelativeTime(review.reviewedAt) : null;
  const savedAnchor = useMemo(() => anchorFor(review?.overallScore), [review?.overallScore]);

  return (
    <Card>
      <Stack gap={16}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Take-home</h2>

        {/* ── a. What the candidate saw — COLLAPSED ─────────────────────────── */}
        <section aria-label="What the candidate saw">
          <button
            type="button"
            aria-expanded={isTaskOpen}
            onClick={() => setIsTaskOpen((open) => !open)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: TYPE.sm, fontWeight: 600, color: 'var(--link)',
            }}
          >
            {isTaskOpen ? '▾' : '▸'} What the candidate saw
          </button>
          {isTaskOpen && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              {snapshot ? (
                <>
                  <p style={{ fontSize: TYPE.sm, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>
                    {snapshot.title}
                  </p>
                  {snapshot.estimatedHours != null && (
                    <Badge variant="neutral" size="sm">{`~${snapshot.estimatedHours}h`}</Badge>
                  )}
                  {snapshot.descriptionMarkdown && <Markdown>{snapshot.descriptionMarkdown}</Markdown>}
                  {snapshot.submissionInstructionsMarkdown && (
                    <Markdown>{snapshot.submissionInstructionsMarkdown}</Markdown>
                  )}
                </>
              ) : (
                <p style={helperStyle}>The task snapshot is unavailable for this submission.</p>
              )}
            </div>
          )}
        </section>

        {/* ── b. The submission ─────────────────────────────────────────────── */}
        <section aria-label="Submission" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <p style={labelStyle}>
            {`Submitted${submission.submittedAt ? ` ${formatRelativeTime(submission.submittedAt)}` : ''}`}
          </p>

          {submission.links.length > 0 && (
            <ul style={{ margin: '0 0 12px', paddingLeft: 18 }}>
              {submission.links.map((link) => (
                <li key={link.url ?? ''} style={{ fontSize: TYPE.sm, marginBottom: 4 }}>
                  <a href={link.url ?? '#'} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'var(--link)' }}>
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {filesDeleted ? (
            <p style={helperStyle}>Files were deleted.</p>
          ) : submission.files.length > 0 && (
            <Stack gap={6}>
              {submission.files.map((file) => (
                <div
                  key={file.fileId ?? file.originalName ?? ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: TYPE.sm, flex: '1 1 140px', minWidth: 0 }}>{file.originalName}</span>
                  {file.sizeBytes != null && (
                    <span style={{ fontSize: TYPE.xs, color: 'var(--ink-faint)' }}>{formatSize(file.sizeBytes)}</span>
                  )}
                  {file.mimeType && <Badge variant="neutral" size="sm">{file.mimeType.split('/').pop()?.toUpperCase()}</Badge>}
                  <Button
                    variant="secondary" size="sm"
                    disabled={downloadingFileId === file.fileId}
                    onClick={() => handleDownload(file.fileId)}
                  >
                    {downloadingFileId === file.fileId
                      ? <><Spinner size={12} /> Preparing…</>
                      : 'Download'}
                  </Button>
                </div>
              ))}
            </Stack>
          )}

          {fileError && <p style={{ ...helperStyle, color: 'var(--danger)' }}>{fileError}</p>}

          {submission.seekerNotesMarkdown?.trim() && (
            <div style={{ marginTop: 12 }}>
              <p style={labelStyle}>Candidate notes</p>
              <Markdown>{submission.seekerNotesMarkdown}</Markdown>
            </div>
          )}
        </section>

        {/* A teammate already reviewed — collapsed until this reviewer commits. */}
        {hideTeammateReview && (
          <section aria-label="Teammate review" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button
              type="button"
              aria-expanded={isTeammateReviewOpen}
              onClick={() => setIsTeammateReviewOpen((open) => !open)}
              style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: TYPE.sm, color: 'var(--link)', fontWeight: 600,
              }}
            >
              A teammate has reviewed this — show
            </button>
            {isTeammateReviewOpen && review && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                  <Badge variant="neutral">{`${review.overallScore}/5`}</Badge>
                  <Badge variant={review.passesBar ? 'success' : 'danger'}>{review.passesBar ? 'Passed' : 'Failed'}</Badge>
                  {reviewedAgo && <span style={{ fontSize: TYPE.xs, color: 'var(--ink-muted)' }}>{reviewedAgo}</span>}
                </div>
                {review.reviewNotesMarkdown && <Markdown>{review.reviewNotesMarkdown}</Markdown>}
              </div>
            )}
          </section>
        )}

        {/* ── c. The score form, last ─────────────────────────────────────────
            Labelled "Your review form", not "Your review": the conflict dialog uses
            the latter for its own column, and two live regions sharing one
            accessible name is ambiguous to a screen reader when both are open. */}
        <section aria-label="Your review form" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {formError && <Alert type="error">{formError}</Alert>}

          {isOwnReview && !isEditing ? (
            <div>
              <p style={labelStyle}>{`Your review${reviewedAgo ? ` · ${reviewedAgo}` : ''}`}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge variant="neutral">{`${review?.overallScore}/5`}</Badge>
                <Badge variant={review?.passesBar ? 'success' : 'danger'}>{review?.passesBar ? 'Passed' : 'Failed'}</Badge>
                {savedAnchor && <span style={{ fontSize: TYPE.xs, color: 'var(--ink-muted)' }}>{savedAnchor.label}</span>}
              </div>
              {review?.reviewNotesMarkdown && <Markdown>{review.reviewNotesMarkdown}</Markdown>}
              <div style={{ marginTop: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit review</Button>
              </div>
            </div>
          ) : (
            <Stack gap={14}>
              <ScoreSelector value={score} disabled={isSubmitting} onChange={setScore} />

              <div>
                <p style={{ fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>
                  Passes the bar?
                </p>
                <div role="radiogroup" aria-label="Passes the bar" style={{ display: 'flex', gap: 8 }}>
                  {[{ value: true, label: 'Yes' }, { value: false, label: 'No' }].map((option) => (
                    <Button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={passesBar === option.value}
                      variant={passesBar === option.value ? 'primary' : 'secondary'}
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => setPassesBar(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Textarea
                  label="Review notes"
                  rows={5}
                  value={notes}
                  maxLength={NOTES_MAX}
                  disabled={isSubmitting}
                  placeholder="What stood out, what you'd probe in an interview…"
                  onChange={(event) => setNotes(event.target.value.slice(0, NOTES_MAX))}
                />
                <p style={helperStyle}>
                  {`Private to your team — never shown to the candidate. ${notes.length} / ${NOTES_MAX}`}
                </p>
              </div>

              <Stack gap={8} dir="row" wrap>
                <Button loading={isSubmitting} disabled={!canSubmit} onClick={handleSave}>
                  {isOwnReview ? 'Save changes' : 'Save review'}
                </Button>
                {isOwnReview && (
                  <Button variant="ghost" disabled={isSubmitting} onClick={() => setIsEditing(false)}>Cancel</Button>
                )}
              </Stack>
              {!canSubmit && !isSubmitting && (
                <p style={helperStyle}>Pick a score and whether they pass the bar.</p>
              )}
            </Stack>
          )}
        </section>
      </Stack>

      <ReviewConflictDialog
        currentReview={conflict?.currentReview ?? null}
        conflictingReviewer={conflict?.reviewer ?? null}
        pending={conflict?.pending ?? null}
        isSubmitting={isSubmitting}
        // Closes and makes no request. The form still holds everything they typed,
        // so "keep theirs" is reversible until they navigate away.
        onKeepTheirs={() => {
          // Recorded because it is the outcome, not the absence of one: a team that
          // mostly keeps the other review has a different problem from one that
          // mostly overrides.
          trackEvent('assignment_review_conflicted', { companyId, postingId, resolution: 'kept_theirs' });
          setConflict(null);
        }}
        onReplace={(expectedReviewedAt) => {
          if (conflict) void save(expectedReviewedAt, conflict.pending);
        }}
      />
    </Card>
  );
}
