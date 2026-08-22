'use client';
// FILE: src/components/ui/forms.tsx
// Shared form-field building blocks consumed by Input/Select/Textarea and the
// toggle controls. Public field components live in their own files.
import { useId } from 'react';
import type { ReactNode, CSSProperties, FocusEvent } from 'react';
import { RADIUS, TYPE, SHADOW } from '../../theme/tokens';

/** Base visual style shared by text inputs, selects and textareas. */
export const fieldBaseStyle: CSSProperties = {
  width: '100%', padding: '10px 12px',
  fontFamily: 'inherit', fontSize: TYPE.base,
  background: 'var(--surface)', color: 'var(--ink)',
  border: '1px solid var(--border-strong)', borderRadius: RADIUS.md,
  outline: 'none', transition: 'border-color 180ms ease, box-shadow 180ms ease',
};

/** onFocus/onBlur handlers that draw the accent ring and restore on blur. */
export function focusHandlers<T extends HTMLElement>(hasError?: boolean) {
  return {
    onFocus: (e: FocusEvent<T>) => {
      e.currentTarget.style.borderColor = 'var(--accent)';
      e.currentTarget.style.boxShadow = SHADOW.focus;
    },
    onBlur: (e: FocusEvent<T>) => {
      e.currentTarget.style.borderColor = hasError ? 'var(--danger)' : 'var(--border-strong)';
      e.currentTarget.style.boxShadow = 'none';
    },
  };
}

export function Label({ children, htmlFor, required }: { children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: 6, fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)' }}>
      {children}
      {required && <span aria-hidden style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
    </label>
  );
}

/**
 * Wraps a control with its label, hint and error message and wires up the
 * accessible ids. Pass the generated `controlId`/`describedBy` into the child.
 */
export function FieldShell({
  label, hint, error, required, children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Receives the id to attach to the control + aria-describedby target id. */
  children: (ids: { controlId: string; describedBy?: string }) => ReactNode;
}) {
  const controlId = useId();
  const msgId = `${controlId}-msg`;
  const describedBy = error || hint ? msgId : undefined;
  return (
    <div style={{ width: '100%' }}>
      {label && <Label htmlFor={controlId} required={required}>{label}</Label>}
      {children({ controlId, describedBy })}
      {error
        ? <p id={msgId} role="alert" style={{ color: 'var(--danger)', fontSize: TYPE.xs, marginTop: 5, fontWeight: 500 }}>{error}</p>
        : hint ? <p id={msgId} style={{ color: 'var(--ink-faint)', fontSize: TYPE.xs, marginTop: 5 }}>{hint}</p> : null}
    </div>
  );
}

/** Simple label + hint wrapper retained for existing callers. */
export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p style={{ color: 'var(--ink-faint)', fontSize: TYPE.xs, marginTop: 5 }}>{hint}</p>}
    </div>
  );
}
