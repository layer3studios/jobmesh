'use client';
// FILE: src/components/ui/Drawer.tsx
// Slide-in panel. `side=right` (desktop) or `side=bottom` (mobile sheet).
import { createPortal } from 'react-dom';
import { useId } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { X } from 'lucide-react';
import { RADIUS, SHADOW, Z, TYPE } from '../../theme/tokens';
import { useFocusTrap } from './useFocusTrap';

type DrawerSide = 'right' | 'bottom';
type DrawerWidth = 'sm' | 'md' | 'lg';
const WIDTH: Record<DrawerWidth, number> = { sm: 320, md: 480, lg: 640 };

export function Drawer({
  isOpen, onClose, title, side = 'right', width = 'md', children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  side?: DrawerSide;
  /** Applies to the right side only. */
  width?: DrawerWidth;
  children: ReactNode;
}) {
  const titleId = useId();
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  if (!isOpen) return null;

  const panel: CSSProperties = side === 'right'
    ? { top: 0, right: 0, height: '100vh', width: '100%', maxWidth: WIDTH[width], borderLeft: '1px solid var(--border)', animation: 'fadeIn 200ms ease' }
    : { left: 0, right: 0, bottom: 0, maxHeight: '85vh', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, borderTop: '1px solid var(--border)', animation: 'sheetSlideUp 240ms cubic-bezier(0.16,1,0.3,1)' };

  return createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: Z.modal, background: 'var(--overlay)', animation: 'fadeIn 160ms ease' }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ position: 'absolute', display: 'flex', flexDirection: 'column', background: 'var(--surface)', boxShadow: SHADOW.lg, ...panel }}
      >
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 id={titleId} style={{ fontSize: TYPE.lg, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{ display: 'flex', border: 'none', background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer', padding: 4, borderRadius: RADIUS.sm }}
          >
            <X size={18} />
          </button>
        </header>
        <div style={{ padding: 20, overflow: 'auto', color: 'var(--ink)', fontSize: TYPE.base, lineHeight: 1.55 }}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
