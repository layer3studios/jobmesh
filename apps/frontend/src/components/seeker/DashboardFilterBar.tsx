'use client';
// FILE: src/components/seeker/DashboardFilterBar.tsx
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { trackEvent } from '../../lib/analytics-events';
import { MAX_LOCATIONS, SALARY_MAX_LPA } from './dashboard/constants';
import type { JobFacets } from './dashboard/useJobFacets';
import { Z } from '@/theme/tokens';

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

/** Dense LinkedIn-style multi-select: trigger button + checkbox popover. */
function MultiSelectDropdown({ label, options, selected, onChange, baseStyle }: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (v: string[]) => void;
  baseStyle: CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  const active = selected.length > 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          ...baseStyle,
          fontWeight: active ? 600 : 400,
          borderColor: active ? 'var(--accent)' : 'var(--border-strong)',
          color: active ? 'var(--accent)' : 'var(--ink)',
        }}
      >
        {label}{active ? ` · ${selected.length}` : ''}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: Z.dropdown,
          minWidth: 190, background: 'var(--surface)',
          border: '1px solid var(--border-strong)', borderRadius: 10,
          boxShadow: 'var(--shadow-md)', padding: 6,
        }}>
          {options.map(o => (
            <label
              key={o.value}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 7, cursor: 'pointer',
                fontSize: '0.82rem', color: 'var(--ink)',
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggle(o.value)}
                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              {o.label}
            </label>
          ))}
          {active && (
            <button
              onClick={() => onChange([])}
              style={{
                width: '100%', marginTop: 4, padding: '6px 8px',
                background: 'transparent', border: 'none', borderTop: '1px solid var(--border)',
                color: 'var(--ink-muted)', fontSize: '0.78rem', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
              }}
            >Clear</button>
          )}
        </div>
      )}
    </div>
  );
}

const numberInputStyle = (base: CSSProperties): CSSProperties => ({
  ...base,
  width: 88,
  padding: '8px 10px',
  backgroundImage: 'none',
  cursor: 'text',
});

/** Searchable city picker fed by the facets endpoint; up to MAX_LOCATIONS cities. */
function LocationPicker({ cities, selected, onChange, baseStyle }: {
  cities: { city: string; count: number }[];
  selected: string[];
  onChange: (v: string[]) => void;
  baseStyle: CSSProperties;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const q = query.trim().toLowerCase();
  const suggestions = cities
    .filter(c => !selected.some(s => s.toLowerCase() === c.city.toLowerCase()))
    .filter(c => !q || c.city.toLowerCase().includes(q))
    .slice(0, 8);
  const atLimit = selected.length >= MAX_LOCATIONS;

  const add = (city: string) => {
    if (atLimit) return;
    onChange([...selected, city]);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        placeholder={atLimit ? `Max ${MAX_LOCATIONS} cities` : (selected.length ? `Location · ${selected.length}` : 'Location')}
        disabled={atLimit}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' && suggestions.length > 0) { e.preventDefault(); add(suggestions[0].city); }
          if (e.key === 'Escape') setOpen(false);
        }}
        style={{ ...baseStyle, width: 132, backgroundImage: 'none', cursor: atLimit ? 'not-allowed' : 'text' }}
      />
      {open && suggestions.length > 0 && !atLimit && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: Z.dropdown,
          minWidth: 180, maxHeight: 260, overflowY: 'auto',
          background: 'var(--surface)', border: '1px solid var(--border-strong)',
          borderRadius: 10, boxShadow: 'var(--shadow-md)', padding: 4,
        }}>
          {suggestions.map(c => (
            <button
              key={c.city}
              onClick={() => add(c.city)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                width: '100%', padding: '7px 10px', borderRadius: 7,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.82rem', color: 'var(--ink)', textAlign: 'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span>{c.city}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{c.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
