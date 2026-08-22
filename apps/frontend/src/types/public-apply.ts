// FILE: src/types/public-apply.ts
// Public apply-flow types — mirror the backend 5A public shapes
// (public-apply-routes.js). Public audience: unauthenticated candidates.

/** The three social networks an employer can link from their careers page. */
export interface PublicSocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
}

export interface PublicCompany {
  name: string;
  tagline: string | null;
  about: string | null;
  socialLinks: PublicSocialLinks | null;
  slug: string;
  website: string | null;
  logoUrl: string | null;
}

export interface PublicJob {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  workplaceType: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  /** ISO instant applications stop being accepted, or null. */
  applicationDeadline: string | null;
  postedAt: string | null;
}

/** List surface (company page) — badge data only, no task text. */
export interface PublicAssignmentSummary {
  estimatedHours: number;
  allowedFileTypes: string[];
}

/**
 * Detail surface (job page) — the whole task. The backend returns this in full on
 * a public endpoint by design: the apply page is unauthenticated and take-homes
 * circulate publicly anyway, so hiding it would only inconvenience the candidate
 * deciding whether to invest the hours.
 */
export interface PublicAssignment {
  id: string;
  title: string;
  publicSummary: string;
  descriptionMarkdown: string;
  submissionInstructionsMarkdown: string;
  estimatedHours: number;
  allowedFileTypes: string[];
}

export interface PublicJobSummary {
  id: string;
  slug: string;
  title: string;
  location: string;
  employmentType: string;
  /** Null on older rows that predate the field being projected. */
  workplaceType: string | null;
  postedAt: string | null;
  assignment: PublicAssignmentSummary | null;
}

export interface ApplyFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coverNote: string;
  consent_dpdp: boolean;
  consent_futureOpportunities: boolean;
  resume: File | null;
  /**
   * "How did you hear about us?" — submitted as `utm_source`, which apply-service
   * already reads into application.sourceDetail. Empty string means unanswered.
   */
  source: string;
  /** Honeypot — bots fill this hidden field; real users leave it empty (R4). */
  honeypot: string;
}
