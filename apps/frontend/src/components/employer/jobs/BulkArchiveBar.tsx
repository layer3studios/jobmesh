'use client';
// FILE: src/components/employer/jobs/BulkArchiveBar.tsx
// Floating batch-actions bar for the Ranked tab (PP3/D3, R2). Appears only while ≥1
// applicant is selected, pinned bottom-center. Shows the count, a Clear action, and
// the primary danger "Archive N". Pure presentational — the parent owns selection and
// submission state. aria-live announces count changes to screen readers.

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { Z } from '@/theme/tokens';

export default function BulkArchiveBar({
  selectedCount, onClear, onArchive, isSubmitting, moveSlot,
}: {
  selectedCount: number;
  onClear: () => void;
  onArchive: () => void;
  isSubmitting: boolean;
  /** The "Move to ▾" menu, rendered between the count and Archive. */
  moveSlot?: ReactNode;
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: Z.sticky, display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--paper)', border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: '12px 16px',
      }}
    >
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
        {selectedCount} selected
      </span>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={isSubmitting}>Clear</Button>
      {moveSlot}
      <Button variant="danger" size="sm" onClick={onArchive} loading={isSubmitting}>
        Archive {selectedCount}
      </Button>
    </div>
  );
}
