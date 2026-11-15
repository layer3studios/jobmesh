'use client';
// FILE: src/components/seeker/DashboardFilterSheetFields.tsx
// The scrollable body of the mobile filter sheet: role, experience, work mode,
// posted-date, location, tech stack and salary.
//
// Split from DashboardFilterSheet purely for size (section 2). The sheet keeps
// everything with a lifecycle — open/close animation, and the salary debounce —
// and this file is only the field groups.
//
// THE SALARY DRAFT STATE STAYS IN THE PARENT and arrives here as props. Moving it
// down would look tidier and would quietly change behaviour: the sheet renders
// null while closed but stays mounted, so the draft survives a close/reopen. A
// child would unmount with it and lose the numbers mid-edit.
//
// Options come from filter-schema.ts, the same list the desktop bar and the
// applied-filter chips read, so the labels cannot drift apart per viewport.

import { Group, Chips, MultiChips } from './DashboardFilterSheetParts';
import { MAX_LOCATIONS, SALARY_MAX_LPA } from './dashboard/constants';
import { DATE_OPTIONS, WORKPLACE_OPTIONS, type FilterState, type Option } from './dashboard/filter-schema';
import type { JobFacets } from './dashboard/useJobFacets';

const salaryInputStyle = {
  flex: 1, padding: '9px 12px', borderRadius: 9,
  fontFamily: 'inherit', fontSize: '0.86rem',
  background: 'var(--surface)', color: 'var(--ink)',
  border: '1px solid var(--border-strong)', outline: 'none',
} as const;

const clampLpa = (v: string) => {
  if (v === '') return '';
  const n = Math.max(0, Math.min(SALARY_MAX_LPA, Math.floor(Number(v) || 0)));
  return String(n);
};

export interface DashboardFilterSheetFieldsProps {
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  roleOptions: Option[];
  experienceOptions: Option[];
  facets: JobFacets;
  salMin: string;
  salMax: string;
  setSalMin: (v: string) => void;
  setSalMax: (v: string) => void;
}

const toggle = (list: string[], v: string): string[] =>
  list.includes(v) ? list.filter(x => x !== v) : [...list, v];

export default function DashboardFilterSheetFields({
  filters, setFilters, roleOptions, experienceOptions, facets,
  salMin, salMax, setSalMin, setSalMax,
}: DashboardFilterSheetFieldsProps) {
  const cityCapped = filters.locations.length >= MAX_LOCATIONS;

  return (
    <div className="thin-scroll" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Group label="Role">
        <Chips
          value={filters.role}
          options={roleOptions}
          onChange={v => setFilters({ role: v })}
        />
      </Group>
      <Group label="Experience">
        <MultiChips
          values={filters.experience}
          options={experienceOptions.filter(o => o.value !== 'all')}
          onToggle={band => setFilters({ experience: toggle(filters.experience, band) })}
        />
      </Group>
      <Group label="Work mode">
        <MultiChips
          values={filters.workplace}
          options={WORKPLACE_OPTIONS}
          onToggle={mode => setFilters({ workplace: toggle(filters.workplace, mode) })}
        />
      </Group>
      <Group label="Posted">
        <Chips
          value={filters.date}
          options={DATE_OPTIONS}
          onChange={v => setFilters({ date: v as FilterState['date'] })}
        />
      </Group>
      {facets.cities.length > 0 && (
        <Group label={`Location${filters.locations.length ? ` · ${filters.locations.length}/${MAX_LOCATIONS}` : ''}`}>
          <MultiChips
            values={filters.locations}
            options={facets.cities.slice(0, 12).map(c => ({ value: c.city, label: c.city }))}
            disabledWhenUnselected={cityCapped}
            onToggle={city => setFilters({ locations: toggle(filters.locations, city) })}
          />
          {cityCapped && (
            <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
              Up to {MAX_LOCATIONS} cities. Remove one to add another.
            </p>
          )}
        </Group>
      )}
      {facets.techStack.length > 0 && (
        <Group label="Tech stack">
          <MultiChips
            values={filters.techStack}
            options={facets.techStack.slice(0, 18).map(t => ({ value: t.tag, label: t.tag }))}
            onToggle={tag => setFilters({ techStack: toggle(filters.techStack, tag) })}
          />
        </Group>
      )}
      <Group label="Salary (₹ LPA)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" inputMode="numeric" min={0} max={SALARY_MAX_LPA}
            value={salMin} placeholder="Min"
            aria-label="Minimum salary in lakhs per annum"
            onChange={e => setSalMin(clampLpa(e.target.value))}
            style={salaryInputStyle}
          />
          <span style={{ color: 'var(--ink-muted)' }}>–</span>
          <input
            type="number" inputMode="numeric" min={0} max={SALARY_MAX_LPA}
            value={salMax} placeholder="Max"
            aria-label="Maximum salary in lakhs per annum"
            onChange={e => setSalMax(clampLpa(e.target.value))}
            style={salaryInputStyle}
          />
        </div>
      </Group>
    </div>
  );
}
