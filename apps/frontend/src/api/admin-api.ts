// FILE: src/api/admin-api.ts
// Thin client for the admin endpoints (/api/admin/*). Sends the seeker auth
// cookie, unwraps the { data } envelope, throws AdminApiError (status + code) on
// any non-2xx. Admin pages call only this module.
// Cookie handling (client): credentials:'include' → the browser attaches tj_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type { AdminIdentity } from '../context/admin/admin-context-types';

export class AdminApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

export interface EmployerAccessWhitelistEntry {
  email: string;
  note: string | null;
  addedAt: string;
}

export interface EmployerAccessState {
  isEmployerSignupOpen: boolean;
  whitelist: EmployerAccessWhitelistEntry[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as T;
}

export function fetchEmployerAccess(): Promise<EmployerAccessState> {
  return request<EmployerAccessState>('/admin/employer-access');
}

export function setEmployerSignupOpen(
  isOpen: boolean,
): Promise<{ isEmployerSignupOpen: boolean; updatedAt: string }> {
  return request('/admin/employer-access/toggle', {
    method: 'POST',
    body: JSON.stringify({ isEmployerSignupOpen: isOpen }),
  });
}

export function addWhitelistEntry(
  email: string,
  note?: string,
): Promise<EmployerAccessWhitelistEntry> {
  return request<EmployerAccessWhitelistEntry>('/admin/employer-access/whitelist', {
    method: 'POST',
    body: JSON.stringify({ email, note }),
  });
}

export function removeWhitelistEntry(email: string): Promise<{ deleted: true }> {
  return request(`/admin/employer-access/whitelist/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
}

// ─── Admin auth (jm_admin_token) ──────────────────────────────────────────────
// These endpoints return a { admin } envelope (not { data }), so they use their own
// fetch logic. All send credentials:'include' so the browser attaches jm_admin_token.

/** POST /admin/auth/google → the signed-in admin. Throws AdminApiError on non-2xx. */
/** Sign in. `inviteToken` (invite-acceptance flow) activates a pending admin row. */
export async function loginAdmin(idToken: string, inviteToken?: string): Promise<AdminIdentity> {
  const response = await fetch(apiUrl('/admin/auth/google'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inviteToken ? { idToken, inviteToken } : { idToken }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`);
  }
  return body.admin as AdminIdentity;
}

/** GET /admin/auth/me → the admin, or null when there is no valid session (401). */
export async function fetchAdminMe(): Promise<AdminIdentity | null> {
  const response = await fetch(apiUrl('/admin/auth/me'), { credentials: 'include' });
  if (response.status === 401) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`);
  }
  return body.admin as AdminIdentity;
}

/** POST /admin/auth/logout. Best-effort — a non-2xx (already-expired cookie) is ignored. */
export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(apiUrl('/admin/auth/logout'), { method: 'POST', credentials: 'include' });
  } catch {
    // Network error on logout is non-fatal; the caller clears local state regardless.
  }
}
