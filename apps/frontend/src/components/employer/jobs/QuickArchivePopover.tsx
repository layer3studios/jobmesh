'use client';
// FILE: src/components/employer/jobs/QuickArchivePopover.tsx
// Lightweight archive confirm, anchored to the ✕ on a ranked row or pipeline card.
//
// A popover rather than a Modal on purpose: archiving one obvious no is a
// high-frequency, low-stakes action, and a full-screen dialog makes triaging fifty
// candidates feel like fifty decisions. The reason picker is still REQUIRED — the
// archive is cheap to trigger, not cheap to get wrong.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Select, Checkbox } from '@/components/ui';
import { useAnchoredPosition } from '@/components/ui/ActionsMenu';
import { archiveApplicant } from '@/api/employer-applicants-api';
import { EmployerApplicantsApiError } from '@/api/employer-applicants-api';
import type { ArchiveReason } from '@/types/employer-applicants';
import { Z } from '@/theme/tokens';

export default function QuickArchivePopover({
  candidateName, applicationId, reasons, anchorRef, isOpen, onClose, onArchived,
}: {
  candidateName: string;
  applicationId: string;
  /** Cached by the parent — the ranked tab and pipeline both already load these. */
  reasons: ArchiveReason[];
  anchorRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  onArchived: (candidateName: string) => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [reasonId, setReasonId] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Viewport coordinates, so the panel can be portalled out of the ranked table
  // and the pipeline column — both of which are overflow:hidden and were
  // clipping this popover.
  const position = useAnchoredPosition(anchorRef, popoverRef, isOpen);

  useEffect(() => { if (isOpen) setError(null); }, [isOpen]);

  // Escape closes, and a click anywhere outside closes. Both are registered only
  // while open, so a closed popover costs nothing.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const handleArchive = async () => {
    if (!reasonId) return;
    setIsArchiving(true);
    setError(null);
    try {
      await archiveApplicant(applicationId, { reasonId, skipEmail: !sendEmail });
      onArchived(candidateName);
      onClose();
    } catch (err) {
      // The popover STAYS OPEN so the choice is not lost — a network blip should
      // cost a retry click, not the whole interaction.
      setError(err instanceof EmployerApplicantsApiError
        ? err.message
        : 'Could not archive. Check your connection and try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Archive ${candidateName}`}
      onClick={(event) => event.stopPropagation()}
      style={{
        position: 'fixed', zIndex: Z.dropdown,
        top: position?.top ?? 0, left: position?.left ?? 0,
        visibility: position ? 'visible' : 'hidden',
        minWidth: 240, maxWidth: 280, padding: 12, borderRadius: 10,
        background: 'var(--surface-raised)', border: '0.5px solid var(--border)',
        boxShadow: 'var(--shadow-lg)', cursor: 'default',
      }}
    >
      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
        Archive {candidateName}?
      </p>

      {reasons.length === 0 ? (
        // Every company is seeded with seven reasons at onboarding, so this is a
        // data-integrity case rather than a normal empty state. There is no
        // archive-reasons settings page to link to, so it does not promise one.
        <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
          No archive reasons are available for this company. Archive from the
          candidate&rsquo;s detail page, or contact support.
        </p>
      ) : (
        <>
          <Select
            aria-label="Archive reason"
            placeholder="Select a reason"
            value={reasonId}
            options={reasons.map((reason) => ({ value: reason.id, label: reason.text }))}
            onChange={(event) => setReasonId(event.target.value)}
          />
          <div style={{ marginTop: 10 }}>
            <Checkbox
              checked={sendEmail}
              onChange={setSendEmail}
              label="Send rejection email"
            />
          </div>
          {error && (
            <p role="alert" style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--danger)' }}>{error}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <Button
              size="sm"
              variant="danger"
              loading={isArchiving}
              disabled={!reasonId || isArchiving}
              onClick={handleArchive}
            >
              Archive
            </Button>
            <button
              type="button"
              onClick={onClose}
              disabled={isArchiving}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: 12, color: 'var(--ink-muted)',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
