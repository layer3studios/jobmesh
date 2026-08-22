// FILE: src/components/ui/Badge.tsx
// Small status/label pill. Documented variants: neutral|brand|success|
// warning|danger|info. Legacy aliases (primary|green|red|yellow|blue|acid)
// are retained for existing callers.
import type { ReactNode, CSSProperties } from 'react';
import { RADIUS } from '../../theme/tokens';

type BadgeVariant =
  | 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  | 'primary' | 'green' | 'red' | 'yellow' | 'blue' | 'acid';
type BadgeSize = 'sm' | 'md';

const STYLE: Record<BadgeVariant, CSSProperties> = {
  neutral: { background: 'var(--paper-2)', color: 'var(--ink-muted)' },
  brand: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  success: { background: 'var(--success-soft)', color: 'var(--success)' },
  warning: { background: 'var(--warning-soft)', color: 'var(--warning)' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  info: { background: 'var(--info-soft)', color: 'var(--info)' },
  // legacy aliases
  primary: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  acid: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  green: { background: 'var(--success-soft)', color: 'var(--success)' },
  red: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  yellow: { background: 'var(--warning-soft)', color: 'var(--warning)' },
  blue: { background: 'var(--info-soft)', color: 'var(--info)' },
};

const SIZE: Record<BadgeSize, CSSProperties> = {
  sm: { padding: '2px 7px', fontSize: '0.68rem' },
  md: { padding: '3px 9px', fontSize: '0.7rem' },
};

export function Badge({
  children, variant = 'neutral', size = 'md', style,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        borderRadius: RADIUS.pill, fontFamily: 'inherit', fontWeight: 600,
        letterSpacing: '-0.005em', whiteSpace: 'nowrap',
        border: '1px solid transparent',
        ...SIZE[size], ...STYLE[variant], ...style,
      }}
    >
      {children}
    </span>
  );
}
