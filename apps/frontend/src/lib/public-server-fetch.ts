// FILE: src/lib/public-server-fetch.ts
// Server-side fetch for PUBLIC (unauthenticated) reads — jobs list, job detail,
// company directory, public apply company/job. Deliberately does NOT call
// next/headers cookies(): reading cookies forces the route dynamic and kills
// ISR/data-cache (NAV-PERF-AUDIT §5). Instead it opts into the Next Data Cache via
// { next: { revalidate } }, so repeat renders serve cached data without re-hitting
// Express — even when the route itself is dynamic for other reasons.
//
// Same ServerFetchError + JSON-parse behavior as serverFetch, and the same
// AbortController timeout ceiling (§8).
import {
  ServerFetchError, parseServerResponse, serverApiUrl, SERVER_FETCH_TIMEOUT_MS,
} from './server-fetch';

/**
 * Fetch a public backend `/api` path with a revalidate window (seconds). No cookies
 * are attached. Returns parsed JSON on 2xx; throws ServerFetchError otherwise.
 */
export async function publicServerFetch<T>(
  path: string, revalidate: number, init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(serverApiUrl(path), {
      next: { revalidate },
      signal: controller.signal,
      ...init,
      headers: { ...(init?.headers ?? {}) },
    });
  } catch (error) {
    const aborted = controller.signal.aborted;
    throw new ServerFetchError(
      504,
      aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
      aborted ? `Upstream timed out after ${SERVER_FETCH_TIMEOUT_MS}ms` : (error instanceof Error ? error.message : 'Upstream unavailable'),
    );
  } finally {
    clearTimeout(timer);
  }

  return parseServerResponse<T>(response);
}
