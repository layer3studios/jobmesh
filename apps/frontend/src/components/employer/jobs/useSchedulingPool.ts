// FILE: src/components/employer/jobs/useSchedulingPool.ts
// Loads what the "Send scheduling link" button needs: whether the posting has
// interviewDefaults and how many pool times remain. Defaults visibility falls
// back to availableCount > 0 (times can only exist once defaults do), so the
// button still appears while the posting payload lacks interviewDefaults.

import { useCallback, useEffect, useState } from 'react';
import { getEmployerPosting } from '../../../api/employer-jobs-api';
import { getInterviewTimeCount } from '../../../api/employer-interview-times-api';

export function useSchedulingPool(postingId: string): {
  hasDefaults: boolean;
  availableCount: number;
  refetchPool: () => Promise<void>;
} {
  const [hasDefaults, setHasDefaults] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);

  const refetchPool = useCallback(async () => {
    if (!postingId) return;
    try {
      const [posting, count] = await Promise.all([
        getEmployerPosting(postingId),
        getInterviewTimeCount(postingId),
      ]);
      setAvailableCount(count.availableCount);
      setHasDefaults(Boolean(posting.interviewDefaults) || count.availableCount > 0);
    } catch {
      // Pool info is an enhancement — a failed load just hides the button.
      setHasDefaults(false);
      setAvailableCount(0);
    }
  }, [postingId]);

  useEffect(() => { void refetchPool(); }, [refetchPool]);

  return { hasDefaults, availableCount, refetchPool };
}
