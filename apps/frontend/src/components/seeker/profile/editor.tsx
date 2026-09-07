'use client';
// FILE: src/components/seeker/profile/editor.tsx
// The building blocks of the profile editor: a labelled field, a pill-picker,
// the section header that carries the one Save button, and the error strip.
// Save is the only way a change leaves the page; it is disabled until
// something is dirty and pops a check for a beat when the server agrees.
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

/**
 * Pills. A value that is not in `options` (say, a domain the resume parser
 * invented) is still shown, selected, so it can be turned off. When `max` is
 * reached the others stay clickable: picking one swaps out the oldest choice.
 */
export function Pills({ options, value, onToggle, onReplace, max, icons }: {
  options: string[]; value: string[]; onToggle: (v: string) => void; onReplace?: (next: string[]) => void; max?: number; icons?: Record<string, ReactNode>;
}) {
  const full = !!max && value.length >= max;
  const all = [...value.filter(v => !options.includes(v)), ...options];
  return (
    <div className="pf-pills" role="group">
      {all.map((o, i) => {
        const on = value.includes(o);
        const click = () => {
          if (on || !full || !max) return onToggle(o);
          if (onReplace) return onReplace([...value.slice(1), o]);
          onToggle(o);
        };
        return (
          <button
            key={o} type="button" className="pf-pill press" aria-pressed={on}
            onClick={click} style={{ '--i': Math.min(i, 12) } as React.CSSProperties}
            title={!on && full ? `Replaces ${value[0]}` : undefined}
          >
            {icons?.[o]}{o}{on && <Check size={11} className="pf-pill__check" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** Section header with the Save button. `savedAt` flips a check for a beat after a save lands. */
export function PaneHead({ title, sub, dirty, saving, savedAt, onSave, right }: {
  title: string; sub?: string; dirty: boolean; saving: boolean; savedAt: number | null; onSave: () => void; right?: ReactNode;
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
    <div className="pfx-sec__head">
      <div>
        <span className="pfx-sec__title">{title}</span>
        {sub && <p className="pfx-sec__sub">{sub}</p>}
      </div>
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

/** A read-only section header (experience, education, proof). */
export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="pfx-sec__head">
      <div>
        <span className="pfx-sec__title">{title}</span>
        {sub && <p className="pfx-sec__sub">{sub}</p>}
      </div>
      {right}
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
