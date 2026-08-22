'use client';
// FILE: src/components/employer/jobs/usePostingRowActions.ts
// Builds the ⋯ menu for one posting and owns the mutations behind it.
//
// A hook rather than a component because the desktop table and the mobile card
// render different markup around the SAME action set — duplicating the permission
// gates and the close/reopen/delete calls in two places is how the two silently
// drift apart.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui';
import type { ActionsMenuItem } from '@/components/ui';
import {
  closeEmployerPosting, reopenEmployerPosting, deleteEmployerPosting, EmployerJobsApiError,
} from '@/api/employer-jobs-api';
import type { Posting } from '@/types/employer-jobs';
import { withOrigin, NAV_ORIGINS } from '@/lib/nav-origin';

export type PendingConfirm =
  | { kind: 'close'; posting: Posting }
  | { kind: 'delete'; posting: Posting }
  | null;

export interface PostingRowActions {
  items: ActionsMenuItem[];
  pending: PendingConfirm;
  isMutating: boolean;
  confirm: () => Promise<void>;
  cancel: () => void;
}

export function usePostingRowActions({
  posting, canEdit, canClose, canDelete, onFill, onChanged,
}: {
  posting: Posting;
  canEdit: boolean;
  canClose: boolean;
  /** Owner+ only — deleting a posting is the one irreversible action here. */
  canDelete: boolean;
  onFill: (posting: Posting) => void;
  onChanged: () => void;
}): PostingRowActions {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState<PendingConfirm>(null);
  const [isMutating, setIsMutating] = useState(false);

  const applicantsHref = withOrigin(`/employer/jobs/${posting.id}?tab=ranked`, NAV_ORIGINS.JOBS);
  const isActive = posting.status === 'active';
  const isClosed = posting.status === 'closed';
  // Delete is offered only where the backend would actually allow it, so the menu
  // never presents an action that answers 400.
  const isDeletable = posting.status === 'draft' && (posting.applicantCount ?? 0) === 0;

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setIsMutating(true);
    try {
      await action();
      showToast('success', successMessage);
      setPending(null);
      onChanged();
    } catch (error) {
      // The backend refuses a stale reopen (deadline passed) and a stale delete
      // (applicants arrived) with a specific message — surface it verbatim rather
      // than a generic failure, because it names the thing to fix.
      showToast('error', error instanceof EmployerJobsApiError
        ? error.message
        : 'Could not update the posting. Please try again.');
    } finally {
      setIsMutating(false);
    }
  };

  const items: ActionsMenuItem[] = [
    { id: 'applicants', label: 'View applicants', onSelect: () => router.push(applicantsHref) },
  ];
  if (canEdit) {
    items.push(
      { id: 'edit', label: 'Edit posting', onSelect: () => router.push(withOrigin(`/employer/jobs/${posting.id}`, NAV_ORIGINS.JOBS)) },
      { id: 'duplicate', label: 'Duplicate', onSelect: () => router.push(`/employer/jobs/new?duplicate=${posting.id}`) },
    );
  }
  if (canClose && isActive) {
    items.push(
      // Distinct from "Position filled": this stops new submissions and touches
      // nobody already in the pipeline. The confirm copy says so explicitly.
      { id: 'close', label: 'Close applications', dividerBefore: true, onSelect: () => setPending({ kind: 'close', posting }) },
      { id: 'fill', label: 'Position filled', onSelect: () => onFill(posting) },
    );
  }
  if (canClose && isClosed) {
    items.push({
      id: 'reopen',
      label: 'Reopen',
      dividerBefore: true,
      onSelect: () => void run(() => reopenEmployerPosting(posting.id), 'Posting reopened.'),
    });
  }
  if (canDelete && isDeletable) {
    items.push({
      id: 'delete', label: 'Delete', danger: true, dividerBefore: true,
      onSelect: () => setPending({ kind: 'delete', posting }),
    });
  }

  const confirm = async () => {
    if (!pending) return;
    if (pending.kind === 'close') {
      await run(() => closeEmployerPosting(pending.posting.id), 'Applications closed.');
      return;
    }
    await run(() => deleteEmployerPosting(pending.posting.id), 'Posting deleted.');
  };

  return { items, pending, isMutating, confirm, cancel: () => setPending(null) };
}
