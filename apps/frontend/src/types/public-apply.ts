// FILE: src/types/public-apply.ts
// Public apply-flow types — mirror the backend 5A public shapes
// (public-apply-routes.js). Public audience: unauthenticated candidates.

/** The three social networks an employer can link from their careers page. */
export interface PublicSocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
}

/** Mirrors CultureSection on the employer side; the public page reads the same shape. */
export interface PublicCultureBenefit {
  icon: string | null;
  title: string;
  description: string | null;
}

export interface PublicCultureSection {
  headline: string | null;
  description: string | null;
  benefits: PublicCultureBenefit[];
  photoUrls: string[];
}

export interface PublicCompany {
  name: string;
  tagline: string | null;
  about: string | null;
  socialLinks: PublicSocialLinks | null;
  slug: string;
  website: string | null;
  logoUrl: string | null;
  /** null when the employer never configured one — the section is then not rendered. */
  cultureSection?: PublicCultureSection | null;
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
  /** Empty on a posting that asks nothing, which is the common case. */
  screeningQuestions?: PublicScreeningQuestion[];
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

/**
 * A screening question as the CANDIDATE sees it. Deliberately has no
 * knockoutAnswer field — the backend strips it before this ever leaves the server.
 */
export interface PublicScreeningQuestion {
  id: string;
  questionText: string;
  questionType: 'text' | 'single_select' | 'yes_no';
  isRequired: boolean;
  /** Yes/No questions arrive with their two options already filled in. */
  options: string[];
  order: number;
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
  /**
   * Optional LeetCode handle. Best-effort on purpose: a malformed value is dropped
   * server-side rather than blocking the application, so this field never carries
   * a validation error.
   */
  leetcodeUsername: string;
  /** Honeypot — bots fill this hidden field; real users leave it empty (R4). */
  honeypot: string;
}
