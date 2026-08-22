// FILE: src/types/employer-team.ts
// Shape contract for the team-settings feature (feat/team-invites-ui, Chunk 4).
// Mirrors the backend team-service / member-management-service projections exactly
// — no field the backend does not return (NAMING §0). The 4-value role enum with a
// derived isFounder matches the backend company_members model.

export type Role = 'founder' | 'owner' | 'member' | 'interviewer';

/** Roles that can be granted via an invite. Founder is transferred, never invited. */
export type InvitableRole = 'owner' | 'member' | 'interviewer';

// GET /api/employer/team/members row (team-service.getTeamMembersForCompany).
export interface TeamMember {
  id: string;
  employerUserId: string;
  name: string | null;
  email: string | null;
  picture: string | null;
  role: Role;
  isFounder: boolean;
  canMoveApplicants: boolean;
  canArchiveApplicants: boolean;
  invitedByEmployerUserId: string | null;
  joinedAt: string;
}

// GET /api/employer/team/invites row (team-service.getPendingInvitesForCompany).
// `inviteUrl` is NOT returned by the list endpoint — the backend never re-echoes a
// token (Chunk 2, D_impl_ui_4). It is populated client-side only at create/resend
// time and lost on navigation.
export interface CompanyInvite {
  id: string;
  email: string;
  role: Role;
  canMoveApplicants: boolean;
  canArchiveApplicants: boolean;
  invitedByEmployerUserId: string | null;
  expiresAt: string;
  createdAt: string;
  inviteUrl?: string;
}

// Props resolved server-side and handed to the client subtree.
export interface TeamPageData {
  members: TeamMember[];
  invites: CompanyInvite[];
  currentMember: TeamMember | null;
}

// Sanitized public preview from GET /api/public/invites/:token. Never carries the
// token or the inviter's id — only invitedByName (Chunk 2 contract).
export interface InvitePreview {
  companyName: string;
  companyId: string;
  role: Role;
  canMoveApplicants: boolean;
  canArchiveApplicants: boolean;
  expiresAt: string;
  status: 'pending';
  invitedByName: string | null;
}

// Result of POST /api/employer/team/invites/accept. `alreadyMember` is true when the
// backend answered 409 ALREADY_MEMBER — still a success from the UI's point of view
// (the invite was marked accepted), so we redirect rather than error (D_impl_ui5_4).
export interface AcceptInviteResult {
  member: TeamMember;
  redirectUrl: string;
  alreadyMember: boolean;
}
