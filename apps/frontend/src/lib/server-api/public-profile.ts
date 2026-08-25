// FILE: src/lib/server-api/public-profile.ts
// Server-only read for /u/{slug}. Public, so it goes through publicServerFetch
// (no cookies, ISR/data-cache eligible). React.cache-wrapped because
// generateMetadata AND the page body both call it — without this the page costs
// two upstream requests and two view-count increments for one visit.
//
// A 404 (unknown slug, or a profile turned private) is a NORMAL outcome, not an
// error: it resolves to null so the page can render its own not-found state.
// Anything else — a 500, an unreachable backend — also degrades to null rather
// than throwing, because a public link that errors reads as broken to the person
// the candidate sent it to.
import { cache } from 'react';
import { publicServerFetch } from '../public-server-fetch';
import { ServerFetchError } from '../server-fetch';
import type { PublicProfile } from '../../types/public-profile';

// Matches the backend's Cache-Control: public, max-age=300. The view count is
// intentionally approximate — an exact count is not worth a dynamic render on
// every visit to every profile.
const PROFILE_REVALIDATE = 300;

export const getPublicProfileServer = cache(async (slug: string): Promise<PublicProfile | null> => {
  try {
    const body = await publicServerFetch<{ profile: PublicProfile }>(
      `/public/profile/${encodeURIComponent(slug)}`,
      PROFILE_REVALIDATE,
    );
    return body.profile ?? null;
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) return null;
    console.warn('[public-profile] load failed:', error instanceof Error ? error.message : error);
    return null;
  }
});

/**
 * Every published slug, for sitemap.ts. Hourly revalidate, matching the sitemap's
 * own window. NOT React.cache-wrapped: it has exactly one caller, once per
 * sitemap render, so deduping would only add a cache entry nothing reads.
 */
export async function getPublicProfileSlugsServer(): Promise<string[]> {
  const body = await publicServerFetch<{ slugs: string[] }>('/public/profile', 3600);
  return body.slugs ?? [];
}
