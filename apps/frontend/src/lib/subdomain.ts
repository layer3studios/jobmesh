// FILE: src/lib/subdomain.ts
// Host → audience resolution, shared by middleware.ts and any server code that
// needs to know which subdomain served the request. Pure functions, no next/*
// imports, so this stays testable and safe for the Edge runtime.
//
// Production maps one audience per subdomain (NAMING-CONVENTIONS §17). Local dev
// has no subdomains, so the middleware skips rewriting entirely and the existing
// path-based routes (/employer, /admin, /apply) keep working unchanged.

/** Audiences that own a subdomain. 'seeker' is the bare domain (no subdomain). */
export type Audience = 'seeker' | 'employer' | 'admin' | 'apply' | 'health' | 'api';

/** Subdomain label → the audience it serves. Anything absent here is unknown. */
const AUDIENCE_BY_SUBDOMAIN: Record<string, Audience> = {
  hire: 'employer',
  admin: 'admin',
  apply: 'apply',
  health: 'health',
  api: 'api',
};

/** Path prefix each audience's route group lives under. Health is a route handler. */
export const PATH_PREFIX_BY_AUDIENCE: Record<Audience, string> = {
  seeker: '',
  employer: '/employer',
  admin: '/admin',
  apply: '/apply',
  health: '/api/health',
  api: '',
};

/**
 * Hosts that mean "developer machine" — subdomain routing is skipped for all of
 * them. Covers `localhost`, loopback IPs, and LAN IPs used to test on a phone.
 */
export function isLocalHostname(hostname: string): boolean {
  const host = stripPort(hostname);
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return true;
  // Private LAN ranges (192.168.x.x, 10.x.x.x, 172.16–31.x.x) — `next dev` prints
  // one of these as the Network URL, and it must behave exactly like localhost.
  return /^(?:192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host);
}

/** Drop the `:port` suffix and lowercase. IPv6 literals keep their brackets. */
export function stripPort(hostname: string): string {
  const host = hostname.trim().toLowerCase();
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1) || host;
  const colonIndex = host.lastIndexOf(':');
  return colonIndex === -1 ? host : host.slice(0, colonIndex);
}

/**
 * The leftmost label of a 3+ label host: 'hire.jobmesh.in' → 'hire'.
 * A bare two-label domain ('jobmesh.in') has no subdomain → null.
 * Returns null for local and IP hosts, which never carry an audience subdomain.
 */
export function extractSubdomain(hostname: string): string | null {
  const host = stripPort(hostname);
  if (!host || isLocalHostname(host)) return null;
  // A bare IPv4/IPv6 literal has no subdomain even with 4 dot-separated parts.
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) return null;
  const labels = host.split('.');
  if (labels.length < 3) return null;
  return labels[0] || null;
}

/**
 * Resolve a Host header to its audience.
 * - null host (a proxy stripped it) or a local host → 'seeker' with isKnown, so
 *   the caller falls back to path-based routing rather than 404-ing.
 * - An unmapped label ('foo.jobmesh.in') → isKnown:false so the caller 404s
 *   instead of rewriting into a redirect loop.
 */
export function resolveAudience(hostname: string | null): {
  audience: Audience;
  subdomain: string | null;
  isKnown: boolean;
  isWww: boolean;
} {
  if (!hostname) return { audience: 'seeker', subdomain: null, isKnown: true, isWww: false };

  const subdomain = extractSubdomain(hostname);
  if (subdomain === null) {
    return { audience: 'seeker', subdomain: null, isKnown: true, isWww: false };
  }
  if (subdomain === 'www') {
    return { audience: 'seeker', subdomain: 'www', isKnown: true, isWww: true };
  }

  const audience = AUDIENCE_BY_SUBDOMAIN[subdomain];
  return audience
    ? { audience, subdomain, isKnown: true, isWww: false }
    : { audience: 'seeker', subdomain, isKnown: false, isWww: false };
}
