// FILE: src/types/employer-applicants.ts
// Shapes for the employer applicant pipeline (Ranked + Kanban tabs). Mirrors the
// 7A/Step-6 backend responses: getApplicantDetail / listApplicants / listStages /
// listArchiveReasons. Kept minimal — only the fields the pipeline UI consumes.

export type {
  OtherApplication, ScreeningAnswer, ApplicantSort,
} from './employer-applicant-detail-extras';
import type { OtherApplication, ScreeningAnswer } from './employer-applicant-detail-extras';

export type {
  ScoreTier, ApplicantScore, ResumeMeta, DoNotContact, ApplicantNote,
} from './employer-applicant-profile';

import type {
  ApplicantScore, ResumeMeta, DoNotContact,
} from './employer-applicant-profile';
import type {
  AssignmentReview, AssignmentSubmission, ApplicantAssignmentSummary,
} from './employer-assignment-review';
import type { ScoreJobStatus } from './employer-applicant-actions';

// Re-exported so every existing `from '@/types/employer-applicants'` import of an
// assignment type keeps resolving — this split must not move anyone's import path.
export type {
  AssignmentReview, AssignmentSnapshot, AssignmentSubmissionFile, AssignmentSubmission,
  ApplicantAssignmentSummary, AssignmentStats, AssignmentReviewFilter,
} from './employer-assignment-review';

export type {
  ScoreJobStatus, RescoreResult, ResumeUrl, BulkArchiveResult, AnonymizePreview, AnonymizeResult,
} from './employer-applicant-actions';

export type {
  ArchiveReason, ApplicantFacets, CandidateTag, SavedView,
} from './employer-applicant-library';

/** One stage-history entry. Archive/unarchive rows carry a note beginning "Archived:"/"Unarchived". */
export interface StageChange {
  id: string;
  fromStageId: string | null;
  toStageId: string | null;
  movedByUserId: string | null;
  note: string | null;
  movedAt: string | null;
}







// ─── Take-home assignment review (Chunk 5 backend / 8c UI) ──────────────────
// TWO SEPARATE SCORING AXES, deliberately never merged. `score` above is the AI
// resume score: 0–100 with tiers. `overallScore` below is a human 1–5 verdict on a
// take-home. They measure different things on different scales, the backend keeps
// them in separate response keys, and nothing in this app may average, blend or
// co-sort them.









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
  /**
   * The candidate's public LeetCode record, when they are also a JobMesh seeker
   * who connected one. Null for an external applicant, for a seeker who never
   * connected, and whenever LeetCode could not be reached — one falsy case, and
   * the UI renders no button at all for it.
   */
  leetcode?: LeetCodeProfile | null;
  /** What was last looked up or typed. Seeds the employer's lookup box. */
  leetcodeUsername?: string | null;
}





import type { LeetCodeProfile } from './seeker-profile';

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
    /** How this application arrived. 'referral' when a teammate's link brought them. */
    source?: string | null;
    /** The referrer's name when source is 'referral'; the utm answer otherwise. */
    sourceDetail?: string | null;
    /** Full Q&A snapshot. Present on the DETAIL response only. */
    screeningAnswers?: ScreeningAnswer[];
    /** Roll-up of the above. Present on BOTH the list and the detail responses. */
    hasKnockoutAnswers?: boolean;
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
