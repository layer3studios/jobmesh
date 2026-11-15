'use client';
// FILE: src/components/analytics/RouteAnalytics.tsx
// GA4 pageviews for client-side navigations. Replaces PostHogPageView, which
// captured PostHog pageviews by hand.
//
// Why PostHog is NOT captured here any more: initPostHog() now runs with
// `capture_pageview: 'history_change'`, so posthog-js follows the History API
// itself. Capturing here as well would double-count every navigation. The old
// manual approach also lost the entry pageview entirely — the effect ran while
// consent was still pending, no-oped, and never re-fired once consent was
// granted. Letting the SDK own its pageviews fixes both.
//
// GTM still needs help: its GA4 tag fires on container load only, so pushState
// navigations are invisible to it without an explicit page_view event. Clarity
// follows the History API on its own.
//
// The first run is skipped deliberately — the GTM container load already
// counted the initial page, so firing here too would double-count the landing
// page of every session.
//
// useSearchParams requires a Suspense boundary in the App Router; the mount
// site wraps this in <Suspense fallback={null}>.
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageViewGA } from '@/lib/tracking';

export default function RouteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (!pathname) return;

    const query = searchParams?.toString();
    trackPageViewGA(pathname + (query ? `?${query}` : ''), document.title);
  }, [pathname, searchParams]);

  return null;
}
