'use client';
// FILE: src/components/seeker/consent/ConsentManager.tsx
// Account Privacy page (/account/privacy, seeker-only). Lists active consents
// with one-click withdrawal (as easy as granting, R3), a collapsed history of
// withdrawn consents, a rights-request form, and the grievance officer contact.

import { useCallback, useEffect, useState } from 'react';
import { Container, Card, Button, Badge, Alert, PageHeader, Stack, Spinner, Modal, useToast } from '@/components/ui';
import { listConsents, withdrawConsent, DpdpApiError } from '@/api/dpdp-api';
import { PURPOSE_LABELS, GRIEVANCE_EMAIL } from '@/components/shared/consent-copy';
import RightsRequestForm from './RightsRequestForm';
import type { Consent } from '@/types/dpdp';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function ConsentRow({ consent, onWithdraw }: { consent: Consent; onWithdraw?: (c: Consent) => void }) {
  return (
    <Card padding="sm">
      <Stack gap={8} dir="row" align="center" justify="space-between" wrap>
        <div>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>
            {PURPOSE_LABELS[consent.purpose]}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 2 }}>
            {consent.withdrawnAt ? `Withdrawn on ${formatDate(consent.withdrawnAt)}` : `Granted ${formatDate(consent.grantedAt)}`}
            {' · '}{consent.dataItems.join(', ')}
          </p>
        </div>
        <Stack gap={6} dir="row" align="center">
          {consent.crossBorderTransfer && <Badge variant="warning">Cross-border</Badge>}
          {onWithdraw && <Button variant="ghost" size="sm" onClick={() => onWithdraw(consent)}>Withdraw</Button>}
        </Stack>
      </Stack>
    </Card>
  );
}

export default function ConsentManager() {
  const { showToast } = useToast();
  const [consents, setConsents] = useState<Consent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [pending, setPending] = useState<Consent | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setConsents(await listConsents({ includeWithdrawn: true }));
    } catch (err) {
      setError(err instanceof DpdpApiError ? err.message : 'Could not load your consents.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const confirmWithdraw = async () => {
    if (!pending) return;
    setWithdrawing(true);
    try {
      await withdrawConsent(pending.id);
      showToast('success', 'Consent withdrawn');
      setPending(null);
      await load();
    } catch (err) {
      showToast('error', err instanceof DpdpApiError ? err.message : 'Could not withdraw consent. Try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const active = (consents ?? []).filter((c) => c.withdrawnAt === null);
  const withdrawn = (consents ?? []).filter((c) => c.withdrawnAt !== null);

  return (
    // data-ph-mask: seeker's consent records + rights-request contact — masked in replay.
    <div data-ph-mask style={{ display: 'contents' }}>
    <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <PageHeader label="ACCOUNT" title="Privacy & consent" />

      {error && <Alert type="error">{error}</Alert>}
      {consents === null && !error && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={22} /></div>
      )}

      {consents !== null && (
        <Stack gap={20}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>Active consents</h3>
            {active.length === 0 ? (
              <Card><p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>You have no active consents yet.</p></Card>
            ) : (
              <Stack gap={8}>
                {active.map((c) => <ConsentRow key={c.id} consent={c} onWithdraw={setPending} />)}
              </Stack>
            )}
          </div>

          {withdrawn.length > 0 && (
            <div>
              <Button variant="link" onClick={() => setShowWithdrawn((v) => !v)}>
                {showWithdrawn ? 'Hide' : 'Show'} withdrawn consents ({withdrawn.length})
              </Button>
              {showWithdrawn && (
                <div style={{ marginTop: 10 }}>
                  <Stack gap={8}>
                    {withdrawn.map((c) => <ConsentRow key={c.id} consent={c} />)}
                  </Stack>
                </div>
              )}
            </div>
          )}

          <RightsRequestForm grievanceEmail={GRIEVANCE_EMAIL} />

          <Card>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Grievance officer</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              Email: {GRIEVANCE_EMAIL}<br />Response within 90 days per the DPDP Act.
            </p>
          </Card>
        </Stack>
      )}

      <Modal
        isOpen={pending !== null}
        onClose={() => { if (!withdrawing) setPending(null); }}
        title="Withdraw this consent?"
        size="sm"
        closeOnOverlayClick={false}
        footer={(
          <>
            <Button variant="ghost" autoFocus disabled={withdrawing} onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="danger" loading={withdrawing} onClick={confirmWithdraw}>Withdraw</Button>
          </>
        )}
      >
        Are you sure? This may affect your ability to use features like resume matching.
      </Modal>
    </Container>
    </div>
  );
}
