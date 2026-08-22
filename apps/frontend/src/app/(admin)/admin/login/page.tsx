'use client';
// FILE: src/app/(admin)/admin/login/page.tsx
// Admin sign-in. Sibling of (app)/ so it renders OUTSIDE the auth guard (mirrors the
// employer login structure). Google sign-in POSTs the id token to the admin auth
// endpoint; on success the (app) layout re-runs and hydrates AdminContext from the
// fresh jm_admin_token cookie. Reuses AuthLayout so it looks like a JobMesh page.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button, Spinner, Alert, Stack } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { loginAdmin, AdminApiError } from '@/api/admin-api';
import { isSafeAdminNextPath } from '@/context/admin/admin-context-types';

const DEFAULT_ADMIN_PATH = '/admin';

function resolveAdminNext(search: string): string {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const next = new URLSearchParams(query).get('next') ?? '';
  return isSafeAdminNextPath(next) ? next : DEFAULT_ADMIN_PATH;
}

function messageForLoginError(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.code === 'MISSING_ID_TOKEN') return 'Google sign-in was interrupted. Try again.';
    if (error.status === 403) return 'This Google account is not registered as a JobMesh admin. Contact an existing admin for access.';
    if (error.code === 'INVALID_GOOGLE_TOKEN') return 'Google sign-in failed. Try again.';
  }
  return 'Something went wrong. Try again.';
}

export default function AdminLoginPage() {
  const router = useRouter();
  // Read ?next on mount from window.location to keep this a plain client route (no
  // Suspense-bound useSearchParams). Defaults to /admin. Mirrors the employer login.
  const [redirectTo, setRedirectTo] = useState(DEFAULT_ADMIN_PATH);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setRedirectTo(resolveAdminNext(window.location.search)); }, []);

  const handleSuccess = async (idToken?: string) => {
    if (!idToken) {
      setError('Google sign-in was interrupted. Try again.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await loginAdmin(idToken);
      // Let the (app) layout re-run and hydrate AdminContext from the fresh cookie.
      router.push(redirectTo);
    } catch (err) {
      setError(messageForLoginError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Stack gap={16}>
        <div>
          <h1 style={{ fontSize: TYPE.xl, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            JobMesh Admin
          </h1>
          <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.55 }}>
            Sign in with your admin Google account.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
          {isSubmitting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-muted)' }}>
              <Spinner size={16} /> Signing in…
            </div>
          ) : (
            <GoogleLogin
              onSuccess={(response) => { void handleSuccess(response.credential); }}
              onError={() => setError('Google sign-in failed. Try again.')}
              useOneTap={false}
              theme="outline"
              size="large"
              width="320"
            />
          )}
        </div>

        {error && (
          <Alert type="warning">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span>{error}</span>
              <Button variant="link" onClick={() => setError(null)} aria-label="Dismiss error">Dismiss</Button>
            </div>
          </Alert>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="link">← Back to JobMesh</Button>
          </Link>
        </div>
      </Stack>
    </AuthLayout>
  );
}
