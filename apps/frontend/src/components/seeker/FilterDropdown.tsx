'use client';
// FILE: src/components/seeker/FilterDropdown.tsx
// Single-select filter: a chip trigger and a portalled listbox (FilterPanel).
// Replaces the native <select> in the filter row so the option list is themed
// in both modes — the browser's own menu ignores the token system.
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { FilterPanel, FilterTrigger, optionStyle, selectedOptionStyle } from './FilterPanel';

interface Option { value: string; label: string; }

export function FilterDropdown({ label, options, value, onChange, baseStyle, minWidth }: {
  /** Shown on the trigger when nothing (or the "all" option) is selected. */
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  baseStyle: CSSProperties;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const current = options.find(o => o.value === value);
  const active = !!current && current.value !== 'all' && current.value !== '';

  return (
    <>
      <FilterTrigger
        label={active && current ? current.label : label}
        active={active}
        open={open}
        onClick={() => setOpen(o => !o)}
        baseStyle={baseStyle}
        triggerRef={triggerRef}
      />
      <FilterPanel open={open} onClose={close} anchorRef={triggerRef} minWidth={minWidth}>
        <div role="listbox" aria-label={label}>
          {options.map(o => {
            const selected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                className="jb-option"
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={selected ? selectedOptionStyle : optionStyle}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </FilterPanel>
    </>
  );
}
