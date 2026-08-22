'use client';
// FILE: src/components/employer/jobs/parts/DoNotContactDialog.tsx
// Confirmation for setting or clearing the do-not-contact flag.
//
// The reason field is OPTIONAL but asked for every time, because the reason is what
// the next recruiter reads six months from now when they are deciding whether the
// flag still applies. Making it required would just produce "n/a".
//
// Clearing skips the reason field entirely: there is nothing to record, and the
// stored reason is wiped by the same write.

import { useState } from 'react';
import { Modal, Button, Stack, Textarea } from '@/components/ui';
import { COPY } from '@/theme/brand';

const C = COPY.employer.applicants;
const MAXIMUM_REASON_LENGTH = 200;

const BODY_STYLE = { margin: 0, fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--ink-2)' };

export default function DoNotContactDialog({
  isOpen, isCurrentlyFlagged, candidateName, isBusy, onCancel, onConfirm,
}: {
  isOpen: boolean;
  /** Drives whether this dialog is setting the flag or removing it. */
  isCurrentlyFlagged: boolean;
  candidateName: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string | null) => void;
}) {
  const [reason, setReason] = useState('');
  const isClearing = isCurrentlyFlagged;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isBusy ? () => {} : onCancel}
      title={isClearing
        ? C.doNotContactClearTitle
        : C.doNotContactDialogTitle.replace('{name}', candidateName)}
      size="sm"
      footer={
        <Stack gap={8} dir="row" justify="flex-end">
          <Button variant="secondary" size="sm" disabled={isBusy} onClick={onCancel}>
            {COPY.employer.common.cancel}
          </Button>
          <Button
            variant={isClearing ? 'primary' : 'danger'}
            size="sm"
            loading={isBusy}
            onClick={() => onConfirm(isClearing ? null : (reason.trim() || null))}
          >
            {isClearing ? C.doNotContactClear : C.doNotContactSet}
          </Button>
        </Stack>
      }
    >
      <Stack gap={12}>
        <p style={BODY_STYLE}>
          {isClearing ? C.doNotContactClearBody : C.doNotContactDialogBody}
        </p>
        {!isClearing && (
          <Textarea
            label={C.doNotContactReasonLabel}
            placeholder={C.doNotContactReasonPlaceholder}
            rows={3}
            value={reason}
            maxLength={MAXIMUM_REASON_LENGTH}
            disabled={isBusy}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
      </Stack>
    </Modal>
  );
}
