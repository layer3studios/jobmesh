'use client';
// FILE: settings/branding/parts/CultureEditor.tsx
// The "Culture" block on the Branding settings page. Owns the whole section as one
// piece of local state and saves it with a single PATCH.
//
// ONE SAVE, WHOLE SECTION. The backend treats the payload as complete — an omitted
// benefit means the employer deleted it. Saving field-by-field would make "I
// removed a perk" indistinguishable from "I didn't touch the perks", so the editor
// deliberately holds a draft and commits it in one write.

import { useState } from 'react';
import { Alert, Button, Card, Input, Stack, Textarea, useToast } from '@/components/ui';
import { COPY } from '@/theme/brand';
import { updateEmployerCompany } from '@/api/employer-api';
import { useEmployer } from '@/context/employer/EmployerContext';
import {
  MAXIMUM_CULTURE_HEADLINE_LENGTH, MAXIMUM_CULTURE_DESCRIPTION_LENGTH,
  type CultureSection,
} from '@/context/employer/employer-context-types';
import CultureBenefitRows from './CultureBenefitRows';
import CulturePhotoGrid from './CulturePhotoGrid';

const TEXT = COPY.employer.culture;

const EMPTY_SECTION: CultureSection = {
  headline: null, description: null, benefits: [], photoUrls: [],
};

/**
 * Drop benefits the employer added but never titled, and collapse a section with
 * nothing left in it to null. Sending an untitled benefit would just earn a 400,
 * and an empty row is far more likely to be an abandoned "Add benefit" click than
 * something they meant to save.
 */
function toPayload(draft: CultureSection): CultureSection | null {
  const benefits = draft.benefits
    .map((benefit) => ({ ...benefit, title: benefit.title.trim() }))
    .filter((benefit) => benefit.title !== '');
  const section: CultureSection = {
    headline: draft.headline?.trim() || null,
    description: draft.description?.trim() || null,
    benefits,
    photoUrls: draft.photoUrls,
  };
  const isEmpty = !section.headline && !section.description
    && section.benefits.length === 0 && section.photoUrls.length === 0;
  return isEmpty ? null : section;
}

export default function CultureEditor({ canEdit }: { canEdit: boolean }) {
  const { company, refreshEmployerSession } = useEmployer();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<CultureSection>(company?.cultureSection ?? EMPTY_SECTION);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CultureSection>(key: K, value: CultureSection[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateEmployerCompany({ cultureSection: toPayload(draft) });
      // Re-read the session so the careers-page preview and every other surface
      // reflect the save at once, not just this form.
      await refreshEmployerSession();
      showToast('success', TEXT.saved);
    } catch {
      setError(TEXT.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  const isBusy = isSaving || !canEdit;

  return (
    <Card>
      <Stack gap={16}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            {TEXT.sectionTitle}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-muted)' }}>
            {TEXT.sectionBody}
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <Input
          label={TEXT.headlineLabel}
          value={draft.headline ?? ''}
          placeholder={TEXT.headlinePlaceholder}
          maxLength={MAXIMUM_CULTURE_HEADLINE_LENGTH}
          disabled={isBusy}
          onChange={(e) => set('headline', e.target.value || null)}
        />

        <Textarea
          label={TEXT.descriptionLabel}
          rows={5}
          value={draft.description ?? ''}
          placeholder={TEXT.descriptionPlaceholder}
          maxLength={MAXIMUM_CULTURE_DESCRIPTION_LENGTH}
          disabled={isBusy}
          onChange={(e) => set('description', e.target.value || null)}
        />

        <CultureBenefitRows
          benefits={draft.benefits}
          disabled={isBusy}
          onChange={(benefits) => set('benefits', benefits)}
        />

        <CulturePhotoGrid
          photoUrls={draft.photoUrls}
          disabled={isBusy}
          onChange={(photoUrls) => set('photoUrls', photoUrls)}
          onError={setError}
        />

        <div>
          <Button type="button" onClick={() => void handleSave()} disabled={isBusy}>
            {isSaving ? TEXT.saving : TEXT.save}
          </Button>
        </div>
      </Stack>
    </Card>
  );
}
