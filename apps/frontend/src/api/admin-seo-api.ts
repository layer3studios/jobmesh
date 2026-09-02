// FILE: src/api/admin-seo-api.ts
// Client for /api/admin/seo. Forwards the admin cookie (credentials: 'include')
// to a RELATIVE /api path, matching the other admin clients. Non-2xx throws
// SeoApiError.

import type { SeoPayload } from '@/types/admin-seo';

const BASE = '/api/admin/seo';

export class SeoApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'SeoApiError';
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new SeoApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as T;
}

export function fetchSeo(): Promise<SeoPayload> {
  return requestJson<SeoPayload>('');
}

/** Requeue one terminally failed submission. */
export function retryIndexingJob(jobId: string): Promise<{ ok: boolean }> {
  return requestJson<{ ok: boolean }>(`/retry/${encodeURIComponent(jobId)}`, { method: 'POST' });
}

/**
 * Queue a submission for one posting. 'deleted' asks Google to drop the URL —
 * that is what the stale-URL list uses; 'updated' backfills a live posting.
 */
export function submitPosting(
  postingId: string,
  action: 'updated' | 'deleted' = 'updated',
): Promise<{ enqueued: boolean; action: string }> {
  return requestJson<{ enqueued: boolean; action: string }>(
    `/submit/${encodeURIComponent(postingId)}?action=${action}`,
    { method: 'POST' },
  );
}
