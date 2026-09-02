// FILE: tests/api/admin-scraper-health-api.test.ts
// The scraper-health client: URL shape, credential forwarding, data unwrapping,
// and ScraperHealthApiError on every non-2xx.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchScraperHealth, fetchScrapeRuns, triggerScrapeNow, ScraperHealthApiError,
} from '@/api/admin-scraper-health-api';

function res(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const OVERVIEW = {
  sites: [{ siteName: 'ashby', latestNewJobs: 4, avgNewJobs: 40, isVolumeAnomalous: true }],
  corpus: { totalJobs: 100, pctCleaned: 90, pctTagged: 80, pctSalary: 25, duplicateJobIds: 2 },
};

describe('admin-scraper-health-api', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('fetchScraperHealth unwraps data and sends the admin cookie', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => res(200, { data: OVERVIEW }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await fetchScraperHealth();
    expect(out.sites[0].siteName).toBe('ashby');
    expect(out.corpus.pctCleaned).toBe(90);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/admin/scraper-health');
    expect(init?.credentials).toBe('include');
  });

  it('fetchScrapeRuns sends the limit, and the site only when given', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => res(200, { data: { runs: [] } }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchScrapeRuns('ashby', 5);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/admin/scraper-health/runs?limit=5&site=ashby');

    await fetchScrapeRuns();
    const bare = String(fetchMock.mock.calls[1][0]);
    expect(bare).toBe('/api/admin/scraper-health/runs?limit=50');
    expect(bare).not.toContain('site=');
  });

  it('fetchScrapeRuns returns [] when the payload omits runs', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => res(200, { data: {} })));
    expect(await fetchScrapeRuns()).toEqual([]);
  });

  it('triggerScrapeNow POSTs and passes already_running through as data, not an error', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => res(200, { data: { started: false, reason: 'already_running' } }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await triggerScrapeNow();
    expect(out).toEqual({ started: false, reason: 'already_running' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/admin/scraper-health/run-now');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
  });

  it('a 401 throws ScraperHealthApiError carrying the status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => res(401, { error: 'Unauthorized' })));
    await expect(fetchScraperHealth()).rejects.toBeInstanceOf(ScraperHealthApiError);
    await expect(fetchScraperHealth()).rejects.toMatchObject({ status: 401, message: 'Unauthorized' });
  });

  it('a non-JSON error body still produces a useful message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false, status: 500, json: async () => { throw new Error('not json'); },
    } as unknown as Response)));
    await expect(triggerScrapeNow()).rejects.toMatchObject({
      status: 500, message: 'Request failed (500)',
    });
  });
});
