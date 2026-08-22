'use client';
// FILE: src/components/analytics/PostHogProvider.tsx
// Consent-gated lifecycle wrapper for PostHog. Mounted once in the root layout so it
// covers every route — including non-app-group routes (login, invite acceptance) that
// have no Seeker/Employer context. It therefore depends ONLY on the analytics-consent
// store, never on an audience context (D7). Renders children unchanged; no visual
// output and no server/client render divergence (no hydration mismatch).
//
// Deliberate deviation (R9): we do NOT use instrumentation-client.ts — that fires a
// global side effect regardless of consent. Consent gating lives here instead.
import { useEffect, useRef, type ReactNode } from 'react';
import { hydrateAnalyticsConsent } from '@/lib/analytics-consent';
import { initPostHog, getPostHogClient, resetUser } from '@/lib/posthog';
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent';

export default function PostHogProvider({ children }: { children: ReactNode }) {
  const { consent } = useAnalyticsConsent();
  const wasGrantedRef = useRef(false);

  // Read persisted consent once, after mount — keeps the first client render equal to
  // the server render (banner hidden), then reveals the true state.
  useEffect(() => { hydrateAnalyticsConsent(); }, []);

  useEffect(() => {
    if (consent === 'granted') {
      initPostHog();
      wasGrantedRef.current = true;
      return;
    }

    // Consent revoked after having been granted: persist opt-out and drop identity so
    // no further events flow. We do not delete already-captured data (PostHog's own
    // erasure flow handles that).
    if (consent === 'declined' && wasGrantedRef.current) {
      getPostHogClient()?.opt_out_capturing();
      resetUser();
      wasGrantedRef.current = false;
    }
  }, [consent]);

  return <>{children}</>;
}
