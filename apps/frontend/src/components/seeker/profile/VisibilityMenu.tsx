'use client';
// FILE: src/components/seeker/profile/VisibilityMenu.tsx
// Who can open /u/{slug}: a menu of three, because the choice is one value and
// not two independent switches. It opens from the trigger (origin-aware, the
// drawer curve), closes on Escape, outside click or pick, and every row says
// what it means in one line rather than making the label carry it.
import { useEffect, useId, useRef, useState } from 'react';
import { Globe, Lock, ShieldCheck, Check, ChevronDown } from 'lucide-react';
import type { ProfileVisibility } from '../../../types/public-profile';

const OPTIONS: { value: ProfileVisibility; label: string; hint: string; icon: React.ReactNode }[] = [
  { value: 'public', label: 'Public', hint: 'Anyone with the link can read it.', icon: <Globe size={13} /> },
  { value: 'private', label: 'Private', hint: 'Nobody sees it, not even with the link.', icon: <Lock size={13} /> },
  { value: 'recruiters', label: 'Recruiters only', hint: 'Only signed-in employers. Everyone else sees nothing.', icon: <ShieldCheck size={13} /> },
];

export function visibilityLabel(v: ProfileVisibility): string {
  return OPTIONS.find(o => o.value === v)?.label ?? 'Private';
}

export default function VisibilityMenu({ value, onChange, disabled }: {
  value: ProfileVisibility;
  onChange: (v: ProfileVisibility) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const current = OPTIONS.find(o => o.value === value) ?? OPTIONS[1];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown); };
  }, [open]);

  return (
    <div className="pf-vis" ref={wrapRef}>
      <button
        type="button" className="pf-vis__trigger press" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId}
        onClick={() => setOpen(v => !v)}
      >
        {current.icon}
        <span>{current.label}</span>
        <ChevronDown size={13} className="pf-vis__chev" aria-hidden />
      </button>

      <div id={menuId} className="pf-vis__menu glass" role="listbox" data-open={open ? 'true' : 'false'} aria-hidden={!open}>
        {OPTIONS.map((o, i) => (
          <button
            key={o.value} type="button" role="option" aria-selected={o.value === value}
            className="pf-vis__item" tabIndex={open ? 0 : -1}
            style={{ '--i': i } as React.CSSProperties}
            onClick={() => { onChange(o.value); setOpen(false); }}
          >
            <span className="pf-vis__icon" aria-hidden>{o.icon}</span>
            <span className="pf-vis__text">
              <span className="pf-vis__label">{o.label}</span>
              <span className="pf-vis__hint">{o.hint}</span>
            </span>
            {o.value === value && <Check size={14} className="pf-vis__check" aria-hidden />}
          </button>
        ))}
      </div>
    </div>
  );
}
