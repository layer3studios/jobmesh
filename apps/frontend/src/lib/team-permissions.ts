// FILE: src/lib/team-permissions.ts
// Client-side VIEW logic for team actions — decides which buttons to show. The
// backend is the actual gate (require-company-role-middleware + the service rules);
// these functions only keep the UI from offering an action the backend would 403.
import type { Role } from '../types/employer-team';

const isOwnerOrHigher = (role: Role): boolean => role === 'founder' || role === 'owner';
// Founder/Owner/Member act on applicants + postings without per-action gating;
// Interviewer is the only gated role (view + notes, plus opt-in move/archive).
const isMemberOrHigher = (role: Role): boolean => role !== 'interviewer';

/** Frontend visibility only — backend enforces truth. Founder/Owner may invite. */
export function canInvite(currentRole: Role): boolean {
  return isOwnerOrHigher(currentRole);
}

/**
 * Frontend visibility only — backend enforces truth. Owner+ may remove any
 * non-Founder; anyone may remove themselves unless they are the Founder.
 */
export function canRemove(currentRole: Role, targetRole: Role, isSelf: boolean): boolean {
  if (targetRole === 'founder') return false; // Founder is never removable here (D_impl_ui_8)
  if (isSelf) return true; // self-leave for any non-Founder role (D3)
  return isOwnerOrHigher(currentRole);
}

/**
 * Frontend visibility only — backend enforces truth. Owner+ may change a
 * non-Founder's role, but never their own (SELF_ROLE_CHANGE_FORBIDDEN).
 */
export function canChangeRole(currentRole: Role, targetRole: Role, isSelf: boolean): boolean {
  if (isSelf) return false;
  if (targetRole === 'founder') return false;
  return isOwnerOrHigher(currentRole);
}

/**
 * Frontend visibility only — backend enforces truth. Only the current Founder may
 * transfer, and only to an existing Owner (D_impl_ui_3).
 */
export function canTransferFounder(currentRole: Role, targetRole: Role): boolean {
  return currentRole === 'founder' && targetRole === 'owner';
}

/**
 * Frontend visibility only — backend enforces truth. Founder/Owner/Member may move
 * applicants; an Interviewer only when granted canMoveApplicants.
 */
export function canMoveApplicant(currentRole: Role, canMoveApplicants: boolean): boolean {
  return isMemberOrHigher(currentRole) || canMoveApplicants;
}

/**
 * Frontend visibility only — backend enforces truth. Founder/Owner/Member may
 * archive applicants; an Interviewer only when granted canArchiveApplicants.
 */
export function canArchiveApplicant(currentRole: Role, canArchiveApplicants: boolean): boolean {
  return isMemberOrHigher(currentRole) || canArchiveApplicants;
}

/**
 * Frontend visibility only — backend enforces truth. Readable alias of
 * canArchiveApplicant for the Ranked bulk-archive surface.
 */
export function canBulkArchive(currentRole: Role, canArchiveApplicants: boolean): boolean {
  return canArchiveApplicant(currentRole, canArchiveApplicants);
}

/** Frontend visibility only — backend enforces truth. Founder/Owner/Member may create postings. */
export function canCreatePosting(currentRole: Role): boolean {
  return isMemberOrHigher(currentRole);
}

/** Frontend visibility only — backend enforces truth. Founder/Owner/Member may edit postings. */
export function canEditPosting(currentRole: Role): boolean {
  return isMemberOrHigher(currentRole);
}

/** Frontend visibility only — backend enforces truth. Founder/Owner/Member may close/reopen postings. */
export function canClosePosting(currentRole: Role): boolean {
  return isMemberOrHigher(currentRole);
}

/** Frontend visibility only — backend enforces truth. Founder/Owner/Member may requeue AI scoring. */
export function canRescoreApplicant(currentRole: Role): boolean {
  return isMemberOrHigher(currentRole);
}

/** Frontend visibility only — backend enforces truth. Founder/Owner/Member may schedule, reschedule and cancel interviews. */
export function canScheduleInterview(currentRole: Role): boolean {
  return isMemberOrHigher(currentRole);
}

/** Frontend visibility only — backend enforces truth. Only Founder/Owner may edit company settings. */
export function canEditCompanySettings(currentRole: Role): boolean {
  return isOwnerOrHigher(currentRole);
}

/** Frontend visibility only — backend enforces truth. Erasure is irreversible and
 *  reaches every application by the candidate, so it stops at Owner+. */
export function canAnonymizeCandidate(currentRole: Role): boolean {
  return isOwnerOrHigher(currentRole);
}

// ── Assignment library (Chunk 2 gates) ──────────────────────────────────────
// These mirror employer-assignments-routes.js one-for-one:
//   GET    /                    requireInterviewerOrHigher
//   GET    /:id                 requireInterviewerOrHigher
//   POST   /                    requireMemberOrHigher
//   PATCH  /:id                 requireMemberOrHigher
//   POST   /:id/clone           requireMemberOrHigher
//   PATCH  /:id/archive         requireOwnerOrHigher
//   PATCH  /:id/unarchive       requireOwnerOrHigher
// If a gate moves there, move it here. Frontend visibility only, as ever.

/** Every company role can read the library — an Interviewer needs the task to review against. */
export function canViewAssignments(currentRole: Role): boolean {
  return currentRole === 'interviewer' || isMemberOrHigher(currentRole);
}

/** A Member can create a posting, so a Member must be able to create the task for it. */
export function canCreateAssignment(currentRole: Role): boolean {
  return isMemberOrHigher(currentRole);
}

/** Member+ may edit — subject to the separate in-use lock, which applies to every role. */
export function canEditAssignment(currentRole: Role): boolean {
  return isMemberOrHigher(currentRole);
}

/** Member+ may clone. This is the escape hatch from the in-use edit lock. */
export function canCloneAssignment(currentRole: Role): boolean {
  return isMemberOrHigher(currentRole);
}

/** Owner+ only — retiring a task from the library is a company-shaping action. */
export function canArchiveAssignment(currentRole: Role): boolean {
  return isOwnerOrHigher(currentRole);
}
