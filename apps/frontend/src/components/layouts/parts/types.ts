// FILE: src/components/layouts/parts/types.ts
import type { ReactNode, CSSProperties } from 'react';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export const utilityBtn: CSSProperties = {
  width: 38, height: 38, borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--ink-muted)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  flexShrink: 0,
};

export const menuItem: CSSProperties = {
  width: '100%',
  display: 'flex', alignItems: 'center', gap: 9,
  padding: '8px 12px',
  fontSize: '0.875rem', color: 'var(--ink-2)',
  background: 'none', border: 'none', borderRadius: 8,
  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
};

export const mobileMenuButton: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '11px 14px',
  background: 'transparent',
  border: '1px solid var(--border)', borderRadius: 10,
  color: 'var(--ink-2)', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
  textAlign: 'left' as const,
};
