'use client';
// FILE: src/components/seeker/DashboardFilterBar.tsx
import { useEffect, useState, type CSSProperties } from 'react';
import { trackEvent } from '../../lib/analytics-events';
import { SALARY_MAX_LPA } from './dashboard/constants';
import type { JobFacets } from './dashboard/useJobFacets';

interface Option { value: string; label: string; }

import { MultiSelectDropdown } from './DashboardMultiSelect';
import { LocationPicker } from './DashboardLocationPicker';

// A select value of 'all' clears that dimension (removed); anything else adds it.
type DiscoveryFilter = 'role' | 'exp' | 'wp' | 'date';
function emitFilter(filterType: DiscoveryFilter, value: string): void {
  trackEvent('jobs_filter_applied', { filterType, action: value === 'all' ? 'removed' : 'added' });
}

interface Props {
  roleCategoryFilter: string;
  experienceBandFilter: string[];
  workplaceFilter: string[];
  dateFilter: string;
  sel: string;
  cos: string;
  roleOptions: Option[];
  experienceOptions: Option[];
  desktopSelectStyle: CSSProperties;
  setRoleCategoryFilter: (v: string) => void;
  setExperienceBandFilter: (v: string[]) => void;
  setWorkplaceFilter: (v: string[]) => void;
  setDateFilter: (v: string) => void;
  setSel: (v: string) => void;
  setCos: (v: string) => void;
  setSp: (fn: (sp: URLSearchParams) => void) => void;
  facets: JobFacets;
  locationsFilter: string[];
  setLocationsFilter: (v: string[]) => void;
  techStackFilter: string[];
  setTechStackFilter: (v: string[]) => void;
  salaryMinFilter: string;
  salaryMaxFilter: string;
  setSalaryFilter: (min: string, max: string) => void;
}


const numberInputStyle = (base: CSSProperties): CSSProperties => ({
  ...base,
  width: 88,
  padding: '8px 10px',
  backgroundImage: 'none',
  cursor: 'text',
});


export default function DashboardFilterBar({
  roleCategoryFilter, experienceBandFilter, workplaceFilter, dateFilter,
  sel, cos, roleOptions, experienceOptions, desktopSelectStyle,
  setRoleCategoryFilter, setExperienceBandFilter, setWorkplaceFilter,
  setDateFilter, setSel, setCos, setSp,
  facets, locationsFilter, setLocationsFilter,
  techStackFilter, setTechStackFilter,
  salaryMinFilter, salaryMaxFilter, setSalaryFilter,
}: Props) {
  void sel; void cos; void setSel; void setCos;

  // Salary inputs are committed on a short debounce so each keystroke does not
  // rewrite the URL and trigger a refetch.
  const [salMin, setSalMin] = useState(salaryMinFilter);
  const [salMax, setSalMax] = useState(salaryMaxFilter);
  useEffect(() => { setSalMin(salaryMinFilter); setSalMax(salaryMaxFilter); }, [salaryMinFilter, salaryMaxFilter]);
  useEffect(() => {
    if (salMin === salaryMinFilter && salMax === salaryMaxFilter) return;
    const t = setTimeout(() => setSalaryFilter(salMin, salMax), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salMin, salMax]);

  const clampLpa = (v: string) => {
    if (v === '') return '';
    const n = Math.max(0, Math.min(SALARY_MAX_LPA, Math.floor(Number(v) || 0)));
    return String(n);
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <select
        value={roleCategoryFilter}
        onChange={e => { setRoleCategoryFilter(e.target.value); emitFilter('role', e.target.value); setSp(sp => { sp.set('role', e.target.value); sp.delete('page'); }); }}
        style={desktopSelectStyle}
      >
        {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <MultiSelectDropdown
        label="Experience"
        options={experienceOptions.filter(o => o.value !== 'all')}
        selected={experienceBandFilter}
        onChange={setExperienceBandFilter}
        baseStyle={desktopSelectStyle}
      />

      <MultiSelectDropdown
        label="Work mode"
        options={[
          { value: 'remote', label: 'Remote' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'on-site', label: 'On-site' },
        ]}
        selected={workplaceFilter}
        onChange={setWorkplaceFilter}
        baseStyle={desktopSelectStyle}
      />

      <select
        value={dateFilter}
        onChange={e => { setDateFilter(e.target.value); emitFilter('date', e.target.value); setSp(sp => { sp.set('date', e.target.value); sp.delete('page'); }); }}
        style={desktopSelectStyle}
      >
        <option value="all">Any time</option>
        <option value="today">Today</option>
        <option value="3d">Last 3 days</option>
        <option value="7d">Last week</option>
        <option value="30d">Last month</option>
      </select>

      <LocationPicker
        cities={facets.cities}
        selected={locationsFilter}
        onChange={setLocationsFilter}
        baseStyle={desktopSelectStyle}
      />

      {facets.techStack.length > 0 && (
        <select
          value=""
          onChange={e => {
            const tag = e.target.value;
            if (tag && !techStackFilter.includes(tag)) setTechStackFilter([...techStackFilter, tag]);
          }}
          style={desktopSelectStyle}
        >
          <option value="">{techStackFilter.length ? `Tech · ${techStackFilter.length}` : 'Tech stack'}</option>
          {facets.techStack
            .filter(t => !techStackFilter.includes(t.tag))
            .map(t => <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>)}
        </select>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number" inputMode="numeric" min={0} max={SALARY_MAX_LPA}
          value={salMin}
          placeholder="Min LPA"
          onChange={e => setSalMin(clampLpa(e.target.value))}
          style={numberInputStyle(desktopSelectStyle)}
        />
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.8rem' }}>–</span>
        <input
          type="number" inputMode="numeric" min={0} max={SALARY_MAX_LPA}
          value={salMax}
          placeholder="Max LPA"
          onChange={e => setSalMax(clampLpa(e.target.value))}
          style={numberInputStyle(desktopSelectStyle)}
        />
      </div>
    </div>
  );
}
