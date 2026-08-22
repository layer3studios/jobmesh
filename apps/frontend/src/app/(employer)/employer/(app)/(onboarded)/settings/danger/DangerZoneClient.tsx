'use client';
// FILE: settings/danger/DangerZoneClient.tsx
// Danger zone. There is NO delete-company endpoint on the backend (only POST /
// GET / PATCH /api/employer/company), so this routes the founder to support
// rather than showing a destructive button that cannot do anything. When
// DELETE lands, swap the support block for a typed-name confirmation dialog.

import { useEmployer } from '@/context/employer/EmployerContext';
import { Button } from '@/components/ui';
import { canEditCompanySettings } from '@/lib/team-permissions';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import SettingsPageHeader from '../parts/SettingsPageHeader';

const SUPPORT_EMAIL = 'hello@jobmesh.in';

export default function DangerZoneClient() {
  const { company, viewerRole } = useEmployer();
  const isFounder = viewerRole === 'founder';
  const canManage = viewerRole ? canEditCompanySettings(viewerRole) : false;

  const supportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Delete company: ${company?.name ?? ''} (${company?.slug ?? ''})`,
  )}`;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Settings' }, { label: 'Danger zone' }]} />
      <SettingsPageHeader
        title="Danger zone"
        subtitle="Irreversible actions for this company."
      />

      <div
        data-testid="danger-delete-card"
        style={{
          border: '1px solid var(--danger)', borderRadius: 12, overflow: 'hidden', maxWidth: 640,
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--danger)', background: 'var(--danger-soft)' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--danger)' }}>Delete company</h2>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
            Deleting {company?.name ?? 'your company'} permanently removes every posting,
            applicant, interview and team member. This cannot be undone.
          </p>
          {canManage ? (
            <>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
                Self-serve deletion isn&apos;t available yet. Contact support to delete your company —
                we&apos;ll confirm your identity{isFounder ? '' : ' with the Founder'} before anything is removed.
              </p>
              <div>
                <Button variant="danger" as="a" href={supportHref}>Contact support to delete</Button>
              </div>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-faint)' }}>
              Only a Founder or Owner can request company deletion.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
