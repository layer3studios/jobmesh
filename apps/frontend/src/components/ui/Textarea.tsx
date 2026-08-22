'use client';
// FILE: src/components/ui/Textarea.tsx
// Multi-line text field with optional auto-grow.
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { fieldBaseStyle, focusHandlers, FieldShell } from './forms';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Grow height to fit content as the user types. */
  autoGrow?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, autoGrow, rows = 4, required, style, className = '', onFocus, onBlur, onInput, ...rest },
  ref,
) {
  const fh = focusHandlers<HTMLTextAreaElement>(!!error);
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ controlId, describedBy }) => (
        <textarea
          ref={ref}
          id={controlId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={className}
          style={{ ...fieldBaseStyle, resize: autoGrow ? 'none' : 'vertical', minHeight: 88, ...style }}
          onInput={(e) => {
            if (autoGrow) {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
            }
            onInput?.(e);
          }}
          onFocus={(e) => { fh.onFocus(e); onFocus?.(e); }}
          onBlur={(e) => { fh.onBlur(e); onBlur?.(e); }}
          {...rest}
        />
      )}
    </FieldShell>
  );
});
