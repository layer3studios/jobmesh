'use client';
// FILE: src/components/employer/jobs/RankedBulkActions.tsx
// The bulk-archive surface (floating bar + confirm dialog), extracted from
// RankedTab for the line cap. Owns the dialog + submit state; the parent owns
// the selection and reloads after a successful archive.

import { useState } from 'react';
import { useToast } from '@/components/ui';
import { bulkArchiveApplicants } from '@/api/employer-applicants-api';
import type { ArchiveReason, Stage } from '@/types/employer-applicants';
import { summarizeBulkResult, resolveBulkErrorMessage } from './ranked-bulk-helpers';
import BulkArchiveBar from './BulkArchiveBar';
import BulkArchiveDialog from './BulkArchiveDialog';
import BulkMoveMenu from './BulkMoveMenu';
import { trackEvent } from '@/lib/analytics-events';

export default function RankedBulkActions({
  postingId, companyId, reasons, stages = [], selectedIds, onSelectionChange, onArchived,
}: {
  postingId: string;
  companyId: string | undefined;
  reasons: ArchiveReason[];
  /** Pipeline stages for the "Move to" menu. Optional for old callers. */
  stages?: Stage[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onArchived: () => void;
}) {
  const { showToast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirmArchive({ reasonId, note, skipEmail }: { reasonId: string; note: string; skipEmail: boolean }) {
    try {
      setIsSubmitting(true);
      const result = await bulkArchiveApplicants({ applicationIds: [...selectedIds], reasonId, note, skipEmail });
      result.succeeded.forEach(({ id }) => {
        trackEvent('applicant_archived', {
          applicationId: id, postingId, companyId, archiveReason: reasonId, isBulk: true,
        });
        trackEvent('applicants_archived', {
          companyId: companyId ?? '', applicantId: id, jobId: postingId, ...(reasonId ? { reasonId } : {}),
        });
      });
      const { variant, message, nextSelection } = summarizeBulkResult(result, selectedIds);
      showToast(variant, message);
      onSelectionChange(nextSelection);
      setIsDialogOpen(false);
      onArchived();
    } catch (error) {
      showToast('error', resolveBulkErrorMessage(error)); // selection + dialog intact for retry
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <BulkArchiveBar
        selectedCount={selectedIds.size}
        onClear={() => onSelectionChange(new Set())}
        onArchive={() => setIsDialogOpen(true)}
        isSubmitting={isSubmitting}
        moveSlot={stages.length > 0 ? (
          <BulkMoveMenu
            stages={stages}
            selectedIds={selectedIds}
            onMoved={() => { onSelectionChange(new Set()); onArchived(); }}
          />
        ) : undefined}
      />
      <BulkArchiveDialog
        open={isDialogOpen}
        selectedCount={selectedIds.size}
        reasons={reasons}
        isSubmitting={isSubmitting}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmArchive}
      />
    </>
  );
}
