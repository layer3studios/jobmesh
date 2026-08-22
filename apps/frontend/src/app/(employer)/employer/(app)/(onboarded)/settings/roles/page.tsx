// FILE: settings/roles/page.tsx
// Roles & permissions — documentation, not configuration. Reuses the same role
// tiles the Team page shows so the two never drift.
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import RoleTiles from '../team/parts/RoleTiles';
import SettingsPageHeader from '../parts/SettingsPageHeader';
import PermissionMatrix from './parts/PermissionMatrix';
import { COPY } from '@/theme/brand';

export const metadata: Metadata = {
  title: 'Roles | JobMesh Employer',
  robots: { index: false },
};

const DETAIL_ROWS = [
  ['Founder', 'One per company. Full access including billing and the danger zone. Transferable to an Owner.'],
  ['Owner', 'Everything except billing and deleting the company. Can invite and remove teammates.'],
  ['Member', 'Day-to-day hiring: create and edit postings, move candidates, schedule interviews.'],
  ['Interviewer', 'Read-only on candidates plus notes. Moving and archiving are opt-in per person.'],
];

export default function RolesSettingsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: COPY.employer.settings.title }, { label: COPY.employer.settings.roles }]} />
      <SettingsPageHeader
        title={COPY.employer.settings.rolesTitle}
        subtitle={COPY.employer.settings.rolesSubtitle}
      />
      <RoleTiles />
      <div style={{
        background: 'var(--surface-sunken)', border: '0.5px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {DETAIL_ROWS.map(([role, description]) => (
          <div key={role} style={{
            display: 'flex', gap: 12, padding: '12px 16px',
            borderBottom: '0.5px solid var(--border)', flexWrap: 'wrap',
          }}>
            <span style={{ width: 96, flexShrink: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{role}</span>
            <span style={{ flex: 1, minWidth: 220, fontSize: 13, color: 'var(--ink-2)' }}>{description}</span>
          </div>
        ))}
      </div>
      <PermissionMatrix />
    </div>
  );
}
