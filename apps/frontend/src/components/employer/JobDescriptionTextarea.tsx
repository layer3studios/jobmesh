'use client';
// FILE: src/components/employer/JobDescriptionTextarea.tsx
// Auto-growing description field. Wraps react-textarea-autosize but reuses the
// design system's FieldShell + fieldBaseStyle + focus ring so it is visually
// indistinguishable from the Textarea primitive. minRows/maxRows cap growth so a
// huge JD paste scrolls internally instead of pushing the submit button off-screen (R2).

import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import type { TextareaAutosizeProps } from 'react-textarea-autosize';
import { fieldBaseStyle, focusHandlers, FieldShell } from '@/components/ui';

interface Props extends Omit<TextareaAutosizeProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  style?: CSSProperties;
}

export const JobDescriptionTextarea = forwardRef<HTMLTextAreaElement, Props>(
  function JobDescriptionTextarea(
    { label, hint, error, required, style, className = '', onFocus, onBlur, ...rest },
    ref,
  ) {
    const fh = focusHandlers<HTMLTextAreaElement>(!!error);
    return (
      <FieldShell label={label} hint={hint} error={error} required={required}>
        {({ controlId, describedBy }) => (
          <TextareaAutosize
            ref={ref}
            id={controlId}
            minRows={10}
            maxRows={30}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={className}
            // TextareaAutosize narrows `style` (height?: number, no min/maxHeight);
            // our merged object sets no height, so the cast is safe.
            style={{
              ...fieldBaseStyle,
              resize: 'none',
              boxSizing: 'border-box',
              ...(error ? { borderColor: 'var(--danger)' } : {}),
              ...style,
            } as TextareaAutosizeProps['style']}
            onFocus={(event) => { fh.onFocus(event); onFocus?.(event); }}
            onBlur={(event) => { fh.onBlur(event); onBlur?.(event); }}
            {...rest}
          />
        )}
      </FieldShell>
    );
  },
);
