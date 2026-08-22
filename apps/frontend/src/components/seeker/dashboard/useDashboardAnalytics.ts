'use client';
// FILE: src/components/seeker/dashboard/useDashboardAnalytics.ts
// Funnel 2 (Seeker Job Discovery) analytics, extracted from the Dashboard orchestrator
// to keep it under the 200-line cap. Fires jobs_list_viewed once (after the first load
// resolves, so totalResults is real) and jobs_search_query_entered on a 500ms debounce
// (length only, never the query text — D8). Returns a click tracker for job cards.
import { useEffect, useRef } from 'react';
import { trackEvent } from '../../../lib/analytics-events';
import { getFromRoute } from '../../../lib/from-route';

interface DashboardAnalyticsArgs {
  loading: boolean;
  totalResults: number;
  filterCount: number;
  searchInput: string;
}

export function useDashboardAnalytics({ loading, totalResults, filterCount, searchInput }: DashboardAnalyticsArgs) {
  const hasFiredView = useRef(false);

  // jobs_list_viewed — once, after the initial fetch completes.
  useEffect(() => {
    if (loading || hasFiredView.current) return;
    hasFiredView.current = true;
    trackEvent('jobs_list_viewed', { totalResults, filterCount });
    // filterCount/totalResults intentionally read at first-load time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // jobs_search_query_entered — 500ms debounce; only positive-length queries (D8).
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed.length === 0) return undefined;
    const timer = setTimeout(() => {
      trackEvent('jobs_search_query_entered', { queryLength: trimmed.length });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);
}

export function trackJobResultClick(jobId: string, positionInList: number): void {
  trackEvent('jobs_result_clicked', { jobId, positionInList, fromRoute: getFromRoute() });
}
