// FILE: src/api/admin-job-browser-api.ts
// Client for /api/admin/jobs. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching the other admin
// clients. Non-2xx throws JobBrowserApiError.

import type {
  JobSearchResult, JobDetail, JobRow, JobSourceFilter, HiddenFilter, DeleteResult,
} from '@/types/admin-job-browser';

const BASE = '/api/admin/jobs';

export class JobBrowserApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'JobBrowserApiError';
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new JobBrowserApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as T;
}

export interface SearchParams {
  q?: string;
  source?: JobSourceFilter;
  site?: string;
  hidden?: HiddenFilter;
  limit?: number;
  skip?: number;
}

export function searchJobs(params: SearchParams = {}): Promise<JobSearchResult> {
  const query = new URLSearchParams({
    source: params.source ?? 'all',
    hidden: params.hidden ?? 'exclude',
    limit: String(params.limit ?? 50),
    skip: String(params.skip ?? 0),
  });
  if (params.q) query.set('q', params.q);
  if (params.site) query.set('site', params.site);
  return requestJson<JobSearchResult>(`?${query.toString()}`);
}

export async function fetchSites(): Promise<string[]> {
  const data = await requestJson<{ sites: string[] }>('/sites');
  return data.sites ?? [];
}

export async function fetchJob(id: string): Promise<JobDetail> {
  const data = await requestJson<{ job: JobDetail }>(`/${encodeURIComponent(id)}`);
  return data.job;
}

export async function setJobHidden(id: string, hidden: boolean): Promise<JobRow> {
  const data = await requestJson<{ job: JobRow }>(
    `/${encodeURIComponent(id)}/${hidden ? 'hide' : 'unhide'}`,
    { method: 'POST' },
  );
  return data.job;
}

/**
 * Scraped jobs only. A native posting is refused server-side with a 403, which
 * surfaces here as a JobBrowserApiError carrying code 'native_posting'.
 */
export function deleteJob(id: string): Promise<DeleteResult> {
  return requestJson<DeleteResult>(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
