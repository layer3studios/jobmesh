// FILE: src/context/employer/employer-context-types.ts
// Shared types for the employer auth context. Kept separate from the seeker
// types — employer and seeker are independent audiences (NAMING §0).

/** The eight events a teammate can be emailed about. All default true server-side. */
export interface NotificationPreferences {
  newApplication: boolean;
  stageChange: boolean;
  noteMention: boolean;
  interviewScheduled: boolean;
  interviewReminder: boolean;
  feedbackSubmitted: boolean;
  candidateHired: boolean;
  applicationDeadline: boolean;
}

export type NotificationEventKey = keyof NotificationPreferences;

export interface EmployerUser {
  id: string;
  email: string;
  name: string;
  /** Google's photo URL. Its link rotates, which is why avatarUrl exists. */
  picture: string | null;
  companyId: string | null; // null until company onboarding (Step 3)
  /** The user's own upload. Wins over `picture` permanently once set. */
  avatarUrl: string | null;
  /** IANA zone id. Defaults to 'Asia/Kolkata' server-side, never absent. */
  timezone: string;
  jobTitle: string | null;
  notificationPreferences: NotificationPreferences;
}

/** Which image to render: the upload always wins, then Google, then initials. */
export function displayPictureFor(
  user: Pick<EmployerUser, 'avatarUrl' | 'picture'> | null | undefined,
): string | null {
  return user?.avatarUrl || user?.picture || null;
}

export type EmployerLoginErrorKind = 'gated' | 'network' | 'invalid' | 'unknown';

export interface EmployerLoginError {
  kind: EmployerLoginErrorKind;
  message: string;
}

// The caller's company, as projected by the backend's toPublicCompany (3A).
// Populated from the /api/employer/auth/me payload alongside employerUser.
export interface EmployerCompany {
  id: string;
  slug: string;
  name: string;
  /** One-line company description shown on the public careers page. */
  tagline: string | null;
  /** Longer company description (≤500 chars) shown on the careers page. */
  about: string | null;
  /** Optional LinkedIn/X/GitHub URLs. Null when none are set. */
  socialLinks: { linkedin?: string; twitter?: string; github?: string } | null;
  website: string | null;
  /** Public read URL for the uploaded logo, or null when none is set. */
  logoUrl: string | null;
  plan: 'free' | 'paid';
  retentionDays: number;
  /** Days of inactivity before a candidate is auto-archived. null = turned off. */
  autoArchiveStaleDays: number | null;
  privacyPolicyUrl: string | null;
  dpoEmail: string | null;
  createdAt: string;
}

// The four-value company role enum. Kept as a string union here to avoid a cross-import
// into src/types; identical to Role in src/types/employer-team.
export type EmployerViewerRole = 'founder' | 'owner' | 'member' | 'interviewer';

export interface EmployerCtx {
  employerUser: EmployerUser | null;
  company: EmployerCompany | null;     // null until onboarding completes (Step 3B)
  isLoading: boolean;          // initial /me check in flight
  isAuthenticating: boolean;   // login POST in flight
  loginError: EmployerLoginError | null;
  // Viewer's company role + Interviewer permission flags, resolved from the roster
  // (the /me payload does not carry role). Non-Interviewer viewers report both flags
  // true (the flags are meaningless for them). null role = unresolved / guest.
  viewerRole: EmployerViewerRole | null;
  viewerCanMoveApplicants: boolean;
  viewerCanArchiveApplicants: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  clearLoginError: () => void;
  refreshEmployerSession: () => Promise<void>; // re-fetch /me → employerUser + company
}
