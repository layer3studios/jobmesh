'use client';
// FILE: src/components/seeker/dashboard/useDashboardFilters.ts
// Owns all filter state. Syncs writes to the URL via setSp.

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { trackEvent } from '../../../lib/analytics-events';

type DiscoveryFilter = 'company' | 'role' | 'exp' | 'wp' | 'date' | 'loc' | 'tech' | 'sal';
const emitRemoved = (filterType: DiscoveryFilter) =>
  trackEvent('jobs_filter_applied', { filterType, action: 'removed' });

const parseCsvParam = (v: string | null): string[] =>
  v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];

export function useDashboardFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSp = useCallback((fn: (sp: URLSearchParams) => void) => {
    const next = new URLSearchParams(Array.from(sp.entries()));
    fn(next);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [sp, pathname, router]);

  const sel = sp.get('company') || '';
  const selectedJobParam = sp.get('selectedJob') || '';
  const [roleCategoryFilter, setRoleCategoryFilter] = useState(sp.get('role') || 'all');
  const [experienceBandFilter, setExperienceBandFilterState] = useState<string[]>(
    parseCsvParam(sp.get('exp')).filter(v => v !== 'all'));
  const [workplaceFilter, setWorkplaceFilterState] = useState<string[]>(
    parseCsvParam(sp.get('wp')).filter(v => v !== 'all'));
  const [dateFilter, setDateFilter] = useState(sp.get('date') || 'all');
  const [entryLevelFilter, setEntryLevelFilter] = useState(sp.get('entry') === '1');
  const [hideApplied, setHideApplied] = useState(sp.get('hideApplied') === '1');
  const [showNewOnly, setShowNewOnly] = useState(sp.get('newOnly') === '1');
  const [searchInput, setSearchInput] = useState(sp.get('q') || '');
  const [sortByMatch, setSortByMatch] = useState(sp.get('sort') === 'match');
  const [locationsFilter, setLocationsFilterState] = useState<string[]>(parseCsvParam(sp.get('loc')));
  const [techStackFilter, setTechStackFilterState] = useState<string[]>(parseCsvParam(sp.get('tech')));
  const [salaryMinFilter, setSalaryMinFilterState] = useState(sp.get('salMin') || '');
  const [salaryMaxFilter, setSalaryMaxFilterState] = useState(sp.get('salMax') || '');

  // Multi-value + salary setters keep state and URL in lockstep and reset paging.
  const setExperienceBandFilter = useCallback((next: string[]) => {
    setExperienceBandFilterState(next);
    trackEvent('jobs_filter_applied', { filterType: 'exp', action: next.length ? 'added' : 'removed' });
    setSp(p => { if (next.length) p.set('exp', next.join(',')); else p.delete('exp'); p.delete('page'); });
  }, [setSp]);

  const setWorkplaceFilter = useCallback((next: string[]) => {
    setWorkplaceFilterState(next);
    trackEvent('jobs_filter_applied', { filterType: 'wp', action: next.length ? 'added' : 'removed' });
    setSp(p => { if (next.length) p.set('wp', next.join(',')); else p.delete('wp'); p.delete('page'); });
  }, [setSp]);

  const setLocationsFilter = useCallback((next: string[]) => {
    setLocationsFilterState(next);
    trackEvent('jobs_filter_applied', { filterType: 'loc', action: next.length ? 'added' : 'removed' });
    setSp(p => { if (next.length) p.set('loc', next.join(',')); else p.delete('loc'); p.delete('page'); });
  }, [setSp]);

  const setTechStackFilter = useCallback((next: string[]) => {
    setTechStackFilterState(next);
    trackEvent('jobs_filter_applied', { filterType: 'tech', action: next.length ? 'added' : 'removed' });
    setSp(p => { if (next.length) p.set('tech', next.join(',')); else p.delete('tech'); p.delete('page'); });
  }, [setSp]);

  const setSalaryFilter = useCallback((min: string, max: string) => {
    setSalaryMinFilterState(min);
    setSalaryMaxFilterState(max);
    trackEvent('jobs_filter_applied', { filterType: 'sal', action: min || max ? 'added' : 'removed' });
    setSp(p => {
      if (min) p.set('salMin', min); else p.delete('salMin');
      if (max) p.set('salMax', max); else p.delete('salMax');
      p.delete('page');
    });
  }, [setSp]);

  const activeFilters = [
    sel ? { label: sel, clear: () => { emitRemoved('company'); setSp(p => { p.delete('company'); }); } } : null,
    roleCategoryFilter !== 'all' ? { label: roleCategoryFilter, clear: () => { emitRemoved('role'); setRoleCategoryFilter('all'); setSp(p => { p.delete('role'); }); } } : null,
    ...experienceBandFilter.map(band => ({
      label: band,
      clear: () => { emitRemoved('exp'); setExperienceBandFilter(experienceBandFilter.filter(b => b !== band)); },
    })),
    ...workplaceFilter.map(mode => ({
      label: mode,
      clear: () => { emitRemoved('wp'); setWorkplaceFilter(workplaceFilter.filter(m => m !== mode)); },
    })),
    dateFilter !== 'all' ? { label: dateFilter, clear: () => { emitRemoved('date'); setDateFilter('all'); setSp(p => { p.delete('date'); }); } } : null,
    ...locationsFilter.map(city => ({
      label: city,
      clear: () => { emitRemoved('loc'); setLocationsFilter(locationsFilter.filter(c => c !== city)); },
    })),
    ...techStackFilter.map(tag => ({
      label: tag,
      clear: () => { emitRemoved('tech'); setTechStackFilter(techStackFilter.filter(t => t !== tag)); },
    })),
    (salaryMinFilter || salaryMaxFilter) ? {
      label: salaryMinFilter && salaryMaxFilter
        ? `₹${salaryMinFilter}–${salaryMaxFilter} LPA`
        : salaryMinFilter ? `₹${salaryMinFilter}+ LPA` : `Up to ₹${salaryMaxFilter} LPA`,
      clear: () => { emitRemoved('sal'); setSalaryFilter('', ''); },
    } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setRoleCategoryFilter('all');
    setExperienceBandFilterState([]);
    setWorkplaceFilterState([]);
    setDateFilter('all');
    setEntryLevelFilter(false);
    setHideApplied(false);
    setShowNewOnly(false);
    setSearchInput('');
    setLocationsFilterState([]);
    setTechStackFilterState([]);
    setSalaryMinFilterState('');
    setSalaryMaxFilterState('');
    router.replace(pathname);
  };

  return {
    sp, setSp,
    sel, selectedJobParam,
    roleCategoryFilter, setRoleCategoryFilter,
    experienceBandFilter, setExperienceBandFilter,
    workplaceFilter, setWorkplaceFilter,
    dateFilter, setDateFilter,
    entryLevelFilter, setEntryLevelFilter,
    hideApplied, setHideApplied,
    showNewOnly, setShowNewOnly,
    searchInput, setSearchInput,
    sortByMatch, setSortByMatch,
    locationsFilter, setLocationsFilter,
    techStackFilter, setTechStackFilter,
    salaryMinFilter, salaryMaxFilter, setSalaryFilter,
    activeFilters, clearAll,
  };
}
