'use client';
// FILE: settings/team/parts/ConfirmDialog.tsx
// Minimal confirm dialog over the Modal primitive. Used for invite revoke, which is
// a soft delete needing an explicit confirmation (Chunk 4, PendingInvites §Revoke).
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: Props) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    setIsSaving(true);
    try {
      await onConfirm();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm} loading={isSaving}>{confirmLabel}</Button>
        </>
      )}
    >
      <p style={{ margin: 0, color: 'var(--ink-2)' }}>{message}</p>
    </Modal>
  );
}
