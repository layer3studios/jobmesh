// FILE: src/lib/posthog.ts
// Client-only PostHog wrapper. NEVER import from a server component. All access to
// posthog-js flows through these helpers so consent gating stays enforceable: the
// only place posthog.init() may run is initPostHog(), and initPostHog() is only ever
// called from the consent-gated TrackingProvider (C7). Helpers no-op before init so
// callers never have to guard (identifyUser / resetUser).
import posthog, { type PostHog } from 'posthog-js';
import { isTrackingAllowed } from './internal-traffic';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let hasInitialized = false;
let hasWarnedMissingEnv = false;

// Idempotent. Safe to call multiple times — a no-op after the first success. Returns
// the client on success, null when env is missing (never throws — a missing key must
// not crash the app). This is the ONLY call site of posthog.init() in the codebase.
export function initPostHog(): PostHog | null {
  if (hasInitialized) return posthog;
  if (typeof window === 'undefined') return null;
  // Our own traffic, and every non-production host, is excluded before a single
  // request is made (lib/internal-traffic.ts) rather than filtered afterwards.
  if (!isTrackingAllowed()) return null;

  if (!POSTHOG_KEY || !POSTHOG_HOST) {
    if (!hasWarnedMissingEnv) {
      hasWarnedMissingEnv = true;
      console.warn('[posthog] NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST missing — analytics disabled.');
    }
    return null;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    autocapture: true,
    // 'history_change' — NOT false, and not true.
    //   false  lost the entry pageview outright: consent is granted AFTER the
    //          page has loaded, so a manual capture on mount had already no-oped
    //          against an uninitialised client and never re-fired. Every new
    //          visitor's landing page went unrecorded, which on this site is
    //          most of the traffic.
    //   true   captures the initial load only, and misses every App Router
    //          client-side navigation (they are pushState, not a document load).
    // 'history_change' captures the load AND follows the History API, so it is
    // correct whenever init happens — including mid-session, on consent.
    capture_pageview: 'history_change',
    capture_pageleave: true,
    // Core Web Vitals with attribution: CLS carries the element that moved and
    // INP the interaction that was slow, so a bad score points at a cause
    // instead of just reporting a number.
    capture_performance: { web_vitals: true, web_vitals_attribution: true },
    session_recording: { maskAllInputs: true, maskTextSelector: '[data-ph-mask]' },
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug(false);
    },
  });
  hasInitialized = true;
  return posthog;
}

// Returns the live client, or null when not yet initialised (consent not granted).
export function getPostHogClient(): PostHog | null {
  return hasInitialized ? posthog : null;
}

// NOTE: there is deliberately no capturePageView() any more. Pageviews are the
// SDK's job via `capture_pageview: 'history_change'` above; a manual capture
// alongside it double-counts every navigation. See components/analytics/
// RouteAnalytics.tsx for why the manual version was removed.

// Call after a successful login. Creates the person profile (person_profiles is
// 'identified_only', so anonymous visitors never get one). Only non-sensitive,
// already-known fields belong in properties — no phone, resume, or applications.
export function identifyUser(distinctId: string, properties?: Record<string, unknown>): void {
  const client = getPostHogClient();
  if (!client) return;
  client.identify(distinctId, properties);
}

// Call on logout or consent revoke. Clears the distinct_id so subsequent events are
// not tied to the previous person.
export function resetUser(): void {
  const client = getPostHogClient();
  if (!client) return;
  client.reset();
}
