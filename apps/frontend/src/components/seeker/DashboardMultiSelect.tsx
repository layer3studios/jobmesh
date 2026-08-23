'use client';
// FILE: src/components/seeker/DashboardMultiSelect.tsx
// A checkbox dropdown for one filter facet (role, experience, workplace). Split out
// of DashboardFilterBar.tsx (naming conventions section 2).

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Z } from '@/theme/tokens';

interface Option { value: string; label: string; }

/** Dense LinkedIn-style multi-select: trigger button + checkbox popover. */
export function MultiSelectDropdown({ label, options, selected, onChange, baseStyle }: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (v: string[]) => void;
  baseStyle: CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  const active = selected.length > 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          ...baseStyle,
          fontWeight: active ? 600 : 400,
          borderColor: active ? 'var(--accent)' : 'var(--border-strong)',
          color: active ? 'var(--accent)' : 'var(--ink)',
        }}
      >
        {label}{active ? ` · ${selected.length}` : ''}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: Z.dropdown,
          minWidth: 190, background: 'var(--surface)',
          border: '1px solid var(--border-strong)', borderRadius: 10,
          boxShadow: 'var(--shadow-md)', padding: 6,
        }}>
          {options.map(o => (
            <label
              key={o.value}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 7, cursor: 'pointer',
                fontSize: '0.82rem', color: 'var(--ink)',
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggle(o.value)}
                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              {o.label}
            </label>
          ))}
          {active && (
            <button
              onClick={() => onChange([])}
              style={{
                width: '100%', marginTop: 4, padding: '6px 8px',
                background: 'transparent', border: 'none', borderTop: '1px solid var(--border)',
                color: 'var(--ink-muted)', fontSize: '0.78rem', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
              }}
            >Clear</button>
          )}
        </div>
      )}
    </div>
  );
}
