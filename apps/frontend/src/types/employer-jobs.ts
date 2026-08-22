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
}

export type PostingPatch = Partial<PostingCreateInput>;
