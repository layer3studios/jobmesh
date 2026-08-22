'use client';
// FILE: src/components/seeker/legal/RequestMyDataForm.tsx
// "Request my data" — the DPDP right of access for a candidate with no account.
//
// TWO FIELDS AND A DELIBERATELY UNINFORMATIVE SUCCESS MESSAGE. The server answers
// identically whether or not it holds anything for that email, so this form does
// too: the same sentence, in the same place, every time. Telling the person "we
// found you" would turn a privacy control into a way to check who has applied where.
//
// The form never clears on success. Someone who mistypes their address should be
// able to see what they typed and fix it, and since the response cannot tell them
// they got it wrong, keeping the value on screen is the only correction they get.

import { useState } from 'react';
import { Card, Stack, Input, Button, Alert } from '@/components/ui';
import { requestMyDataExport, DpdpApiError } from '@/api/dpdp-api';
import { COPY } from '@/theme/brand';

const C = COPY.employer.dpdp;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HEADING_STYLE = { margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' };
const BODY_STYLE = { margin: 0, fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--ink-muted)' };

export default function RequestMyDataForm({ companySlug }: { companySlug: string }) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFieldError('Enter a valid email address.');
      return;
    }
    setFieldError(undefined);
    setFailure(null);
    setIsSending(true);
    try {
      const result = await requestMyDataExport({ email: trimmed, companySlug });
      setSentMessage(result.message || C.requestMyDataSent);
    } catch (error) {
      setFailure(error instanceof DpdpApiError ? error.message : C.requestMyDataFailed);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Stack gap={12}>
          <h2 style={HEADING_STYLE}>{C.requestMyData}</h2>
          <p style={BODY_STYLE}>{C.requestMyDataBody}</p>
          <Input
            label={C.emailLabel}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            error={fieldError}
            disabled={isSending}
            onChange={(event) => setEmail(event.target.value)}
          />
          {sentMessage && <Alert type="success">{sentMessage}</Alert>}
          {failure && <Alert type="error">{failure}</Alert>}
          <div>
            <Button type="submit" size="sm" loading={isSending}>{C.requestMyDataAction}</Button>
          </div>
        </Stack>
      </form>
    </Card>
  );
}
