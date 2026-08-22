'use client';
// FILE: src/components/employer/jobs/TimeChipGrid.tsx
// The tappable time-chip grid: a group of toggle buttons (role="group", each
// chip a real <button> with aria-pressed, so Space/Enter toggling and focus
// come for free). Selected chips are filled with a check; already-pooled chips
// are disabled and read "Added".

import type { TimeChip } from './time-chip-helpers';

const CHIP_BASE_STYLE = {
  minWidth: 70, padding: '5px 12px', borderRadius: 6, fontSize: 12,
  cursor: 'pointer', border: '0.5px solid var(--border)',
} as const;

export default function TimeChipGrid({
  chips, selectedIstLocals, onToggle,
}: {
  chips: TimeChip[];
  selectedIstLocals: Set<string>;
  onToggle: (istLocal: string) => void;
}) {
  if (chips.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>No selectable times left on this date.</p>;
  }
  return (
    <div role="group" aria-label="Pick interview times" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {chips.map((chip) => {
        const selected = selectedIstLocals.has(chip.istLocal);
        return (
          <button
            key={chip.istLocal}
            type="button"
            aria-pressed={selected}
            disabled={chip.alreadyAdded}
            onClick={() => onToggle(chip.istLocal)}
            style={{
              ...CHIP_BASE_STYLE,
              background: selected ? 'var(--accent)' : chip.alreadyAdded ? 'var(--surface-sunken)' : 'var(--surface-sunken)',
              color: selected ? 'var(--text-on-accent)' : chip.alreadyAdded ? 'var(--ink-faint)' : 'var(--ink)',
              border: chip.alreadyAdded ? 'none' : `0.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
              cursor: chip.alreadyAdded ? 'not-allowed' : 'pointer',
              fontWeight: selected ? 700 : 500,
            }}
          >
            {chip.alreadyAdded ? `${chip.label} · ${chip.existingStatus === 'booked' ? 'booked' : 'added'}` : selected ? `${chip.label} ✓` : chip.label}
          </button>
        );
      })}
    </div>
  );
}
