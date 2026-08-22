'use client';
// FILE: src/components/employer/jobs/parts/AnonymizeCandidateDialog.tsx
// Confirmation for an action that cannot be undone and reaches further than the page
// it is triggered from.
//
// THE DIALOG DOES NOT OPEN UNTIL THE SERVER HAS ANSWERED. A contact is shared across
// every posting at the company, so "this affects all 4 applications" is a fact only
// the server knows — and a confirmation that appears first and corrects itself
// afterwards has already been dismissed by anyone moving quickly. The trigger fetches
// the preview, then opens.
//
// The scheduled-interview warning is a warning, not a block. Anonymizing strips the
// contact details a cancellation email would need, so the order matters — but it is
// the employer's call, and a dialog that refuses to proceed would just be a dead end.

import { AlertTriangle } from 'lucide-react';
import { Modal, Button, Alert, Stack } from '@/components/ui';
import type { AnonymizePreview } from '@/types/employer-applicants';
import { COPY } from '@/theme/brand';

const C = COPY.employer.applicants;

const BODY_STYLE = { margin: 0, fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--ink-2)' };
const SCOPE_STYLE = {
  margin: 0, fontSize: '0.88rem', fontWeight: 500, lineHeight: 1.55, color: 'var(--ink)',
};

/** "12 Aug 2026, 3:30 pm" in the viewer's locale — the interview is a wall-clock fact. */
function formatInterviewDate(startAtUtc: string): string {
  const date = new Date(startAtUtc);
  return Number.isNaN(date.getTime())
    ? startAtUtc
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AnonymizeCandidateDialog({
  isOpen, preview, candidateName, isBusy, onCancel, onConfirm,
}: {
  isOpen: boolean;
  /** Null only in the instant between opening and the preview arriving. */
  preview: AnonymizePreview | null;
  candidateName: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const name = preview?.candidateName || candidateName;
  const nextInterview = preview?.upcomingInterviews[0] ?? null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isBusy ? () => {} : onCancel}
      title={C.anonymizeTitle.replace('{name}', name)}
      size="sm"
      footer={
        <Stack gap={8} dir="row" justify="flex-end">
          <Button variant="secondary" size="sm" disabled={isBusy} onClick={onCancel}>
            {COPY.employer.common.cancel}
          </Button>
          <Button variant="danger" size="sm" loading={isBusy} onClick={onConfirm}>
            {C.anonymizeConfirm}
          </Button>
        </Stack>
      }
    >
      <Stack gap={12}>
        <p style={BODY_STYLE}>{C.anonymizeBody.replaceAll('{name}', name)}</p>
        {preview && preview.applicationCount > 1 && (
          <p style={SCOPE_STYLE}>
            {C.anonymizeScope.replace('{count}', String(preview.applicationCount))}
          </p>
        )}
        {nextInterview && (
          <Alert type="warning">
            <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
              {C.anonymizeInterviewWarning.replace('{date}', formatInterviewDate(nextInterview.startAtUtc))}
            </span>
          </Alert>
        )}
      </Stack>
    </Modal>
  );
}
