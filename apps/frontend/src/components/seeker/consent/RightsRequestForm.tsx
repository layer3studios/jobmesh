'use client';
// FILE: src/components/seeker/consent/RightsRequestForm.tsx
// The "exercise your rights" form on the Account Privacy page. Submits a DPDP
// rights request (access/correction/erasure/grievance) and toasts the 90-day SLA.

import { useState } from 'react';
import { Card, Button, Select, Textarea, Stack, Alert, useToast } from '@/components/ui';
import { submitRightsRequest, DpdpApiError } from '@/api/dpdp-api';
import type { RightsRequestType } from '@/types/dpdp';

const TYPE_OPTIONS = [
  { value: 'access', label: 'Request access to my data' },
  { value: 'correction', label: 'Request a correction' },
  { value: 'erasure', label: 'Request erasure' },
  { value: 'grievance', label: 'File a grievance' },
];

export default function RightsRequestForm({ grievanceEmail }: { grievanceEmail: string }) {
  const { showToast } = useToast();
  const [requestType, setRequestType] = useState<RightsRequestType>('access');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitRightsRequest({ requestType, description });
      showToast('success', `Request submitted. We'll respond within 90 days at ${grievanceEmail}.`);
      setDescription('');
    } catch (err) {
      setError(err instanceof DpdpApiError ? err.message : 'Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="raised">
      <Stack gap={14}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Your rights</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
            Ask us to access, correct, or erase your data, or file a grievance.
          </p>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <Select
          label="Request type"
          options={TYPE_OPTIONS}
          value={requestType}
          onChange={(e) => setRequestType(e.target.value as RightsRequestType)}
        />
        <Textarea
          label="Details (optional)"
          value={description}
          maxLength={4000}
          placeholder="Tell us what you need…"
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <Button loading={submitting} onClick={handleSubmit}>Submit request</Button>
        </div>
      </Stack>
    </Card>
  );
}
