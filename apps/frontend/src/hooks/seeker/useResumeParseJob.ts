'use client';
// FILE: src/hooks/seeker/useResumeParseJob.ts
// Polls GET /api/seeker/resume/jobs/:jobId until the parse job reaches a terminal
// state (D3). Fixed 2s cadence, exponential backoff on transient network/5xx for
// the NEXT poll only (never surfaced unless the overall timeout trips), and a hard
// 3-minute client timeout (R1/R4). Every fetch carries an AbortController and the
// effect is guarded by an isCancelled ref so no timer or fetch survives unmount or
// a jobId change under React 19 StrictMode double-mount (R2).

import { useEffect, useState } from 'react';
import { fetchResumeJob } from '../../api/seeker-api';
import type { ParsedProfile } from '../../types/seeker-profile';

export const POLL_INTERVAL_MILLISECONDS = 2000;
export const MAX_BACKOFF_MILLISECONDS = 15000;
export const POLL_TIMEOUT_MILLISECONDS = 180_000;
export const POLL_TIMEOUT_CODE = 'POLL_TIMEOUT';

type ResumeParseJobHookStatus = 'idle' | 'polling' | 'done' | 'failed' | 'timeout';

interface ResumeParseJobHookState {
  status: ResumeParseJobHookStatus;
  profile: ParsedProfile | null;
  errorCode: string | null;
  errorMessage: string | null;
}

const IDLE_STATE: ResumeParseJobHookState = {
  status: 'idle', profile: null, errorCode: null, errorMessage: null,
};

export function useResumeParseJob(jobId: string | null): ResumeParseJobHookState {
  const [state, setState] = useState<ResumeParseJobHookState>(IDLE_STATE);

  useEffect(() => {
    if (jobId === null) {
      setState(IDLE_STATE);
      return;
    }
    setState({ status: 'polling', profile: null, errorCode: null, errorMessage: null });

    const cancelled = { current: false };
    let controller: AbortController | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let nextDelay = POLL_INTERVAL_MILLISECONDS;

    const stop = () => {
      cancelled.current = true;
      controller?.abort();
      if (pollTimer !== null) clearTimeout(pollTimer);
    };

    const timeoutTimer = setTimeout(() => {
      if (cancelled.current) return;
      stop();
      setState({ status: 'timeout', profile: null, errorCode: POLL_TIMEOUT_CODE, errorMessage: null });
    }, POLL_TIMEOUT_MILLISECONDS);

    const schedule = (delay: number) => {
      pollTimer = setTimeout(() => { void poll(); }, delay);
    };

    const poll = async () => {
      if (cancelled.current) return;
      controller = new AbortController();
      try {
        const job = await fetchResumeJob(jobId, controller.signal);
        if (cancelled.current) return;
        nextDelay = POLL_INTERVAL_MILLISECONDS;
        if (job.status === 'done') {
          stop();
          clearTimeout(timeoutTimer);
          setState({ status: 'done', profile: job.result?.profile ?? null, errorCode: null, errorMessage: null });
          return;
        }
        if (job.status === 'failed') {
          stop();
          clearTimeout(timeoutTimer);
          setState({ status: 'failed', profile: null, errorCode: job.errorCode, errorMessage: job.errorMessage });
          return;
        }
        schedule(nextDelay);
      } catch {
        // Transient network/5xx blip — expected. Back the next poll off but keep
        // polling; the user only ever sees an error if the overall timeout trips (R5).
        if (cancelled.current) return;
        nextDelay = Math.min(nextDelay * 2, MAX_BACKOFF_MILLISECONDS);
        schedule(nextDelay);
      }
    };

    void poll();

    return () => {
      stop();
      clearTimeout(timeoutTimer);
    };
  }, [jobId]);

  return state;
}

export default useResumeParseJob;
