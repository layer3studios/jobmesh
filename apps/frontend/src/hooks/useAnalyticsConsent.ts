'use client';
// FILE: src/hooks/useAnalyticsConsent.ts
// React binding over the analytics-consent module store. useSyncExternalStore keeps
// every subscriber (banner, footer link, PostHogProvider, audience contexts) in sync
// and stays SSR-safe: the server snapshot renders the banner hidden, matching the
// client's pre-hydration render (no mismatch).
import { useSyncExternalStore } from 'react';
import {
  subscribeAnalyticsConsent,
  getAnalyticsConsentSnapshot,
  getAnalyticsServerSnapshot,
  grantAnalyticsConsent,
  declineAnalyticsConsent,
  openAnalyticsPreferences,
  type AnalyticsConsent,
} from '@/lib/analytics-consent';

interface UseAnalyticsConsent {
  consent: AnalyticsConsent;
  isBannerOpen: boolean;
  grant: () => void;
  decline: () => void;
  openPreferences: () => void;
}

export function useAnalyticsConsent(): UseAnalyticsConsent {
  const snapshot = useSyncExternalStore(
    subscribeAnalyticsConsent,
    getAnalyticsConsentSnapshot,
    getAnalyticsServerSnapshot,
  );

  return {
    consent: snapshot.consent,
    isBannerOpen: snapshot.isBannerOpen,
    grant: grantAnalyticsConsent,
    decline: declineAnalyticsConsent,
    openPreferences: openAnalyticsPreferences,
  };
}
