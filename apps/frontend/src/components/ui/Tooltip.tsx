'use client';
// FILE: src/components/ui/Tooltip.tsx
// Lightweight tooltip shown on hover and keyboard focus.
import { useId, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { RADIUS, TYPE, SHADOW, Z } from '../../theme/tokens';

type Position = 'top' | 'bottom' | 'left' | 'right';

const POS: Record<Position, CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
};

export function Tooltip({
  content, children, position = 'top',
}: {
  content: string;
  children: ReactNode;
  position?: Position;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          id={id}
          style={{
            position: 'absolute', ...POS[position], zIndex: Z.toast,
            background: 'var(--ink)', color: 'var(--paper)',
            padding: '6px 9px', borderRadius: RADIUS.sm, fontSize: TYPE.xs,
            fontWeight: 500, whiteSpace: 'nowrap', boxShadow: SHADOW.md,
            pointerEvents: 'none', animation: 'fadeIn 120ms ease',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
