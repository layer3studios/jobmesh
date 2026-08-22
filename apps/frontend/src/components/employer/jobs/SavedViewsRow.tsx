'use client';
// FILE: src/components/employer/jobs/SavedViewsRow.tsx
// Per-recruiter saved filter views for one posting: a horizontally scrollable
// chip row above the applicant list, a "Save view" action, and a per-chip menu
// for rename/delete. Views are fetched once per page load and cached in the
// API module; mutations write through that cache.

import { useEffect, useRef, useState } from 'react';
import { Button, Input, Modal, Stack, useToast } from '@/components/ui';
import {
  listSavedViews, createSavedView, updateSavedView, deleteSavedView,
  EmployerApplicantsApiError,
} from '@/api/employer-applicants-api';
import type { SavedView } from '@/types/employer-applicants';
import { Z } from '@/theme/tokens';
import { createPortal } from 'react-dom';
import { useAnchoredPosition } from '@/components/ui/ActionsMenu';

const SAVE_ERROR_MESSAGE = 'Could not save the view.';

function ViewChipMenu({ onRename, onDelete, onClose, anchorRef }: {
  onRename: () => void; onDelete: () => void; onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, menuRef, true);
  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose]);

  const itemStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '7px 12px', textAlign: 'left',
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '0.8125rem', color: 'var(--ink)',
  };

  if (typeof document === 'undefined') return null;

  // Portalled: the chip row is overflowX:auto, which would otherwise clip this
  // menu and add a horizontal scrollbar to the row when it opens.
  return createPortal(
    <div ref={menuRef} style={{
      position: 'fixed', zIndex: Z.dropdown,
      top: position?.top ?? 0, left: position?.left ?? 0,
      visibility: position ? 'visible' : 'hidden',
      minWidth: 120, background: 'var(--paper)', border: '1px solid var(--border)',
      borderRadius: 8, boxShadow: 'var(--shadow-md)', overflow: 'hidden',
    }}>
      <button type="button" style={itemStyle} onClick={onRename}>Rename</button>
      <button type="button" style={{ ...itemStyle, color: 'var(--danger)' }} onClick={onDelete}>Delete</button>
    </div>,
    document.body,
  );
}

export default function SavedViewsRow({ postingId, isViewActive, canSave, onApply, onSaveCurrent }: {
  postingId: string;
  /** True when a view's filters match the live list. */
  isViewActive: (view: SavedView) => boolean;
  /** False when no filter is active — nothing to save. */
  canSave: boolean;
  onApply: (view: SavedView) => void;
  /** Returns the current filter payload to persist. */
  onSaveCurrent: () => Record<string, unknown>;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // The ⋯ element that opened the menu, so the portalled panel can anchor to it.
  const menuAnchorRef = useRef<HTMLElement | null>(null);
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'rename'; view: SavedView } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    listSavedViews(postingId)
      .then((result) => { if (!cancelled) setViews(result); })
      .catch(() => { /* saved views are non-critical; the list still works */ });
    return () => { cancelled = true; };
  }, [postingId]);

  const resolveError = (error: unknown) =>
    error instanceof EmployerApplicantsApiError ? error.message : SAVE_ERROR_MESSAGE;

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (modal?.mode === 'create') {
        const view = await createSavedView(postingId, { name: nameInput, filters: onSaveCurrent() });
        setViews((prev) => [view, ...prev]);
        showToast('success', `Saved view "${view.name}".`);
      } else if (modal?.mode === 'rename') {
        const view = await updateSavedView(postingId, modal.view.id, { name: nameInput });
        setViews((prev) => prev.map((item) => (item.id === view.id ? view : item)));
        showToast('success', 'View renamed.');
      }
      setModal(null);
      setNameInput('');
    } catch (error) {
      showToast('error', resolveError(error)); // modal stays open for retry
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(view: SavedView) {
    setOpenMenuId(null);
    try {
      await deleteSavedView(postingId, view.id);
      setViews((prev) => prev.filter((item) => item.id !== view.id));
      showToast('success', `Deleted view "${view.name}".`);
    } catch (error) {
      showToast('error', resolveError(error));
    }
  }

  if (views.length === 0 && !canSave) return null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
          Views
        </span>
        {views.map((view) => {
          const isActive = isViewActive(view);
          return (
            <div key={view.id} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
              <button
                type="button" aria-pressed={isActive} onClick={() => onApply(view)}
                style={{
                  cursor: 'pointer', borderRadius: 999, padding: '4px 8px 4px 12px',
                  fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'var(--text-on-accent)' : 'var(--ink-muted)',
                }}
              >
                {view.name}
                <span
                  role="button" aria-label={`Options for ${view.name}`}
                  onClick={(event) => { event.stopPropagation(); menuAnchorRef.current = event.currentTarget; setOpenMenuId(openMenuId === view.id ? null : view.id); }}
                  style={{ padding: '0 2px', fontWeight: 700, lineHeight: 1 }}
                >⋯</span>
              </button>
              {openMenuId === view.id && (
                <ViewChipMenu
                  anchorRef={menuAnchorRef}
                  onClose={() => setOpenMenuId(null)}
                  onRename={() => { setOpenMenuId(null); setNameInput(view.name); setModal({ mode: 'rename', view }); }}
                  onDelete={() => void handleDelete(view)}
                />
              )}
            </div>
          );
        })}
        {canSave && (
          <Button variant="ghost" size="sm" onClick={() => { setNameInput(''); setModal({ mode: 'create' }); }}>
            + Save view
          </Button>
        )}
      </div>

      <Modal
        isOpen={modal !== null}
        onClose={() => { if (!isSubmitting) setModal(null); }}
        title={modal?.mode === 'rename' ? 'Rename view' : 'Save current view'}
        size="sm"
        footer={
          <Stack gap={8} dir="row" justify="flex-end">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => void handleSubmit()}
              disabled={isSubmitting || nameInput.trim() === ''}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        }
      >
        <Input
          aria-label="View name" placeholder="e.g. Senior React, Bengaluru"
          value={nameInput} maxLength={60}
          onChange={(event) => setNameInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
        />
      </Modal>
    </>
  );
}
