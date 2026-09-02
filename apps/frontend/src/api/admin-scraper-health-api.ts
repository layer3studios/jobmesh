// FILE: src/api/admin-scraper-health-api.ts
// Client for /api/admin/scraper-health. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching
// admin-ai-usage-api. Non-2xx throws ScraperHealthApiError.

import type { ScraperHealthOverview, ScrapeRun, RunNowResult } from '@/types/admin-scraper-health';

const BASE = '/api/admin/scraper-health';

export class ScraperHealthApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'ScraperHealthApiError';
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ScraperHealthApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as T;
}

/** Per-site summaries plus the corpus-quality strip. */
export function fetchScraperHealth(): Promise<ScraperHealthOverview> {
  return requestJson<ScraperHealthOverview>('');
}

/** Recent run rows, newest first. An empty `site` means every site. */
export async function fetchScrapeRuns(site?: string, limit = 50): Promise<ScrapeRun[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (site) params.set('site', site);
  const data = await requestJson<{ runs: ScrapeRun[] }>(`/runs?${params.toString()}`);
  return data.runs ?? [];
}

/**
 * Trigger a scrape. Resolves to `{ started: false, reason: 'already_running' }`
 * — not an error — when a pass is already in flight.
 */
export function triggerScrapeNow(): Promise<RunNowResult> {
  return requestJson<RunNowResult>('/run-now', { method: 'POST' });
}
