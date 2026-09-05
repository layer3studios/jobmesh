'use client';
// FILE: src/components/ui/Checkbox.tsx
// Accessible checkbox: visually-hidden native input + custom box.
import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import { TYPE, RADIUS, SHADOW } from '../../theme/tokens';

export function Checkbox({
  label, checked, onChange, disabled, error, compact,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  /** Dense variant for filter panels: 0.82rem label. */
  compact?: boolean;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  // Indigo is the one hue a checked control may carry; unchecked is a bare hairline.
  const borderColor = error ? 'var(--danger)' : checked ? 'var(--thread-indigo)' : 'var(--border-strong)';
  return (
    <label
      htmlFor={id}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1, fontSize: compact ? '0.82rem' : TYPE.base, color: 'var(--text-primary)',
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
            background: checked ? 'var(--thread-indigo)' : 'transparent',
            transition: 'all 150ms ease', pointerEvents: 'none',
            boxShadow: focused ? SHADOW.focus : 'none',
          }}
        >
          {checked && <Check size={13} strokeWidth={3} color="var(--on-indigo)" />}
        </span>
      </span>
      {label}
    </label>
  );
}
