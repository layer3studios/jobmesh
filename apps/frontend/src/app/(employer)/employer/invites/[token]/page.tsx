// FILE: invites/[token]/page.tsx
// Invite acceptance entry (Server Component). Lives OUTSIDE the (app) group, so no auth
// or onboarding guard runs — the invitee may be a brand-new employer, or not signed in
// at all. Server-fetches the sanitized public preview (unauth, no cookies), then either
// renders a terminal state (404 / 410) or the interactive accept client wrapped in a
// guest EmployerProvider that self-detects the session (D_impl_ui5_1).
import type { Metadata } from 'next';
import { publicServerFetch } from '@/lib/public-server-fetch';
import { EmployerProvider } from '@/context/employer/EmployerContext';
import type { InvitePreview } from '@/types/employer-team';
import InviteAcceptClient from './InviteAcceptClient';
import InviteStatusView, { type InviteStatusVariant } from './InviteStatusView';

// Always fetch fresh (revalidate 0): an invite's status can flip between renders.
const fetchPreview = (token: string) =>
  publicServerFetch<InvitePreview>(`/public/invites/${encodeURIComponent(token)}`, 0);

// Map a stale-invite ServerFetchError to its terminal variant, or null for a real
// failure. Read structurally (status + code) rather than via instanceof — the error
// is a ServerFetchError, but structural matching is resilient to it crossing module
// boundaries during SSR.
function staleVariant(error: unknown): InviteStatusVariant | null {
  const e = error as { status?: number; code?: string | null } | null;
  if (!e || typeof e.status !== 'number') return null;
  if (e.status === 404 || e.code === 'INVITE_NOT_FOUND') return 'not_found';
  if (e.status !== 410) return null;
  if (e.code === 'INVITE_REVOKED') return 'revoked';
  if (e.code === 'INVITE_ALREADY_ACCEPTED') return 'accepted';
  return 'expired';
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const noindex = { robots: { index: false } } satisfies Partial<Metadata>;
  try {
    const preview = await fetchPreview(token);
    return { title: `Join ${preview.companyName} on JobMesh`, ...noindex };
  } catch {
    return { title: 'Join a team on JobMesh', ...noindex };
  }
}

export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let preview: InvitePreview;
  try {
    preview = await fetchPreview(token);
  } catch (error) {
    const variant = staleVariant(error);
    if (variant) return <InviteStatusView variant={variant} />;
    throw error; // genuine upstream failure → the (employer) error boundary handles it
  }
  return (
    <EmployerProvider>
      <InviteAcceptClient token={token} preview={preview} />
    </EmployerProvider>
  );
}
