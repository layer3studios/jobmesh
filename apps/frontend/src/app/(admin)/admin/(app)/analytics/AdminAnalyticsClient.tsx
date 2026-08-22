'use client';
// FILE: src/app/(admin)/admin/(app)/analytics/AdminAnalyticsClient.tsx
// Client dashboard. SSR seeds initialData for initialSince (fast first paint); filter
// clicks fetch client-side and memoize per range in memory, so revisiting a range is
// instant (D1/D5). Failures are bundle-level, surface inline with Retry (D2/D7).
// Section markup lives in parts/AnalyticsSections (dense overview-first layout).
//
// initialData is NULLABLE. When the PostHog bundles are unavailable at SSR (missing
// key → 503), the page hands us `posthogNotice` instead of data, and this component
// still renders the shell, the header and the time selector, with the notice standing
// in for the PostHog sections only. The Mongo-backed assignments section below is
// rendered unconditionally — see page.tsx's header comment for the source-split rule.
import { useCallback, useState } from 'react';
import type { AdminAnalyticsData, SinceRange } from '@/types/admin-analytics';
import { fetchAllAnalyticsBundles, AdminAnalyticsApiError } from '@/api/admin-analytics-api';
import AnalyticsSections from './parts/AnalyticsSections';
import AssignmentAnalyticsSection from './parts/AssignmentAnalyticsSection';
import TimeRangeSelector from './parts/TimeRangeSelector';
import EmptyStateNotice from './parts/EmptyStateNotice';

// Map a bundle-level error to a user-facing message + whether a Retry makes sense.
function describeError(error: AdminAnalyticsApiError): { title: string; body: string; canRetry: boolean } {
  if (error.code === 'ANALYTICS_DISABLED') {
    return { title: 'Analytics not configured', body: 'Set POSTHOG_PERSONAL_API_KEY on the backend and reload — no data can be fetched until then.', canRetry: false };
  }
  if (error.status === 401 || error.status === 403) {
    return { title: 'Session expired', body: 'Reload the page to sign in again.', canRetry: false };
  }
  return { title: "Couldn't load analytics", body: error.message || 'Something went wrong fetching this range.', canRetry: true };
}

// Full-page error surface for a range with no cached data — notice + optional Retry.
function ErrorSurface({ error, onRetry }: { error: AdminAnalyticsApiError; onRetry: () => void }) {
  const { title, body, canRetry } = describeError(error);
  return (
    <>
      <EmptyStateNotice title={title} body={body} />
      {canRetry && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" onClick={onRetry} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
          }}>Retry</button>
        </div>
      )}
    </>
  );
}

export default function AdminAnalyticsClient({
  initialData, initialSince, posthogNotice = null,
}: {
  initialData: AdminAnalyticsData | null;
  initialSince: SinceRange;
  /** Set when the PostHog bundles failed at SSR in a way that is expected and
   *  explainable (missing key). Stands in for those sections, not for the page. */
  posthogNotice?: { title: string; body: string } | null;
}) {
  const [currentSince, setCurrentSince] = useState<SinceRange>(initialSince);
  // Seed only when SSR actually produced data — a null seed would masquerade as a
  // successful cache hit and suppress the client refetch on the initial range.
  const [cache, setCache] = useState<Map<SinceRange, AdminAnalyticsData>>(
    () => (initialData ? new Map([[initialSince, initialData]]) : new Map()),
  );
  const [loadingRanges, setLoadingRanges] = useState<Set<SinceRange>>(() => new Set());
  const [errorByRange, setErrorByRange] = useState<Map<SinceRange, AdminAnalyticsApiError>>(() => new Map());
  const [dismissed, setDismissed] = useState<Set<SinceRange>>(() => new Set());

  const load = useCallback(async (next: SinceRange) => {
    setLoadingRanges((prev) => new Set(prev).add(next));
    try {
      const data = await fetchAllAnalyticsBundles(next);
      setCache((prev) => new Map(prev).set(next, data));
      setErrorByRange((prev) => { const m = new Map(prev); m.delete(next); return m; });
    } catch (error) {
      const apiError = error instanceof AdminAnalyticsApiError
        ? error
        : new AdminAnalyticsApiError(0, null, error instanceof Error ? error.message : 'Failed to load analytics.');
      setErrorByRange((prev) => new Map(prev).set(next, apiError));
    } finally {
      setLoadingRanges((prev) => { const s = new Set(prev); s.delete(next); return s; });
    }
  }, []);

  const onSelect = (next: SinceRange) => {
    if (next === currentSince) return;
    setCurrentSince(next);
    if (!cache.has(next)) void load(next);
  };

  const retry = () => { setDismissed((prev) => { const s = new Set(prev); s.delete(currentSince); return s; }); void load(currentSince); };
  const dismissBanner = () => setDismissed((prev) => new Set(prev).add(currentSince));

  const data = cache.get(currentSince);
  const currentError = errorByRange.get(currentSince);
  const isChanging = loadingRanges.has(currentSince);

  return (
    <div className="mx-auto w-full max-w-[1536px]" style={{ padding: '24px clamp(16px, 3vw, 32px) 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Analytics</h1>
        <TimeRangeSelector value={currentSince} onSelect={onSelect} isChanging={isChanging} />
      </div>

      {/* Refresh failed but a cached view for this range still exists — keep showing it. */}
      {data && currentError && !dismissed.has(currentSince) && (
        <div role="status" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16,
          padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--paper-2)',
          color: 'var(--ink-muted)', fontSize: '0.85rem',
        }}>
          <span>Refresh failed — showing cached data. Try again.</span>
          <button type="button" onClick={dismissBanner} aria-label="Dismiss" style={{
            border: 'none', background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer', fontWeight: 600,
          }}>Dismiss</button>
        </div>
      )}

      {/* PostHog half. Whatever happens here, it replaces THESE SECTIONS ONLY —
          the shell, the selector and the assignments section below all survive. */}
      {data ? (
        <AnalyticsSections data={data} />
      ) : currentError ? (
        <ErrorSurface error={currentError} onRetry={retry} />
      ) : posthogNotice ? (
        <EmptyStateNotice title={posthogNotice.title} body={posthogNotice.body} />
      ) : (
        <p style={{ textAlign: 'center', marginTop: 60, color: 'var(--ink-muted)' }}>Loading analytics…</p>
      )}

      {/* Outside the bundle branch on purpose: its Mongo half has no PostHog
          dependency, so it must render even when the bundle above 503s. */}
      <AssignmentAnalyticsSection since={currentSince} />
    </div>
  );
}
