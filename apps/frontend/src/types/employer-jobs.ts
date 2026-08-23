// FILE: src/types/employer-jobs.ts
// Native posting types — mirror the backend public shape (4A toPublicPosting).
// Employer audience only; never imported by seeker/admin code (§0).

export type PostingStatus = 'draft' | 'active' | 'closed';
export type WorkplaceType = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

import type { InterviewDefaults } from './employer-interviews';

export interface Posting {
  id: string;
  slug: string;
  title: string;
  description: string;
  descriptionPlain: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: 'INR';
  status: PostingStatus;
  /**
   * The take-home attached to this posting, or null. The backend has always
   * returned this (toPublicPosting in models/employer/posting-model.js); it was
   * simply not declared here until the assignment library needed it to compute
   * "Used by" without an extra endpoint. Attaching/detaching is Chunk 8b.
   */
  assignmentId: string | null;
  applicationDeadline: string | null;
  autoCloseOnDeadline: boolean;
  postedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Non-archived applications on this posting. Present on the LIST endpoint only —
   * the single-posting GET does not compute it, hence optional.
   */
  applicantCount?: number;
  /**
   * Views of the public apply page. Employer visits and bot traffic are excluded
   * server-side, so this counts candidates who opened the posting.
   */
  viewCount?: number;
  /** Pool-scheduling configuration; null/absent until configured. */
  interviewDefaults?: InterviewDefaults | null;
  /** Employer-authored apply-form questions. [] when the posting asks nothing. */
  screeningQuestions?: ScreeningQuestion[];
}

export interface PostingCreateInput {
  title: string;
  description: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status?: PostingStatus;
  /** ISO instant the posting stops accepting applications, or null. */
  applicationDeadline?: string | null;
  autoCloseOnDeadline?: boolean;
  /** Sent as the FULL list in display order — order is recomputed server-side. */
  screeningQuestions?: ScreeningQuestion[];
}

export type PostingPatch = Partial<PostingCreateInput>;

/** The three shapes a screening question can take. */
export type ScreeningQuestionType = 'text' | 'single_select' | 'yes_no';

/**
 * Employer-side question, as stored on the posting. `knockoutAnswer` is present
 * ONLY here — the candidate's copy (PublicScreeningQuestion) omits it, because
 * showing someone which answer is flagged turns the question into a quiz with a
 * visible answer key.
 */
export interface ScreeningQuestion {
  id: string;
  questionText: string;
  questionType: ScreeningQuestionType;
  isRequired: boolean;
  /** Only ever populated for single_select; yes_no derives Yes/No. */
  options: string[];
  /** The one answer that flags the candidate for review. Never auto-rejects. */
  knockoutAnswer: string | null;
  order: number;
}

export const MAXIMUM_SCREENING_QUESTIONS = 5;
export const MINIMUM_SELECT_OPTIONS = 2;
export const MAXIMUM_SELECT_OPTIONS = 6;
export const MAXIMUM_QUESTION_TEXT_LENGTH = 300;
export const MAXIMUM_OPTION_LENGTH = 100;
