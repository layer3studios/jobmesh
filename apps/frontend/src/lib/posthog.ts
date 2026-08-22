// FILE: src/lib/posthog.ts
// Client-only PostHog wrapper. NEVER import from a server component. All access to
// posthog-js flows through these helpers so consent gating stays enforceable: the
// only place posthog.init() may run is initPostHog(), and initPostHog() is only ever
// called from the consent-gated PostHogProvider (C7). Helpers no-op before init so
// callers never have to guard (capturePageView / identifyUser / resetUser).
import posthog, { type PostHog } from 'posthog-js';

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
    capture_pageview: false,
    capture_pageleave: true,
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

export function capturePageView(pathname: string, searchParams?: string): void {
  const client = getPostHogClient();
  if (!client) return;
  const url = searchParams ? `${pathname}?${searchParams}` : pathname;
  client.capture('$pageview', { $current_url: url });
}

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
