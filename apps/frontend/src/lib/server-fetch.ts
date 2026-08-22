// FILE: src/lib/server-fetch.ts
// Server-side cookie-forwarding fetch (AUTH-PLAN §2, R1). Used by Server
// Components, layouts, sitemap.ts for AUTHENTICATED reads. Reads the incoming
// request's cookie jar via next/headers (async in Next 15) and attaches it as a
// Cookie header so the backend sees an authenticated request during SSR. Throws
// ServerFetchError on non-2xx / timeout so callers can branch (401 → guest, etc).
//
// PUBLIC reads (no cookie needed — jobs, directory, apply) must use
// ./public-server-fetch instead: reading cookies() here forces the whole route
// dynamic, which defeats ISR/data-cache (NAV-PERF-AUDIT §5).
import { cookies } from 'next/headers';
import { API_BASE } from './api-base';

// Origin comes ONLY from env (C10) — the dev default lives in .env.example, not
// here. Empty when unset (server code must set it in every real environment).
const SERVER_API_ORIGIN =
  process.env.SERVER_API_ORIGIN ?? process.env.DEV_API_PROXY_ORIGIN ?? '';

// Hard ceiling on any single SSR upstream call so a slow/hung Express degrades
// gracefully instead of hanging the navigation (NAV-PERF-AUDIT §8).
export const SERVER_FETCH_TIMEOUT_MS = 3000;

export class ServerFetchError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'ServerFetchError';
    this.status = status;
    this.code = code;
  }
}

/** Parse a 2xx JSON body or throw a typed ServerFetchError. Shared with publicServerFetch. */
export async function parseServerResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ServerFetchError(
      response.status,
      (body as { code?: string | null })?.code ?? null,
      (body as { error?: string })?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

/** Full request URL for a backend `/api` path. Shared with publicServerFetch. */
export function serverApiUrl(path: string): string {
  return `${SERVER_API_ORIGIN}${API_BASE}${path}`;
}

/**
 * Fetch a backend `/api` path from server code with the caller's cookies forwarded.
 * `path` is the portion AFTER '/api' (e.g. '/seeker/me'), matching the client api
 * modules. Returns parsed JSON on 2xx; throws ServerFetchError otherwise. Aborts
 * after SERVER_FETCH_TIMEOUT_MS by default; pass `options.timeoutMs` to widen the
 * budget for analytics-class endpoints (e.g. PostHog Query API, whose queue can hold
 * a request up to 30s) where the 3s ceiling would spuriously time out.
 */
export async function serverFetch<T>(
  path: string, init?: RequestInit, options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? SERVER_FETCH_TIMEOUT_MS;
  const cookieJar = await cookies();
  const cookieHeader = cookieJar.toString(); // C9: forward the whole jar; backend authorizes per route.

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(serverApiUrl(path), {
      // Authed reads must never be cached across users.
      cache: 'no-store',
      signal: controller.signal,
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
  } catch (error) {
    const aborted = controller.signal.aborted;
    throw new ServerFetchError(
      504,
      aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
      aborted ? `Upstream timed out after ${timeoutMs}ms` : (error instanceof Error ? error.message : 'Upstream unavailable'),
    );
  } finally {
    clearTimeout(timer);
  }

  return parseServerResponse<T>(response);
}
