// FILE: src/lib/nav-origin.ts
// The `?from=` navigation-origin param. It records which SECTION a task flow
// started in, so a sub-page reached from the Dashboard still reads as part of
// the Dashboard (breadcrumb root + nav highlight) rather than looking like the
// user switched sections.
//
// The applicant-detail page also uses `?from=` for its own tab context
// ('ranked' | 'pipeline'). Those values are disjoint from the origins here, so
// the two coexist in one param: parseNavOrigin returns null for them and the
// consumer falls back to route-based behaviour.

export const NAV_ORIGINS = { DASHBOARD: 'dashboard', JOBS: 'jobs' } as const;

export type NavOrigin = (typeof NAV_ORIGINS)[keyof typeof NAV_ORIGINS];

const ORIGIN_CRUMB: Record<NavOrigin, { label: string; href: string }> = {
  dashboard: { label: 'Dashboard', href: '/employer' },
  jobs: { label: 'Jobs', href: '/employer/jobs' },
};

/** A recognised origin, or null for a missing / unrelated `from` value. */
export function parseNavOrigin(value: string | null | undefined): NavOrigin | null {
  if (value === NAV_ORIGINS.DASHBOARD || value === NAV_ORIGINS.JOBS) return value;
  return null;
}

/** The root breadcrumb (and nav section) an origin maps to. */
export function originCrumb(origin: NavOrigin): { label: string; href: string } {
  return ORIGIN_CRUMB[origin];
}

/** Append `?from=<origin>` to a href, preserving any query it already carries. */
export function withOrigin(href: string, origin: NavOrigin): string {
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}from=${origin}`;
}
