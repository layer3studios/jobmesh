'use client';
// FILE: src/components/ui/Select.tsx
// Styled native select with label/hint/error. Accepts `options` or children.
import { forwardRef } from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { fieldBaseStyle, focusHandlers, FieldShell } from './forms';

export interface SelectOption { value: string; label: string }

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options?: SelectOption[];
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, placeholder, options, required, style, className = '', children, onFocus, onBlur, ...rest },
  ref,
) {
  const fh = focusHandlers<HTMLSelectElement>(!!error);
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ controlId, describedBy }) => (
        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            id={controlId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={className}
            style={{
              ...fieldBaseStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer',
              ...(error ? { borderColor: 'var(--danger)' } : {}),
              ...style,
            }}
            onFocus={(e) => { fh.onFocus(e); onFocus?.(e); }}
            onBlur={(e) => { fh.onBlur(e); onBlur?.(e); }}
            {...rest}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options
              ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
              : children}
          </select>
          <ChevronDown
            size={16}
            aria-hidden
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }}
          />
        </div>
      )}
    </FieldShell>
  );
});
