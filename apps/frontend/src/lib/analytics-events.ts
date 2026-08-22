// FILE: src/lib/analytics-events.ts
// Typed custom-event layer over Chunk 1's PostHog client. Every funnel event flows
// through trackEvent(), which:
//   • no-ops when PostHog is not initialised (i.e. consent not granted) — via
//     getPostHogClient() returning null;
//   • never throws (defensive try/catch, warns once);
//   • strips any personal-data-shaped keys before sending (belt-and-suspenders — the
//     typed schemas below already exclude PII; D7/C8).
// Event names are past-tense verb_noun snake_case; property names are camelCase (D5/D6).
import { getPostHogClient } from './posthog';

type ApplyMethod = 'public' | 'seeker_authenticated';
type AuthMethod = 'google';
type MoveMethod = 'drag' | 'select';
type ScoreDecile = number | 'unscored';
type FilterType = 'search' | 'company' | 'role' | 'exp' | 'wp' | 'date' | 'entry' | 'newOnly' | 'hideApplied' | 'sort' | 'loc' | 'tech' | 'sal';
type FilterAction = 'added' | 'removed';
type InviteStatus = 'valid' | 'expired' | 'revoked' | 'accepted';
type InvitableRoleName = 'owner' | 'member' | 'interviewer';

// The single source of truth: event name → property shape. Adding/renaming a property
// is a compile-time break at every call site (no `any`, no `unknown`).
export interface EventPropertyMap {
  // Funnel 1 — Seeker Apply
  job_viewed: { jobId: string; company?: string; jobSlug?: string; fromRoute: string };
  /**
   * Fires once on apply-form mount, for EVERY posting — this is the "form viewed"
   * counter. There is no separate apply_form_viewed event; `hasAssignment` splits
   * the two populations so the abandonment ratio can be computed for each without
   * a second event or a PostHog funnel (the apply flow is anonymous, so a funnel
   * would undercount). Paired with apply_submitted's identical flag.
   */
  apply_started: { jobId: string; companyId?: string; applyMethod: ApplyMethod; hasAssignment?: boolean };
  apply_form_field_focused: { jobId: string; fieldName: string };
  // The assignment properties are OPTIONAL extensions of the existing event, not a
  // parallel apply_submitted_with_assignment — one funnel event means the assignment
  // and plain paths stay comparable in the same PostHog query. Counts and booleans
  // only: never a link URL, a filename, or the notes text.
  apply_submitted: {
    jobId: string; companyId?: string; applyMethod: ApplyMethod; hasResume: boolean; hasCoverNote: boolean;
    /** The denominator's partner — see apply_started. Always sent, both populations. */
    hasAssignment?: boolean;
    linkCount?: number; fileCount?: number; hasGithubProfile?: boolean; hasLinkedinProfile?: boolean;
  };
  apply_success_viewed: { jobId?: string; companyId?: string; companySlug?: string };
  // Funnel 1a — Seeker Apply, take-home assignment (ids, counts and booleans only).
  assignment_apply_form_viewed: { postingId: string; assignmentId: string };
  assignment_draft_saved: { postingId: string };
  assignment_draft_restored: { postingId: string; fileCount: number; expiredFileCount: number };
  /** `reason` is a stable error code (e.g. FILE_TOO_LARGE), never a filename. */
  assignment_file_upload_failed: { postingId: string; reason: string };

