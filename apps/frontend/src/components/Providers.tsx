'use client';
// FILE: src/components/Providers.tsx
// Global client providers mounted once in the root layout. Mirrors the current
// frontend's main.tsx stack MINUS the audience contexts: SeekerProvider and
// EmployerProvider are seeded per route group (D3/D4), not globally. Here we keep
// the cross-cutting ones: Google OAuth, Theme, Toast, and consent-gated PostHog.
import { Suspense, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '../context/theme/ThemeProvider';
import { ToastProvider } from './ui';
import PostHogProvider from './analytics/PostHogProvider';
import PostHogPageView from './analytics/PostHogPageView';
import AnalyticsConsentBanner from './analytics/AnalyticsConsentBanner';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* Theme outermost so PostHog does not init before the theme is set (perf). */}
      <ThemeProvider>
        <PostHogProvider>
          <ToastProvider>
            {/* useSearchParams requires a Suspense boundary in the App Router (R1). */}
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            {children}
            <AnalyticsConsentBanner />
          </ToastProvider>
        </PostHogProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default Providers;
