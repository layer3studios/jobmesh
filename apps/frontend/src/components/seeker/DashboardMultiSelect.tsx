'use client';
// FILE: src/components/seeker/DashboardMultiSelect.tsx
// Multi-select filter (Experience, Work mode): chip trigger + portalled panel
// of Checkbox primitives. Native checkboxes are never rendered visibly — the
// primitive owns the box, so both themes read from tokens.
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { Checkbox } from '../ui/Checkbox';
import { FilterPanel, FilterTrigger } from './FilterPanel';

interface Option { value: string; label: string; }

export function MultiSelectDropdown({ label, options, selected, onChange, baseStyle }: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (v: string[]) => void;
  baseStyle: CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  const active = selected.length > 0;

  return (
    <>
      <FilterTrigger
        label={active ? `${label} · ${selected.length}` : label}
        active={active}
        open={open}
        onClick={() => setOpen(o => !o)}
        baseStyle={baseStyle}
        triggerRef={triggerRef}
      />
      <FilterPanel open={open} onClose={close} anchorRef={triggerRef} minWidth={200}>
        <div role="group" aria-label={label}>
          {options.map((o, i) => (
            <div key={o.value} className="jb-option rise" style={{ padding: '6px 10px', borderRadius: 7, fontSize: '0.82rem', '--i': Math.min(i, 8) } as React.CSSProperties}>
              <Checkbox label={o.label} checked={selected.includes(o.value)} onChange={() => toggle(o.value)} compact />
            </div>
          ))}
        </div>
        {active && (
          <button
            type="button"
            className="press rise"
            onClick={() => onChange([])}
            style={{
              width: '100%', marginTop: 4, padding: '7px 10px',
              background: 'transparent', border: 'none', borderTop: '1px solid var(--border-hairline)',
              color: 'var(--ink-muted)', fontSize: '0.78rem', cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left',
            }}
          >Clear</button>
        )}
      </FilterPanel>
    </>
  );
}
