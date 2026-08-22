'use client';
// FILE: src/components/ui/Checkbox.tsx
// Accessible checkbox: visually-hidden native input + custom box.
import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import { TYPE, RADIUS, SHADOW } from '../../theme/tokens';

export function Checkbox({
  label, checked, onChange, disabled, error,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? 'var(--danger)' : checked ? 'var(--accent)' : 'var(--border-strong)';
  return (
    <label
      htmlFor={id}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1, fontSize: TYPE.base, color: 'var(--ink)',
      }}
    >
      <span style={{ position: 'relative', display: 'inline-flex', width: 18, height: 18, flexShrink: 0 }}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ position: 'absolute', opacity: 0, width: 18, height: 18, margin: 0, cursor: 'inherit' }}
        />
        <span
          aria-hidden
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${borderColor}`, borderRadius: RADIUS.xs,
            background: checked ? 'var(--accent)' : 'var(--surface)',
            transition: 'all 150ms ease', pointerEvents: 'none',
            boxShadow: focused ? SHADOW.focus : 'none',
          }}
        >
          {checked && <Check size={13} strokeWidth={3} color="var(--paper)" />}
        </span>
      </span>
      {label}
    </label>
  );
}
