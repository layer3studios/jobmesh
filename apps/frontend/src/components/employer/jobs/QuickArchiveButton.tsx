'use client';
// FILE: src/components/employer/jobs/QuickArchiveButton.tsx
// The ✕ trigger plus its popover, as one unit. Both the ranked row and the
// pipeline card mount THIS rather than wiring an anchor ref, open state and
// stopPropagation three times each.
//
// It renders nothing at all when the viewer cannot archive, or when the candidate
// is already archived — offering an action the backend would refuse is worse than
// not offering it.

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import QuickArchivePopover from './QuickArchivePopover';
import type { ArchiveReason } from '@/types/employer-applicants';

export default function QuickArchiveButton({
  candidateName, applicationId, reasons, canArchive, isArchived, onArchived, alwaysVisible = false,
}: {
  candidateName: string;
  applicationId: string;
  reasons: ArchiveReason[];
  canArchive: boolean;
  isArchived: boolean;
  onArchived: (candidateName: string) => void;
  /** True on touch layouts, where there is no hover to reveal the control. */
  alwaysVisible?: boolean;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (!canArchive || isArchived) return null;

  return (
    // The row and the card are both click-to-navigate, so every event here stops
    // at this wrapper — opening the popover must never also open the candidate.
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={anchorRef}
        type="button"
        aria-label={`Archive ${candidateName}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="quick-archive-trigger"
        data-always-visible={alwaysVisible || isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <X size={16} aria-hidden />
      </button>
      <QuickArchivePopover
        candidateName={candidateName}
        applicationId={applicationId}
        reasons={reasons}
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onArchived={onArchived}
      />
    </span>
  );
}
