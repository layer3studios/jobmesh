// FILE: src/lib/api-base.ts
// Central API base. Every browser-side API call routes through here.
//
// Subdomain era (NAMING-CONVENTIONS §17): the app is no longer same-origin with
// the backend. Nginx sends jobmesh.in and every audience subdomain to Next, and
// only api.jobmesh.in to Express, so a relative '/api' would hit Next and 404.
// NEXT_PUBLIC_API_URL supplies the API ORIGIN; NEXT_PUBLIC_API_BASE_URL keeps
// supplying the PATH PREFIX ('/api'), which the backend still mounts every route
// under. Leaving NEXT_PUBLIC_API_URL empty restores the old same-origin behaviour
// unchanged, so this is a superset of the previous contract, not a replacement.
//
//   origin ''                       + '/api' → /api/seeker/me            (same-origin)
//   origin 'https://api.jobmesh.in' + '/api' → https://api.jobmesh.in/api/seeker/me
//
// Never hardcode an absolute API origin here — it comes only from env (C10).

/** API origin, no trailing slash. Empty = same-origin (dev proxy / legacy nginx). */
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** Path prefix every backend route is mounted under. */
export const API_PATH_PREFIX = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

export const API_BASE = `${API_ORIGIN}${API_PATH_PREFIX}`;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
