'use client';
// FILE: src/components/employer/jobs/parts/PostingFillDialog.tsx
// Confirm for the "Position filled" quick action. Separate from
// PostingConfirmDialog because this one is not a status flip: it archives every
// remaining candidate as a side effect, and the count of people affected is the
// whole reason a confirm is owed. Built on the shared Modal, which already traps
// focus and handles Escape.

import { Button, Modal } from '@/components/ui';

export default function PostingFillDialog({
  isOpen, candidateCount, isMutating, onCancel, onConfirm,
}: {
  isOpen: boolean;
  /** Non-archived applicants who will be archived. Quoted in the body copy. */
  candidateCount: number;
  isMutating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;
  const candidateWord = candidateCount === 1 ? 'candidate' : 'candidates';

  return (
    <Modal
      isOpen
      onClose={() => { if (!isMutating) onCancel(); }}
      title="Mark this position as filled?"
      size="sm"
      closeOnOverlayClick={false}
      footer={(
        <>
          <Button variant="ghost" autoFocus disabled={isMutating} onClick={onCancel}>Cancel</Button>
          <Button variant="danger" loading={isMutating} onClick={onConfirm}>Position filled</Button>
        </>
      )}
    >
      This will close the posting and archive all {candidateCount} remaining {candidateWord} as
      &ldquo;Position filled&rdquo;. This can&rsquo;t be undone.
    </Modal>
  );
}
