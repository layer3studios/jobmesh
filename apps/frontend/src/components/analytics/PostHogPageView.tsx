'use client';
// FILE: src/components/analytics/PostHogPageView.tsx
// Manual $pageview capture for the App Router. capture_pageview is disabled in
// initPostHog() because PostHog's automatic pageview does not reliably fire on
// client-side navigations in the App Router (R6); we fire it here on every
// pathname/searchParams change (and on the initial mount). Guarded by the helper —
// a no-op until consent grants and PostHog initialises.
//
// useSearchParams must sit inside a Suspense boundary in the App Router (R1); the
// mount site wraps this component in <Suspense fallback={null}>.
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { capturePageView } from '@/lib/posthog';

export default function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    capturePageView(pathname, query ? query : undefined);
  }, [pathname, searchParams]);

  return null;
}
