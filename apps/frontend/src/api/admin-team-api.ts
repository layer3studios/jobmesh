// FILE: src/api/admin-team-api.ts
// Client API module for the admin team endpoints (/api/admin/team/*). Mirrors
// employer-team-api: credentials 'include' (C9), non-2xx throws AdminTeamApiError
// with status + stable code. The backend NEVER returns inviteToken from the roster
// (only POST /invite echoes it, once, to the inviter).
import { apiUrl } from '../lib/api-base';

export type AdminRole = 'super_admin' | 'admin';

export interface TeamAdmin {
  adminUserId: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  activatedAt: string | null;
  invitedByAdminUserId: string | null;
  invitedByEmail: string | null;
  notes: string | null;
}

export interface AdminInvite {
  adminUserId: string;
  email: string;
  role: AdminRole;
  inviteToken: string;
  inviteExpiresAt: string;
  inviteUrl: string;
}

export class AdminTeamApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'AdminTeamApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminTeamApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

export async function listAdmins(): Promise<TeamAdmin[]> {
  const body = await request<{ admins: TeamAdmin[] }>('/admin/team');
  return body.admins;
}

export async function inviteAdmin(email: string, role: AdminRole): Promise<AdminInvite> {
  const body = await request<{ invite: AdminInvite }>('/admin/team/invite', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
  return body.invite;
}

export async function deactivateAdmin(adminUserId: string): Promise<TeamAdmin> {
  const body = await request<{ admin: TeamAdmin }>(`/admin/team/${encodeURIComponent(adminUserId)}/deactivate`, { method: 'PATCH' });
  return body.admin;
}

export async function reactivateAdmin(adminUserId: string): Promise<TeamAdmin> {
  const body = await request<{ admin: TeamAdmin }>(`/admin/team/${encodeURIComponent(adminUserId)}/reactivate`, { method: 'PATCH' });
  return body.admin;
}

export async function updateAdminRole(adminUserId: string, role: AdminRole): Promise<TeamAdmin> {
  const body = await request<{ admin: TeamAdmin }>(`/admin/team/${encodeURIComponent(adminUserId)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return body.admin;
}

/** Regenerate a pending invite's token + expiry; the old URL dies immediately. */
export async function resendAdminInvite(adminUserId: string): Promise<AdminInvite> {
  const body = await request<{ invite: AdminInvite }>(`/admin/team/${encodeURIComponent(adminUserId)}/resend-invite`, { method: 'POST' });
  return body.invite;
}

/** Hard-delete a never-activated pending invite row. */
export async function revokeAdminInvite(adminUserId: string): Promise<void> {
  await request<{ adminUserId: string }>(`/admin/team/${encodeURIComponent(adminUserId)}/invite`, { method: 'DELETE' });
}
