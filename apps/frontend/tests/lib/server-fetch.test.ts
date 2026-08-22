import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/headers so cookies() returns a fake jar with a Cookie value.
vi.mock('next/headers', () => ({
  cookies: async () => ({ toString: () => 'tj_token=abc123; jm_employer_token=xyz' }),
}));

import { serverFetch, ServerFetchError } from '@/lib/server-fetch';

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

describe('serverFetch', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('forwards the whole cookie jar as a Cookie header and returns JSON on 2xx', async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() => Promise.resolve(jsonResponse(200, { ok: true })));
    vi.stubGlobal('fetch', fetchMock);

    const data = await serverFetch<{ ok: boolean }>('/seeker/me');
    expect(data.ok).toBe(true);

    const init = fetchMock.mock.calls[0][1];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers.Cookie).toBe('tj_token=abc123; jm_employer_token=xyz');
  });

  it('throws a typed ServerFetchError (status + code) on non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() => Promise.resolve(jsonResponse(401, { code: 'UNAUTHENTICATED', error: 'nope' }))));

    const error = await serverFetch('/seeker/me').catch((caught) => caught);
    expect(error).toBeInstanceOf(ServerFetchError);
    expect((error as ServerFetchError).status).toBe(401);
    expect((error as ServerFetchError).code).toBe('UNAUTHENTICATED');
  });
});

describe('serverFetch timeoutMs override', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.useRealTimers());

  // fetch that resolves after `delayMs` (null = never), and rejects if the
  // AbortController fires — mirroring how the real fetch reacts to signal.abort().
  function abortableFetch(delayMs: number | null, body: unknown) {
    return vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
      if (delayMs != null) setTimeout(() => resolve(jsonResponse(200, body)), delayMs);
      init?.signal?.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    }));
  }

  it('honors timeoutMs override — override longer than default (does not abort)', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', abortableFetch(100, { ok: true }));

    const promise = serverFetch<{ ok: boolean }>('/admin/analytics/volume', undefined, { timeoutMs: 10_000 });
    await vi.advanceTimersByTimeAsync(100);
    const data = await promise;
    expect(data.ok).toBe(true);
  });

  it('honors timeoutMs override — override shorter than default (aborts with UPSTREAM_TIMEOUT)', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', abortableFetch(null, {}));

    const promise = serverFetch('/admin/analytics/volume', undefined, { timeoutMs: 50 });
    const caught = promise.catch((error) => error);
    await vi.advanceTimersByTimeAsync(50);
    const error = await caught;
    expect(error).toBeInstanceOf(ServerFetchError);
    expect((error as ServerFetchError).code).toBe('UPSTREAM_TIMEOUT');
    expect((error as ServerFetchError).message).toContain('50ms');
  });

  it('defaults to SERVER_FETCH_TIMEOUT_MS when no override is passed', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', abortableFetch(null, {}));

    const promise = serverFetch('/seeker/me');
    const caught = promise.catch((error) => error);
    await vi.advanceTimersByTimeAsync(3000);
    const error = await caught;
    expect(error).toBeInstanceOf(ServerFetchError);
    expect((error as ServerFetchError).code).toBe('UPSTREAM_TIMEOUT');
    expect((error as ServerFetchError).message).toContain('3000ms');
  });
});
