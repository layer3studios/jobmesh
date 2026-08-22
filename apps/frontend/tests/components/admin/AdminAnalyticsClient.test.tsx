import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { AdminAnalyticsData } from '@/types/admin-analytics';

// Mock the bundle wrapper only; keep AdminAnalyticsApiError real for error-path tests.
vi.mock('@/api/admin-analytics-api', async (importActual) => {
  const actual = await importActual<typeof import('@/api/admin-analytics-api')>();
  return { ...actual, fetchAllAnalyticsBundles: vi.fn() };
});

// Stub recharts so charts render in happy-dom without real dimensions. Components are
// defined INSIDE the factory — vi.mock is hoisted above module-level consts.
vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Nil = () => null;
  return {
    ResponsiveContainer: Pass, LineChart: Pass, Line: Nil, Tooltip: Nil, XAxis: Nil, YAxis: Nil,
    BarChart: Pass, Bar: Pass, Cell: Nil, PieChart: Pass, Pie: Pass, Legend: Nil,
  };
});

import AdminAnalyticsClient from '@/app/(admin)/admin/(app)/analytics/AdminAnalyticsClient';
import EmptyStateNotice from '@/app/(admin)/admin/(app)/analytics/parts/EmptyStateNotice';
import { fetchAllAnalyticsBundles, AdminAnalyticsApiError } from '@/api/admin-analytics-api';

const fetchBundles = vi.mocked(fetchAllAnalyticsBundles);

function makeData(visitorsTotal: number): AdminAnalyticsData {
  const meta = { cachedAt: '2026-07-20T00:00:00.000Z', since: '7d' };
  return {
    volume: { ...meta, visitorsTotal, pageviewsTotal: 456, visitorsByDay: [{ date: 'd', count: 1 }], pageviewsByDay: [] },
    seeker: { ...meta, signups: 7, logins: 3, jobsListViews: 20, jobDetailViews: 12, applyStarted: 5, applySubmitted: 2, applySuccessViewed: 1, funnel: [{ stage: 'jobs_list_viewed', count: 20 }] },
    employer: { ...meta, signups: 4, logins: 6, onboardingStarted: 3, onboardingCompleted: 2, postingsCreated: 8, postingsPublished: 5, funnel: [{ stage: 'employer_signup_completed', count: 4 }] },
    engagement: { ...meta, applicantsViewed: 30, applicantsMovedStage: 12, applicantsArchived: 4, notesAdded: 9 },
    team: { ...meta, invitesSent: 10, invitesAccepted: 6 },
    traffic: { ...meta, byReferrer: [{ bucket: 'google', count: 5 }], byDevice: [{ type: 'Desktop', count: 8 }] },
  };
}

const DATA = makeData(123);

describe('AdminAnalyticsClient', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders KPI tiles from the data', () => {
    render(<AdminAnalyticsClient initialData={DATA} initialSince="7d" />);
    expect(screen.getByText('Visitors')).toBeTruthy();
    expect(screen.getByText('123')).toBeTruthy();
    expect(screen.getByText('456')).toBeTruthy();
    // Team accepted-rate hint (6/10 = 60%).
    expect(screen.getByText('60% accepted')).toBeTruthy();
  });

  it('renders initialData for initialSince without fetching on mount', () => {
    render(<AdminAnalyticsClient initialData={DATA} initialSince="7d" />);
    expect(fetchBundles).not.toHaveBeenCalled();
  });

  it('clicking a different range fetches that range and shows its data', async () => {
    fetchBundles.mockResolvedValueOnce(makeData(999));
    render(<AdminAnalyticsClient initialData={DATA} initialSince="7d" />);

    fireEvent.click(screen.getByText('24h'));
    expect(fetchBundles).toHaveBeenCalledWith('24h');
    await waitFor(() => expect(screen.getByText('999')).toBeTruthy());
  });

  it('clicking back to a previously-cached range does not re-fetch', async () => {
    fetchBundles.mockResolvedValueOnce(makeData(999));
    render(<AdminAnalyticsClient initialData={DATA} initialSince="7d" />);

    fireEvent.click(screen.getByText('24h'));
    await waitFor(() => expect(screen.getByText('999')).toBeTruthy());
    fetchBundles.mockClear();

    // 7d is cached from the initial SSR data → no fetch.
    fireEvent.click(screen.getByText('7 days'));
    expect(fetchBundles).not.toHaveBeenCalled();
    expect(screen.getByText('123')).toBeTruthy();
  });

  it('surfaces a fetch error inline with a Retry button', async () => {
    fetchBundles.mockRejectedValueOnce(new AdminAnalyticsApiError(500, null, 'boom'));
    render(<AdminAnalyticsClient initialData={DATA} initialSince="7d" />);

    fireEvent.click(screen.getByText('24h'));
    await waitFor(() => expect(screen.getByText("Couldn't load analytics")).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('Retry re-runs the fetch for the failed range', async () => {
    fetchBundles.mockRejectedValueOnce(new AdminAnalyticsApiError(500, null, 'boom'));
    render(<AdminAnalyticsClient initialData={DATA} initialSince="7d" />);

    fireEvent.click(screen.getByText('24h'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy());

    fetchBundles.mockResolvedValueOnce(makeData(777));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fetchBundles).toHaveBeenLastCalledWith('24h');
    await waitFor(() => expect(screen.getByText('777')).toBeTruthy());
  });

  it('disables the range selector while a fetch is in flight (isChanging)', async () => {
    let resolve: (d: AdminAnalyticsData) => void = () => {};
    fetchBundles.mockReturnValueOnce(new Promise<AdminAnalyticsData>((r) => { resolve = r; }));
    render(<AdminAnalyticsClient initialData={DATA} initialSince="7d" />);

    fireEvent.click(screen.getByText('24h'));
    expect((screen.getByText('24h') as HTMLButtonElement).disabled).toBe(true);

    resolve(makeData(999));
    await waitFor(() => expect((screen.getByText('24h') as HTMLButtonElement).disabled).toBe(false));
  });
});

describe('EmptyStateNotice (ANALYTICS_DISABLED state)', () => {
  it('renders the not-configured message', () => {
    render(<EmptyStateNotice title="Analytics not configured" body="Set POSTHOG_PERSONAL_API_KEY." />);
    expect(screen.getByText('Analytics not configured')).toBeTruthy();
    expect(screen.getByText('Set POSTHOG_PERSONAL_API_KEY.')).toBeTruthy();
  });
});
