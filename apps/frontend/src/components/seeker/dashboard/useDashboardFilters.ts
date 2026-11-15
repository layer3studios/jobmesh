'use client';
// FILE: src/components/seeker/dashboard/useDashboardFilters.ts
// Filter state for the jobs board. The URL is the state — nothing here mirrors
// a param in useState, so a shared link, a back/forward step and the controls
// can never disagree. Components call `setFilters({ role: 'Backend' })` and
// never touch a param name; filter-schema.ts owns the spelling, the defaults
// and the chip labels.
//
// The one exception is the search box: it keeps a local draft so typing stays
// at keystroke speed, and commits to the URL on a debounce.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { trackEvent, type FilterType } from '../../../lib/analytics-events';
import {
  parseFilters, writeFilters, filterChips, clearedFilters, moreFilterCount,
  PARAM, DEFAULT_FILTERS, type FilterState, type FilterChip, type Option,
} from './filter-schema';
import { ROLE_OPTIONS } from './constants';

const SEARCH_DEBOUNCE_MS = 300;

/** Which filter a patch touched, for the analytics event. */
const FILTER_EVENT: Partial<Record<keyof FilterState, FilterType>> = {
  company: 'company', role: 'role', experience: 'exp', workplace: 'wp',
  date: 'date', locations: 'loc', techStack: 'tech',
  salaryMin: 'sal', salaryMax: 'sal',
  entryLevel: 'entry', hideApplied: 'hideApplied', newOnly: 'newOnly',
};

function trackPatch(patch: Partial<FilterState>): void {
  const seen = new Set<string>();
  for (const [key, value] of Object.entries(patch) as [keyof FilterState, unknown][]) {
    const filterType = FILTER_EVENT[key];
    if (!filterType || seen.has(filterType)) continue;
    seen.add(filterType);
    const cleared = Array.isArray(value)
      ? value.length === 0
      : value === DEFAULT_FILTERS[key] || value === '' || value === false;
    trackEvent('jobs_filter_applied', { filterType, action: cleared ? 'removed' : 'added' });
  }
}

export interface DashboardFilters {
  filters: FilterState;
  /** Merge a patch into the URL. Defaults are dropped and paging resets. */
  setFilters: (patch: Partial<FilterState>) => void;
  /** The search box draft — local, committed to the URL on a debounce. */
  searchInput: string;
  setSearchInput: (v: string) => void;
  /** The committed search term, i.e. what the list should be fetched with. */
  search: string;
  roleOptions: Option[];
  chips: FilterChip[];
  moreCount: number;
  clearAll: () => void;
  /** The job open in the detail panel, which filters must not close. */
  selectedJobParam: string;
  setSelectedJobParam: (id: string) => void;
}

export function useDashboardFilters(): DashboardFilters {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derived, not copied: a URL change re-renders with the new filters.
  const spKey = sp.toString();
  const filters = useMemo(() => parseFilters(sp), [spKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback((mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(spKey);
    mutate(next);
    const qs = next.toString();
    // scroll: false — a filter refines the list you are looking at; yanking the
    // page back to the top on every toggle lost the reader's place.
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [spKey, pathname, router]);

  const setFilters = useCallback((patch: Partial<FilterState>) => {
    trackPatch(patch);
    commit(next => writeFilters(next, patch));
  }, [commit]);

  const clearAll = useCallback(() => {
    setSearchInput('');
    // Only the filter params go. `selectedJob` used to be collateral damage
    // here — clearing filters closed the job you had open.
    commit(next => writeFilters(next, { ...clearedFilters(), search: '' }));
  }, [commit]);

  const setSelectedJobParam = useCallback((id: string) => {
    commit(next => { if (id) next.set('selectedJob', id); else next.delete('selectedJob'); });
  }, [commit]);

  // ── Search draft ──────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(filters.search);
  // Keep the draft honest when the URL moves under it (back/forward, Clear all,
  // a link with ?q=). Only when it actually differs, so typing is untouched.
  const committedSearch = filters.search;
  const lastCommitted = useRef(committedSearch);
  useEffect(() => {
    if (committedSearch === lastCommitted.current) return;
    lastCommitted.current = committedSearch;
    setSearchInput(committedSearch);
  }, [committedSearch]);

  useEffect(() => {
    const draft = searchInput.trim();
    if (draft === committedSearch) return;
    const t = setTimeout(() => {
      lastCommitted.current = draft;
      commit(next => writeFilters(next, { search: draft }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput, committedSearch, commit]);

  const chips = useMemo(() => filterChips(filters, ROLE_OPTIONS), [filters]);
  const moreCount = useMemo(() => moreFilterCount(filters), [filters]);

  return {
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    search: committedSearch,
    roleOptions: ROLE_OPTIONS,
    chips,
    moreCount,
    clearAll,
    selectedJobParam: sp.get('selectedJob') || '',
    setSelectedJobParam,
  };
}

export { PARAM };
