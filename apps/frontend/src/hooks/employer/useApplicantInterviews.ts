// FILE: src/hooks/employer/useApplicantInterviews.ts
// Owns the interview list for one application. Every mutation refetches rather
// than optimistically patching — interview state is low-frequency and
// correctness matters more than snappiness here.

import { useCallback, useEffect, useState } from 'react';
import { listInterviews, EmployerInterviewsApiError } from '../../api/employer-interviews-api';
import type { Interview } from '../../types/employer-interviews';

const LOAD_ERROR_MESSAGE = 'Could not load interviews.';

const ACTIVE_STATUSES: Interview['status'][] = ['proposed', 'scheduled'];

export function useApplicantInterviews(applicationId: string): {
  interviews: Interview[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  activeInterview: Interview | null;
  hasActiveInterview: boolean;
} {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const list = await listInterviews(applicationId);
      setInterviews(list);
    } catch (caught) {
      setError(caught instanceof EmployerInterviewsApiError ? caught.message : LOAD_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  const activeInterview = interviews.find((interview) => ACTIVE_STATUSES.includes(interview.status)) ?? null;

  return {
    interviews,
    loading,
    error,
    refetch,
    activeInterview,
    hasActiveInterview: activeInterview !== null,
  };
}
