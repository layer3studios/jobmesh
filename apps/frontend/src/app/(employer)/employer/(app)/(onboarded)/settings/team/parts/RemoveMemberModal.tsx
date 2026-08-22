'use client';
// FILE: settings/team/parts/RemoveMemberModal.tsx
// Confirm removal of a teammate, or self-leave. Two variants, each with a typed
// confirmation guard: removing someone else requires typing their email; leaving
// requires typing LEAVE. Backend still enforces the Founder safeguards (D_impl_ui_8).
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { removeMember, EmployerTeamApiError } from '@/api/employer-team-api';
import type { TeamMember } from '@/types/employer-team';

interface Props {
  member: TeamMember;
  isSelf: boolean;
  onClose: () => void;
  onRemoved: (memberId: string, isSelf: boolean) => void;
  onError: (message: string) => void;
}

export default function RemoveMemberModal({ member, isSelf, onClose, onRemoved, onError }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const expected = isSelf ? 'LEAVE' : (member.email ?? '').toLowerCase();
  const isMatch = isSelf
    ? confirmText.trim() === 'LEAVE'
    : confirmText.trim().toLowerCase() === expected && expected.length > 0;

  const name = member.name ?? member.email ?? 'this member';

  async function handleSubmit() {
    if (!isMatch) return;
    setIsSaving(true);
    try {
      await removeMember(member.id);
      onRemoved(member.id, isSelf);
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
      title={isSelf ? 'Leave this company' : `Remove ${name}`}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={isSaving} disabled={!isMatch}>
            {isSelf ? 'Leave' : 'Remove'}
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, color: 'var(--ink-2)' }}>
          {isSelf
            ? 'Are you sure you want to leave? You’ll lose access to this company immediately.'
            : `Remove ${name} from your team? They’ll lose access immediately.`}
        </p>
        <Input
          label={isSelf ? 'Type LEAVE to confirm' : `Type ${member.email ?? 'the email'} to confirm`}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
        />
      </div>
    </Modal>
  );
}
