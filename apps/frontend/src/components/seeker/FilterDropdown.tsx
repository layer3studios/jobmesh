'use client';
// FILE: src/components/seeker/FilterDropdown.tsx
// Single-select filter: a chip trigger and a portalled listbox (FilterPanel).
// Replaces the native <select> in the filter row so the option list is themed
// in both modes — the browser's own menu ignores the token system.
//
// Picking an option is felt before it is applied: the row flashes and
// presses, the list closes a beat later, and the trigger pops as its label
// changes. Arrow keys walk the list; the selected row is scrolled into view
// when the list opens.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { FilterPanel, FilterTrigger, optionStyle, selectedOptionStyle } from './FilterPanel';

interface Option { value: string; label: string; }

const PICK_DELAY_MS = 160;

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
  const [picked, setPicked] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = useCallback(() => setOpen(false), []);

  const current = options.find(o => o.value === value);
  const active = !!current && current.value !== 'all' && current.value !== '';

  // The selected row is brought into view as the list opens.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  // The trigger pops once each time its value changes.
  const firstValue = useRef(true);
  useEffect(() => {
    if (firstValue.current) { firstValue.current = false; return; }
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 360);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const pick = (v: string) => {
    if (timer.current) return;
    setPicked(v);
    timer.current = setTimeout(() => {
      timer.current = null;
      onChange(v);
      setOpen(false);
      setPicked(null);
    }, PICK_DELAY_MS);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next = items[(idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
    next?.focus();
    next?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <>
      <FilterTrigger
        label={active && current ? current.label : label}
        active={active}
        open={open}
        pulse={pulse}
        onClick={() => setOpen(o => !o)}
        baseStyle={baseStyle}
        triggerRef={triggerRef}
      />
      <FilterPanel open={open} onClose={close} anchorRef={triggerRef} minWidth={minWidth}>
        <div ref={listRef} role="listbox" aria-label={label} onKeyDown={onListKey}>
          {options.map((o, i) => {
            const selected = o.value === value;
            const isPicked = picked === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`jb-option rise${selected ? ' jb-option--selected' : ''}${isPicked ? ' jb-option--picked' : ''}`}
                onClick={() => pick(o.value)}
                style={{ ...(selected ? selectedOptionStyle : optionStyle), '--i': Math.min(i, 8) } as React.CSSProperties}
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
