// FILE: src/app/(admin)/admin/(app)/team/page.tsx
// Admin team management (Server Component). Admin identity is jm_admin_token via
// require-admin-middleware; the (admin)/admin/(app)/layout.tsx guard runs first, so
// the null branch below is belt-and-suspenders for a session expiring mid-render.
// SSR fetches the roster; TeamManagementClient owns all mutations (each backend
// write site carries an `// audit:` breadcrumb for the future audit-log chunk).
import type { Metadata } from 'next';
import { getAdminTeamServer } from '@/lib/server-api/admin-team';
import TeamManagementClient from './TeamManagementClient';

export const metadata: Metadata = {
  title: 'Team · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default async function AdminTeamPage() {
  const admins = await getAdminTeamServer();

  if (!admins) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>Access denied</h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
          You need an admin account to view the team.
        </p>
      </div>
    );
  }

  return <TeamManagementClient initialAdmins={admins} />;
}
