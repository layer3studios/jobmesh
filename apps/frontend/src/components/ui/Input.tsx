'use client';
// FILE: src/components/ui/Input.tsx
// Text input with optional label, hint, error and icon slots.
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { fieldBaseStyle, focusHandlers, FieldShell } from './forms';

type InputType = 'text' | 'email' | 'password' | 'number' | 'search';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: InputType;
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = 'text', label, hint, error, leftIcon, rightIcon, required, style, className = '', onFocus, onBlur, ...rest },
  ref,
) {
  const fh = focusHandlers<HTMLInputElement>(!!error);
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ controlId, describedBy }) => (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span aria-hidden style={{ position: 'absolute', left: 12, display: 'flex', color: 'var(--ink-faint)', pointerEvents: 'none' }}>{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={controlId}
            type={type}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={className}
            style={{
              ...fieldBaseStyle,
              ...(leftIcon ? { paddingLeft: 38 } : {}),
              ...(rightIcon ? { paddingRight: 38 } : {}),
              ...(error ? { borderColor: 'var(--danger)' } : {}),
              ...style,
            }}
            onFocus={(e) => { fh.onFocus(e); onFocus?.(e); }}
            onBlur={(e) => { fh.onBlur(e); onBlur?.(e); }}
            {...rest}
          />
          {rightIcon && (
            <span aria-hidden style={{ position: 'absolute', right: 12, display: 'flex', color: 'var(--ink-faint)', pointerEvents: 'none' }}>{rightIcon}</span>
          )}
        </div>
      )}
    </FieldShell>
  );
});
