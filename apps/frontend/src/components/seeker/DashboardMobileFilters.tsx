'use client';
// FILE: src/components/seeker/DashboardMobileFilters.tsx
import { CheckCircle2, Sparkles, Bell } from 'lucide-react';
import type { CSSProperties } from 'react';

interface Props {
  hideApplied: boolean;
  entryLevelFilter: boolean;
  showNewOnly: boolean;
  newJobsCount: number;
  setHideApplied: (v: boolean) => void;
  setEntryLevelFilter: (v: boolean) => void;
  setShowNewOnly: (v: boolean) => void;
  setSp: (fn: (sp: URLSearchParams) => void) => void;
  activeMobileFilters: number;
  onOpenFilters: () => void;
}

export default function DashboardMobileFilters({
  hideApplied, entryLevelFilter, showNewOnly, newJobsCount,
  setHideApplied, setEntryLevelFilter, setShowNewOnly, setSp,
  activeMobileFilters, onOpenFilters,
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
        onClick={onOpenFilters}
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
        onClick={() => { setHideApplied(!hideApplied); setSp(sp => { if (!hideApplied) sp.set('hideApplied', '1'); else sp.delete('hideApplied'); sp.delete('page'); }); }}
        style={pill(hideApplied)}
      >
        <CheckCircle2 size={12} /> Hide applied
      </button>
      <button
        onClick={() => { setEntryLevelFilter(!entryLevelFilter); setSp(sp => { if (!entryLevelFilter) sp.set('entry', '1'); else sp.delete('entry'); sp.delete('page'); }); }}
        style={pill(entryLevelFilter)}
      >
        <Sparkles size={12} /> Fresher
      </button>
      <button
        onClick={() => { setShowNewOnly(!showNewOnly); setSp(sp => { if (!showNewOnly) sp.set('newOnly', '1'); else sp.delete('newOnly'); sp.delete('page'); }); }}
        style={pill(showNewOnly)}
      >
        <Bell size={12} /> New only {newJobsCount > 0 && `· ${newJobsCount}`}
      </button>

    </div>
  );
}
