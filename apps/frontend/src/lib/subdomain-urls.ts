// FILE: src/lib/subdomain-urls.ts
// Cross-audience link builders (NAMING-CONVENTIONS §17).
//
// A link that crosses audiences cannot be a bare path any more: in production the
// audiences are different hosts, so <Link href="/employer/login"> from jobmesh.in
// would 404 — /employer only exists behind hire.jobmesh.in. These helpers read the
// per-audience origin from env, so the SAME call resolves to a localhost path in
// dev and a subdomain URL in production, with no code change between them.
//
//   dev   NEXT_PUBLIC_EMPLOYER_URL=http://localhost:3001/employer
//         getEmployerUrl('/login') → 'http://localhost:3001/employer/login'
//   prod  NEXT_PUBLIC_EMPLOYER_URL=https://hire.jobmesh.in
//         getEmployerUrl('/login') → 'https://hire.jobmesh.in/login'
//   unset getEmployerUrl('/login') → '/employer/login'   (same-origin fallback)
//
// The fallback matters. An audience's env var can be missing — a misconfigured
// deploy, a test runner, a Storybook — and the helper must then degrade to the
// pre-subdomain same-origin path, which still works behind a single host. It must
// NOT return a bare '/login', which belongs to a different audience entirely.
//
// Use these ONLY for cross-audience links. Navigation WITHIN one audience stays a
// relative next/link href so client-side routing is preserved.

/**
 * Join a configured origin with a path.
 * @param base       Configured origin, e.g. 'https://hire.jobmesh.in'.
 * @param path       Path within that audience, e.g. '/login'.
 * @param sameOrigin Path prefix identifying this audience on a single host,
 *                   used verbatim when `base` is unset.
 */
function buildUrl(base: string | undefined, path: string, sameOrigin: string): string {
  const origin = (base ?? '').replace(/\/$/, '');
  const suffix = !path || path === '/' ? '' : (path.startsWith('/') ? path : `/${path}`);
  if (origin) return `${origin}${suffix}` || origin;
  return `${sameOrigin}${suffix}` || '/';
}

/** Employer ATS — hire.jobmesh.in in production, /employer same-origin. */
export function getEmployerUrl(path: string = ''): string {
  return buildUrl(process.env.NEXT_PUBLIC_EMPLOYER_URL, path, '/employer');
}

/** Seeker site — the bare jobmesh.in domain, and the root path same-origin. */
export function getSeekerUrl(path: string = ''): string {
  return buildUrl(process.env.NEXT_PUBLIC_SITE_URL, path, '');
}

/** Internal admin dashboard — admin.jobmesh.in, /admin same-origin. */
export function getAdminUrl(path: string = ''): string {
  return buildUrl(process.env.NEXT_PUBLIC_ADMIN_URL, path, '/admin');
}

/** Public apply + careers pages — apply.jobmesh.in, /apply same-origin. */
export function getApplyUrl(path: string = ''): string {
  return buildUrl(process.env.NEXT_PUBLIC_APPLY_URL, path, '/apply');
}

/** Backend API — api.jobmesh.in. Mirrors api-base.ts for non-fetch uses (links). */
export function getApiUrl(path: string = ''): string {
  return buildUrl(process.env.NEXT_PUBLIC_API_URL, path, '/api');
}
