'use client';
// FILE: src/components/seeker/FilterPanel.tsx
// The board's popover panel: a glass surface portalled to <body> and anchored
// to its trigger with useAnchoredPosition, so no overflow ancestor can clip it
// and no native <option> list is ever shown. Owns open/close plumbing
// (outside click, Escape) for both the single- and multi-select filters.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useAnchoredPosition } from '../ui/useAnchoredPosition';
import { Z } from '@/theme/tokens';

export const optionStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.82rem', color: 'var(--text-primary)',
  background: 'transparent', border: 'none', textAlign: 'left',
  position: 'relative',
};

/** The selected option carries the indigo left edge — the only hue in the panel. */
export const selectedOptionStyle: CSSProperties = {
  ...optionStyle, fontWeight: 600,
};

export function FilterTrigger({ label, active, open, pulse, onClick, baseStyle, triggerRef }: {
  label: string; active: boolean; open: boolean; onClick: () => void;
  /** True for a beat after the value changes: the chip pops. */
  pulse?: boolean;
  baseStyle: CSSProperties; triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={triggerRef}
      type="button"
      className={`jb-chip${pulse ? ' jb-pop' : ''}`}
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={open}
      style={{
        ...baseStyle,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        backgroundImage: 'none', paddingRight: 10,
        fontWeight: active ? 600 : 500,
        borderColor: active || open ? 'var(--border-strong)' : 'var(--border)',
        color: active || open ? 'var(--text-primary)' : 'var(--ink-muted)',
      }}
    >
      <span key={label} className="jb-chip__label">{label}</span>
      <ChevronDown size={13} aria-hidden className="jb-chip__chev" style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
    </button>
  );
}

export function FilterPanel({ open, onClose, anchorRef, children, minWidth = 200, maxHeight = 320 }: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
  minWidth?: number;
  /** Taller panels (the More filters dialog) pass their own cap. */
  maxHeight?: number | string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); anchorRef.current?.focus(); } };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      className="jb-panel panel-scroll"
      style={{
        position: 'fixed',
        top: position?.top ?? 0, left: position?.left ?? 0,
        visibility: position ? 'visible' : 'hidden',
        zIndex: Z.dropdown, minWidth, maxHeight, overflowY: 'auto',
        background: 'var(--glass-panel)',
        border: '1px solid var(--border-hairline)', borderRadius: 10,
        boxShadow: 'var(--shadow-md)', padding: 6,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
