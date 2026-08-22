'use client';
// FILE: src/app/(admin)/admin/invites/[token]/InviteAcceptClient.tsx
// Interactive half of the admin invite acceptance page. Mirrors /admin/login's shell
// and Google flow, but passes the invite token to loginAdmin so the backend matches
// the pending row by token, activates it, and sets jm_admin_token in one step.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button, Spinner, Alert, Stack } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { loginAdmin, AdminApiError } from '@/api/admin-api';

function messageForAcceptError(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.code === 'INVITE_INVALID') return 'This invite link is invalid or has expired. Ask your inviter to send a new one.';
    if (error.code === 'INVITE_EMAIL_MISMATCH') return 'Please sign in with the Google account that was invited.';
    if (error.code === 'INVALID_GOOGLE_TOKEN') return 'Google sign-in failed. Try again.';
  }
  return 'Something went wrong. Try again.';
}

export default function InviteAcceptClient({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = async (idToken?: string) => {
    if (!idToken) { setError('Google sign-in was interrupted. Try again.'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      await loginAdmin(idToken, token);
      router.push('/admin'); // fresh cookie → the (app) guard hydrates AdminContext
    } catch (err) {
      setError(messageForAcceptError(err));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Stack gap={16}>
        <div>
          <h1 style={{ fontSize: TYPE.xl, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            You&apos;ve been invited
          </h1>
          <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.55 }}>
            You&apos;ve been invited to join JobMesh as an admin. Sign in with the Google
            account matching the invited email to accept.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
          {isSubmitting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-muted)' }}>
              <Spinner size={16} /> Accepting…
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
      </Stack>
    </AuthLayout>
  );
}
