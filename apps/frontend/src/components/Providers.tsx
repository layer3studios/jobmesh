'use client';
// FILE: src/components/Providers.tsx
// Global client providers mounted once in the root layout. Mirrors the current
// frontend's main.tsx stack MINUS the audience contexts: SeekerProvider and
// EmployerProvider are seeded per route group (D3/D4), not globally. Here we keep
// the cross-cutting ones: Google OAuth, Theme, Toast, and the consent-gated
// analytics stack (PostHog + GTM/GA4 + Clarity, all behind TrackingProvider).
import { Suspense, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '../context/theme/ThemeProvider';
import { ToastProvider } from './ui';
import TrackingProvider from './analytics/TrackingProvider';
import RouteAnalytics from './analytics/RouteAnalytics';
import AnalyticsConsentBanner from './analytics/AnalyticsConsentBanner';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* Theme outermost so no tracker inits before the theme is set (perf). */}
      <ThemeProvider>
        <TrackingProvider>
          <ToastProvider>
            {/* useSearchParams requires a Suspense boundary in the App Router (R1). */}
            <Suspense fallback={null}>
              <RouteAnalytics />
            </Suspense>
            {children}
            <AnalyticsConsentBanner />
          </ToastProvider>
        </TrackingProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default Providers;
