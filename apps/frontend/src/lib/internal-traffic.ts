// FILE: src/lib/internal-traffic.ts
// Keeps our own testing out of PostHog, GA4 and Clarity.
//
// Filtering in the vendors' dashboards only hides internal data AFTER it was
// ingested (PostHog's "filter out internal users" still counts it against the
// event quota, and Clarity has no such filter at all). So instead no tracker is
// ever STARTED when:
//
//   • the page is not served from a production host — localhost, a LAN IP, a
//     preview deploy. NEXT_PUBLIC_ANALYTICS_HOSTS lists the hosts that count,
//     and nothing else tracks. This is also why a dev machine never pollutes
//     production analytics, by construction rather than by discipline.
//   • this device is marked as ours: open any page with ?jm_internal=1 (undo
//     with ?jm_internal=0). Survives logout, so a test phone stays excluded.
//
// lib/tracking.ts and lib/posthog.ts both check isTrackingAllowed() before
// loading anything.

const INTERNAL_KEY = 'jm_internal';
const URL_PARAM = 'jm_internal';

/**
 * Hosts where analytics may run. Subdomains of the product (apply.*, hire.*)
 * are listed explicitly rather than matched by suffix — a wildcard would also
 * match a preview deploy that merely ends in the same string.
 */
const PRODUCTION_HOSTS = (
  process.env.NEXT_PUBLIC_ANALYTICS_HOSTS
  || 'jobmesh.in,www.jobmesh.in,apply.jobmesh.in'
)
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

/** True when this device was marked as ours via ?jm_internal=1. */
export function isInternalDevice(): boolean {
  try {
    return localStorage.getItem(INTERNAL_KEY) === '1';
  } catch {
    return false; // storage blocked — assume a real visitor
  }
}

export function setInternalDevice(internal: boolean): void {
  try {
    if (internal) localStorage.setItem(INTERNAL_KEY, '1');
    else localStorage.removeItem(INTERNAL_KEY);
  } catch {
    /* storage blocked: nothing to persist */
  }
}

/**
 * Applies ?jm_internal=1 / =0 from the current URL, then strips the parameter
 * so it is not bookmarked or shared (a shared link carrying it would silently
 * exclude a real visitor). Returns the new state, or null when absent.
 */
export function applyInternalFlagFromUrl(): boolean | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const value = url.searchParams.get(URL_PARAM);
  if (value !== '1' && value !== '0') return null;
  setInternalDevice(value === '1');
  url.searchParams.delete(URL_PARAM);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  return value === '1';
}

/** Analytics may load only on a production host, on a device that is not ours. */
export function isTrackingAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  return PRODUCTION_HOSTS.includes(window.location.hostname.toLowerCase()) && !isInternalDevice();
}
