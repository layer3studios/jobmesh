// FILE: src/types/employer-applicants.ts
// Shapes for the employer applicant pipeline (Ranked + Kanban tabs). Mirrors the
// 7A/Step-6 backend responses: getApplicantDetail / listApplicants / listStages /
// listArchiveReasons. Kept minimal — only the fields the pipeline UI consumes.

export type ScoreTier = 'strong' | 'good' | 'partial' | 'weak' | 'poor';

/**
 * The "never contact this person again" flag. Lives on the CONTACT, so it follows
 * the candidate across every posting they appear on at this company.
 */
export interface DoNotContact {
  flag: boolean;
  setAt: string | null;
  setBy: string | null;
  /** Snapshot of who set it — still correct after that person leaves. */
  setByName: string | null;
  reason: string | null;
}

export interface ApplicantScore {
  id: string;
  score: number;
  tier: ScoreTier;
  matchedSkills: string[];
  missingSkills: string[];
  /** Detail-view fields (7C); optional so the leaner pipeline payloads still type-check. */
  bonusSkills?: string[];
  experienceFit?: string | null;
  locationFit?: string | null;
  noticePeriodFit?: string | null;
  explanation: string | null;
  processedAt: string | null;
  processingError: string | null;
}

/** One resume file's metadata (7A). Null when the candidate never uploaded one. */
export interface ResumeMeta {
  id: string;
  originalFilename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
}

/** One stage-history entry. Archive/unarchive rows carry a note beginning "Archived:"/"Unarchived". */
export interface StageChange {
  id: string;
  fromStageId: string | null;
  toStageId: string | null;
  movedByUserId: string | null;
  note: string | null;
  movedAt: string | null;
}

/**
 * One employer-written note on an application (C3). Append-only: there is no edit or
 * delete endpoint, and updatedAt always equals createdAt today. The author fields are
 * a snapshot taken at write time (R2) — they are NOT a live join onto the employer
 * user, so a later rename leaves historical notes reading as they did when written.
 */
export interface ApplicantNote {
  id: string;
  applicationId: string;
  authorEmployerUserId: string | null;
  authorName: string | null;
  authorEmail: string;
  body: string;
  /** Teammates named with @ in the body, validated server-side against the roster.
   *  Empty on notes written before mentions existed. */
  mentionedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Take-home assignment review (Chunk 5 backend / 8c UI) ──────────────────
// TWO SEPARATE SCORING AXES, deliberately never merged. `score` above is the AI
// resume score: 0–100 with tiers. `overallScore` below is a human 1–5 verdict on a
// take-home. They measure different things on different scales, the backend keeps
// them in separate response keys, and nothing in this app may average, blend or
// co-sort them.

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

/** Full applicant detail payload (7A endpoint) consumed by the ApplicantDetail page. */
export interface ApplicantDetail extends Applicant {
  scoreJobStatus: ScoreJobStatus | null;
  stageChanges: StageChange[];
  resumeMeta: ResumeMeta | null;
  resumeDownloadUrl: string | null;
  resumeDownloadExpiresAt: string | null;
  /** ABSENT when this person applied only once — never an empty array. */
  otherApplications?: OtherApplication[];
  /** Null for a plain posting or a legacy application — guard on it, never assume. */
  assignmentSubmission?: AssignmentSubmission | null;
  assignmentReview?: AssignmentReview | null;
}

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

export interface Applicant {
  application: {
    id: string;
    jobId: string;
    contactId: string;
    stageId: string;
    archived: { at: string; reasonId: string; note?: string } | null;
    appliedAt: string;
    /** Candidate-written note submitted at apply time (7A). Null when they left it blank. */
    coverNote: string | null;
    lastStageMovedAt: string;
    /** Recruiter-applied labels drawn from the company tag library. Max 10. */
    tags?: string[];
  };
  contact: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    /** Always present from the backend; optional here so older fixtures type-check. */
    doNotContact?: DoNotContact;
    /** Parsed-profile enrichment (7A). Optional: the apply flow only fills email/phone
     *  today, so these are usually null/absent until the backend wires the resume parser
     *  in. github/portfolio aren't extracted yet — declared here so the UI lights up
     *  automatically once they are. */
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
    location?: string | null;
  } | null;
  score: ApplicantScore | null;
  /**
   * Total applications by this contact company-wide. ABSENT unless it is greater
   * than one — its presence IS the "cross-applicant" signal.
   */
  applicationCount?: number;
  /**
   * ABSENT (not null) on a plain posting — the backend guards before it runs any
   * assignment query and returns exactly the shape it always has. null means the
   * posting HAS an assignment but this candidate never submitted one.
   */
  assignment?: ApplicantAssignmentSummary | null;
}

export interface Stage {
  id: string;
  text: string;
  order: number;
  isTerminal: boolean;
  isDefault: boolean;
  terminalType: 'hired' | null;
}

export interface ArchiveReason {
  id: string;
  text: string;
  type: 'hired' | 'non-hired';
  status: string;
}

export type ApplicantSort = 'score' | 'date' | 'assignment';

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

/** Filter facets scoped to one posting's applicant pool (Chunk 1). */
export interface ApplicantFacets {
  skills: Array<{ skill: string; count: number }>;
  cities: Array<{ city: string; count: number }>;
}

/**
 * One tag in the company's shared library. Names are canonical — lowercase and
 * trimmed by the backend — so "Referral" and "referral" are the same tag.
 */
export interface CandidateTag {
  id: string;
  name: string;
  createdAt: string;
}

/** A recruiter's saved filter combination for one posting (per-user, not shared). */
export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Interview feedback summary (Sprint 5) ──────────────────────────────────
// The panel's verdicts on one candidate, aggregated. Recommendations use the
// backend's four-point scale — there is no neutral option, by design.

export type InterviewRecommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no';
export type OverallSignal = 'strong_hire' | 'hire' | 'mixed' | 'no_hire';

export interface FeedbackEntry {
  interviewId: string;
  interviewerName: string;
  interviewerUserId: string | null;
  interviewerAvatarUrl: string | null;
  /** Null while this interviewer still owes their feedback. */
  recommendation: InterviewRecommendation | null;
  notePreview: string | null;
  feedbackText: string | null;
  completedAt: string | null;
  status: string;
}

export interface InterviewFeedbackSummary {
  totalInterviews: number;
  completedInterviews: number;
  recommendations: Partial<Record<InterviewRecommendation, number>>;
  /** Null when nobody has submitted yet. */
  overallSignal: OverallSignal | null;
  /** Always null today — the scale is the recommendation, not a number. */
  averageScore: number | null;
  /** True when the VIEWER owes feedback; feedbackSummaries is then empty. */
  viewerOwesFeedback: boolean;
  feedbackSummaries: FeedbackEntry[];
}
