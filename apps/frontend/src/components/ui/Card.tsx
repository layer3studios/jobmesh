'use client';
// FILE: src/components/ui/Card.tsx
// Surface container. `variant` (flat|raised) and `padding` (sm|md|lg) are
// opt-in; when omitted the original responsive padding is preserved so
// existing callers render unchanged.
import type { ReactNode, CSSProperties } from 'react';
import { SPACING, SHADOW } from '../../theme/tokens';

type CardVariant = 'flat' | 'raised';
type CardPadding = 'sm' | 'md' | 'lg';

const PADDING: Record<CardPadding, string> = {
  sm: SPACING[3], // 12
  md: SPACING[4], // 16
  lg: SPACING[6], // 24
};

export function Card({
  children, hoverable, variant = 'flat', padding, style, onClick, className = '',
}: {
  children: ReactNode;
  /** `raised` adds an elevation shadow. @default 'flat' */
  variant?: CardVariant;
  /** Token padding. When omitted, a responsive default is used. */
  padding?: CardPadding;
  hoverable?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
}) {
  const pad = padding ? PADDING[padding] : 'clamp(16px, 3vw, 22px)';
  return (
    <div
      onClick={onClick}
      className={`card ${hoverable ? 'hover' : ''} ${className}`}
      style={{
        padding: pad,
        ...(variant === 'raised' ? { boxShadow: SHADOW.md } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
