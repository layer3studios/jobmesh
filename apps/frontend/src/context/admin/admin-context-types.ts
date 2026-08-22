// FILE: src/context/admin/admin-context-types.ts
// Shared types for the admin auth context. Admin is a third, independent audience
// alongside seeker and employer (NAMING §0) — never a seeker with a role. Identity
// comes only from GET /api/admin/auth/me; the backend intentionally returns no
// name/picture, so UserMenu derives initials from the email.

export type AdminRole = 'super_admin' | 'admin';

export interface AdminIdentity {
  adminUserId: string;
  email: string;
  role: AdminRole;
}

export interface AdminContextValue {
  admin: AdminIdentity | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Guard for a post-login `?next=` target (admin login, D3). Lives here (not in the
 * login page) because Next.js forbids non-reserved exports from a page file, and this
 * keeps the rule unit-testable. A safe path is an internal /admin path: matches
 * /^\/admin(\/|$)/, has no '//' (scheme-relative), no ':' (protocol), and no '..'
 * segment. Everything else is rejected (the caller falls back to /admin).
 */
export function isSafeAdminNextPath(next: string): boolean {
  if (!next) return false;
  if (!/^\/admin(\/|$)/.test(next)) return false;
  if (next.includes('//')) return false;
  if (next.includes(':')) return false;
  if (next.split('/').includes('..')) return false;
  return true;
}
