'use client';
// FILE: src/components/analytics/TrackingProvider.tsx
// Consent-gated lifecycle wrapper for ALL analytics: PostHog, Google Tag
// Manager (which carries GA4) and Microsoft Clarity. Was PostHogProvider, when
// PostHog was the only tool.
//
// Mounted once in the root layout so it covers every route — including the
// routes outside the audience groups (login, invite acceptance) that have no
// Seeker/Employer context. It therefore depends ONLY on the analytics-consent
// store, never on an audience context.
//
// Renders children unchanged: no visual output, and no server/client render
// divergence, so it cannot cause a hydration mismatch.
//
// Deliberate deviation: we do NOT use instrumentation-client.ts, which would
// fire a global side effect regardless of consent. Consent gating lives here.
import { useEffect, useRef, type ReactNode } from 'react';
import { hydrateAnalyticsConsent } from '@/lib/analytics-consent';
import { initPostHog, getPostHogClient, resetUser } from '@/lib/posthog';
import { startGoogleTagManager, startClarity, stopTagTracking } from '@/lib/tracking';
import { applyInternalFlagFromUrl } from '@/lib/internal-traffic';
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent';

export default function TrackingProvider({ children }: { children: ReactNode }) {
  const { consent } = useAnalyticsConsent();
  const wasGrantedRef = useRef(false);

  // Order matters: the ?jm_internal flag is applied BEFORE consent is read, so a
  // device being marked as ours takes effect on this very page load rather than
  // the next one. Both run after mount, keeping the first client render equal to
  // the server render (banner hidden).
  useEffect(() => {
    applyInternalFlagFromUrl();
    hydrateAnalyticsConsent();
  }, []);

  useEffect(() => {
    if (consent === 'granted') {
      // Each of these is individually idempotent and each re-checks
      // isTrackingAllowed(), so an unset id or an internal device simply means
      // that tool does not start. One missing key never blocks the others.
      initPostHog();
      startGoogleTagManager();
      startClarity();
      wasGrantedRef.current = true;
      return;
    }

    // Consent revoked after having been granted: stop capture everywhere and
    // drop the identity and the on-device data. Already-captured data is NOT
    // deleted here — each vendor's own erasure flow handles that.
    if (consent === 'declined' && wasGrantedRef.current) {
      getPostHogClient()?.opt_out_capturing();
      resetUser();
      stopTagTracking();
      wasGrantedRef.current = false;
    }
  }, [consent]);

  return <>{children}</>;
}
