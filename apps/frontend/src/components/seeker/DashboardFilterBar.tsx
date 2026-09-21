'use client';
// FILE: src/components/seeker/DashboardFilterBar.tsx
// The desktop filter bar. Hick's law: three chips you decide with every day
// (role, experience, work mode) stay out; everything else — posted, city,
// tech stack, salary and the quick toggles — sits behind one "More" chip
// that carries a count of what is set inside it.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { trackEvent } from '../../lib/analytics-events';
import { SALARY_MAX_LPA, MAX_LOCATIONS } from './dashboard/constants';
import type { JobFacets } from './dashboard/useJobFacets';
import { MultiSelectDropdown } from './DashboardMultiSelect';
import { FilterDropdown } from './FilterDropdown';
import { FilterPanel } from './FilterPanel';

interface Option { value: string; label: string; }

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
  roleOptions: Option[];
  experienceOptions: Option[];
  desktopSelectStyle: CSSProperties;
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
  salaryMinFilter: string;
  salaryMaxFilter: string;
  setSalaryFilter: (min: string, max: string) => void;
  // Quick toggles (client-side)
  showNewOnly: boolean; setShowNewOnly: (v: boolean) => void;
  hideApplied: boolean; setHideApplied: (v: boolean) => void;
  entryLevelFilter: boolean; setEntryLevelFilter: (v: boolean) => void;
  newJobsCount: number;
}

const DATE_OPTIONS: Option[] = [
  { value: 'all', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last week' },
  { value: '30d', label: 'Last month' },
];

const WORK_MODE_OPTIONS: Option[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
];

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="jb-more__pill" aria-pressed={on} onClick={onClick}>{children}</button>;
}

