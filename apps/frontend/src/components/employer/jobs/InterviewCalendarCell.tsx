'use client';
// FILE: src/components/employer/jobs/InterviewCalendarCell.tsx
// One mini-calendar date cell: the day number and up to five 5px status dots
// (green available, blue booked). Trailing other-month days are inert; past
// days stay clickable (to view, not add). Selected gets the accent wash.

import type { CalendarCellData } from './interview-calendar-helpers';

const AVAILABLE_GREEN = 'var(--cat-green)';
const MAX_DOTS = 5;

export default function InterviewCalendarCell({
  cell, isSelected, onSelect,
}: {
  cell: CalendarCellData;
  isSelected: boolean;
  onSelect: (dateIso: string) => void;
}) {
  const dots = [
    ...Array.from({ length: cell.availableCount }, () => AVAILABLE_GREEN),
    ...Array.from({ length: cell.bookedCount }, () => 'var(--accent)'),
  ].slice(0, MAX_DOTS);

  return (
    <button
      type="button"
      data-testid={`calendar-cell-${cell.dateIso}`}
      disabled={!cell.isCurrentMonth}
      aria-pressed={isSelected}
      aria-label={`Select ${cell.dateIso}`}
      onClick={() => { if (!isSelected) onSelect(cell.dateIso); }}
      style={{
        // FIXED height, not min-height: as a grid item the cell would otherwise
        // stretch with the row on tall/zoomed viewports.
        height: 32, fontSize: 12, textAlign: 'center', cursor: cell.isCurrentMonth ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        border: 0, borderRight: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)',
        background: isSelected ? 'var(--accent-soft)' : 'transparent',
        opacity: cell.isCurrentMonth ? 1 : 0.4,
        color: cell.isPast ? 'var(--ink-faint)' : 'var(--ink)',
        fontWeight: isSelected || cell.isToday ? 500 : 400,
        boxShadow: cell.isToday ? 'inset 0 -2px 0 var(--accent)' : 'none',
      }}
    >
      {cell.dayOfMonth}
      {dots.length > 0 && (
        <span style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {dots.map((color, index) => (
            <span key={index} data-testid={`dot-${color === AVAILABLE_GREEN ? 'available' : 'booked'}`}
              style={{ width: 5, height: 5, borderRadius: 999, background: color }} />
          ))}
        </span>
      )}
    </button>
  );
}
