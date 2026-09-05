'use client';
// FILE: src/components/employer/jobs/InterviewCalendarGrid.tsx
// The month view: nav arrows + label + colour legend, weekday header row, and
// the 7-column cell grid built from the pure month helper.

import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { InterviewTime } from '@/types/employer-interviews';
import { buildMonthGrid, monthLabel, stepMonth, WEEKDAY_LABELS } from './interview-calendar-helpers';
import InterviewCalendarCell from './InterviewCalendarCell';

// Fixed width so "February 2027" and "May 2026" occupy the same space — the
// arrows must not shift horizontally as the month changes.
const MONTH_LABEL_MIN_WIDTH = 160;

/** Square nav arrow. Uses the shared .icon-btn class for the focus behaviour:
 *  no ring on mouse click, a real ring on keyboard focus. */
function MonthNavButton({ label, onClick, children }: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="icon-btn"
      style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        border: '1px solid var(--border)', background: 'transparent',
        color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-2)' }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: color }} />
      {label}
    </span>
  );
}

export default function InterviewCalendarGrid({
  year, month, times, selectedDate, onSelectDate, onMonthChange,
}: {
  year: number;
  month: number;
  times: InterviewTime[];
  selectedDate: string | null;
  onSelectDate: (dateIso: string) => void;
  onMonthChange: (next: { year: number; month: number }) => void;
}) {
  const cells = buildMonthGrid(year, month, times);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <MonthNavButton label="Previous month" onClick={() => onMonthChange(stepMonth(year, month, -1))}>
          <ChevronLeft size={16} />
        </MonthNavButton>
        <span className="font-display" style={{
          fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)',
          minWidth: MONTH_LABEL_MIN_WIDTH, textAlign: 'center',
        }}>
          {monthLabel(year, month)}
        </span>
        <MonthNavButton label="Next month" onClick={() => onMonthChange(stepMonth(year, month, 1))}>
          <ChevronRight size={16} />
        </MonthNavButton>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 10 }}>
          <LegendDot color="var(--cat-green)" label="available" />
          <LegendDot color="var(--thread-indigo)" label="booked" />
          <LegendDot color="var(--ink-faint)" label="past" />
        </span>
      </div>

      <div className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} style={{ padding: '7px 0', textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{label}</span>
          ))}
        </div>
        <div data-testid="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell) => (
            <InterviewCalendarCell
              key={cell.dateIso}
              cell={cell}
              isSelected={cell.dateIso === selectedDate}
              onSelect={onSelectDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
