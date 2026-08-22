import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchVolume, fetchSeeker, fetchEmployer, fetchEngagement, fetchTeam, fetchTraffic,
  AdminAnalyticsApiError, isAnalyticsDisabled,
} from '@/api/admin-analytics-api';

function res(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const FNS = [
  { name: 'volume', fn: fetchVolume },
  { name: 'seeker', fn: fetchSeeker },
  { name: 'employer', fn: fetchEmployer },
  { name: 'engagement', fn: fetchEngagement },
  { name: 'team', fn: fetchTeam },
  { name: 'traffic', fn: fetchTraffic },
] as const;

describe('admin-analytics-api', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('fetchVolume normalizes fields (day→date) and sends credentials + since', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => res(200, {
      visitorsTotal: 5, pageviewsTotal: 9, cachedAt: 'c', since: '7d',
      visitorsByDay: [{ day: '2026-07-01', count: 3 }], pageviewsByDay: [{ date: '2026-07-01', count: 4 }],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const out = await fetchVolume('7d');
    expect(out.visitorsTotal).toBe(5);
    expect(out.visitorsByDay).toEqual([{ date: '2026-07-01', count: 3 }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/admin/analytics/volume?since=7d');
    expect(init?.credentials).toBe('include');
  });

  it('fetchTraffic normalizes device→type', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => res(200, {
      cachedAt: 'c', since: '7d',
      byReferrer: [{ bucket: 'google', count: 2 }], byDevice: [{ device: 'Desktop', count: 3 }],
    })));
    const out = await fetchTraffic('7d');
    expect(out.byReferrer).toEqual([{ bucket: 'google', count: 2 }]);
    expect(out.byDevice).toEqual([{ type: 'Desktop', count: 3 }]);
  });

  for (const { name, fn } of FNS) {
    it(`${name}: 401 throws AdminAnalyticsApiError`, async () => {
      vi.stubGlobal('fetch', vi.fn(async () => res(401, { error: 'Unauthorized' })));
      const err = await fn('7d').catch((e) => e);
      expect(err).toBeInstanceOf(AdminAnalyticsApiError);
      expect((err as AdminAnalyticsApiError).status).toBe(401);
    });

    it(`${name}: 403 throws AdminAnalyticsApiError`, async () => {
      vi.stubGlobal('fetch', vi.fn(async () => res(403, { error: 'Forbidden' })));
      const err = await fn('7d').catch((e) => e);
      expect((err as AdminAnalyticsApiError).status).toBe(403);
    });

    it(`${name}: 503 ANALYTICS_DISABLED is detectable`, async () => {
      vi.stubGlobal('fetch', vi.fn(async () => res(503, { code: 'ANALYTICS_DISABLED', error: 'disabled' })));
      const err = await fn('7d').catch((e) => e);
      expect(err).toBeInstanceOf(AdminAnalyticsApiError);
      expect(isAnalyticsDisabled(err)).toBe(true);
    });
  }
});
