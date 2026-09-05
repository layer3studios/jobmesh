'use client';
// FILE: src/components/ui/ActionsMenu.tsx
// A "⋯" trigger and its dropdown. There is no menu primitive in this design system
// yet, so this is it — kept generic (items are data, not markup) so the jobs table
// is not the only surface that can use it.
//
// Keyboard behaviour follows the WAI-ARIA menu-button pattern, because a table row
// action that is mouse-only is unusable for anyone driving the grid from the
// keyboard: Escape closes and restores focus, Arrow keys move, Home/End jump.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { Z } from '@/theme/tokens';
import { useAnchoredPosition } from './useAnchoredPosition';

// Re-exported so existing imports of these from this module keep resolving.
export { useAnchoredPosition } from './useAnchoredPosition';
export type { AnchoredPosition } from './useAnchoredPosition';



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
            background: 'var(--glass-strong)', backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-sat))', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-sat))', border: '1px solid var(--border)',
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
