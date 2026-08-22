'use client';
// FILE: src/components/employer/jobs/BulkMoveMenu.tsx
// "Move to ▾" for the Ranked bulk bar: a dropdown of the posting's non-terminal
// stages; picking one bulk-moves the selection. Partial failure shows a
// dismissible detail panel — a toast alone would swallow the reasons.

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { bulkMoveStage, type BulkMoveResult } from '@/api/employer-applicant-actions-api';
import type { Stage } from '@/types/employer-applicants';
import { Z } from '@/theme/tokens';

export default function BulkMoveMenu({ stages, selectedIds, onMoved }: {
  stages: Stage[];
  selectedIds: Set<string>;
  onMoved: (result: BulkMoveResult) => void;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [failures, setFailures] = useState<BulkMoveResult['failures'] | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Terminal stages (Hired) are deliberate single decisions, not bulk targets.
  const targets = stages.filter((stage) => !stage.isTerminal);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function handleMove(stage: Stage): Promise<void> {
    setOpen(false);
    setMoving(true);
    try {
      const result = await bulkMoveStage([...selectedIds], stage.id);
      if (result.failed === 0) {
        showToast('success', `${result.moved} candidate${result.moved === 1 ? '' : 's'} moved to ${stage.text}`);
      } else {
        showToast('error', `${result.moved} moved, ${result.failed} failed`);
        setFailures(result.failures);
      }
      onMoved(result);
    } catch {
      showToast('error', 'Could not move the selected candidates. Try again.');
    } finally {
      setMoving(false);
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <Button
        variant="secondary" size="sm" loading={moving}
        aria-haspopup="menu" aria-expanded={open}
        // The ranked table's "m" shortcut selects a row, then clicks this trigger.
        data-bulk-move-trigger
        onClick={() => setOpen((value) => !value)}
        iconRight={<ChevronDown size={13} />}
      >
        Move to
      </Button>
      {open && (
        <div role="menu" style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, minWidth: 160, zIndex: Z.dropdown,
          background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: 'var(--shadow-lg)', padding: 4,
        }}>
          {targets.map((stage) => (
            <button
              key={stage.id} role="menuitem" type="button"
              onClick={() => void handleMove(stage)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px',
                fontSize: '0.85rem', color: 'var(--ink)', background: 'transparent',
                border: 0, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {stage.text}
            </button>
          ))}
        </div>
      )}
      {failures && (
        <div role="alert" style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, width: 280, zIndex: Z.dropdown,
          background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: 'var(--shadow-lg)', padding: 12,
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
            {failures.length} candidate{failures.length === 1 ? '' : 's'} could not be moved
          </p>
          {failures.slice(0, 5).map((failure) => (
            <p key={failure.applicationId} style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
              {failure.reason.replaceAll('_', ' ').toLowerCase()}
            </p>
          ))}
          <div style={{ marginTop: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setFailures(null)}>Dismiss</Button>
          </div>
        </div>
      )}
    </div>
  );
}
