// FILE: src/lib/analytics-consent.ts
// Client-side analytics/tracking consent store (DPDP Act 2023). SEPARATE from the
// server-backed per-purpose ConsentGate (that governs post-signup data processing).
// This one governs non-essential analytics cookies for ALL visitors — anonymous
// included — and is the sole gate for PostHog initialisation (Chunk 1). State lives
// in localStorage under a distinct key so the two systems never collide.
//
// Three states: 'pending' (undecided — no init), 'granted' (init PostHog),
// 'declined' (never init). A module-level store (not React context) so the root
// PostHogProvider, the banner, the footer link, and the audience contexts can all
// read/observe it regardless of where they mount in the tree.

export type AnalyticsConsent = 'pending' | 'granted' | 'declined';

export const ANALYTICS_CONSENT_KEY = 'jm_analytics_consent';

interface ConsentSnapshot {
  consent: AnalyticsConsent;
  isBannerOpen: boolean;
}

// Immutable snapshot object — useSyncExternalStore requires a stable reference
// between notifications, so we only ever replace `current`, never mutate it.
let current: ConsentSnapshot = { consent: 'pending', isBannerOpen: false };
let isHydrated = false;
const listeners = new Set<() => void>();

const SERVER_SNAPSHOT: ConsentSnapshot = { consent: 'pending', isBannerOpen: false };

function emit(next: ConsentSnapshot): void {
  current = next;
  listeners.forEach((listener) => listener());
}

function readStored(): AnalyticsConsent {
  try {
    const raw = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (raw === 'granted' || raw === 'declined') return raw;
  } catch {
    /* storage blocked (private mode / SSR) — treat as undecided */
  }
  return 'pending';
}

function persist(value: AnalyticsConsent): void {
  try {
    if (value === 'pending') localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    else localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    /* storage blocked — in-memory state still drives this session */
  }
}

// Called once from a client effect (never at import time) so the first client
// render matches the server render (banner hidden) — no hydration mismatch. After
// hydration the banner opens only if the user has not yet decided.
export function hydrateAnalyticsConsent(): void {
  if (isHydrated) return;
  isHydrated = true;
  const stored = readStored();
  emit({ consent: stored, isBannerOpen: stored === 'pending' });
}

export function grantAnalyticsConsent(): void {
  persist('granted');
  emit({ consent: 'granted', isBannerOpen: false });
}

export function declineAnalyticsConsent(): void {
  persist('declined');
  emit({ consent: 'declined', isBannerOpen: false });
}

// Footer "Cookie preferences" entry point — re-opens the banner so a returning
// visitor can change a previous choice.
export function openAnalyticsPreferences(): void {
  emit({ consent: current.consent, isBannerOpen: true });
}

export function subscribeAnalyticsConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getAnalyticsConsentSnapshot(): ConsentSnapshot {
  return current;
}

export function getAnalyticsServerSnapshot(): ConsentSnapshot {
  return SERVER_SNAPSHOT;
}
