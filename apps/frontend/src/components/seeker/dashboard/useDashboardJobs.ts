'use client';
// FILE: src/components/seeker/dashboard/useDashboardJobs.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import type { IJob } from '../../../types';
import { PAGE_SIZE } from './constants';
import { DEFAULT_FILTERS, type FilterState } from './filter-schema';

interface FilterParams {
  /** The applied filters, straight off the URL. */
  filters: FilterState;
  /** The committed search term (the debounced draft, not the keystrokes). */
  search: string;
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
export function useDashboardJobs({ filters, search }: FilterParams) {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchJobs = useCallback(async (pageNum: number, append: boolean) => {
    const p = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
    if (filters.company) p.set('company', filters.company);
    if (filters.role !== DEFAULT_FILTERS.role) p.set('roleCategory', filters.role);
    if (filters.experience.length > 0) p.set('experienceBand', filters.experience.join(','));
    // entryLevel only matters when no bands are selected — the backend ORs the
    // fresher band with isEntryLevel itself when bands are present.
    if (filters.entryLevel && filters.experience.length === 0) p.set('entryLevel', 'true');
    if (filters.workplace.length > 0) p.set('workplace', filters.workplace.join(','));
    if (filters.date !== DEFAULT_FILTERS.date) p.set('date', filters.date);
    if (search.length >= 2) p.set('search', search);
    if (filters.locations.length > 0) p.set('locations', filters.locations.join(','));
    if (filters.techStack.length > 0) p.set('techStack', filters.techStack.join(','));
    if (filters.salaryMin) p.set('salaryMin', filters.salaryMin);
    if (filters.salaryMax) p.set('salaryMax', filters.salaryMax);

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
    setError(null);
    try {
      const r = await fetch(`/api/seeker/jobs?${p}`, { credentials: 'include', signal: controller.signal });
      if (!r.ok) throw new Error(`The jobs service answered ${r.status}. Give it a second and try again.`);
      const d = await r.json() as JobsResponse;
      if (controller.signal.aborted) return;
      responseCache.set(cacheKey, { data: d, at: Date.now() });
      applyResponse(d);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      console.error(e);
      setError(e instanceof Error && e.message ? e.message : 'Check your connection and try again.');
    } finally {
      if (!controller.signal.aborted) {
        if (append) setLoadingMore(false); else setLoading(false);
      }
    }
    // `filters` is derived from the URL, so it is a new object only when the URL
    // changed — one dep instead of eleven, and no array-identity churn.
  }, [filters, search]);

  // Debounced refetch: rapid filter toggles collapse into one request.
  useEffect(() => {
    const t = setTimeout(() => { fetchJobs(1, false); }, 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  const retry = useCallback(() => { responseCache.clear(); void fetchJobs(1, false); }, [fetchJobs]);

  return { jobs, setJobs, totalJobs, totalPages, currentPage, loading, loadingMore, error, retry, fetchJobs };
}
