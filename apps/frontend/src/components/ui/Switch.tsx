'use client';
// FILE: src/components/ui/Switch.tsx
// Accessible toggle switch (role="switch").
import { useId, useState } from 'react';
import { TYPE, RADIUS, SHADOW } from '../../theme/tokens';

export function Switch({
  label, checked, onChange, disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  return (
    <label
      htmlFor={id}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1, fontSize: TYPE.base, color: 'var(--ink)',
      }}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          position: 'relative', width: 38, height: 22, flexShrink: 0, border: 'none', padding: 0,
          borderRadius: RADIUS.pill, cursor: 'inherit',
          background: checked ? 'var(--accent)' : 'var(--border-strong)',
          transition: 'background 180ms ease',
          boxShadow: focused ? SHADOW.focus : 'none',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute', top: 2, left: checked ? 18 : 2, width: 18, height: 18,
            borderRadius: '50%', background: 'var(--paper)', transition: 'left 180ms ease',
          }}
        />
      </button>
      {label}
    </label>
  );
}
