// FILE: src/app/(admin)/admin/(app)/layout.tsx
// Admin guard. Requires jm_admin_token via getAdminMeServer(). No seeker cookie is
// read. Missing/invalid admin → /admin/login?next=<path>. See lib/server-api/admin.ts.
//
// The guard lives here (in the (app) group) rather than the parent segment layout so
// that /admin/login — a sibling of (app) — renders OUTSIDE the auth wall. Same pattern
// as (employer)/employer/(app)/layout.tsx.
import { redirect } from 'next/navigation';
import { getAdminMeServer } from '@/lib/server-api/admin';
import { AdminProvider } from '@/context/admin/AdminContext';
import AdminAppShell from '@/components/layouts/AdminAppShell';

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminMeServer();
  // No reliable server-side pathname without middleware (R4) — default ?next to /admin.
  if (!admin) redirect(`/admin/login?next=${encodeURIComponent('/admin')}`);

  return (
    <AdminProvider initialAdmin={admin}>
      <AdminAppShell>{children}</AdminAppShell>
    </AdminProvider>
  );
}
