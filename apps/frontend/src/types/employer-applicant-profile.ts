// FILE: src/types/employer-applicant-profile.ts
// What we know ABOUT a candidate rather than what we do with them: the AI score,
// their resume metadata, the do-not-contact flag and recruiter notes. Split out of
// employer-applicants.ts (section 2).

export type ScoreTier = 'strong' | 'good' | 'partial' | 'weak' | 'poor';

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
