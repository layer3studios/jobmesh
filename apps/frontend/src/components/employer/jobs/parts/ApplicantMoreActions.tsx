'use client';
// FILE: src/components/employer/jobs/parts/ApplicantMoreActions.tsx
// The ⋯ menu on the applicant action bar: export this candidate's data, and erase it.
//
// These two live behind a ⋯ rather than beside Move and Archive because they are not
// triage. Move and Archive happen dozens of times an afternoon; exporting a record
// and anonymizing a person happen when someone asks you to, and putting a
// irreversible action next to the button you press all day is how it gets pressed
// by accident.
//
// Export is a plain navigation — the server sets Content-Disposition and names the
// file, so the browser does the rest. Anonymize fetches its impact first, then opens
// the dialog (see AnonymizeCandidateDialog).

import { useState } from 'react';
import { ActionsMenu, useToast } from '@/components/ui';
import type { ActionsMenuItem } from '@/components/ui/ActionsMenu';
import {
  candidateExportUrl, fetchAnonymizePreview, anonymizeCandidate, setDoNotContact,
  EmployerApplicantsApiError,
} from '@/api/employer-applicants-api';
import type { AnonymizePreview } from '@/types/employer-applicants';
import { COPY } from '@/theme/brand';
import AnonymizeCandidateDialog from './AnonymizeCandidateDialog';
import DoNotContactDialog from './DoNotContactDialog';

const C = COPY.employer.applicants;

export default function ApplicantMoreActions({
  applicationId, candidateName, canAnonymize, onAnonymized,
  contactId = null, isDoNotContact = false, canFlagContact = false,
}: {
  applicationId: string;
  candidateName: string;
  /** Owner+ only. The backend enforces it too — this just stops a pointless 403. */
  canAnonymize: boolean;
  onAnonymized: () => void;
  /** Null on a record with no contact — the flag item is then not offered. */
  contactId?: string | null;
  isDoNotContact?: boolean;
  /** Member+. An Interviewer still SEES the flag; they just cannot change it. */
  canFlagContact?: boolean;
}) {
  const { showToast } = useToast();
  const [preview, setPreview] = useState<AnonymizePreview | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);

  async function confirmDoNotContact(reason: string | null) {
    if (!contactId) return;
    setIsBusy(true);
    try {
      await setDoNotContact(contactId, { flag: !isDoNotContact, reason });
      setIsFlagDialogOpen(false);
      showToast('success', isDoNotContact ? C.doNotContactCleared : C.doNotContactSaved);
      // Reload rather than patch: the banner, the contact card and the ranked row
      // all read this flag, and re-reading is the only way to show what landed.
      onAnonymized();
    } catch (error) {
      showToast('error', error instanceof EmployerApplicantsApiError ? error.message : C.doNotContactFailed);
    } finally {
      setIsBusy(false);
    }
  }

  async function openAnonymizeDialog() {
    setIsBusy(true);
    try {
      const next = await fetchAnonymizePreview(applicationId);
      if (next.alreadyAnonymized) {
        showToast('info', C.anonymizeAlready);
        return;
      }
      setPreview(next);
      setIsDialogOpen(true);
    } catch (error) {
      showToast('error', error instanceof EmployerApplicantsApiError ? error.message : C.anonymizeFailed);
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmAnonymize() {
    setIsBusy(true);
    try {
      const result = await anonymizeCandidate(applicationId);
      setIsDialogOpen(false);
      showToast('success', result.alreadyAnonymized ? C.anonymizeAlready : C.anonymizeDone);
      // Reload rather than patch state: the name, the contact card and the notes all
      // changed at once, and re-reading is the only way to show what actually landed.
      onAnonymized();
    } catch (error) {
      showToast('error', error instanceof EmployerApplicantsApiError ? error.message : C.anonymizeFailed);
    } finally {
      setIsBusy(false);
    }
  }

  const items: ActionsMenuItem[] = [
    {
      id: 'export',
      label: C.exportData,
      onSelect: () => { window.location.href = candidateExportUrl(applicationId); },
    },
    ...(contactId ? [{
      id: 'do-not-contact',
      label: isDoNotContact ? C.doNotContactClear : C.doNotContactSet,
      dividerBefore: true,
      disabled: !canFlagContact || isBusy,
      description: canFlagContact ? undefined : C.doNotContactMemberOnly,
      onSelect: () => setIsFlagDialogOpen(true),
    }] : []),
    {
      id: 'anonymize',
      label: C.anonymize,
      danger: true,
      dividerBefore: true,
      disabled: !canAnonymize || isBusy,
      description: canAnonymize ? undefined : C.anonymizeOwnerOnly,
      onSelect: () => void openAnonymizeDialog(),
    },
  ];

  return (
    <>
      <ActionsMenu items={items} label={`${COPY.employer.common.actions} — ${candidateName}`} />
      <DoNotContactDialog
        isOpen={isFlagDialogOpen}
        isCurrentlyFlagged={isDoNotContact}
        candidateName={candidateName}
        isBusy={isBusy}
        onCancel={() => setIsFlagDialogOpen(false)}
        onConfirm={(reason) => void confirmDoNotContact(reason)}
      />
      <AnonymizeCandidateDialog
        isOpen={isDialogOpen}
        preview={preview}
        candidateName={candidateName}
        isBusy={isBusy}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={() => void confirmAnonymize()}
      />
    </>
  );
}
