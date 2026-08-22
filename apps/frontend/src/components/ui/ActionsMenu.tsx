'use client';
// FILE: src/components/ui/ActionsMenu.tsx
// A "⋯" trigger and its dropdown. There is no menu primitive in this design system
// yet, so this is it — kept generic (items are data, not markup) so the jobs table
// is not the only surface that can use it.
//
// Keyboard behaviour follows the WAI-ARIA menu-button pattern, because a table row
// action that is mouse-only is unusable for anyone driving the grid from the
// keyboard: Escape closes and restores focus, Arrow keys move, Home/End jump.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { Z } from '@/theme/tokens';

/** Viewport gap between the trigger and the panel, and from the viewport edge. */
const ANCHOR_GAP = 4;
const VIEWPORT_MARGIN = 8;

export interface AnchoredPosition { top: number; left: number }

/**
 * Position a floating panel against a trigger, in VIEWPORT coordinates.
 *
 * Pair this with `position: fixed` and a portal to document.body. An
 * absolutely-positioned panel is laid out inside its nearest positioned ancestor,
 * so any ancestor with `overflow: auto/hidden` either clips it or grows a
 * scrollbar to contain it — which is exactly what the jobs table (overflow:auto),
 * the ranked table and the pipeline column (overflow:hidden) were doing. Taking
 * the panel out of the document flow entirely is the only fix that holds
 * regardless of what wraps the trigger.
 *
 * Because the panel no longer participates in layout, it also cannot lengthen the
 * page — so no body scroll-lock is needed, and none is applied (locking would
 * itself shift the layout by the scrollbar width).
 *
 * Recomputed on scroll (capture-phase, so ancestor scrollers count) and resize,
 * so a fixed panel stays glued to its trigger instead of drifting.
 */
export function useAnchoredPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
): AnchoredPosition | null {
  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  const measure = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? 0;
    const height = panel?.offsetHeight ?? 0;

    // Flip above when there is not enough room below for the real panel height.
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipAbove = height > 0 && spaceBelow < height + ANCHOR_GAP + VIEWPORT_MARGIN;
    const top = flipAbove ? rect.top - height - ANCHOR_GAP : rect.bottom + ANCHOR_GAP;

    // Right-aligned to the trigger, then clamped so it never leaves the viewport.
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.right - width, maxLeft));

    setPosition({ top: Math.max(VIEWPORT_MARGIN, top), left });
  }, [anchorRef, panelRef]);

  // Layout effect so the first paint is already in the right place — a passive
  // effect would show one frame at the top-left corner.
  useLayoutEffect(() => {
    if (!isOpen) { setPosition(null); return; }
    measure();
  }, [isOpen, measure]);

  useEffect(() => {
    if (!isOpen) return;
    const onChange = () => measure();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [isOpen, measure]);

  return position;
}
export interface ActionsMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  /** Renders in --danger and is separated from the safe actions above it. */
  danger?: boolean;
  disabled?: boolean;
  /**
   * Why this item is unavailable, as a VISIBLE second line — not a tooltip.
   * A tooltip is unreachable on touch and invisible to anyone who does not happen
   * to hover, so a disabled control whose only explanation is a tooltip reads as
   * simply broken.
   */
  description?: string;
  /** Draws a hairline above this item. */
  dividerBefore?: boolean;
}

const MENU_WIDTH = 240;

export function ActionsMenu({
  items, label = 'More actions',
}: { items: ActionsMenuItem[]; label?: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const position = useAnchoredPosition(triggerRef, menuRef, isOpen);

  const enabled = items.filter((item) => !item.disabled);

  useEffect(() => { if (isOpen) setActiveIndex(0); }, [isOpen]);

  // Focus follows the active item so the screen reader announces each one as the
  // arrow keys move, rather than the menu staying silent until Enter.
  useEffect(() => {
    if (!isOpen) return;
    const node = menuRef.current?.querySelectorAll<HTMLButtonElement>('[data-menu-item]')[activeIndex];
    node?.focus();
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  const close = (restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); return; }
    if (event.key === 'Tab') { close(false); return; }
    if (enabled.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % enabled.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + enabled.length) % enabled.length);
    } else if (event.key === 'Home') {
      event.preventDefault(); setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault(); setActiveIndex(enabled.length - 1);
    }
  };

  return (
    // Every event stops here: the jobs table row navigates on click, so opening
    // the menu must never also open the posting.
    <span
      style={{ display: 'inline-flex' }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="actions-menu-trigger"
        onClick={() => setIsOpen((open) => !open)}
      >
        <MoreHorizontal size={16} aria-hidden />
      </button>
      {/* Portalled to <body> and fixed-positioned so no ancestor's overflow can
          clip it or grow a scrollbar to contain it. Rendered off-screen for the
          first paint (position === null) so it can be measured before placement. */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          onClick={(event) => event.stopPropagation()}
          style={{
            position: 'fixed', zIndex: Z.dropdown,
            top: position?.top ?? 0, left: position?.left ?? 0,
            visibility: position ? 'visible' : 'hidden',
            minWidth: MENU_WIDTH, padding: 4, borderRadius: 10,
            background: 'var(--surface-raised)', border: '0.5px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {items.map((item) => (
            <div key={item.id}>
              {item.dividerBefore && (
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              )}
              <button
                type="button"
                role="menuitem"
                data-menu-item={item.disabled ? undefined : ''}
                disabled={item.disabled}
                tabIndex={-1}
                className="actions-menu-item"
                data-danger={item.danger ? 'true' : undefined}
                onClick={() => { close(false); item.onSelect(); }}
              >
                {item.label}
                {item.description && (
                  <span style={{
                    display: 'block', marginTop: 2, fontSize: 11, lineHeight: 1.4,
                    color: 'var(--ink-faint)', whiteSpace: 'normal',
                  }}>
                    {item.description}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </span>
  );
}
