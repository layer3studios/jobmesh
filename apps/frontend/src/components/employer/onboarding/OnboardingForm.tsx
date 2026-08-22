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
        <h1 style={{ fontSize: TYPE.xl, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Welcome to JobMesh Hire
        </h1>
        <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.55 }}>
          Let&apos;s set up your company.
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
