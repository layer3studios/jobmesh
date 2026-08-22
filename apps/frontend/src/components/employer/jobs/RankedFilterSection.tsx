'use client';
// FILE: src/components/employer/jobs/RankedFilterSection.tsx
// One collapsible sidebar section: uppercase header + chevron toggle. Open
// state is session-only React state (not persisted), seeded by defaultOpen.

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function RankedFilterSection({
  label, suffix, defaultOpen = false, children,
}: {
  label: string;
  /** Muted count next to the label, e.g. the unique skill count. */
  suffix?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 6, background: 'none', border: 0, padding: '4px 0', cursor: 'pointer' }}
      >
        <span style={{
          flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 500,
          letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-2)',
        }}>
          {label}{suffix && <span style={{ marginLeft: 6, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-faint)' }}>{suffix}</span>}
        </span>
        {open ? <ChevronUp size={14} style={{ color: 'var(--ink-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--ink-muted)' }} />}
      </button>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>{children}</div>}
    </div>
  );
}

/** A checkbox/radio row shared by the sidebar sections. */
export function FilterOptionRow({
  label, checked, onToggle, count, dotColor, type = 'checkbox', name,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  count?: number | null;
  dotColor?: string;
  type?: 'checkbox' | 'radio';
  name?: string;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 6,
      cursor: 'pointer', fontSize: 13, color: 'var(--ink)',
      background: checked ? 'var(--accent-soft)' : 'transparent',
    }}>
      <input type={type} name={name} checked={checked} onChange={onToggle} style={{ accentColor: 'var(--accent)' }} />
      {dotColor && <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: dotColor, flexShrink: 0 }} />}
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{count}</span>}
    </label>
  );
}
