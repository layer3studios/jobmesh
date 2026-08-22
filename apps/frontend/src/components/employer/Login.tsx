'use client';
// FILE: src/components/employer/Login.tsx
// Employer Google sign-in. Wrapped in AuthLayout (centered card + brand header).
// Distinguishes gated / invalid / network / unknown login failures and lets the
// user dismiss the error. On success the auth effect redirects to /employer.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button, Spinner, Alert, Stack } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { useEmployer } from '@/context/employer/EmployerContext';
import { resolveSafeNextPath } from '@/lib/safe-next-path';
import { trackEvent } from '@/lib/analytics-events';
import { getFromRoute } from '@/lib/from-route';

const GOOGLE_ERROR_MESSAGE = 'Google sign-in failed. Please try again.';
const NO_CREDENTIAL_MESSAGE = 'No sign-in credential was returned. Please try again.';

export default function EmployerLogin() {
  const { employerUser, isAuthenticating, loginError, login, clearLoginError } = useEmployer();
  const router = useRouter();
  const [googleError, setGoogleError] = useState<string | null>(null);
  // Post-login destination honours a safe internal ?next= (D_impl_ui5_2) — e.g. an
  // invite link that bounced through login. Read on mount from window.location to keep
  // this a plain client route (no Suspense-bound useSearchParams). Defaults to /employer.
  const [redirectTo, setRedirectTo] = useState('/employer');
  useEffect(() => { setRedirectTo(resolveSafeNextPath(window.location.search)); }, []);

  // Redirect once a session exists (covers both fresh login and already-logged-in).
  useEffect(() => {
    if (employerUser) router.replace(redirectTo);
  }, [employerUser, router, redirectTo]);

  // Employer sign-in screen is the employer signup entry point.
  useEffect(() => { trackEvent('employer_signup_started', { fromRoute: getFromRoute() }); }, []);

  const activeError = loginError ?? (googleError ? { kind: 'unknown' as const, message: googleError } : null);

  const dismissError = () => {
    clearLoginError();
    setGoogleError(null);
  };

  const handleSuccess = (credential?: string) => {
    if (!credential) {
      setGoogleError(NO_CREDENTIAL_MESSAGE);
      return;
    }
    setGoogleError(null);
    void login(credential);
  };

  return (
    <AuthLayout>
      <Stack gap={16}>
        <div>
          <h1 style={{ fontSize: TYPE.xl, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Sign in to JobMesh Hire
          </h1>
          <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.55 }}>
            Manage your hiring with AI-powered scoring.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
          <GoogleLogin
            onSuccess={(response) => handleSuccess(response.credential)}
            onError={() => setGoogleError(GOOGLE_ERROR_MESSAGE)}
            useOneTap={false}
            theme="outline"
            size="large"
            width="320"
          />
        </div>

        {activeError && (
          <Alert type={activeError.kind === 'gated' ? 'error' : 'warning'}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span>{activeError.message}</span>
              <Button variant="link" onClick={dismissError} aria-label="Dismiss error">Dismiss</Button>
            </div>
          </Alert>
        )}

        {isAuthenticating && (
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--ink-muted)' }}>
            <Spinner size={16} />
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="link">Looking for a job? Go to JobMesh →</Button>
          </Link>
        </div>
      </Stack>
    </AuthLayout>
  );
}