export default function DashboardFilterBar(p: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  // Salary inputs commit on a short debounce so each keystroke does not
  // rewrite the URL and trigger a refetch.
  const [salMin, setSalMin] = useState(p.salaryMinFilter);
  const [salMax, setSalMax] = useState(p.salaryMaxFilter);
  useEffect(() => { setSalMin(p.salaryMinFilter); setSalMax(p.salaryMaxFilter); }, [p.salaryMinFilter, p.salaryMaxFilter]);
  useEffect(() => {
    if (salMin === p.salaryMinFilter && salMax === p.salaryMaxFilter) return;
    const t = setTimeout(() => p.setSalaryFilter(salMin, salMax), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salMin, salMax]);

  const clampLpa = (v: string) => {
    if (v === '') return '';
    const n = Math.max(0, Math.min(SALARY_MAX_LPA, Math.floor(Number(v) || 0)));
    return String(n);
  };

  const toggleIn = (list: string[], v: string, set: (n: string[]) => void, max?: number) => {
    if (list.includes(v)) set(list.filter(x => x !== v));
    else if (!max || list.length < max) set([...list, v]);
  };

  const moreCount =
    (p.dateFilter !== 'all' ? 1 : 0) + p.locationsFilter.length + p.techStackFilter.length +
    (p.salaryMinFilter || p.salaryMaxFilter ? 1 : 0) +
    (p.showNewOnly ? 1 : 0) + (p.hideApplied ? 1 : 0) + (p.entryLevelFilter ? 1 : 0);

  const clearMore = () => {
    p.setDateFilter('all'); p.setSp(sp => { sp.delete('date'); sp.delete('page'); });
    p.setLocationsFilter([]); p.setTechStackFilter([]); p.setSalaryFilter('', '');
    p.setShowNewOnly(false); p.setHideApplied(false); p.setEntryLevelFilter(false);
    p.setSp(sp => { sp.delete('newOnly'); sp.delete('hideApplied'); sp.delete('entry'); });
  };

  const setToggle = (key: 'newOnly' | 'hideApplied' | 'entry', set: (v: boolean) => void, v: boolean) => {
    set(v);
    p.setSp(sp => { if (v) sp.set(key, '1'); else sp.delete(key); });
  };

  return (
    <div className="jb-filters">
      <FilterDropdown
        label="All roles"
        options={p.roleOptions}
        value={p.roleCategoryFilter}
        onChange={v => { p.setRoleCategoryFilter(v); emitFilter('role', v); p.setSp(sp => { sp.set('role', v); sp.delete('page'); }); }}
        baseStyle={p.desktopSelectStyle}
      />
      <MultiSelectDropdown
        label="Experience"
        options={p.experienceOptions.filter(o => o.value !== 'all')}
        selected={p.experienceBandFilter}
        onChange={p.setExperienceBandFilter}
        baseStyle={p.desktopSelectStyle}
      />
      <MultiSelectDropdown
        label="Work mode"
        options={WORK_MODE_OPTIONS}
        selected={p.workplaceFilter}
        onChange={p.setWorkplaceFilter}
        baseStyle={p.desktopSelectStyle}
      />

      <button
        ref={moreRef}
        type="button"
        className="jb-chip"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen(o => !o)}
        style={{
          ...p.desktopSelectStyle, backgroundImage: 'none', paddingRight: 10,
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontWeight: moreCount ? 600 : 500,
          borderColor: moreCount || moreOpen ? 'var(--border-strong)' : 'var(--border)',
          color: moreCount || moreOpen ? 'var(--text-primary)' : 'var(--ink-muted)',
        }}
      >
        <SlidersHorizontal size={13} aria-hidden />
        More
        {moreCount > 0 && <span className="jb-chip__count">{moreCount}</span>}
      </button>

      <FilterPanel open={moreOpen} onClose={closeMore} anchorRef={moreRef} minWidth={320} maxHeight="min(72vh, 640px)">
        <div className="jb-more" role="dialog" aria-label="More filters">
          <div className="jb-more__section">
            <p className="jb-more__label">Posted</p>
            <div className="jb-more__wrap">
              {DATE_OPTIONS.map(o => (
                <Pill key={o.value} on={p.dateFilter === o.value}
                  onClick={() => { p.setDateFilter(o.value); emitFilter('date', o.value); p.setSp(sp => { if (o.value === 'all') sp.delete('date'); else sp.set('date', o.value); sp.delete('page'); }); }}>
                  {o.label}
                </Pill>
              ))}
            </div>
          </div>

          {p.facets.cities.length > 0 && (
            <div className="jb-more__section">
              <p className="jb-more__label">City {p.locationsFilter.length > 0 && `· ${p.locationsFilter.length}/${MAX_LOCATIONS}`}</p>
              <div className="jb-more__wrap">
                {p.facets.cities.slice(0, 10).map(c => (
                  <Pill key={c.city} on={p.locationsFilter.includes(c.city)}
                    onClick={() => toggleIn(p.locationsFilter, c.city, p.setLocationsFilter, MAX_LOCATIONS)}>
                    {c.city}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {p.facets.techStack.length > 0 && (
            <div className="jb-more__section">
              <p className="jb-more__label">Tech stack</p>
              <div className="jb-more__wrap">
                {p.facets.techStack.slice(0, 16).map(t => (
                  <Pill key={t.tag} on={p.techStackFilter.includes(t.tag)}
                    onClick={() => toggleIn(p.techStackFilter, t.tag, p.setTechStackFilter)}>
                    {t.tag}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          <div className="jb-more__section">
            <p className="jb-more__label">Salary (₹ LPA)</p>
            <div className="jb-more__salary">
              <input type="number" inputMode="numeric" min={0} max={SALARY_MAX_LPA} value={salMin} placeholder="Min"
                aria-label="Minimum salary in lakhs per annum" onChange={e => setSalMin(clampLpa(e.target.value))} />
              <span>to</span>
              <input type="number" inputMode="numeric" min={0} max={SALARY_MAX_LPA} value={salMax} placeholder="Max"
                aria-label="Maximum salary in lakhs per annum" onChange={e => setSalMax(clampLpa(e.target.value))} />
            </div>
          </div>

          <div className="jb-more__section">
            <p className="jb-more__label">Show</p>
            <div className="jb-more__wrap">
              <Pill on={p.showNewOnly} onClick={() => setToggle('newOnly', p.setShowNewOnly, !p.showNewOnly)}>
                New this week{p.newJobsCount > 0 ? ` · ${p.newJobsCount}` : ''}
              </Pill>
              <Pill on={p.entryLevelFilter} onClick={() => setToggle('entry', p.setEntryLevelFilter, !p.entryLevelFilter)}>Fresher-friendly</Pill>
              <Pill on={p.hideApplied} onClick={() => setToggle('hideApplied', p.setHideApplied, !p.hideApplied)}>Hide applied</Pill>
            </div>
          </div>

          <div className="jb-more__foot">
            <button type="button" className="jb-active__clear press" onClick={clearMore} disabled={moreCount === 0} style={{ opacity: moreCount ? 1 : 0.5 }}>
              Reset these
            </button>
            <button type="button" className="jb-more__pill press" aria-pressed="true" onClick={closeMore}>Done</button>
          </div>
        </div>
      </FilterPanel>
    </div>
  );
}
