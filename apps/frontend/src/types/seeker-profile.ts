// FILE: src/types/seeker-profile.ts
// Parsed-resume profile types — mirror the backend 4.7A normalized shape
// (resume-parser-service.js). Seeker audience only.

export interface ProfileExperience {
  company: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  responsibilities: string[];
  technologies: string[];
}

export interface ProfileEducation {
  institution: string | null;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  cgpa: number | null;
  percentage: number | null;
  collegeTier: 'Tier-1' | 'Tier-2' | 'Tier-3' | null;
}

export interface ProfileSkill { name: string; category: string | null; proficiency: string | null }
export interface ProfileLanguage { language: string; proficiency: string | null }
export interface ProfileCTC { amount: number | null; currency: string }

export interface ParsedProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  currentLocation: { city: string | null; state: string | null } | null;
  linkedinUrl: string | null;
  summary: string | null;
  experience: ProfileExperience[];
  education: ProfileEducation[];
  skills: ProfileSkill[];
  totalExperienceYears: number | null;
  seniorityLevel: string | null;
  domain: string | null;
  subDomain: string | null;
  currentCTC: ProfileCTC | null;
  expectedCTC: ProfileCTC | null;
  noticePeriod: string | null;
  languages: ProfileLanguage[];
  certifications: Array<{ name: string; issuer: string | null }>;
  projects: Array<{ name: string; description: string | null; technologies: string[] }>;
  parsedAt: string | null;
}

// Discriminated union the page reacts to (D1). seeker-api normalizes the raw
// backend envelope into one of these before the UI ever sees it.
export type ResumeUploadResult =
  | { kind: 'queued'; jobId: string }
  | { kind: 'unchanged'; profile: ParsedProfile };

export type ResumeParseJobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface ResumeParseJobResult { profile: ParsedProfile; isUnchanged: boolean }

// The client-safe parse-job shape (backend toPublicJob, D1). tmpPath/resumeText
// are stripped server-side; the page only ever reads status/result/error fields.
export interface ResumeParseJob {
  id: string;
  status: ResumeParseJobStatus;
  result: ResumeParseJobResult | null;
  errorCode: string | null;
  errorMessage: string | null;
}

// ─── F3c: resume review + market snapshot (mirror the F3a/F3b backend shapes) ──

export type ReviewScoreDimension =
  | 'parseability' | 'contentStrength' | 'indiaMarketFit' | 'skillsDepth';

export type ReviewFindingSeverity = 'critical' | 'warning' | 'info';

export type ReviewFindingSection =
  | 'contact' | 'summary' | 'experience' | 'education'
  | 'skills' | 'projects' | 'certifications' | 'layout';

export interface ReviewFinding {
  section: ReviewFindingSection;
  severity: ReviewFindingSeverity;
  message: string;
  sourceEvidence: string | null;
}

export interface ReviewImprovement {
  title: string;
  why: string;
  observedBullet: string | null;
  question: string;
}

export interface ResumeReview {
  scores: Record<ReviewScoreDimension, number> & { overall: number };
  strengths: string[];
  findings: ReviewFinding[];
  topImprovements: ReviewImprovement[];
  reviewedAt: string;
  modelVersion: string;
}

export interface MatchBreakdownItem { key: string; count: number }

export interface MatchCount {
  count: number;
  breakdown: { byLocation: MatchBreakdownItem[]; byRoleCategory: MatchBreakdownItem[] };
  asOf: string;
}

export interface SalaryBenchmark {
  p25: number | null;
  p50: number | null;
  p75: number | null;
  sampleSize: number;
  currency: 'INR';
  unit: 'LPA';
  filters: { seniority: string | null; roleCategory: string | null; location: string | null };
  asOf: string;
}
