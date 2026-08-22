'use client';
// FILE: src/components/employer/jobs/PostingOverview.tsx
// Overview tab, dashboard edition: status/actions top bar, four KPI tiles,
// then Job details (+ pipeline snapshot) beside the scrollable Description.
// Editing still swaps to the existing inline PostingForm; Close keeps its
// confirm dialog with the scheduled-interview warning.

import { useState } from 'react';
import { Stack, useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canEditPosting, canClosePosting } from '@/lib/team-permissions';
import PostingEditView from './parts/PostingEditView';
import { isoToDeadlineInput } from './posting-form-helpers';
import type { PostingFormValues } from './posting-form-helpers';
import PostingConfirmDialog from './PostingConfirmDialog';
import type { ConfirmAction } from './PostingConfirmDialog';
import PostingActionBar from './parts/PostingActionBar';
import PostingFillDialog from './parts/PostingFillDialog';
import PostingKpiTiles from './PostingKpiTiles';
import PostingDetailsCard from './PostingDetailsCard';
import PostingDescriptionCard from './PostingDescriptionCard';
import { usePostingOverviewData } from './usePostingOverviewData';
import {
  updateEmployerPosting, closeEmployerPosting, reopenEmployerPosting, fillEmployerPosting,
  EmployerJobsApiError,
} from '@/api/employer-jobs-api';
import { listInterviewTimes } from '@/api/employer-interview-times-api';
import type { Posting, PostingCreateInput } from '@/types/employer-jobs';
import { trackEvent } from '@/lib/analytics-events';

const daysOpen = (createdAt: string): number => Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));

const toFormValues = (p: Posting): PostingFormValues => ({
  title: p.title, description: p.description, location: p.location,
  workplaceType: p.workplaceType, employmentType: p.employmentType,
  salaryMinStr: p.salaryMin != null ? String(p.salaryMin) : '',
  salaryMaxStr: p.salaryMax != null ? String(p.salaryMax) : '',
  applicationDeadline: isoToDeadlineInput(p.applicationDeadline), autoCloseOnDeadline: p.autoCloseOnDeadline === true,
});

