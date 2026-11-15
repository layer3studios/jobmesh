'use client';
// FILE: src/components/seeker/DashboardMobileFilters.tsx
// The phone filter strip: one button into the full sheet, then the three
// toggles worth a tap without opening it. What is actually applied is shown by
// the ActiveChips row underneath, not by this strip's count.
import { CheckCircle2, Sparkles, Bell } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { FilterState } from './dashboard/filter-schema';

interface Props {
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  newJobsCount: number;
  activeMobileFilters: number;
  onOpenFilters: () => void;
}

export default function DashboardMobileFilters({
  filters, setFilters, newJobsCount, activeMobileFilters, onOpenFilters,
}: Props) {
  const pill = (active: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 12px',
    borderRadius: 999,
    fontFamily: 'inherit',
    fontSize: '0.78rem',
    fontWeight: 500,
    background: active ? 'var(--accent-soft)' : 'transparent',
    border: '1px solid',
    borderColor: active ? 'var(--accent-mid)' : 'var(--border-strong)',
    color: active ? 'var(--accent)' : 'var(--ink-muted)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      padding: '6px 0',
    }} className="no-scrollbar">
      <button
        type="button"
        onClick={onOpenFilters}
        aria-haspopup="dialog"
        style={{
          ...pill(activeMobileFilters > 0),
          background: activeMobileFilters > 0 ? 'var(--ink)' : 'var(--paper-2)',
          color: activeMobileFilters > 0 ? 'var(--paper)' : 'var(--ink-muted)',
          borderColor: 'transparent',
        }}
      >
        Filters {activeMobileFilters > 0 && `· ${activeMobileFilters}`}
      </button>
      <button
        type="button"
        onClick={() => setFilters({ hideApplied: !filters.hideApplied })}
        aria-pressed={filters.hideApplied}
        style={pill(filters.hideApplied)}
      >
        <CheckCircle2 size={12} aria-hidden /> Hide applied
      </button>
      <button
        type="button"
        onClick={() => setFilters({ entryLevel: !filters.entryLevel })}
        aria-pressed={filters.entryLevel}
        style={pill(filters.entryLevel)}
      >
        <Sparkles size={12} aria-hidden /> Fresher
      </button>
      <button
        type="button"
        onClick={() => setFilters({ newOnly: !filters.newOnly })}
        aria-pressed={filters.newOnly}
        style={pill(filters.newOnly)}
      >
        <Bell size={12} aria-hidden /> New only {newJobsCount > 0 && `· ${newJobsCount}`}
      </button>
    </div>
  );
}
