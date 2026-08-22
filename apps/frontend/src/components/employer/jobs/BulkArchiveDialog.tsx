'use client';
// FILE: src/components/employer/jobs/BulkArchiveDialog.tsx
// Confirmation dialog for bulk archive (PP3/D4, R3). Reason picker (required) + optional
// note, then confirms to the parent. Built on the shared <Modal> (portal, focus trap,
// Escape). Default focus lands on Cancel to prevent an accidental confirm; Escape/overlay
// are inert while submitting. Local reason/note reset on each fresh open.

import { useEffect, useState } from 'react';
import { Modal, Button, Select, Textarea, Stack } from '@/components/ui';
import type { ArchiveReason } from '@/types/employer-applicants';

const NOTE_MAX_LENGTH = 500;
const CANCEL_ATTR = 'data-bulk-cancel';

export default function BulkArchiveDialog({
  open, selectedCount, reasons, isSubmitting, onCancel, onConfirm,
}: {
  open: boolean;
  selectedCount: number;
  reasons: ArchiveReason[];
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (input: { reasonId: string; note: string; skipEmail: boolean }) => void;
}) {
  const [reasonId, setReasonId] = useState('');
  const [note, setNote] = useState('');
  // Rejection email defaults ON — opting out is the edge case (tests, duplicates).
  const [sendEmail, setSendEmail] = useState(true);

  // Fresh dialog on each open: clear inputs and land focus on Cancel (R3). Button is not
  // a forwardRef, so focus the rendered element by its data attribute (Button spreads it
  // through). This effect runs after the Modal's focus trap, so it wins the initial focus.
  useEffect(() => {
    if (!open) return;
    setReasonId('');
    setNote('');
    setSendEmail(true);
    document.querySelector<HTMLButtonElement>(`[${CANCEL_ATTR}]`)?.focus();
  }, [open]);

  // Escape/overlay/X route here; ignore while a request is in flight (D4).
  const handleClose = () => { if (!isSubmitting) onCancel(); };
  const plural = selectedCount === 1 ? '' : 's';
  const reasonOptions = reasons.map((reason) => ({ value: reason.id, label: reason.text }));

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onCancel} disabled={isSubmitting} {...{ [CANCEL_ATTR]: '' }}>Cancel</Button>
      <Button
        variant="danger"
        size="sm"
        loading={isSubmitting}
        disabled={!reasonId || isSubmitting}
        onClick={() => onConfirm({ reasonId, note, skipEmail: !sendEmail })}
      >
        Archive {selectedCount}
      </Button>
    </>
  );

  return (
    <Modal isOpen={open} onClose={handleClose} title={`Archive ${selectedCount} applicant${plural}?`} size="sm" footer={footer}>
      <Stack gap={14}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
          Archived applicants stay on the record but move out of your active pipeline. This can be undone one at a time.
        </p>
        <Select
          label="Reason"
          required
          placeholder="Choose a reason"
          options={reasonOptions}
          value={reasonId}
          onChange={(event) => setReasonId(event.target.value)}
        />
        <Textarea
          label="Note (optional)"
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--ink)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
            />
            Send rejection email to candidate{selectedCount === 1 ? '' : 's'}
          </label>
          <p style={{ margin: '4px 0 0 24px', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
            {sendEmail
              ? 'A stage-appropriate rejection email will be sent.'
              : 'No email will be sent.'}
          </p>
        </div>
      </Stack>
    </Modal>
  );
}
