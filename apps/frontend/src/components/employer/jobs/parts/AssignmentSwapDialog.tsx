'use client';
// FILE: src/components/employer/jobs/parts/AssignmentSwapDialog.tsx
// The swap / detach confirm. Built on the shared Modal (which already traps focus
// and handles Escape — we do not reimplement, C11), and shaped exactly like
// PostingConfirmDialog: focus on Cancel, overlay click disabled, the confirm button
// labelled with the action.
//
// DELIBERATELY NOT TYPE-TO-CONFIRM. Swapping an assignment is reversible — you can
// swap back — and existing submissions are snapshot-protected, so the worst case is
// that new applicants see a different task. Heavy friction here would be friction
// spent on a cheap, undoable action, and the cost is paid somewhere else: people who
// are made to type a confirmation phrase for routine changes learn to treat every
// dialog as an obstacle, and click through the ones that really are destructive.
// Save that pattern for deletions.
//
// The copy comes from assignment-section-helpers so the wording is testable and
// cannot drift between the swap and detach paths.

import { useEffect } from 'react';
import { Button, Modal } from '@/components/ui';
import type { ConfirmCopy } from './assignment-section-helpers';

const CANCEL_ATTRIBUTE = 'data-assignment-confirm-cancel';

export default function AssignmentSwapDialog({
  copy, isMutating, onCancel, onConfirm,
}: {
  /** null closes the dialog. */
  copy: ConfirmCopy | null;
  isMutating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isOpen = copy !== null;

  /**
   * `autoFocus` alone does NOT put focus on Cancel here, and it is worth knowing
   * why. Modal's useFocusTrap runs `focusables()[0].focus()` in its own effect on
   * open, and the first focusable inside the dialog is the header's close (X)
   * button — so the trap overrides autoFocus a tick later. This effect belongs to
   * the PARENT of Modal, and parent effects run after child effects, so it lands
   * last and wins.
   *
   * The same latent bug affects PostingConfirmDialog, whose header comment also
   * claims focus lands on Cancel. Fixing it there is a change to an existing
   * surface and is left out of this chunk deliberately; fixing the shared Modal
   * would change focus behaviour for every dialog in the app at once.
   */
  useEffect(() => {
    if (!isOpen) return;
    document.querySelector<HTMLButtonElement>(`[${CANCEL_ATTRIBUTE}]`)?.focus();
  }, [isOpen]);

  if (copy === null) return null;

  return (
    <Modal
      isOpen
      // Modal calls this on Escape as well as the close button, so Escape cancels
      // without ever reaching onConfirm.
      onClose={() => { if (!isMutating) onCancel(); }}
      title={copy.title}
      size="sm"
      closeOnOverlayClick={false}
      footer={(
        <>
          {/* Cancel takes focus: the least-destructive option is the one a stray
              Enter should land on. The data attribute is how the effect above finds
              it — Button is not a forwardRef component. */}
          <Button
            variant="ghost" autoFocus disabled={isMutating} onClick={onCancel}
            {...{ [CANCEL_ATTRIBUTE]: 'true' }}
          >
            Cancel
          </Button>
          <Button variant="primary" loading={isMutating} onClick={onConfirm}>
            {copy.confirmLabel}
          </Button>
        </>
      )}
    >
      {copy.body}
    </Modal>
  );
}
