'use client';
// FILE: src/components/seeker/DashboardFilterBar.tsx
// The desktop filter bar. Hick's law: three chips you decide with every day
// (role, experience, work mode) stay out; everything else — posted, city,
// tech stack, salary and the quick toggles — sits behind one "More" chip
// that carries a count of what is set inside it.
//
// This file names filters, never URL params: every change goes through
// `setFilters`, which owns the param spelling, drops defaults and resets
// paging (see dashboard/filter-schema.ts).
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SALARY_MAX_LPA, MAX_LOCATIONS } from './dashboard/constants';
import { DATE_OPTIONS, WORKPLACE_OPTIONS, type FilterState, type Option } from './dashboard/filter-schema';
import type { JobFacets } from './dashboard/useJobFacets';
import { MultiSelectDropdown } from './DashboardMultiSelect';
import { FilterDropdown } from './FilterDropdown';
import { FilterPanel } from './FilterPanel';

interface Props {
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  /** How many of the filters inside "More" are set. */
  moreCount: number;
  roleOptions: Option[];
  experienceOptions: Option[];
  desktopSelectStyle: CSSProperties;
  facets: JobFacets;
  newJobsCount: number;
}

function Pill({ on, onClick, children, disabled }: {
  on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="jb-more__pill"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
    >
      {children}
    </button>
  );
}

export default function DashboardFilterBar({
  filters, setFilters, moreCount, roleOptions, experienceOptions, desktopSelectStyle, facets, newJobsCount,
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  // Salary inputs commit on a short debounce so each keystroke does not
  // rewrite the URL and trigger a refetch.
  const [salMin, setSalMin] = useState(filters.salaryMin);
  const [salMax, setSalMax] = useState(filters.salaryMax);
  useEffect(() => { setSalMin(filters.salaryMin); setSalMax(filters.salaryMax); }, [filters.salaryMin, filters.salaryMax]);
  useEffect(() => {
    if (salMin === filters.salaryMin && salMax === filters.salaryMax) return;
    const t = setTimeout(() => setFilters({ salaryMin: salMin, salaryMax: salMax }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salMin, salMax]);

  const clampLpa = (v: string) => {
    if (v === '') return '';
    const n = Math.max(0, Math.min(SALARY_MAX_LPA, Math.floor(Number(v) || 0)));
    return String(n);
  };

  const toggle = (list: string[], v: string): string[] =>
    list.includes(v) ? list.filter(x => x !== v) : [...list, v];

  const cityCapped = filters.locations.length >= MAX_LOCATIONS;

  const clearMore = () => setFilters({
    date: 'all', locations: [], techStack: [], salaryMin: '', salaryMax: '',
    newOnly: false, hideApplied: false, entryLevel: false,
  });

  return (
    <div className="jb-filters">
      <FilterDropdown
        label="All roles"
        options={roleOptions}
        value={filters.role}
        onChange={v => setFilters({ role: v })}
        baseStyle={desktopSelectStyle}
      />
      <MultiSelectDropdown
        label="Experience"
        options={experienceOptions.filter(o => o.value !== 'all')}
        selected={filters.experience}
        onChange={v => setFilters({ experience: v })}
        baseStyle={desktopSelectStyle}
      />
      <MultiSelectDropdown
        label="Work mode"
        options={WORKPLACE_OPTIONS}
        selected={filters.workplace}
        onChange={v => setFilters({ workplace: v })}
        baseStyle={desktopSelectStyle}
      />

      <button
        ref={moreRef}
        type="button"
        className="jb-chip"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen(o => !o)}
        style={{
          ...desktopSelectStyle, backgroundImage: 'none', paddingRight: 10,
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
                <Pill key={o.value} on={filters.date === o.value}
                  onClick={() => setFilters({ date: o.value as FilterState['date'] })}>
                  {o.label}
                </Pill>
              ))}
            </div>
          </div>

          {facets.cities.length > 0 && (
            <div className="jb-more__section">
              <p className="jb-more__label">
                City {filters.locations.length > 0 && `· ${filters.locations.length}/${MAX_LOCATIONS}`}
              </p>
              <div className="jb-more__wrap">
                {facets.cities.slice(0, 10).map(c => {
                  const on = filters.locations.includes(c.city);
                  // At the cap the unpicked cities go disabled rather than
                  // swallowing the click with no explanation.
                  return (
                    <Pill key={c.city} on={on} disabled={!on && cityCapped}
                      onClick={() => setFilters({ locations: toggle(filters.locations, c.city) })}>
                      {c.city}
                    </Pill>
                  );
                })}
              </div>
              {cityCapped && (
                <p className="jb-more__hint">Up to {MAX_LOCATIONS} cities. Remove one to add another.</p>
              )}
            </div>
          )}

          {facets.techStack.length > 0 && (
            <div className="jb-more__section">
              <p className="jb-more__label">Tech stack</p>
              <div className="jb-more__wrap">
                {facets.techStack.slice(0, 16).map(t => (
                  <Pill key={t.tag} on={filters.techStack.includes(t.tag)}
                    onClick={() => setFilters({ techStack: toggle(filters.techStack, t.tag) })}>
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
              <Pill on={filters.newOnly} onClick={() => setFilters({ newOnly: !filters.newOnly })}>
                New this week{newJobsCount > 0 ? ` · ${newJobsCount}` : ''}
              </Pill>
              <Pill on={filters.entryLevel} onClick={() => setFilters({ entryLevel: !filters.entryLevel })}>
                Fresher-friendly
              </Pill>
              <Pill on={filters.hideApplied} onClick={() => setFilters({ hideApplied: !filters.hideApplied })}>
                Hide applied
              </Pill>
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
