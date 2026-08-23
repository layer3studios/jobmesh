// FILE: src/types/employer-applicant-detail-extras.ts
// Pieces that hang off the applicant detail rather than the list: the candidate's
// other applications at this company, their screening answers, and the sort the
// ranked table is ordered by. Split out of employer-applicants.ts (section 2).

/**
 * One OTHER application by the same person at the same company. Contacts are deduped
 * by email per company, so these rows are the same human, not a fuzzy match.
 */
export interface OtherApplication {
  applicationId: string;
  postingId: string | null;
  postingTitle: string | null;
  stageId: string | null;
  stage: string | null;
  appliedAt: string | null;
  isArchived: boolean;
}

/**
 * One screening answer as stored on the application. `questionText` is a SNAPSHOT
 * taken at apply time — the posting's current wording may differ, and this is
 * deliberately what the candidate actually saw.
 */
export interface ScreeningAnswer {
  questionId: string;
  questionText: string;
  answer: string;
  /** True when the answer matched the one the employer chose to flag. */
  isKnockout: boolean;
}

export type ApplicantSort = 'score' | 'date' | 'assignment';
