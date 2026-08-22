// FILE: src/components/employer/jobs/parts/review-helpers.ts
// Pure helpers for the assignment review surfaces: the list pill, the filter
// predicate, and the score anchors. No React, no I/O.
//
// Relative time is NOT reimplemented here — formatRelativeTime already exists in
// applicant-view-helpers.ts and is used by the Ranked table and Kanban cards. It is
// re-exported so review code has one import, and so "2m ago" reads identically
// wherever it appears.

import type {
  Applicant, ApplicantAssignmentSummary, AssignmentReviewFilter,
} from '@/types/employer-applicants';

export { formatRelativeTime } from '@/components/employer/jobs/applicant-view-helpers';

export interface PillState {
  label: string;
  variant: 'neutral' | 'success' | 'danger' | 'warning';
  /** True when there is nothing to review — no submission was ever made. */
  isEmpty: boolean;
}

/**
 * The list cell's pill.
 *
 * Four states, and the distinction between the last two matters: "Not reviewed"
 * means work is waiting for you, "No submission" means there is nothing to wait
 * for. Collapsing them would hide a queue.
 */
export function assignmentPillState(assignment: ApplicantAssignmentSummary | null | undefined): PillState {
  if (!assignment) return { label: 'No submission', variant: 'neutral', isEmpty: true };
  const { review } = assignment;
  if (!review) return { label: 'Not reviewed', variant: 'warning', isEmpty: false };
  return {
    label: `${review.overallScore}/5 · ${review.passesBar ? 'Passed' : 'Failed'}`,
    variant: review.passesBar ? 'success' : 'danger',
    isEmpty: false,
  };
}

/**
 * Does one row satisfy an assignment filter? Mirrors filterByAssignmentReview in
 * employer-applicants-controller.js — the server filters authoritatively; this
 * exists so the UI can reason about the same rules without a round trip.
 *
 * A row with no submission satisfies NONE of the four filters, including
 * 'not_reviewed'. Someone filtering for unreviewed work wants a queue of things
 * they can act on, and a candidate who submitted nothing is not one of them.
 */
export function matchesAssignmentFilter(
  applicant: Pick<Applicant, 'assignment'>, filter: AssignmentReviewFilter | null,
): boolean {
  if (!filter) return true;
  const assignment = applicant.assignment;
  if (!assignment) return false;
  const review = assignment.review;
  switch (filter) {
    case 'reviewed': return review != null;
    case 'not_reviewed': return review == null;
    case 'passed': return review?.passesBar === true;
    case 'failed': return review != null && review.passesBar === false;
    default: return true;
  }
}

/**
 * The 1–5 anchors.
 *
 * Unlabelled stars produce wildly inconsistent scoring between reviewers — that is
 * the problem anchoring solves. But an adjective alone ("Strong") is just a second
 * abstract category, which is the same problem wearing a label. Each point gets one
 * OBSERVABLE line a reviewer can check the submission against. Static on purpose:
 * per-company configuration would let each team drift into its own private scale
 * and make scores incomparable across postings.
 */
export const SCORE_ANCHORS: ReadonlyArray<{ value: number; label: string; description: string }> = [
  { value: 1, label: 'Poor', description: 'Incomplete, or does not run' },
  { value: 2, label: 'Below bar', description: 'Works, but misses core requirements' },
  { value: 3, label: 'Meets bar', description: 'Does what was asked, competently' },
  { value: 4, label: 'Strong', description: 'Complete, with good judgement in the details' },
  { value: 5, label: 'Exceptional', description: "Would raise the team's average" },
] as const;

/** The anchor for one score, or null when it is out of range / unset. */
export function anchorFor(score: number | null | undefined) {
  if (score == null) return null;
  return SCORE_ANCHORS.find((anchor) => anchor.value === score) ?? null;
}

/** "4 · Strong — Complete, with good judgement in the details". */
export function formatAnchorLine(score: number | null | undefined): string | null {
  const anchor = anchorFor(score);
  if (!anchor) return null;
  return `${anchor.value} · ${anchor.label} — ${anchor.description}`;
}

export interface FilterChip {
  id: AssignmentReviewFilter | null;
  label: string;
}

/** The chip row. `null` is the All chip — it clears the query param entirely. */
export const ASSIGNMENT_FILTER_CHIPS: ReadonlyArray<FilterChip> = [
  { id: null, label: 'All' },
  { id: 'reviewed', label: 'Assignment reviewed' },
  { id: 'not_reviewed', label: 'Not reviewed' },
  { id: 'passed', label: 'Passed bar' },
  { id: 'failed', label: 'Failed bar' },
] as const;

const VALID_FILTERS: AssignmentReviewFilter[] = ['reviewed', 'not_reviewed', 'passed', 'failed'];

/** Read the filter out of a query string, ignoring anything unrecognised. */
export function parseAssignmentFilter(raw: string | null | undefined): AssignmentReviewFilter | null {
  if (!raw) return null;
  return VALID_FILTERS.includes(raw as AssignmentReviewFilter) ? (raw as AssignmentReviewFilter) : null;
}

/**
 * The pre-filter stats line. Worded to describe the POSTING, never the view —
 * "47 applications", not "showing 47" — because the number does not change when a
 * chip is clicked. See the AssignmentStats doc comment for why.
 */
export function formatStatsLine(stats: {
  total: number; reviewed: number; passing: number;
}): string {
  return `${stats.total} ${stats.total === 1 ? 'application' : 'applications'} · `
    + `${stats.reviewed} reviewed · ${stats.passing} passing`;
}