  // Funnel 1b — Employer take-home lifecycle (8a/8b/8c).
  // IDS AND NUMBERS ONLY. An assignment title is employer-authored free text and
  // never appears here, nor does a posting title, a candidate name, or a URL. The
  // PII blocklist in posthog.ts is a backstop, not the design.
  assignment_created: { companyId: string; assignmentId: string; estimatedHours: number };
  assignment_cloned: { companyId: string; assignmentId: string };
  assignment_archived: { companyId: string; assignmentId: string };
  assignment_attached: { companyId: string; postingId: string; assignmentId: string };
  /** applicationCount is what made the swap confirm necessary — worth keeping. */
  assignment_detached: { companyId: string; postingId: string; applicationCount: number };
  assignment_review_submitted: { companyId: string; postingId: string; overallScore: number; passesBar: boolean };
  assignment_review_edited: { companyId: string; postingId: string };
  /**
   * The one worth having. If review conflicts turn out to be common, the review
   * flow needs rethinking — and there is no other way to find that out, because a
   * conflict resolved in the UI leaves no trace in Mongo.
   */
  assignment_review_conflicted: { companyId: string; postingId: string; resolution: 'replaced' | 'kept_theirs' };
  // Funnel 2 — Seeker Job Discovery
  jobs_list_viewed: { totalResults: number; filterCount: number };
  jobs_filter_applied: { filterType: FilterType; action: FilterAction };
  jobs_search_query_entered: { queryLength: number };
  jobs_result_clicked: { jobId: string; positionInList: number; fromRoute: string };
  // Funnel 3 — Seeker Signup + Auth
  seeker_signup_started: { fromRoute: string };
  seeker_signup_completed: { method: AuthMethod };
  seeker_login_completed: { method: AuthMethod };
  seeker_logged_out: { fromRoute: string };
  // Funnel 4 — Employer Signup + First Job
  employer_signup_started: { fromRoute: string };
  employer_signup_completed: { method: AuthMethod };
  employer_login_completed: { method: AuthMethod };
  onboarding_started: Record<string, never>;
  onboarding_completed: { companySize?: string; industry?: string };
  posting_form_opened: { fromRoute: string };
  posting_created: { postingId: string; isDraft: boolean; isPublished: boolean };
  posting_published: { postingId: string };
  // Funnel 5 — Employer Applicant Actions
  applicant_viewed: { applicationId: string; postingId: string; companyId?: string; scoreDecile: ScoreDecile };
  applicant_moved_stage: { applicationId: string; postingId: string; companyId?: string; fromStage: string; toStage: string; method: MoveMethod };
  applicant_archived: { applicationId: string; postingId: string; companyId?: string; archiveReason: string; isBulk: boolean };
  applicant_rescored: { applicationId: string; postingId: string; companyId?: string };
  note_added: { applicationId: string; postingId: string; companyId?: string; noteLength: number };
  // Funnel 6 — Team Invites (feature not yet built; schemas defined for Chunk 5)
  team_page_viewed: { memberCount: number; pendingInviteCount: number };
  invite_form_opened: Record<string, never>;
  invite_sent: { role: string; canMove: boolean; canArchive: boolean };
  invite_link_copied: { role: string };
  invite_preview_viewed: { role: string; status: InviteStatus };
  invite_accepted: { role: string; wasAlreadyMember: boolean };
  member_role_changed: { fromRole: string; toRole: string; targetIsSelf: boolean };
  member_removed: { targetIsSelf: boolean };
  founder_transferred: Record<string, never>;
  // Admin-analytics reconciliation events — the plural/team_-prefixed names the backend
  // HogQL queries count (fix/analytics-event-name-reconciliation). They coexist with the
  // legacy singular events above until those are retired.
  // PII-safe: identifiers + enum only
  applicants_viewed: { companyId: string; applicantId: string; jobId: string };
  // PII-safe: identifiers + enum only
  applicants_moved_stage: { companyId: string; applicantId: string; jobId: string; fromStage: string; toStage: string };
  // PII-safe: identifiers + enum only (reasonId is an internal id — never the reason text)
  applicants_archived: { companyId: string; applicantId: string; jobId: string; reasonId?: string };
  // PII-safe: identifiers + enum only
  team_invite_sent: { companyId: string; inviteId: string; role: InvitableRoleName; canMoveApplicants: boolean; canArchiveApplicants: boolean };
  // PII-safe: identifiers + enum only (inviteId optional — the accept flow never sees it; C2 sanitizes)
  team_invite_accepted: { companyId: string; inviteId?: string; role: InvitableRoleName };
  // Funnel 7 — Candidate interview booking (public, unauthenticated). PII-safe:
  // status/mode enums + slot position only — NEVER the booking token, the
  // candidate's name, or a company id.
  interview_booking_page_viewed: { status: string; mode?: string };
  interview_slot_confirmed: { mode: string; slotIndex: number };
}

export type AnalyticsEvent = keyof EventPropertyMap;

// Defensive PII blocklist (lower-cased). The typed schemas never include these, but a
// generic sink must never leak them even if a caller passes an off-schema object.
const PII_KEYS = new Set([
  'email', 'phone', 'name', 'fullname', 'firstname', 'lastname',
  'resume', 'resumeurl', 'address', 'password', 'credential', 'querytext',
]);

let hasWarned = false;

function stripPii(properties: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (PII_KEYS.has(key.toLowerCase())) continue;
    safe[key] = value;
  }
  return safe;
}

export function trackEvent<E extends AnalyticsEvent>(event: E, properties?: EventPropertyMap[E]): void {
  try {
    const client = getPostHogClient();
    if (!client) return; // not initialised → no consent → no-op
    const safe = properties ? stripPii(properties as Record<string, unknown>) : undefined;
    client.capture(event, safe);
  } catch (err) {
    if (!hasWarned) {
      hasWarned = true;
      console.warn('[analytics] trackEvent failed', err);
    }
  }
}
