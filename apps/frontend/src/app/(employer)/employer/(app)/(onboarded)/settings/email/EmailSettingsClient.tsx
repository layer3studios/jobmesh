'use client';
// FILE: settings/email/EmailSettingsClient.tsx
// Email settings. There is no per-company email config in the backend yet, so
// this reports the platform defaults every candidate email is sent from today
// rather than inventing settings that do not exist.

import { useEmployer } from '@/context/employer/EmployerContext';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import SettingsPageHeader from '../parts/SettingsPageHeader';
import EmailTemplatePreviews from './parts/EmailTemplatePreviews';
import RejectionTemplateEditor from './parts/RejectionTemplateEditor';
import { canEditCompanySettings } from '@/lib/team-permissions';
import { COPY } from '@/theme/brand';

const PLATFORM_SENDING_DOMAIN = 'jobmesh.in';
const PLATFORM_FROM_ADDRESS = 'hello@jobmesh.in';

const ROW = {
  display: 'flex', gap: 12, padding: '12px 16px',
  borderBottom: '0.5px solid var(--border)', flexWrap: 'wrap' as const,
};
const LABEL = { width: 160, flexShrink: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)' } as const;
const VALUE = { flex: 1, minWidth: 220, fontSize: 13, color: 'var(--ink-2)' } as const;

export default function EmailSettingsClient() {
  const { company, viewerRole } = useEmployer();
  // Editing the wording sent under the company's name is an Owner+ action; a
  // Member still sees the templates, read-only.
  const canEdit = viewerRole ? canEditCompanySettings(viewerRole) : false;
  // The reply-to a candidate sees is the company's own site when one is set.
  const website = company?.website ?? null;

  return (
    <div>
      <Breadcrumbs items={[{ label: COPY.employer.settings.title }, { label: COPY.employer.settings.email }]} />
      <SettingsPageHeader
        title="Email settings"
        subtitle="How candidate-facing emails are sent for your company."
      />
      <div style={{
        background: 'var(--surface-sunken)', border: '0.5px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', maxWidth: 640,
      }}>
        <div style={ROW}>
          <span style={LABEL}>Sending domain</span>
          <span style={VALUE}>{PLATFORM_SENDING_DOMAIN}</span>
        </div>
        <div style={ROW}>
          <span style={LABEL}>From address</span>
          <span style={VALUE}>{PLATFORM_FROM_ADDRESS}</span>
        </div>
        <div style={ROW}>
          <span style={LABEL}>Sender name</span>
          <span style={VALUE}>{company?.name ?? '—'}</span>
        </div>
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <span style={LABEL}>Company website</span>
          <span style={VALUE}>{website ?? 'Not set'}</span>
        </div>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
        Custom sender addresses are coming soon.
      </p>

      <EmailTemplatePreviews companyName={company?.name ?? 'your company'} />

      <RejectionTemplateEditor
        companyName={company?.name ?? 'your company'}
        canEdit={canEdit}
      />
    </div>
  );
}
