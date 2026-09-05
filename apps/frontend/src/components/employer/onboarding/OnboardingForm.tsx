'use client';
// FILE: src/components/employer/onboarding/OnboardingForm.tsx
// Presentational half of the onboarding page. All state lives in Onboarding.tsx;
// this renders the heading, the three fields, the live apply-URL preview (R2),
// the top-level alert and the submit button. No data fetching here.

import { Input, Button, Alert, Stack } from '@/components/ui';
import { TYPE } from '@/theme/tokens';

export interface OnboardingFormProps {
  name: string;
  website: string;
  retentionDays: string;
  slugPreview: string;
  nameError?: string;
  websiteError?: string;
  retentionError?: string;
  topError: string | null;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onRetentionChange: (value: string) => void;
  onSubmit: () => void;
}

export default function OnboardingForm({
  name, website, retentionDays, slugPreview,
  nameError, websiteError, retentionError, topError, isSubmitting,
  onNameChange, onWebsiteChange, onRetentionChange, onSubmit,
}: OnboardingFormProps) {
  return (
    <Stack gap={16}>
      <div>
        <p style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>Step 1 of 1 · Company</p>
        <h1 className="font-display" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
          Set up your company.
        </h1>
        <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', marginTop: 10, lineHeight: 1.55 }}>
          Applicants see this name on every posting and on your careers page.
        </p>
      </div>

      {topError && <Alert type="error">{topError}</Alert>}

      <Input
        label="Company name"
        required
        value={name}
        maxLength={120}
        error={nameError}
        hint="The name as you'd like applicants to see it."
        onChange={(event) => onNameChange(event.target.value)}
      />

      <div style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)' }}>
        Your public apply URL will be:
        <div style={{ marginTop: 4 }}>
          <code style={{ fontSize: TYPE.sm, color: 'var(--ink)' }}>/apply/{slugPreview}</code>
        </div>
      </div>

      <Input
        label="Website (optional)"
        type="text"
        placeholder="https://acme.in"
        value={website}
        maxLength={2048}
        error={websiteError}
        onChange={(event) => onWebsiteChange(event.target.value)}
      />

      <Input
        label="Resume retention (days)"
        type="number"
        value={retentionDays}
        min={30}
        max={3650}
        error={retentionError}
        hint="How long applicant data is kept after archiving. Default 365 days. You can change this later in Settings."
        onChange={(event) => onRetentionChange(event.target.value)}
      />

      <Button onClick={onSubmit} loading={isSubmitting} disabled={!name.trim()}>
        Create company
      </Button>
    </Stack>
  );
}
