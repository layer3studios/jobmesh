'use client';
// FILE: src/components/employer/jobs/RankedToolbarActions.tsx
// Posting-level actions in the ranked toolbar: export the applicant list, import
// more candidates, and the keyboard-shortcut help. Grouped here so RankedTab keeps
// owning list state rather than three unrelated pieces of chrome.

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui';
import ExportApplicantsButton from './ExportApplicantsButton';
import BulkImportModal from './BulkImportModal';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';

export default function RankedToolbarActions({
  postingId, canManage, onImported, helpOpen, onHelpOpen, onHelpClose, onModalStateChange,
}: {
  postingId: string;
  /** Member+ — export and import are both writes-adjacent, interviewer-hidden. */
  canManage: boolean;
  onImported: () => void;
  helpOpen: boolean;
  onHelpOpen: () => void;
  onHelpClose: () => void;
  /** Lets the parent pause keyboard shortcuts while a modal owns the keyboard. */
  onModalStateChange: (isOpen: boolean) => void;
}) {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const setImportOpen = (open: boolean) => {
    setIsImportOpen(open);
    onModalStateChange(open);
  };

  return (
    <>
      {canManage && (
        <>
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} aria-hidden="true" />
              Import
            </span>
          </Button>
          <ExportApplicantsButton postingId={postingId} />
        </>
      )}
      <KeyboardShortcutsHelp isOpen={helpOpen} onOpen={onHelpOpen} onClose={onHelpClose} />
      <BulkImportModal
        postingId={postingId}
        isOpen={isImportOpen}
        onClose={() => setImportOpen(false)}
        onImported={onImported}
      />
    </>
  );
}
