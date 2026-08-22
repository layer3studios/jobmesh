'use client';
// FILE: src/components/ui/Button.tsx
// Primary action primitive. Variants, sizes, loading + icon slots.
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Spinner } from './Spinner';
import { RADIUS, MOTION, SHADOW } from '../../theme/tokens';

type Size = 'sm' | 'md' | 'lg';
/** `primary|secondary|ghost|danger|link` are the documented set;
 *  `success|outline` are retained for existing callers. */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'success' | 'outline';

const BASE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  fontFamily: 'inherit', fontWeight: 500, letterSpacing: '-0.005em',
  border: '1px solid transparent', borderRadius: RADIUS.md, cursor: 'pointer',
  textDecoration: 'none', lineHeight: 1,
  transition: `all ${MOTION.normal} ${MOTION.ease}`,
  whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent',
};

const SIZE: Record<Size, CSSProperties> = {
  sm: { fontSize: '0.8125rem', padding: '7px 14px', minHeight: 32 },
  md: { fontSize: '0.875rem', padding: '9px 18px', minHeight: 38 },
  lg: { fontSize: '0.9375rem', padding: '12px 22px', minHeight: 44 },
};

const VARIANT: Record<Variant, CSSProperties> = {
  primary: { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' },
  secondary: { background: 'var(--paper-2)', color: 'var(--ink)', borderColor: 'var(--border)' },
  ghost: { background: 'transparent', color: 'var(--ink-2)', borderColor: 'var(--border)' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)', borderColor: 'transparent' },
  link: { background: 'transparent', color: 'var(--link)', borderColor: 'transparent', padding: '0', minHeight: 0, textDecoration: 'underline' },
  success: { background: 'var(--success-soft)', color: 'var(--success)', borderColor: 'transparent' },
  outline: { background: 'transparent', color: 'var(--ink)', borderColor: 'var(--border-strong)' },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default 'primary' */
  variant?: Variant;
  /** @default 'md' */
  size?: Size;
  /** Shows a spinner and blocks interaction. */
  loading?: boolean;
  /** Icon rendered before the label. */
  iconLeft?: ReactNode;
  /** Icon rendered after the label. */
  iconRight?: ReactNode;
  /** Stretch to the width of the container. */
  fullWidth?: boolean;
  children: ReactNode;
  /** Render as an anchor instead of a button. */
  as?: 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  className?: string;
}

export function Button({
  variant = 'primary', size = 'md', loading, iconLeft, iconRight, fullWidth,
  children, style, as: Tag = 'button', href, className = '', onFocus, onBlur, ...rest
}: ButtonProps) {
  const isLink = variant === 'link';
  const merged: CSSProperties = {
    ...BASE, ...(isLink ? {} : SIZE[size]), ...VARIANT[variant],
    ...(fullWidth ? { width: '100%' } : {}),
    ...(loading ? { opacity: 0.65, cursor: 'not-allowed' } : {}),
    ...style,
  };
  const focusRing = (on: boolean) => (e: { currentTarget: HTMLElement }) => {
    e.currentTarget.style.boxShadow = on ? SHADOW.focus : 'none';
  };
  const inner = (
    <>
      {loading ? <Spinner size={14} /> : iconLeft}
      {children}
      {!loading && iconRight}
    </>
  );

  if (Tag === 'a') {
    return (
      <a href={href} className={className} style={merged}
        onFocus={(e) => { focusRing(true)(e); onFocus?.(e as never); }}
        onBlur={(e) => { focusRing(false)(e); onBlur?.(e as never); }}
        {...(rest as object)}>{inner}</a>
    );
  }
  return (
    <button disabled={loading || rest.disabled} className={className} style={merged}
      aria-busy={loading || undefined}
      onFocus={(e) => { focusRing(true)(e); onFocus?.(e); }}
      onBlur={(e) => { focusRing(false)(e); onBlur?.(e); }}
      {...rest}>{inner}</button>
  );
}
