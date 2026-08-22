// FILE: src/app/(admin)/admin/invites/[token]/page.tsx
// Admin invite acceptance (Server Component). Sibling of /admin/login — deliberately
// OUTSIDE the (app) auth guard so an invitee with no session can open it. The token
// is opaque: there is no preview endpoint; validation happens at Google sign-in
// (POST /api/admin/auth/google with inviteToken).
import type { Metadata } from 'next';
import InviteAcceptClient from './InviteAcceptClient';

export const metadata: Metadata = {
  title: 'Admin invite · JobMesh',
  robots: { index: false, follow: false },
};

export default async function AdminInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteAcceptClient token={token} />;
}
