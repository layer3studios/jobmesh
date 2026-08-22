'use client';
// FILE: src/components/employer/jobs/useRankedKeyboard.ts
// Keyboard navigation for the ranked candidate table: move the highlight, open a
// candidate, archive or move the highlighted one, and show the shortcut list.
//
// TWO RULES KEEP THIS OUT OF THE BROWSER'S WAY, and both are non-negotiable:
//  1. Any modifier key (Ctrl/Cmd/Alt) means the keystroke belongs to the browser
//     or the OS — Cmd+C, Ctrl+F and friends pass straight through untouched.
//  2. While focus is in a text field, a plain letter is text the user is typing.
//     Only Escape is handled there, and it only blurs.

import { useCallback, useEffect, useState } from 'react';

export interface RankedKeyboardHandlers {
  /** Ids in the order they are rendered — the highlight indexes into this. */
  ids: string[];
  onOpen: (id: string) => void;
  onArchive: (id: string) => void;
  onMove: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onShowHelp: () => void;
  onEscape: () => void;
  /** False while a modal owns the keyboard (import, shortcuts help). */
  enabled?: boolean;
}

/** True when the keystroke is text the user is typing, not a command for us. */
function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}

export function useRankedKeyboard({
  ids, onOpen, onArchive, onMove, onToggleSelect, onShowHelp, onEscape, enabled = true,
}: RankedKeyboardHandlers) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // A candidate that filtering removed must not keep the highlight.
  useEffect(() => {
    if (activeId && !ids.includes(activeId)) setActiveId(null);
  }, [ids, activeId]);

  const step = useCallback((delta: number) => {
    setActiveId((current) => {
      if (ids.length === 0) return null;
      const index = current ? ids.indexOf(current) : -1;
      const next = Math.min(Math.max(index + delta, 0), ids.length - 1);
      const id = ids[index === -1 && delta < 0 ? ids.length - 1 : next];
      document.querySelector(`[data-application-id="${id}"]`)
        ?.scrollIntoView({ block: 'nearest' });
      return id;
    });
  }, [ids]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const typing = isTypingTarget(event.target);

      if (event.key === 'Escape') {
        if (typing) (event.target as HTMLElement).blur();
        else onEscape();
        return;
      }
      if (typing) return;

      switch (event.key) {
        case 'ArrowDown': case 'j': event.preventDefault(); step(1); break;
        case 'ArrowUp': case 'k': event.preventDefault(); step(-1); break;
        case 'Enter': if (activeId) { event.preventDefault(); onOpen(activeId); } break;
        case 'a': if (activeId) { event.preventDefault(); onArchive(activeId); } break;
        case 'm': if (activeId) { event.preventDefault(); onMove(activeId); } break;
        case 's': if (activeId) { event.preventDefault(); onToggleSelect(activeId); } break;
        case '?': event.preventDefault(); onShowHelp(); break;
        default: break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, activeId, step, onOpen, onArchive, onMove, onToggleSelect, onShowHelp, onEscape]);

  return { activeId, setActiveId };
}

/**
 * Click a control inside a row from the keyboard. The row owns its own popover
 * state, so reaching for the real trigger is both simpler and more honest than
 * duplicating that state in the table above it.
 */
export function clickRowControl(applicationId: string, selector: string): boolean {
  const control = document.querySelector<HTMLElement>(
    `[data-application-id="${applicationId}"] ${selector}`,
  );
  control?.click();
  return Boolean(control);
}

/**
 * The ranked table's whole keyboard layer, wired to that table's real controls:
 * the row's archive trigger and the bulk bar's move menu. Kept here rather than
 * in RankedTab so the DOM reach-through lives beside the rules that justify it.
 */
export function useRankedTriage({ visibleIds, postingId, onNavigate, onSelect, onToggleSelect }: {
  visibleIds: string[];
  postingId: string;
  onNavigate: (href: string) => void;
  /** Add one id to the selection — the bulk move menu acts on the selection. */
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
}) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activeId, setActiveId } = useRankedKeyboard({
    ids: visibleIds,
    // A modal owns the keyboard while it is open; nothing here competes with it.
    enabled: !isHelpOpen && !isModalOpen,
    onOpen: (id) => onNavigate(`/employer/jobs/${postingId}/applicants/${id}?from=ranked`),
    onArchive: (id) => clickRowControl(id, '.quick-archive-trigger'),
    onMove: (id) => {
      onSelect(id);
      // The bulk bar mounts on selection, so its trigger only exists next frame.
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-bulk-move-trigger]')?.click();
      });
    },
    onToggleSelect,
    onShowHelp: () => setIsHelpOpen(true),
    onEscape: () => setActiveId(null),
  });

  return {
    activeId,
    isHelpOpen,
    openHelp: () => setIsHelpOpen(true),
    closeHelp: () => setIsHelpOpen(false),
    setModalOpen: setIsModalOpen,
  };
}

export default useRankedKeyboard;
