'use client';
// FILE: src/components/employer/jobs/useRankedApplicants.ts
// The ranked view's server data: applicants, assignment stats, stages, archive
// reasons and facets, plus the load lifecycle around them.
//
// Extracted from RankedTab for size (section 2). The sequence is unchanged — the
// first load runs immediately and every later one is debounced by 300ms, so
// dragging a filter does not fire a request per intermediate value.
//
// `onLoaded` exists so selection pruning still happens at exactly the moment the
// rows arrive. Doing it in an effect on `applicants` instead would run a render
// later, and for one frame the bulk bar would count candidates no longer listed.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listApplicantsWithStats, listStages, listArchiveReasons,
  fetchApplicantFacets, EmployerApplicantsApiError,
} from '@/api/employer-applicants-api';
import type {
  Applicant, ApplicantFacets, ArchiveReason, Stage, ApplicantSort,
  AssignmentStats, AssignmentReviewFilter,
} from '@/types/employer-applicants';
import { serverFiltersToQuery } from './ranked-filter-helpers';
import type { ServerFilterState } from './ranked-filter-helpers';

export type LoadState = 'loading' | 'loaded' | 'error';
const LOAD_ERROR_MESSAGE = 'Could not load applicants.';

export interface UseRankedApplicantsOptions {
  postingId: string;
  sort: ApplicantSort;
  serverFilters: ServerFilterState;
  assignmentFilter: AssignmentReviewFilter | null;
  /** Called with the ids present in the freshly loaded page, before state settles. */
  onLoaded: (presentIds: Set<string>) => void;
}

export function useRankedApplicants({
  postingId, sort, serverFilters, assignmentFilter, onLoaded,
}: UseRankedApplicantsOptions) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  // Rendered exactly as the API returns it. undefined means the posting has no
  // assignment, which is the signal to render the plain list unchanged.
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStats | undefined>(undefined);
  const [stages, setStages] = useState<Stage[]>([]);
  const [reasons, setReasons] = useState<ArchiveReason[]>([]);
  const [facets, setFacets] = useState<ApplicantFacets>({ skills: [], cities: [] });
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);
  const hasLoadedOnce = useRef(false);

  // Held in a ref so a caller passing an inline arrow does not re-create `load`
  // on every render and restart the debounce.
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const load = useCallback(async (activeSort: ApplicantSort) => {
    setLoadState('loading');
    try {
      const filters = serverFiltersToQuery(serverFilters);
      // The assignment filter is a SERVER filter — the backend owns the predicate,
      // and applying it client-side would silently disagree with the stats.
      if (assignmentFilter) filters.assignmentReview = assignmentFilter;
      const [listResult, stagesResult, reasonsResult] = await Promise.all([
        listApplicantsWithStats(postingId, { sort: activeSort, filters }),
        listStages(),
        listArchiveReasons(),
      ]);
      const applicantsResult = listResult.applicants;
      setApplicants(applicantsResult);
      // Straight assignment, never a computation over the rows above.
      setAssignmentStats(listResult.stats);
      setStages(stagesResult);
      setReasons(reasonsResult);
      onLoadedRef.current(new Set(applicantsResult.map((item) => item.application.id)));
      hasLoadedOnce.current = true;
      setLoadState('loaded');
    } catch (error) {
      setLastError(error instanceof EmployerApplicantsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId, serverFilters, assignmentFilter]);

  useEffect(() => {
    if (!hasLoadedOnce.current) { void load(sort); return; }
    const timer = setTimeout(() => { void load(sort); }, 300);
    return () => clearTimeout(timer);
  }, [load, sort]);

  useEffect(() => {
    let cancelled = false;
    fetchApplicantFacets(postingId)
      .then((result) => { if (!cancelled) setFacets(result); })
      .catch(() => { /* facet sections simply don't render counts */ });
    return () => { cancelled = true; };
  }, [postingId]);

  return {
    applicants, assignmentStats, stages, reasons, facets,
    loadState, lastError, hasLoadedOnce, reload: load,
  };
}

export default useRankedApplicants;
