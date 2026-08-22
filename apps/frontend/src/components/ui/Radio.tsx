'use client';
// FILE: src/components/ui/Radio.tsx
// Accessible radio group.
import { useId, useState } from 'react';
import { TYPE, SHADOW } from '../../theme/tokens';

export interface RadioOption { value: string; label: string }

export function Radio({
  options, value, onChange, direction = 'vertical', disabled, name,
}: {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
  name?: string;
}) {
  const auto = useId();
  const groupName = name ?? auto;
  const [focusedValue, setFocusedValue] = useState<string | null>(null);
  return (
    <div
      role="radiogroup"
      style={{ display: 'flex', flexDirection: direction === 'horizontal' ? 'row' : 'column', gap: direction === 'horizontal' ? 16 : 10, flexWrap: 'wrap' }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <label
            key={opt.value}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.55 : 1, fontSize: TYPE.base, color: 'var(--ink)',
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex', width: 18, height: 18, flexShrink: 0 }}>
              <input
                type="radio"
                name={groupName}
                value={opt.value}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                onFocus={() => setFocusedValue(opt.value)}
                onBlur={() => setFocusedValue(null)}
                style={{ position: 'absolute', opacity: 0, width: 18, height: 18, margin: 0, cursor: 'inherit' }}
              />
              <span
                aria-hidden
                style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
                  borderRadius: '50%', background: 'var(--surface)', transition: 'all 150ms ease',
                  boxShadow: focusedValue === opt.value ? SHADOW.focus : 'none', pointerEvents: 'none',
                }}
              >
                {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
              </span>
            </span>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
