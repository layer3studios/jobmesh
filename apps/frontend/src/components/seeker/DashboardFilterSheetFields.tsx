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

import { Group, Chips, MultiChips } from './DashboardFilterSheetParts';
import { MAX_LOCATIONS, SALARY_MAX_LPA } from './dashboard/constants';
import type { JobFacets } from './dashboard/useJobFacets';

interface Option { value: string; label: string; }

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
  roleCategoryFilter: string;
  experienceBandFilter: string[];
  workplaceFilter: string[];
  dateFilter: string;
  roleOptions: Option[];
  experienceOptions: Option[];
  setRoleCategoryFilter: (v: string) => void;
  setExperienceBandFilter: (v: string[]) => void;
  setWorkplaceFilter: (v: string[]) => void;
  setDateFilter: (v: string) => void;
  setSp: (fn: (sp: URLSearchParams) => void) => void;
  facets: JobFacets;
  locationsFilter: string[];
  setLocationsFilter: (v: string[]) => void;
  techStackFilter: string[];
  setTechStackFilter: (v: string[]) => void;
  salMin: string;
  salMax: string;
  setSalMin: (v: string) => void;
  setSalMax: (v: string) => void;
}

export default function DashboardFilterSheetFields({
  roleCategoryFilter, experienceBandFilter, workplaceFilter, dateFilter,
  roleOptions, experienceOptions,
  setRoleCategoryFilter, setExperienceBandFilter, setWorkplaceFilter,
  setDateFilter, setSp,
  facets, locationsFilter, setLocationsFilter,
  techStackFilter, setTechStackFilter,
  salMin, salMax, setSalMin, setSalMax,
}: DashboardFilterSheetFieldsProps) {
  return (
    <div className="thin-scroll" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Group label="Role">
        <Chips
          value={roleCategoryFilter}
          options={roleOptions}
          onChange={v => { setRoleCategoryFilter(v); setSp(sp => { sp.set('role', v); sp.delete('page'); }); }}
        />
      </Group>
      <Group label="Experience">
        <MultiChips
          values={experienceBandFilter}
          options={experienceOptions.filter(o => o.value !== 'all')}
          onToggle={band => setExperienceBandFilter(
            experienceBandFilter.includes(band)
              ? experienceBandFilter.filter(b => b !== band)
              : [...experienceBandFilter, band],
          )}
        />
      </Group>
      <Group label="Work mode">
        <MultiChips
          values={workplaceFilter}
          options={[
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'on-site', label: 'On-site' },
          ]}
          onToggle={mode => setWorkplaceFilter(
            workplaceFilter.includes(mode)
              ? workplaceFilter.filter(m => m !== mode)
              : [...workplaceFilter, mode],
          )}
        />
      </Group>
      <Group label="Posted">
        <Chips
          value={dateFilter}
          options={[
            { value: 'all', label: 'Any time' },
            { value: 'today', label: 'Today' },
            { value: '3d', label: '3 days' },
            { value: '7d', label: '1 week' },
            { value: '30d', label: '1 month' },
          ]}
          onChange={v => { setDateFilter(v); setSp(sp => { sp.set('date', v); sp.delete('page'); }); }}
        />
      </Group>
      {facets.cities.length > 0 && (
        <Group label={`Location${locationsFilter.length ? ` · ${locationsFilter.length}/${MAX_LOCATIONS}` : ''}`}>
          <MultiChips
            values={locationsFilter}
            options={facets.cities.slice(0, 12).map(c => ({ value: c.city, label: c.city }))}
            disabledWhenUnselected={locationsFilter.length >= MAX_LOCATIONS}
            onToggle={city => setLocationsFilter(
              locationsFilter.includes(city)
                ? locationsFilter.filter(c => c !== city)
                : [...locationsFilter, city],
            )}
          />
        </Group>
      )}
      {facets.techStack.length > 0 && (
        <Group label="Tech stack">
          <MultiChips
            values={techStackFilter}
            options={facets.techStack.slice(0, 18).map(t => ({ value: t.tag, label: t.tag }))}
            onToggle={tag => setTechStackFilter(
              techStackFilter.includes(tag)
                ? techStackFilter.filter(t => t !== tag)
                : [...techStackFilter, tag],
            )}
          />
        </Group>
      )}
      <Group label="Salary (₹ LPA)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" inputMode="numeric" min={0} max={SALARY_MAX_LPA}
            value={salMin} placeholder="Min"
            onChange={e => setSalMin(clampLpa(e.target.value))}
            style={salaryInputStyle}
          />
          <span style={{ color: 'var(--ink-muted)' }}>–</span>
          <input
            type="number" inputMode="numeric" min={0} max={SALARY_MAX_LPA}
            value={salMax} placeholder="Max"
            onChange={e => setSalMax(clampLpa(e.target.value))}
            style={salaryInputStyle}
          />
        </div>
      </Group>
    </div>
  );
}
