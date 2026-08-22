// FILE: invites/[token]/InviteStatusView.tsx
// Terminal states for an invite that can't be accepted (404 / 410). Presentational,
// server-renderable: a centered card with a specific message. The 'accepted' variant
// offers a "Go to dashboard" link since that person clearly has an employer relationship
// (D_impl_ui5_7). Other variants are dead ends — nothing actionable to offer.
import Link from 'next/link';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button, Stack } from '@/components/ui';
import { TYPE } from '@/theme/tokens';

export type InviteStatusVariant = 'not_found' | 'expired' | 'revoked' | 'accepted';

const COPY: Record<InviteStatusVariant, { title: string; body: string }> = {
  not_found: { title: 'Invite not found', body: 'This invite link is invalid. Ask whoever invited you to send a new one.' },
  expired: { title: 'This invite has expired', body: 'Invite links are time-limited. Ask an admin to resend the invite.' },
  revoked: { title: 'This invite has been revoked', body: 'This invite was cancelled by an admin. Ask them to send a new one if you still need access.' },
  accepted: { title: 'This invite was already accepted', body: 'This invite has already been used. If that was you, head to your dashboard.' },
};

export default function InviteStatusView({ variant }: { variant: InviteStatusVariant }) {
  const { title, body } = COPY[variant];
  return (
    <AuthLayout>
      <Stack gap={14}>
        <h1 style={{ fontSize: TYPE.xl, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', lineHeight: 1.55 }}>{body}</p>
        {variant === 'accepted' && (
          <Link href="/employer" style={{ textDecoration: 'none' }}>
            <Button variant="primary" fullWidth>Go to dashboard</Button>
          </Link>
        )}
      </Stack>
    </AuthLayout>
  );
}
