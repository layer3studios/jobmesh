// FILE: src/types/employer-applicant-actions.ts
// Result shapes for the actions a recruiter takes on applicants: bulk archive,
// anonymisation, rescoring and signed resume URLs. Split out of
// employer-applicants.ts (section 2).

/**
 * Queue lifecycle of the AI scoring job — a separate axis from score.processingError.
 * 'queued' | 'processing' mean a rescore is in flight; the old score stays visible.
 */
export interface ScoreJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  attemptCount: number;
  errorCode: string | null;
  nextTryAt: string | null;
  completedAt: string | null;
}

/** Response of POST /api/employer/applicants/:id/rescore. */
export interface RescoreResult {
  rescored: boolean;
  jobStatus: ScoreJobStatus['status'];
  jobId: string;
  attemptCount: number;
}

/** Refreshed signed resume URL (7A resume-url endpoint). */
export interface ResumeUrl {
  url: string;
  expiresAt: string;
}

/** Per-item outcome of the PP1 bulk-archive endpoint (partial success is first-class). */
export interface BulkArchiveResult {
  succeeded: Array<{ id: string }>;
  failed: Array<{ id: string; code: string; message: string }>;
  total: number;
  successCount: number;
  failureCount: number;
}

/**
 * What anonymizing a candidate would touch. A contact is shared across postings, so
 * applicationCount is nearly always more than the one application being viewed —
 * which is exactly why the confirmation dialog reads it out.
 */
export interface AnonymizePreview {
  applicationId: string;
  candidateName: string | null;
  applicationCount: number;
  alreadyAnonymized: boolean;
  /** Scheduled interviews. Anonymizing does NOT cancel them — the dialog says so. */
  upcomingInterviews: Array<{ id: string; startAtUtc: string; timezoneId: string | null }>;
}

export interface AnonymizeResult {
  contactAnonymized: boolean;
  alreadyAnonymized: boolean;
  applicationsProcessed: number;
  filesDeleted: number;
  notesRedacted: number;
}
