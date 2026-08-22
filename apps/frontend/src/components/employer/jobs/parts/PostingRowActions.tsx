'use client';
// FILE: src/components/employer/jobs/parts/PostingRowActions.tsx
// The ⋯ menu for one posting row, plus the confirm dialog its destructive items
// open. One component so the desktop table cell and the mobile card mount the
// same thing and cannot drift.

import { ActionsMenu, Button, Modal, Stack } from '@/components/ui';
import { usePostingRowActions } from '../usePostingRowActions';
import type { Posting } from '@/types/employer-jobs';

export default function PostingRowActions({
  posting, canEdit, canClose, canDelete, onFill, onChanged,
}: {
  posting: Posting;
  canEdit: boolean;
  canClose: boolean;
  canDelete: boolean;
  onFill: (posting: Posting) => void;
  onChanged: () => void;
}) {
  const { items, pending, isMutating, confirm, cancel } = usePostingRowActions({
    posting, canEdit, canClose, canDelete, onFill, onChanged,
  });

  // Every row renders a trigger, but a row with only "View applicants" is not
  // worth a menu — that action is already the row's own click target.
  if (items.length <= 1) return null;

  const isDelete = pending?.kind === 'delete';

  return (
    <>
      <ActionsMenu items={items} label={`Actions for ${posting.title}`} />
      <Modal
        isOpen={pending != null}
        onClose={() => { if (!isMutating) cancel(); }}
        title={isDelete ? 'Delete this posting?' : 'Stop accepting applications?'}
        size="sm"
        closeOnOverlayClick={false}
        footer={(
          <>
            <Button variant="ghost" autoFocus disabled={isMutating} onClick={cancel}>Cancel</Button>
            <Button
              variant="danger"
              loading={isMutating}
              onClick={() => void confirm()}
            >
              {isDelete ? 'Delete posting' : 'Close applications'}
            </Button>
          </>
        )}
      >
        <Stack gap={8}>
          {isDelete ? (
            <p style={{ margin: 0 }}>
              {pending?.posting.title} will be permanently removed. This can&rsquo;t be undone.
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              {/* Stated plainly because the neighbouring action, "Position filled",
                  DOES archive everyone — the two are one menu item apart. */}
              Stop accepting applications for {pending?.posting.title}? Existing
              applicants are not affected.
            </p>
          )}
        </Stack>
      </Modal>
    </>
  );
}
