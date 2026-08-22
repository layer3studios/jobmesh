'use client';
// FILE: src/components/shared/ConsentGate.tsx
// Reusable consent gate. Wraps data-collection content and reveals it only once
// the logged-in seeker has active consent for `purpose`. Audience-neutral: it
// never imports a seeker/employer context — a 401 from listConsents means the
// caller is anonymous, and the gate falls through to children (Step 5 collects
// consent inline on the public apply page). Checkbox starts UNCHECKED (R2/C10).

import { useEffect, useRef, useState } from 'react';
import { Card, Button, Checkbox, Alert, Spinner, Stack } from '@/components/ui';
import { listConsents, grantConsent, fetchNoticeVersion, DpdpApiError } from '@/api/dpdp-api';
import { NOTICE_VERSION, PURPOSE_LABELS } from './consent-copy';
import type { ConsentPurpose } from '@/types/dpdp';

interface ConsentGateProps {
  purpose: ConsentPurpose;
  dataItems: string[];
  crossBorderTransfer?: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
}

type GateState = 'loading' | 'gated' | 'granted';

export default function ConsentGate({
  purpose, dataItems, crossBorderTransfer = false, title, description, children,
}: ConsentGateProps) {
  const [state, setState] = useState<GateState>('loading');
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const versionRef = useRef(NOTICE_VERSION);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await fetchNoticeVersion().catch(() => null);
        if (info && !cancelled) versionRef.current = info.version;
        const consents = await listConsents();
        if (cancelled) return;
        const active = consents.some((c) => c.purpose === purpose && c.withdrawnAt === null);
        setState(active ? 'granted' : 'gated');
      } catch (err) {
        if (cancelled) return;
        // Anonymous caller — the gate is passive; Step 5 handles inline consent.
        if (err instanceof DpdpApiError && err.status === 401) setState('granted');
        else setState('gated');
      }
    })();
    return () => { cancelled = true; };
  }, [purpose]);

  const handleGrant = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await grantConsent({
        purpose, dataItems, noticeVersion: versionRef.current, method: 'checkbox', crossBorderTransfer,
      });
      setState('granted');
    } catch (err) {
      setError(err instanceof DpdpApiError ? err.message : 'Could not save your consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'loading') {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={20} /></div>;
  }
  if (state === 'granted') return <>{children}</>;

  return (
    // data-ph-mask: consent form carries the notice + user's data-processing choice.
    <div data-ph-mask style={{ display: 'contents' }}>
    <Card variant="raised">
      <Stack gap={14}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{title}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>{description}</p>
        </div>

        <a href="/legal/privacy" target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--link)' }}>
          Read our Privacy Notice
        </a>

        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Data used:</p>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {dataItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        {crossBorderTransfer && (
          <Alert type="warning">
            Your resume text may be processed by Google AI services hosted outside India. We do not store the file after parsing.
          </Alert>
        )}

        {error && <Alert type="error">{error}</Alert>}

        <Checkbox
          checked={checked}
          onChange={setChecked}
          label={`I have read the Privacy Notice (${versionRef.current}) and consent to ${PURPOSE_LABELS[purpose]} for the data listed above.`}
        />

        <div>
          <Button disabled={!checked} loading={submitting} onClick={handleGrant}>I agree</Button>
        </div>
      </Stack>
    </Card>
    </div>
  );
}
