'use client';
// FILE: src/components/employer/jobs/FeedbackArchiveDialog.tsx
// The post-feedback "Archive?" nudge: wraps the shared BulkArchiveDialog for a
// single applicant and owns the archive call, so InterviewSection stays lean.

import { useState } from 'react';
import { useToast } from '@/components/ui';
import { archiveApplicant } from '@/api/employer-applicants-api';
import type { ArchiveReason } from '@/types/employer-applicants';
import BulkArchiveDialog from './BulkArchiveDialog';

export default function FeedbackArchiveDialog({
  open, applicationId, candidateFirstName, reasons, onClose, onArchived,
}: {
  open: boolean;
  applicationId: string;
  candidateFirstName: string;
  reasons: ArchiveReason[];
  onClose: () => void;
  onArchived: () => void;
}) {
  const { showToast } = useToast();
  const [archiving, setArchiving] = useState(false);

  return (
    <BulkArchiveDialog
      open={open}
      selectedCount={1}
      reasons={reasons}
      isSubmitting={archiving}
      onCancel={onClose}
      onConfirm={({ reasonId, note, skipEmail }) => {
        setArchiving(true);
        archiveApplicant(applicationId, { reasonId, note: note || undefined, skipEmail })
          .then(() => {
            showToast('success', `${candidateFirstName} archived`);
            onClose();
            onArchived();
          })
          .catch(() => showToast('error', 'Could not archive. Try again.'))
          .finally(() => setArchiving(false));
      }}
    />
  );
}
