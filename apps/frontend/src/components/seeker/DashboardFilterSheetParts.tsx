'use client';
// FILE: src/components/seeker/DashboardFilterSheetParts.tsx
import type { ReactNode } from 'react';

export function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: '0.74rem', fontWeight: 500, color: 'var(--ink-muted)',
        marginBottom: 8, letterSpacing: '0.01em',
      }}>{label}</p>
      {children}
    </div>
  );
}

export function MultiChips({ values, options, onToggle, disabledWhenUnselected = false }: {
  values: string[];
  options: { value: string; label: string }[];
  onToggle: (v: string) => void;
  /** When true, unselected chips are disabled (e.g. selection cap reached). */
  disabledWhenUnselected?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const active = values.includes(o.value);
        const disabled = !active && disabledWhenUnselected;
        return (
          <button
            key={o.value}
            onClick={() => !disabled && onToggle(o.value)}
            disabled={disabled}
            style={{
              padding: '7px 12px', borderRadius: 999,
              fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500,
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--paper)' : 'var(--ink-2)',
              border: '1px solid', borderColor: active ? 'var(--ink)' : 'var(--border-strong)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.45 : 1,
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

export function Chips({ value, options, onChange }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '7px 12px', borderRadius: 999,
              fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500,
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--paper)' : 'var(--ink-2)',
              border: '1px solid', borderColor: active ? 'var(--ink)' : 'var(--border-strong)',
              cursor: 'pointer',
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}
