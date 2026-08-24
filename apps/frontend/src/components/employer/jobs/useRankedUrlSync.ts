'use client';
// FILE: src/components/employer/jobs/useRankedUrlSync.ts
// The two pieces of RankedTab state that live in the URL as well as in React:
// the server-side filter set, and the assignment-review chip.
//
// THEY ARE HERE TOGETHER because they share one rule — every change is a router
// replace as well as a setState, so a pasted link restores the same filtered view.
// Splitting them apart would duplicate that rule twice.
//
// Extracted from RankedTab for size (section 2). Behaviour is unchanged: the
// initial values still come from the first render's search params, and each setter
// still writes state and URL in the same order it always did.

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { AssignmentReviewFilter } from '@/types/employer-applicants';
import { parseAssignmentFilter } from '@/components/employer/jobs/parts/review-helpers';
import {
  createInitialServerFilterState,
  readServerFiltersFromSearchParams, writeServerFiltersToSearchParams,
} from './ranked-filter-helpers';
import type { ServerFilterState } from './ranked-filter-helpers';

export interface RankedUrlSync {
  serverFilters: ServerFilterState;
  setServerFilters: (next: ServerFilterState) => void;
  assignmentFilter: AssignmentReviewFilter | null;
  setAssignmentFilter: (next: AssignmentReviewFilter | null) => void;
  clearServerFilters: () => void;
}

export function useRankedUrlSync(): RankedUrlSync {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [serverFilters, setServerFiltersState] = useState<ServerFilterState>(
    () => readServerFiltersFromSearchParams(new URLSearchParams(searchParams?.toString() ?? '')),
  );
  const [assignmentFilter, setAssignmentFilterState] = useState<AssignmentReviewFilter | null>(
    () => parseAssignmentFilter(searchParams?.get('assignmentReview')),
  );

  /** Replace (not push) so filtering never fills the back button with dead ends. */
  const replaceParams = useCallback((mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    mutate(params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  const setServerFilters = useCallback((next: ServerFilterState) => {
    setServerFiltersState(next);
    replaceParams((params) => writeServerFiltersToSearchParams(next, params));
  }, [replaceParams]);

  const setAssignmentFilter = useCallback((next: AssignmentReviewFilter | null) => {
    setAssignmentFilterState(next);
    replaceParams((params) => {
      if (next) params.set('assignmentReview', next);
      else params.delete('assignmentReview');
    });
  }, [replaceParams]);

  const clearServerFilters = useCallback(
    () => setServerFilters(createInitialServerFilterState()),
    [setServerFilters],
  );

  return { serverFilters, setServerFilters, assignmentFilter, setAssignmentFilter, clearServerFilters };
}

export default useRankedUrlSync;
