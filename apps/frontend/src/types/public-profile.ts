// FILE: src/types/public-profile.ts
// The shape of GET /api/public/profile/:slug, mirroring the backend's
// buildPublicProfile. Seeker audience, but read by an UNAUTHENTICATED page.
//
// The optionality here is load-bearing, not laziness: `email` and `phone` are
// absent from the payload entirely when the owner hid them, so they are optional
// and the `showEmail` / `showPhone` booleans are what the UI branches on.

import type { LeetCodeProfile, GitHubProfile } from './seeker-profile';

export interface PublicProfileExperience {
  company: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  responsibilities: string[];
  technologies: string[];
}

export interface PublicProfileEducation {
  institution: string | null;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
}

/** What the page may OFFER. The values appear only when their flag is true. */
export interface PublicProfileContact {
  showEmail: boolean;
  showPhone: boolean;
  email?: string | null;
  phone?: string | null;
}

export interface PublicProfile {
  slug: string;
  name: string;
  headline: string | null;
  openToWork: boolean;
  location: string | null;
  summary: string | null;
  linkedinUrl: string | null;
  skills: string[];
  experience: PublicProfileExperience[];
  education: PublicProfileEducation[];
  leetcode: { username: string; data: LeetCodeProfile } | null;
  github: { username: string; data: GitHubProfile } | null;
  contact: PublicProfileContact;
  /** Signed, 24h, backend-relative. Null when hidden or when no PDF is on file. */
  resumeUrl: string | null;
}

// ─── The seeker's own settings surface (authenticated) ────────────────

export interface ProfileVisibilitySettings {
  showEmail: boolean;
  showPhone: boolean;
  showResume: boolean;
  showLeetCode: boolean;
  showGitHub: boolean;
  showExperience: boolean;
  showSkills: boolean;
  headline: string | null;
  openToWork: boolean;
}

/** Who may open /u/{slug}. `recruiters` is readable only by a signed-in employer. */
export type ProfileVisibility = 'public' | 'recruiters' | 'private';

export interface PublicProfileSettingsState {
  profileSlug: string | null;
  /** True for public and recruiters-only: the page has an address. */
  profilePublic: boolean;
  profileVisibility: ProfileVisibility;
  profileViewCount: number;
  settings: ProfileVisibilitySettings;
  hasResume: boolean;
  hasLeetCode: boolean;
  hasGitHub: boolean;
  /** Absolute, ready to paste. Null until a slug exists. */
  profileUrl: string | null;
}

export interface SlugAvailability {
  available: boolean;
  code: string | null;
  suggestions: string[];
}
