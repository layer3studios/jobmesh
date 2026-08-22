'use client';
// FILE: src/hooks/employer/useDashboard.ts
// Loads the dashboard summary + activity feed in PARALLEL on mount. One error
// state for the page (the dashboard is all-or-nothing); refetch re-runs both.

import { useCallback, useEffect, useState } from 'react';
import { fetchDashboardSummary, fetchDashboardActivity } from '@/api/employer-dashboard-api';
import type { DashboardSummary, DashboardActivityEvent } from '@/types/employer-dashboard';

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<DashboardActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, activityResult] = await Promise.all([
        fetchDashboardSummary(),
        fetchDashboardActivity(),
      ]);
      setSummary(summaryResult);
      setActivity(activityResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { summary, activity, loading, error, refetch };
}
