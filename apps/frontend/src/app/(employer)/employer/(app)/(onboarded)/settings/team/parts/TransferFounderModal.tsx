'use client';
// FILE: settings/team/parts/TransferFounderModal.tsx
// Founder-only. Hands Founder to an existing Owner. Confirmed by typing the target's
// email. On success the whole page refreshes (D_impl_ui_6) so every layout re-derives
// role — optimistic mutation here is too risky since role affects multiple regions.
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { transferFounder, EmployerTeamApiError } from '@/api/employer-team-api';
import type { TeamMember } from '@/types/employer-team';

interface Props {
  owners: TeamMember[];
  initialTargetId?: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function TransferFounderModal({ owners, initialTargetId, onClose, onSuccess, onError }: Props) {
  const [targetId, setTargetId] = useState(initialTargetId ?? owners[0]?.id ?? '');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const target = owners.find((o) => o.id === targetId) ?? null;
  const expectedEmail = (target?.email ?? '').toLowerCase();
  const isMatch = expectedEmail.length > 0 && confirmEmail.trim().toLowerCase() === expectedEmail;

  async function handleSubmit() {
    if (!isMatch || !target) return;
    setIsSaving(true);
    try {
      await transferFounder(target.id);
      onSuccess();
    } catch (error) {
      const message = error instanceof EmployerTeamApiError ? error.message : 'Something went wrong. Please try again.';
      onError(message);
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Transfer Founder"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={isSaving} disabled={!isMatch || owners.length === 0}>
            Transfer Founder
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, color: 'var(--ink-2)' }}>
          You will become an Owner. The person you select will become the new Founder. They will gain the
          ability to delete the company. This action cannot be undone by them alone.
        </p>
        {owners.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>There are no Owners to transfer to.</p>
        ) : (
          <>
            <Select
              label="New Founder (Owners only)"
              value={targetId}
              onChange={(e) => { setTargetId(e.target.value); setConfirmEmail(''); }}
              options={owners.map((o) => ({ value: o.id, label: `${o.name ?? o.email ?? 'Owner'} · ${o.email ?? ''}` }))}
            />
            <Input
              label={`Type ${target?.email ?? 'the email'} to confirm`}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
            />
          </>
        )}
      </div>
    </Modal>
  );
}
