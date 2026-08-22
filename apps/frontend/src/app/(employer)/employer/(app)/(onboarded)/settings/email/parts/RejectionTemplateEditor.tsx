'use client';
// FILE: settings/email/parts/RejectionTemplateEditor.tsx
// Loads the company's custom rejection bodies, renders one card per stage, and
// owns the single PATCH path all three share.
//
// The templates are NOT on the company object — toPublicCompany models the
// careers-facing shape, and what a company writes when rejecting someone is
// internal — so they come from their own Owner-gated endpoint.

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui';
import { fetchRejectionTemplates, updateEmployerCompany, EmployerApiError } from '@/api/employer-api';
import type { RejectionEmailTemplates } from '@/api/employer-api';
import RejectionTemplateCard from './RejectionTemplateCard';
import { REJECTION_STAGES } from '../rejection-template-defaults';
import type { RejectionStageKey } from '../rejection-template-defaults';

type Drafts = Record<RejectionStageKey, string>;
const EMPTY_DRAFTS: Drafts = { application: '', positionFilled: '', postInterview: '' };

/** '' means "use the default" and is sent as null so the backend stores nothing. */
function toPatchValue(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

export default function RejectionTemplateEditor({
  companyName, canEdit,
}: { companyName: string; canEdit: boolean }) {
  const { showToast } = useToast();
  const [saved, setSaved] = useState<Drafts>(EMPTY_DRAFTS);
  const [drafts, setDrafts] = useState<Drafts>(EMPTY_DRAFTS);
  const [savingKey, setSavingKey] = useState<RejectionStageKey | null>(null);

  useEffect(() => {
    // Only an Owner+ may read this endpoint, so a Member never fires the request.
    if (!canEdit) return;
    let active = true;
    fetchRejectionTemplates()
      .then((templates: RejectionEmailTemplates) => {
        if (!active) return;
        const next: Drafts = {
          application: templates.application ?? '',
          positionFilled: templates.positionFilled ?? '',
          postInterview: templates.postInterview ?? '',
        };
        setSaved(next);
        setDrafts(next);
      })
      // A read failure leaves every card on its default placeholder, which is the
      // correct depiction of a company that has customised nothing.
      .catch(() => { /* cards stay on defaults */ });
    return () => { active = false; };
  }, [canEdit]);

  const persist = async (key: RejectionStageKey, text: string) => {
    setSavingKey(key);
    try {
      // Only the edited stage is sent. A PATCH carrying all three would let a
      // stale draft in one card overwrite another card's saved text.
      await updateEmployerCompany({
        rejectionEmailTemplates: { [key]: toPatchValue(text) } as RejectionEmailTemplates,
      });
      setSaved((previous) => ({ ...previous, [key]: text }));
      setDrafts((previous) => ({ ...previous, [key]: text }));
      showToast('success', text.trim() === '' ? 'Reset to the default template.' : 'Template saved.');
    } catch (error) {
      showToast('error', error instanceof EmployerApiError ? error.message : 'Could not save the template.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ marginTop: 24, maxWidth: 640 }}>
      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
        Rejection emails
      </p>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--ink-muted)' }}>
        {canEdit
          ? 'Override the wording candidates receive. Leave a template empty to use the default.'
          : 'The wording candidates receive. Only a Founder or Owner can change these.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {REJECTION_STAGES.map((stage) => (
          <RejectionTemplateCard
            key={stage.key}
            stage={stage}
            value={drafts[stage.key]}
            companyName={companyName}
            canEdit={canEdit}
            isSaving={savingKey === stage.key}
            isDirty={drafts[stage.key] !== saved[stage.key]}
            onChange={(next) => setDrafts((previous) => ({ ...previous, [stage.key]: next }))}
            onSave={() => void persist(stage.key, drafts[stage.key])}
            onReset={() => void persist(stage.key, '')}
          />
        ))}
      </div>
    </div>
  );
}
