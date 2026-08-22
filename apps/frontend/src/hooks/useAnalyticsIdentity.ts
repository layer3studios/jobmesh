'use client';
// FILE: src/hooks/useAnalyticsIdentity.ts
// Declaratively keeps PostHog's identity in sync with an audience context's logged-in
// user, gated by analytics consent. Used by SeekerContext + EmployerContext (Chunk 1
// scope §7). Handles all three transitions:
//   • login (or consent granted after login) → identifyUser
//   • logout → resetUser
// identifyUser / resetUser are no-ops before PostHog init, so this is inert until the
// visitor has consented. Only non-sensitive, already-known fields go in properties.
import { useEffect, useRef } from 'react';
import { identifyUser, resetUser } from '@/lib/posthog';
import { useAnalyticsConsent } from './useAnalyticsConsent';

export interface AnalyticsIdentity {
  distinctId: string;
  properties: Record<string, unknown>;
}

export function useAnalyticsIdentity(identity: AnalyticsIdentity | null): void {
  const { consent } = useAnalyticsConsent();
  const identifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const nextId = identity?.distinctId ?? null;

    if (nextId && consent === 'granted') {
      identifyUser(nextId, identity?.properties);
      identifiedIdRef.current = nextId;
      return;
    }

    // User cleared (logout) after having been identified — reset the distinct_id.
    if (!nextId && identifiedIdRef.current) {
      resetUser();
      identifiedIdRef.current = null;
    }
  }, [identity?.distinctId, identity?.properties, consent]);
}
