// FILE: src/types/employer-discover.ts
// The Discover tab's shapes: a suggested candidate and the AI micro-review.
//
// NOTE WHAT IS ABSENT — the numeric match score. The backend ranks on it and
// never sends it, because a number attached to a person invites false precision.
// `matchedSkills` is the checkable version of the same claim.

export type DiscoverRating = 'strong' | 'good' | 'possible';

export interface DiscoverCandidate {
  seekerUserId: string;
  name: string | null;
  email: string | null;
  location: string | null;
  experienceYears: number | null;

  /** In the candidate's own wording, not canonical form. */
  matchedSkills: string[];
  matchedSkillCount: number;
  hasResume: boolean;

  leetcode: { totalSolved: number; contestRating: number | null } | null;
  github: { publicRepoCount: number; totalStars: number } | null;

  /** Null until the card is scrolled into view and stage 3 runs for it. */
  aiReview: string | null;
  aiRating: DiscoverRating | null;
  addedToPipeline: boolean;
}

export interface DiscoverReviewResult {
  review: string | null;
  rating: DiscoverRating | null;
  cached: boolean;
}
