'use client';
// FILE: src/components/seeker/DashboardFilterSheet.tsx
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui';
import { Group, Chips, MultiChips } from './DashboardFilterSheetParts';
import { MAX_LOCATIONS, SALARY_MAX_LPA } from './dashboard/constants';
import type { JobFacets } from './dashboard/useJobFacets';
import { Z } from '@/theme/tokens';

interface Option { value: string; label: string; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeFilterCount: number;
  visibleJobsCount: number;
  clearAllFilters: () => void;
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
  salaryMinFilter: string;
  salaryMaxFilter: string;
  setSalaryFilter: (min: string, max: string) => void;
}

export default function DashboardFilterSheet({
  isOpen, onClose, activeFilterCount, visibleJobsCount, clearAllFilters,
  roleCategoryFilter, experienceBandFilter, workplaceFilter, dateFilter,
  roleOptions, experienceOptions,
  setRoleCategoryFilter, setExperienceBandFilter, setWorkplaceFilter,
  setDateFilter, setSp,
  facets, locationsFilter, setLocationsFilter,
  techStackFilter, setTechStackFilter,
  salaryMinFilter, salaryMaxFilter, setSalaryFilter,
}: Props) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  // Salary committed on a short debounce to avoid a refetch per keystroke.
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

  const salaryInputStyle = {
    flex: 1, padding: '9px 12px', borderRadius: 9,
    fontFamily: 'inherit', fontSize: '0.86rem',
    background: 'var(--surface)', color: 'var(--ink)',
    border: '1px solid var(--border-strong)', outline: 'none',
  } as const;

  useEffect(() => {
    if (isOpen) { setMounted(true); setClosing(false); }
    else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.sheet,
        background: 'rgba(15,15,14,0.45)',
        animation: `${closing ? 'sheetFadeIn' : 'sheetFadeIn'} 0.22s ease ${closing ? 'reverse' : 'normal'}`,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)',
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          animation: `${closing ? 'sheetSlideDown' : 'sheetSlideUp'} 0.28s cubic-bezier(0.16, 1, 0.3, 1)`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: 'var(--border-strong)',
          margin: '8px auto 0',
        }} />

        <div style={{
          padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Filters {activeFilterCount > 0 && <span style={{ color: 'var(--ink-muted)', fontWeight: 500, fontSize: '0.85rem' }}>· {activeFilterCount}</span>}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--paper-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-muted)', cursor: 'pointer',
          }}>
            <X size={14} />
          </button>
        </div>

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

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--paper-2)',
          display: 'flex', gap: 8,
        }}>
          <Button variant="ghost" size="md" onClick={clearAllFilters} style={{ flex: 1 }}>Clear all</Button>
          <Button variant="primary" size="md" onClick={onClose} style={{ flex: 2 }}>
            Show {visibleJobsCount} results
          </Button>
        </div>
      </div>
    </div>
  );
}
