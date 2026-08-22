'use client';
// FILE: invites/[token]/InviteAcceptClient.tsx
// The interactive half of the invite acceptance page. Detects the employer session via
// EmployerContext (same pattern as any employer route, D_impl_ui5_1). Logged out → a
// "Sign in with Google" link that hands off to /employer/login?next=<this url> so OAuth
// returns here (D_impl_ui5_5). Logged in → an Accept button that POSTs the token.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button, Stack, Alert, Badge, Spinner } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { acceptInvite, EmployerTeamApiError } from '@/api/employer-team-api';
import { trackEvent } from '@/lib/analytics-events';
import { roleLabel } from '@/lib/role-labels';
import { formatRelativeExpiry } from '@/lib/relative-time';
import type { InvitePreview } from '@/types/employer-team';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

function interviewerPermsLabel(preview: InvitePreview): string | null {
  if (preview.role !== 'interviewer') return null;
  if (preview.canMoveApplicants && preview.canArchiveApplicants) return 'Can move · Can archive';
  if (preview.canMoveApplicants) return 'Can move';
  if (preview.canArchiveApplicants) return 'Can archive';
  return 'View + notes only';
}

export default function InviteAcceptClient({ token, preview }: { token: string; preview: InvitePreview }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { employerUser, isLoading, logout } = useEmployer();
  const [accepting, setAccepting] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const loginHref = `/employer/login?next=${encodeURIComponent(`/employer/invites/${token}`)}`;
  const perms = interviewerPermsLabel(preview);

  async function handleAccept() {
    setAccepting(true);
    setMismatch(false);
    try {
      const result = await acceptInvite(token);
      // companyId comes from the invite preview (C8) — the acceptor may have no company
      // of their own yet. inviteId is omitted: neither the sanitized preview nor the
      // accept response carries it (Chunk 2 contract), and the token must never be sent.
      trackEvent('team_invite_accepted', {
        companyId: preview.companyId,
        role: (preview.role === 'founder' ? 'owner' : preview.role),
      });
      showToast('success', result.alreadyMember ? "You're already a member" : `Joined ${preview.companyName}`);
      router.replace(result.redirectUrl || '/employer');
    } catch (error) {
      if (error instanceof EmployerTeamApiError && error.code === 'INVITE_EMAIL_MISMATCH') {
        setMismatch(true);
      } else if (error instanceof EmployerTeamApiError && (error.status === 410 || error.status === 404)) {
        router.refresh(); // the invite went stale — re-fetch the preview for the right terminal state
      } else {
        showToast('error', error instanceof EmployerTeamApiError ? error.message : GENERIC_ERROR);
      }
      setAccepting(false);
    }
  }

  async function handleSignOut() {
    await logout();
    router.replace(loginHref);
  }

  return (
    <AuthLayout>
      <Stack gap={16}>
        <div>
          <h1 style={{ fontSize: TYPE.xl, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Join {preview.companyName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)' }}>as</span>
            <Badge variant="info">{roleLabel(preview.role)}</Badge>
            {perms && <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{perms}</span>}
          </div>
          {preview.invitedByName && (
            <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', marginTop: 8 }}>Invited by {preview.invitedByName}</p>
          )}
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginTop: 4 }}>Expires {formatRelativeExpiry(preview.expiresAt)}</p>
        </div>

        {mismatch && (
          <Alert type="error">
            This invite was sent to a different email. Sign out and sign in with the invited email.
          </Alert>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}><Spinner size={16} /></div>
        ) : !employerUser ? (
          <Button as="a" href={loginHref} variant="primary" fullWidth>Sign in with Google to accept</Button>
        ) : mismatch ? (
          <Button variant="secondary" fullWidth onClick={() => void handleSignOut()}>Sign out</Button>
        ) : (
          <Button variant="primary" fullWidth loading={accepting} onClick={() => void handleAccept()}>
            Accept and join {preview.companyName}
          </Button>
        )}
      </Stack>
    </AuthLayout>
  );
}
