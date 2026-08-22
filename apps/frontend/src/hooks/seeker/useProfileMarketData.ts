'use client';
// FILE: src/hooks/seeker/useProfileMarketData.ts
// Loads the two independent market endpoints for ProfileMarketCard (D4). Both
// fire in parallel and settle independently (allSettled semantics): a match-count
// success is rendered even if the salary benchmark fails, and vice versa — the
// card never blanket-fails. Same F2 safety pattern: AbortController + isCancelled
// ref so an unmount can't land a late state update (R2).

import { useEffect, useRef, useState } from 'react';
import { fetchMatchCount, fetchSalaryBenchmark, SeekerApiError } from '../../api/seeker-api';
import type { MatchCount, SalaryBenchmark } from '../../types/seeker-profile';

export type ProfileMarketStatus = 'idle' | 'loading' | 'loaded' | 'failed';

export interface UseProfileMarketDataResult {
  matchCount: MatchCount | null;
  salaryBenchmark: SalaryBenchmark | null;
  matchErrorCode: string | null;
  salaryErrorCode: string | null;
  status: ProfileMarketStatus;
}

function errorCodeOf(err: unknown): string {
  return err instanceof SeekerApiError && err.code ? err.code : 'UNKNOWN';
}

export function useProfileMarketData(): UseProfileMarketDataResult {
  const [matchCount, setMatchCount] = useState<MatchCount | null>(null);
  const [salaryBenchmark, setSalaryBenchmark] = useState<SalaryBenchmark | null>(null);
  const [matchErrorCode, setMatchErrorCode] = useState<string | null>(null);
  const [salaryErrorCode, setSalaryErrorCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ProfileMarketStatus>('idle');
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    const controller = new AbortController();
    setStatus('loading');
    (async () => {
      const [match, salary] = await Promise.allSettled([
        fetchMatchCount(controller.signal),
        fetchSalaryBenchmark(controller.signal),
      ]);
      if (cancelled.current) return;
      if (match.status === 'fulfilled') setMatchCount(match.value);
      else setMatchErrorCode(errorCodeOf(match.reason));
      if (salary.status === 'fulfilled') setSalaryBenchmark(salary.value);
      else setSalaryErrorCode(errorCodeOf(salary.reason));
      // 'failed' only when BOTH endpoints error; a partial success is 'loaded'.
      const bothFailed = match.status === 'rejected' && salary.status === 'rejected';
      setStatus(bothFailed ? 'failed' : 'loaded');
    })();
    return () => { cancelled.current = true; controller.abort(); };
  }, []);

  return { matchCount, salaryBenchmark, matchErrorCode, salaryErrorCode, status };
}

export default useProfileMarketData;
