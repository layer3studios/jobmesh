// FILE: tests/app/admin/scraper-health-page.test.tsx
// The admin scraper health dashboard: first-load skeletons, the corpus strip,
// site cards including the failed and volume-drop states, the site filter, and
// the run-now button's success / already_running paths.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ScraperHealthClient from '@/app/(admin)/admin/(app)/scraper-health/ScraperHealthClient';
import { ToastProvider } from '@/components/ui/Toast';
import type { ScraperHealthOverview, ScrapeRun } from '@/types/admin-scraper-health';

const fetchScraperHealth = vi.fn();
const fetchScrapeRuns = vi.fn();
const triggerScrapeNow = vi.fn();
vi.mock('@/api/admin-scraper-health-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/admin-scraper-health-api')>();
  return {
    ...actual,
    fetchScraperHealth: () => fetchScraperHealth(),
    fetchScrapeRuns: (...args: unknown[]) => fetchScrapeRuns(...args),
    triggerScrapeNow: () => triggerScrapeNow(),
  };
});

const run = (over: Partial<ScrapeRun> = {}): ScrapeRun => ({
  runId: 'p1', siteName: 'ashby',
  startedAt: '2026-08-29T10:00:00.000Z', finishedAt: '2026-08-29T10:00:12.000Z',
  durationMs: 12_000, jobsFetched: 40, newJobs: 4, deletedExpired: 1,
  scrapedSuccessfully: true, errorMessage: null,
  ...over,
});

const OVERVIEW: ScraperHealthOverview = {
  sites: [
    {
      siteName: 'ashby', lastRun: run(), lastSuccessfulRun: run(),
      latestNewJobs: 4, avgNewJobs: 40, successfulRunCount: 8,
      isVolumeAnomalous: true, lastRunFailed: false, errorMessage: null,
    },
    {
      siteName: 'lever',
      lastRun: run({ siteName: 'lever', scrapedSuccessfully: false, errorMessage: 'HTTP 503 from lever' }),
      lastSuccessfulRun: null,
      latestNewJobs: 0, avgNewJobs: 0, successfulRunCount: 0,
      isVolumeAnomalous: false, lastRunFailed: true, errorMessage: 'HTTP 503 from lever',
    },
  ],
  corpus: {
    totalJobs: 1000, cleanedCount: 900, taggedCount: 800, salaryCount: 250,
    pctCleaned: 90, pctTagged: 80, pctSalary: 25, duplicateJobIds: 2,
  },
};

const RUNS = [run(), run({ runId: 'p0', siteName: 'lever', scrapedSuccessfully: false, errorMessage: 'HTTP 503 from lever' })];

function renderPage() {
  return render(<ToastProvider><ScraperHealthClient /></ToastProvider>);
}

async function renderLoaded() {
  renderPage();
  await screen.findByText('Scraper Health');
  await waitFor(() => expect(screen.getAllByTestId('site-card')).toHaveLength(2));
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchScraperHealth.mockResolvedValue(OVERVIEW);
  fetchScrapeRuns.mockResolvedValue(RUNS);
  triggerScrapeNow.mockResolvedValue({ started: true });
});

describe('ScraperHealthClient', () => {
  it('shows skeletons on first load, then replaces them with the real data', async () => {
    let resolve!: (value: ScraperHealthOverview) => void;
    fetchScraperHealth.mockReturnValue(new Promise<ScraperHealthOverview>((r) => { resolve = r; }));
    renderPage();

    expect(screen.getByTestId('scraper-health-skeleton')).toBeTruthy();
    resolve(OVERVIEW);
    await waitFor(() => expect(screen.queryByTestId('scraper-health-skeleton')).toBeNull());
    expect(screen.getAllByTestId('site-card')).toHaveLength(2);
  });

  it('renders the four corpus KPI tiles', async () => {
    await renderLoaded();
    expect(screen.getAllByTestId('kpi-tile')).toHaveLength(4);
    expect(screen.getByText('90.0%')).toBeTruthy();  // cleaned
    expect(screen.getByText('80.0%')).toBeTruthy();  // tagged
    expect(screen.getByText('25.0%')).toBeTruthy();  // salary
    expect(screen.getByText('2')).toBeTruthy();      // duplicate job IDs
  });

  it('flags a volume drop in words, not only in colour', async () => {
    await renderLoaded();
    const card = screen.getAllByTestId('site-card').find((el) => el.dataset.site === 'ashby')!;
    expect(within(card).getByText('Volume drop')).toBeTruthy();
    expect(within(card).getByText(/4 new jobs is under 30% of the 40 average/)).toBeTruthy();
  });

  it('states a failed site in words and shows its error message', async () => {
    await renderLoaded();
    const card = screen.getAllByTestId('site-card').find((el) => el.dataset.site === 'lever')!;
    expect(within(card).getByText('Last run failed')).toBeTruthy();
    expect(within(card).getByText(/HTTP 503 from lever/)).toBeTruthy();
    expect(within(card).queryByText('Volume drop')).toBeNull();
  });

  it('renders the run history and refetches when the site filter changes', async () => {
    await renderLoaded();
    expect(screen.getAllByTestId('run-row')).toHaveLength(2);
    expect(fetchScrapeRuns).toHaveBeenLastCalledWith(undefined, 50);

    fireEvent.change(screen.getByLabelText('Site'), { target: { value: 'ashby' } });
    await waitFor(() => expect(fetchScrapeRuns).toHaveBeenLastCalledWith('ashby', 50));
  });

  it('run-now refetches and toasts on success, without optimistic UI', async () => {
    await renderLoaded();
    const before = fetchScraperHealth.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Run scrape now' }));

    await waitFor(() => expect(screen.getByText('Scrape started')).toBeTruthy());
    expect(triggerScrapeNow).toHaveBeenCalledTimes(1);
    // Refetched rather than mutating local state optimistically.
    expect(fetchScraperHealth.mock.calls.length).toBeGreaterThan(before);
  });

  it('run-now toasts "Scrape already running" when the lock is held', async () => {
    triggerScrapeNow.mockResolvedValue({ started: false, reason: 'already_running' });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Run scrape now' }));

    await waitFor(() => expect(screen.getByText('Scrape already running')).toBeTruthy());
    expect(screen.queryByText('Scrape started')).toBeNull();
  });

  it('the run-now button is disabled while the request is in flight', async () => {
    let resolve!: (value: { started: boolean }) => void;
    triggerScrapeNow.mockReturnValue(new Promise((r) => { resolve = r; }));
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Run scrape now' }));
    const pending = await screen.findByRole('button', { name: 'Starting…' });
    expect((pending as HTMLButtonElement).disabled).toBe(true);

    resolve({ started: true });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run scrape now' })).toBeTruthy());
  });

  it('a failed first load offers a retry instead of an empty page', async () => {
    fetchScraperHealth.mockRejectedValue(new Error('boom'));
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/Couldn't load scraper health/)).toBeTruthy();

    fetchScraperHealth.mockResolvedValue(OVERVIEW);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getAllByTestId('site-card')).toHaveLength(2));
  });
});
