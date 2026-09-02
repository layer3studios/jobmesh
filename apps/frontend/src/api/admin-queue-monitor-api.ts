// FILE: src/api/admin-queue-monitor-api.ts
// Client for /api/admin/queues. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching
// admin-scraper-health-api. Non-2xx throws QueueMonitorApiError.

import type { QueueSummary, FailedJob, RetryResult } from '@/types/admin-queue-monitor';

const BASE = '/api/admin/queues';

export class QueueMonitorApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'QueueMonitorApiError';
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new QueueMonitorApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as T;
}

/** One card per queue: counts, oldest pending age, failures, last success. */
export async function fetchQueueOverview(): Promise<QueueSummary[]> {
  const data = await requestJson<{ queues: QueueSummary[] }>('');
  return data.queues ?? [];
}

/** Newest failures first for one queue. */
export async function fetchFailedJobs(queueKey: string, limit = 25): Promise<FailedJob[]> {
  const data = await requestJson<{ jobs: FailedJob[] }>(
    `/${encodeURIComponent(queueKey)}/failed?limit=${limit}`,
  );
  return data.jobs ?? [];
}

/**
 * Reset one failed job back to pending. Resolves to `{ retried: false, reason }`
 * — not an error — when the job is no longer failed.
 */
export function retryFailedJob(queueKey: string, jobId: string): Promise<RetryResult> {
  return requestJson<RetryResult>(
    `/${encodeURIComponent(queueKey)}/failed/${encodeURIComponent(jobId)}/retry`,
    { method: 'POST' },
  );
}
