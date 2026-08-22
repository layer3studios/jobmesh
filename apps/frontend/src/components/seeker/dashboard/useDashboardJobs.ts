'use client';
// FILE: src/components/seeker/dashboard/useDashboardJobs.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import type { IJob } from '../../../types';
import { PAGE_SIZE } from './constants';

interface FilterParams {
  sel: string;
  roleCategoryFilter: string;
  experienceBandFilter: string[];
  entryLevelFilter: boolean;
  workplaceFilter: string[];
  dateFilter: string;
  debouncedSearch: string;
  locationsFilter: string[];
  techStackFilter: string[];
  salaryMinFilter: string;
  salaryMaxFilter: string;
}

interface JobsResponse {
  jobs?: IJob[];
  totalJobs?: number;
  totalPages?: number;
  currentPage?: number;
}

// Session cache keyed by the full query string — toggling a filter off and on
// again (or paging back) is served instantly instead of re-hitting the API.
const CLIENT_CACHE_TTL_MS = 60 * 1000;
const responseCache = new Map<string, { data: JobsResponse; at: number }>();

function getCached(key: string): JobsResponse | null {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CLIENT_CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return hit.data;
}

/** Owns the jobs array, pagination state, and the server fetch. */
export function useDashboardJobs(filters: FilterParams) {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchJobs = useCallback(async (pageNum: number, append: boolean) => {
    const p = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
    if (filters.sel) p.set('company', filters.sel);
    if (filters.roleCategoryFilter !== 'all') p.set('roleCategory', filters.roleCategoryFilter);
    if (filters.experienceBandFilter.length > 0) p.set('experienceBand', filters.experienceBandFilter.join(','));
    // entryLevel only matters when no bands are selected — the backend ORs the
    // fresher band with isEntryLevel itself when bands are present.
    if (filters.entryLevelFilter && filters.experienceBandFilter.length === 0) p.set('entryLevel', 'true');
    if (filters.workplaceFilter.length > 0) p.set('workplace', filters.workplaceFilter.join(','));
    if (filters.dateFilter !== 'all') p.set('date', filters.dateFilter);
    if (filters.debouncedSearch.length >= 2) p.set('search', filters.debouncedSearch);
    if (filters.locationsFilter.length > 0) p.set('locations', filters.locationsFilter.join(','));
    if (filters.techStackFilter.length > 0) p.set('techStack', filters.techStackFilter.join(','));
    if (filters.salaryMinFilter) p.set('salaryMin', filters.salaryMinFilter);
    if (filters.salaryMaxFilter) p.set('salaryMax', filters.salaryMaxFilter);

    const cacheKey = p.toString();
    const applyResponse = (d: JobsResponse) => {
      setTotalJobs(d.totalJobs ?? 0);
      setTotalPages(d.totalPages ?? 1);
      setCurrentPage(d.currentPage ?? pageNum);
      const newJobs = d.jobs ?? [];
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
    };

    const cached = getCached(cacheKey);
    if (cached) {
      abortRef.current?.abort();
      applyResponse(cached);
      if (!append) setLoading(false);
      return;
    }

    // Cancel any in-flight request so a stale slow response can't clobber
    // the results of a newer filter combination.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (append) setLoadingMore(true);
    else { setLoading(true); setCurrentPage(1); }
    try {
      const r = await fetch(`/api/seeker/jobs?${p}`, { credentials: 'include', signal: controller.signal });
      const d = await r.json() as JobsResponse;
      if (controller.signal.aborted) return;
      responseCache.set(cacheKey, { data: d, at: Date.now() });
      applyResponse(d);
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') console.error(e);
    } finally {
      if (!controller.signal.aborted) {
        if (append) setLoadingMore(false); else setLoading(false);
      }
    }
  }, [filters.sel, filters.roleCategoryFilter, filters.experienceBandFilter, filters.entryLevelFilter,
      filters.workplaceFilter, filters.dateFilter, filters.debouncedSearch,
      filters.locationsFilter, filters.techStackFilter, filters.salaryMinFilter, filters.salaryMaxFilter]);

  // Debounced refetch: rapid filter toggles collapse into one request.
  useEffect(() => {
    const t = setTimeout(() => { fetchJobs(1, false); }, 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  return { jobs, setJobs, totalJobs, totalPages, currentPage, loading, loadingMore, fetchJobs };
}
