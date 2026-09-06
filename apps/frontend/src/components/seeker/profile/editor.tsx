'use client';
// FILE: src/components/seeker/profile/editor.tsx
// The building blocks of the profile editor pane: a labelled field, a
// pill-picker, and the pane header that carries the one Save button. The
// Save button is the only way a change leaves the page, it is disabled until
// something is dirty, and it pops a check for a beat when the server agrees.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Save } from 'lucide-react';
import { Button } from '../../ui';

export function Field({ label, hint, children, count }: { label: string; hint?: string; children: ReactNode; count?: string }) {
  return (
    <label className="pf-field">
      <span className="pf-field__label">{label}{count && <span className="pf-field__count">{count}</span>}</span>
      {children}
      {hint && <span className="pf-field__hint">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`pf-input${props.className ? ` ${props.className}` : ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`pf-input pf-input--area${props.className ? ` ${props.className}` : ''}`} />;
}

export function Pills({ options, value, onToggle, max, icons }: {
  options: string[]; value: string[]; onToggle: (v: string) => void; max?: number; icons?: Record<string, ReactNode>;
}) {
  const full = !!max && value.length >= max;
  return (
    <div className="pf-pills" role="group">
      {options.map((o, i) => {
        const on = value.includes(o);
        return (
          <button
            key={o} type="button" className="pf-pill" aria-pressed={on} disabled={!on && full}
            onClick={() => onToggle(o)} style={{ '--i': Math.min(i, 12) } as React.CSSProperties}
          >
            {icons?.[o]}{o}
          </button>
        );
      })}
    </div>
  );
}

/** Pane header with the Save button. `saved` flips true for a beat after a save lands. */
export function PaneHead({ title, dirty, saving, savedAt, onSave, right }: {
  title: string; dirty: boolean; saving: boolean; savedAt: number | null; onSave: () => void; right?: ReactNode;
}) {
  const [flash, setFlash] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (savedAt == null) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1400);
    return () => clearTimeout(t);
  }, [savedAt]);
  return (
    <div className="pf-pane__head">
      <span className="ws-section__label">{title}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {right}
        <Button
          size="sm" variant={dirty ? 'primary' : 'secondary'} disabled={!dirty && !flash} loading={saving} onClick={onSave}
          iconLeft={flash ? <Check size={13} className="jb-pop" /> : <Save size={13} />}
          aria-live="polite"
        >
          {flash ? 'Saved' : dirty ? 'Save changes' : 'Saved'}
        </Button>
      </div>
    </div>
  );
}

export function PaneError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="auth-error shake" role="alert" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 0 }}>
      <span>{message}</span>
      <button type="button" className="jb-active__clear press" onClick={onDismiss} style={{ color: 'inherit' }}>Dismiss</button>
    </div>
  );
}

/** Tracks a form against its saved snapshot. */
export function useDirty<T>(saved: T, form: T): boolean {
  return JSON.stringify(saved) !== JSON.stringify(form);
}