export default function PostingOverview({ posting, onReload }: {
  posting: Posting;
  onReload: () => Promise<void>;
}) {
  const { company, viewerRole } = useEmployer();
  const { showToast } = useToast();
  const allowEdit = viewerRole ? canEditPosting(viewerRole) : true;
  const allowClose = viewerRole ? canClosePosting(viewerRole) : true;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isMutating, setIsMutating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<ConfirmAction | null>(null);
  const [previewValues, setPreviewValues] = useState<PostingFormValues>(() => toFormValues(posting));
  const [bookedInterviewCount, setBookedInterviewCount] = useState(0);
  const [isFillOpen, setIsFillOpen] = useState(false);
  const data = usePostingOverviewData(posting.id);

  const applyUrl = `${window.location.origin}/apply/${company?.slug ?? ''}/${posting.slug}`;
  // Re-seed the preview each time edit opens so it reflects the saved posting.
  const openEdit = () => { setPreviewValues(toFormValues(posting)); setMode('edit'); };

  const copyApplyUrl = async () => {
    try {
      await navigator.clipboard.writeText(applyUrl);
      showToast('success', 'Apply URL copied to clipboard.');
    } catch {
      showToast('error', 'Could not copy — select and copy manually.');
    }
  };

  async function openCloseConfirm(): Promise<void> {
    try {
      const booked = await listInterviewTimes(posting.id, { status: 'booked' });
      setBookedInterviewCount(booked.length);
    } catch {
      setBookedInterviewCount(0);
    }
    setConfirmOpen('close');
  }

  // The assignment attachment is NOT part of this payload — it has its own endpoint
  // and PostingForm calls it separately. Reload/exit moves to onSubmitted so the
  // form stays mounted (and its retry affordance reachable) if that second call
  // fails after the posting fields already saved.
  const handleSave = async (input: PostingCreateInput) => {
    await updateEmployerPosting(posting.id, input);
    showToast('success', 'Changes saved');
  };

  const handleSaved = async () => {
    await onReload();
    setMode('view');
  };

  const handleConfirm = async () => {
    if (!confirmOpen) return;
    setIsMutating(true);
    try {
      const wasDraft = posting.status === 'draft';
      confirmOpen === 'close' ? await closeEmployerPosting(posting.id) : await reopenEmployerPosting(posting.id);
      if (confirmOpen === 'reopen' && wasDraft) trackEvent('posting_published', { postingId: posting.id });
      showToast('success', confirmOpen === 'close' ? 'Posting closed' : 'Posting reopened');
      await onReload();
      setConfirmOpen(null);
    } catch (err) {
      showToast('error', err instanceof EmployerJobsApiError ? err.message : 'Could not update posting. Try again.');
    } finally {
      setIsMutating(false);
    }
  };

  // Position filled: closes the posting AND archives everyone still waiting, in one
  // backend call. Reports the archived count so the employer sees what it touched.
  const handleFill = async () => {
    setIsMutating(true);
    try {
      const result = await fillEmployerPosting(posting.id);
      const word = result.archivedCount === 1 ? 'candidate' : 'candidates';
      showToast('success', `Posting closed. ${result.archivedCount} ${word} archived.`);
      // Partial failure is possible — the posting still closed, so say so plainly
      // instead of letting the count quietly under-report.
      if (result.failedCount > 0) {
        showToast('error', `${result.failedCount} could not be archived. Archive them manually.`);
      }
      await onReload();
      setIsFillOpen(false);
    } catch (err) {
      showToast('error', err instanceof EmployerJobsApiError ? err.message : 'Could not update posting. Try again.');
    } finally {
      setIsMutating(false);
    }
  };

  // Edit mirrors the New-posting layout: form left, live preview right.
  if (mode === 'edit') {
    return (
      <PostingEditView
        posting={posting}
        previewValues={previewValues}
        onValuesChange={setPreviewValues}
        onCancel={() => setMode('view')}
        onSubmit={handleSave}
        onSubmitted={() => { void handleSaved(); }}
      />
    );
  }

  return (
    <Stack gap={14}>
      <PostingActionBar
        posting={posting}
        allowEdit={allowEdit}
        allowClose={allowClose}
        isMutating={isMutating}
        onEdit={openEdit}
        onCopyApplyUrl={() => void copyApplyUrl()}
        onCloseposting={() => void openCloseConfirm()}
        onReopen={() => setConfirmOpen('reopen')}
        onFill={() => setIsFillOpen(true)}
      />

      <PostingKpiTiles
        totalApplicants={data.totalApplicants}
        averageScore={data.averageScore}
        interviewsScheduled={data.interviewsScheduled}
        daysOpen={daysOpen(posting.createdAt)}
        viewCount={posting.viewCount ?? 0}
      />

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 300px', minWidth: 280 }}>
          <PostingDetailsCard
            posting={posting} applyUrl={applyUrl} onCopyApplyUrl={() => void copyApplyUrl()}
            stages={data.stages} stageCounts={data.stageCounts}
          />
        </div>
        <div style={{ flex: '3 1 380px', minWidth: 320 }}>
          <PostingDescriptionCard description={posting.description} allowEdit={allowEdit} onEdit={openEdit} />
        </div>
      </div>

      <PostingConfirmDialog
        action={confirmOpen}
        isMutating={isMutating}
        onCancel={() => setConfirmOpen(null)}
        onConfirm={handleConfirm}
        extraWarning={confirmOpen === 'close' && bookedInterviewCount > 0
          ? `${bookedInterviewCount} scheduled interview${bookedInterviewCount === 1 ? '' : 's'} will be cancelled and candidates will be notified.`
          : null}
      />

      <PostingFillDialog
        isOpen={isFillOpen}
        candidateCount={data.totalApplicants ?? 0}
        isMutating={isMutating}
        onCancel={() => setIsFillOpen(false)}
        onConfirm={() => { void handleFill(); }}
      />
    </Stack>
  );
}
