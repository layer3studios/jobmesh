'use client';
// FILE: src/components/ui/Modal.tsx
// Accessible modal dialog: portal, focus trap, Escape + overlay close.
import { createPortal } from 'react-dom';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { RADIUS, SHADOW, Z, TYPE } from '../../theme/tokens';
import { useFocusTrap } from './useFocusTrap';

type ModalSize = 'sm' | 'md' | 'lg';
const WIDTH: Record<ModalSize, number> = { sm: 400, md: 560, lg: 720 };

export function Modal({
  isOpen, onClose, title, size = 'md', children, footer, closeOnOverlayClick = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
}) {
  const titleId = useId();
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  if (!isOpen) return null;

  return createPortal(
    <div
      onMouseDown={(e) => { if (closeOnOverlayClick && e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.modal,
        background: 'var(--overlay)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, animation: 'fadeIn 160ms ease',
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: '100%', maxWidth: WIDTH[size], maxHeight: '90vh', overflow: 'auto',
          background: 'var(--surface)', borderRadius: RADIUS.xl, boxShadow: SHADOW.lg,
          border: '1px solid var(--border)', animation: 'scaleIn 180ms ease',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 id={titleId} style={{ fontSize: TYPE.lg, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ display: 'flex', border: 'none', background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer', padding: 4, borderRadius: RADIUS.sm }}
          >
            <X size={18} />
          </button>
        </header>
        <div style={{ padding: 20, color: 'var(--ink)', fontSize: TYPE.base, lineHeight: 1.55 }}>{children}</div>
        {footer && <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--border)' }}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
