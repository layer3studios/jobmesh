// FILE: src/types/employer-assignment-review.ts
// Take-home submission and review types, as the employer sees them. Split out of
// employer-applicants.ts (naming conventions section 2, 'group related types into
// separate files').

/** One employer's verdict on one submission. 1–5, plus a hard pass/fail. */
export interface AssignmentReview {
  id: string;
  assignmentSubmissionId: string | null;
  reviewedByEmployerUserId: string | null;
  /** Doubles as the optimistic-lock version echoed back as expectedReviewedAt. */
  reviewedAt: string | null;
  overallScore: number | null;
  passesBar: boolean;
  reviewNotesMarkdown: string | null;
}

/** The task exactly as the candidate saw it, frozen at apply time. */
export interface AssignmentSnapshot {
  title: string | null;
  publicSummary: string | null;
  descriptionMarkdown: string | null;
  submissionInstructionsMarkdown: string | null;
  estimatedHours: number | null;
  allowedFileTypes: string[];
  sourceAssignmentId: string | null;
  snapshottedAt: string | null;
}

export interface AssignmentSubmissionFile {
  fileId: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
}

/** The full submission, returned by the applicant DETAIL endpoint only. */
export interface AssignmentSubmission {
  id: string;
  applicationId: string | null;
  jobId: string | null;
  assignmentSnapshot: AssignmentSnapshot | null;
  profileLinks: { githubUrl: string | null; linkedinUrl: string | null } | null;
  submittedAt: string | null;
  links: Array<{ url: string | null; addedAt: string | null }>;
  files: AssignmentSubmissionFile[];
  seekerNotesMarkdown: string | null;
  /** Set once retention deleted the bytes. The rows stay; the files are gone. */
  filesDeletedAt: string | null;
}

/** The row-level summary on the LIST endpoint — counts only, never the content. */
export interface ApplicantAssignmentSummary {
  submissionId: string;
  submittedAt: string | null;
  linkCount: number;
  fileCount: number;
  review: { overallScore: number; passesBar: boolean; reviewedAt: string | null } | null;
}

/**
 * Assignment stats for the posting. PRE-FILTER by design: the backend computes them
 * across every application and deliberately ignores the assignmentReview filter, so
 * a filtered response can return total 47 next to a single row. Render what arrives;
 * never recompute from the visible rows.
 */
export interface AssignmentStats {
  total: number;
  submitted: number;
  reviewed: number;
  passing: number;
}

export type AssignmentReviewFilter = 'reviewed' | 'not_reviewed' | 'passed' | 'failed';
