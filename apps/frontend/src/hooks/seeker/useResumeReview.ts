'use client';
// FILE: src/hooks/seeker/useResumeReview.ts
// Owns the resume-review lifecycle for ProfileReviewCard (D3). Fetches the
// cached review on mount (GET), and exposes run() to trigger a fresh one (POST).
// Mirrors the F2 pattern: an AbortController per request + an isCancelled ref so
// an unmount (or a rerun) never lands a state update on a dead component (R2).
// isStale is a pure derivation the card computes via computeStale(); the hook
// never re-fetches to answer it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchResumeReview, runResumeReview, SeekerApiError } from '../../api/seeker-api';
import type { ResumeReview } from '../../types/seeker-profile';

export type ResumeReviewStatus = 'idle' | 'loading' | 'running' | 'loaded' | 'failed';

export interface UseResumeReviewResult {
  review: ResumeReview | null;
  status: ResumeReviewStatus;
  errorCode: string | null;
  errorMessage: string | null;
  run: () => Promise<void>;
  computeStale: (profileUpdatedAt: string | null) => boolean;
}

export function useResumeReview(): UseResumeReviewResult {
  const [review, setReview] = useState<ResumeReview | null>(null);
  const [status, setStatus] = useState<ResumeReviewStatus>('idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    const controller = new AbortController();
    setStatus('loading');
    (async () => {
      try {
        const result = await fetchResumeReview(controller.signal);
        if (cancelled.current) return;
        setReview(result);
        setStatus('loaded');
      } catch (err) {
        if (cancelled.current) return;
        applyError(err);
      }
    })();
    return () => { cancelled.current = true; controller.abort(); };
  }, []);

  const applyError = (err: unknown) => {
    const isApiError = err instanceof SeekerApiError;
    setErrorCode(isApiError ? err.code : null);
    setErrorMessage(err instanceof Error ? err.message : null);
    setStatus('failed');
  };

  // run() keeps any existing review on screen while the POST is in flight (D5).
  const run = useCallback(async () => {
    setStatus('running');
    setErrorCode(null);
    setErrorMessage(null);
    try {
      const result = await runResumeReview();
      if (cancelled.current) return;
      setReview(result);
      setStatus('loaded');
    } catch (err) {
      if (cancelled.current) return;
      applyError(err);
    }
  }, []);

  const computeStale = useCallback((profileUpdatedAt: string | null) => {
    if (!review || !profileUpdatedAt) return false;
    return new Date(review.reviewedAt).getTime() < new Date(profileUpdatedAt).getTime();
  }, [review]);

  return { review, status, errorCode, errorMessage, run, computeStale };
}

export default useResumeReview;
