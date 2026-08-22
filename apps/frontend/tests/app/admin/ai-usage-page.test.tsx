// FILE: tests/app/admin/ai-usage-page.test.tsx
// The admin AI usage dashboard: KPI tiles, range switching, tier cards, the
// model table, the live-limits table, and the 60s auto-refresh.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminAiUsageClient from '@/app/(admin)/admin/(app)/ai-usage/AdminAiUsageClient';
import type { AiUsageReport } from '@/types/admin-ai-usage';

const fetchAiUsage = vi.fn();
vi.mock('@/api/admin-ai-usage-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/admin-ai-usage-api')>();
  return { ...actual, fetchAiUsage: (...args: unknown[]) => fetchAiUsage(...args) };
});

const REPORT: AiUsageReport = {
  summary: {
    totalRequests: 200, totalTokens: 600_000, totalCacheHits: 15,
    cacheHitRate: 7, totalErrors: 4, errorRate: 2,
  },
  byTier: {
    employer: { requests: 100, tokens: 400_000, errors: 3 },
    seeker: { requests: 40, tokens: 80_000, errors: 1 },
    scraper: { requests: 60, tokens: 120_000, errors: 0 },
  },
  byModel: [
    { model: 'gemini-3.6-flash', requests: 100, tokens: 400_000, cacheHits: 10, errors: 3, avgTokensPerRequest: 4000 },
    { model: 'gemma-4-31b', requests: 100, tokens: 200_000, cacheHits: 5, errors: 1, avgTokensPerRequest: 2000 },
  ],
  byDay: [
    { date: '2026-08-01', requests: 140, tokens: 480_000, cacheHits: 15, errors: 3 },
    { date: '2026-08-02', requests: 60, tokens: 120_000, cacheHits: 0, errors: 1 },
  ],
  currentLimits: {
    models: [{
      model: 'gemini-3.6-flash',
      keys: [
        { keyIndex: 0, rpm: { used: 2, limit: 4 }, rpd: { used: 15, limit: 17 }, tpm: { used: 8000, limit: 212_500 }, exhausted: false },
        { keyIndex: 1, rpm: { used: 4, limit: 4 }, rpd: { used: 20, limit: 17 }, tpm: { used: 0, limit: 212_500 }, exhausted: true },
      ],
    }],
  },
};

async function renderPage() {
  fetchAiUsage.mockResolvedValue(REPORT);
  render(<AdminAiUsageClient />);
  await waitFor(() => expect(screen.getAllByTestId('kpi-tile').length).toBeGreaterThan(0));
}

beforeEach(() => { fetchAiUsage.mockReset(); });
afterEach(() => { vi.useRealTimers(); });

describe('AdminAiUsageClient', () => {
  it('renders 6 KPI tiles with the summary figures', async () => {
    await renderPage();
    const tiles = screen.getAllByTestId('kpi-tile');
    expect(tiles).toHaveLength(6);
    // Scoped to the tiles: "Cache hits" is also a column header in the model table.
    const tileLabels = tiles.map((tile) => tile.textContent ?? '');
    for (const label of [
      'Total requests', 'Total tokens', 'Cache hits', 'Cache hit rate', 'Total errors', 'Error rate',
    ]) {
      expect(tileLabels.some((text) => text.includes(label))).toBe(true);
    }
    expect(tileLabels[0]).toContain('200');      // totalRequests
    expect(tileLabels[1]).toContain('600.0K');  // compacted tokens
    expect(tileLabels[3]).toContain('7.0%');     // cacheHitRate
  });

  it('defaults to 7d and changes the API parameter when a range is picked', async () => {
    await renderPage();
    expect(fetchAiUsage).toHaveBeenCalledWith('7d');
    fireEvent.click(screen.getByRole('button', { name: '30d' }));
    await waitFor(() => expect(fetchAiUsage).toHaveBeenCalledWith('30d'));
    expect(screen.getByRole('button', { name: '30d' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows one card per tier with its counts', async () => {
    await renderPage();
    for (const tier of ['employer', 'seeker', 'scraper']) {
      expect(screen.getByTestId(`tier-card-${tier}`)).toBeTruthy();
    }
    // JSX splits the summary line across text nodes, so read the whole card.
    const employerText = screen.getByTestId('tier-card-employer').textContent ?? '';
    expect(employerText).toContain('100');
    expect(employerText).toContain('400.0K tokens');
    expect(employerText).toContain('3 errors');
    expect(screen.getByTestId('tier-card-scraper').textContent).toContain('0 errors');
  });

  it('renders a by-model table row per model', async () => {
    await renderPage();
    const rows = within(screen.getByTestId('model-table')).getAllByTestId('model-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('gemini-3.6-flash')).toBeTruthy();
    expect(within(rows[0]).getByText('4,000')).toBeTruthy(); // avg tokens/req
  });

  it('renders a daily bar per day with the numbers in the tooltip', async () => {
    await renderPage();
    const bars = within(screen.getByTestId('daily-bars')).getAllByTestId('daily-bar');
    expect(bars).toHaveLength(2);
    expect(bars[0].getAttribute('title')).toContain('140 requests');
    // The busiest day fills the plot; the quieter one is proportionally shorter.
    expect(bars[0].style.height).toBe('100%');
    expect(bars[1].style.height).toBe('43%');
  });

  it('shows RPM/RPD/TPM columns and flags exhausted combos', async () => {
    await renderPage();
    const table = screen.getByTestId('limits-table');
    for (const column of ['Model', 'Key', 'RPM', 'RPD', 'TPM', 'Status']) {
      expect(within(table).getByText(column)).toBeTruthy();
    }
    const rows = within(table).getAllByTestId('limit-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('2 / 4')).toBeTruthy();      // rpm used/limit
    expect(within(rows[0]).getByText('Available')).toBeTruthy();
    expect(within(rows[1]).getByText('Exhausted')).toBeTruthy();
  });

  it('auto-refreshes after 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchAiUsage.mockResolvedValue(REPORT);
    render(<AdminAiUsageClient />);
    await waitFor(() => expect(fetchAiUsage).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchAiUsage).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchAiUsage).toHaveBeenCalledTimes(3);
  });

  it('shows a retry button when the first load fails', async () => {
    fetchAiUsage.mockRejectedValue(new Error('boom'));
    render(<AdminAiUsageClient />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText("Couldn't load AI usage.")).toBeTruthy();

    fetchAiUsage.mockResolvedValue(REPORT);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getAllByTestId('kpi-tile')).toHaveLength(6));
  });
});
