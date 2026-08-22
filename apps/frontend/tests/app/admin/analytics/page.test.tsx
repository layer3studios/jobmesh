// FILE: tests/app/admin/analytics/page.test.tsx
// THE PAGE, not a component in isolation. The bug this file exists to prevent was
// invisible to a component-level test: the assignments section rendered perfectly
// when handed props, while the page it lived on returned a full-page notice before
// that section could ever mount. Every test here therefore drives the real Server
// Component and asserts on the tree it actually produces.
//
// Two independent upstreams are mocked at their real boundaries:
//   • serverFetch — the six PostHog bundles, fetched during SSR
//   • global fetch — the Mongo assignments endpoints, fetched by the client section
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

const { serverFetch } = vi.hoisted(() => ({ serverFetch: vi.fn() }));

vi.mock('@/lib/server-fetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server-fetch')>()),
  serverFetch,
}));

import AdminAnalyticsPage from '@/app/(admin)/admin/(app)/analytics/page';
import { ServerFetchError } from '@/lib/server-fetch';

// ── Fixtures ────────────────────────────────────────────────────────────────
const BUNDLE: Record<string, unknown> = {
  cachedAt: '2026-08-04T00:00:00.000Z',
  since: '7d',
  visitorsTotal: 1234,
  pageviewsTotal: 5678,
  visitorsByDay: [{ date: '2026-08-01', count: 5 }],
  pageviewsByDay: [{ date: '2026-08-01', count: 9 }],
  signups: 11,
  byReferrer: [{ bucket: 'direct', count: 3 }],
  byDevice: [{ type: 'desktop', count: 3 }],
};

// medianSubmissionToReviewHours is the value test 1 asserts on: it is Mongo-only,
// appears nowhere in the PostHog bundles, and is formatted distinctively ("18.5h").
const STATS = {
  postingsWithAssignments: 12,
  totalAssignments: 30,
  submissionsLast30Days: 47,
  reviewsLast30Days: 31,
  medianSubmissionToReviewHours: 18.5,
  medianLinksPerSubmission: 2,
  medianFilesPerSubmission: 1,
  windowDays: 30,
};

const FUNNEL = {
  assignment: { viewed: 100, submitted: 40, completionRatio: 0.4 },
  plain: { viewed: 200, submitted: 120, completionRatio: 0.6 },
  assignmentsCreated: 9,
  reviewsSubmitted: 31,
  reviewConflicts: 2,
  cachedAt: '2026-08-04T00:00:00.000Z',
  since: '7d',
};

const ANALYTICS_DISABLED = () =>
  new ServerFetchError(503, 'ANALYTICS_DISABLED', 'Admin analytics is not configured.');

/** Record of every URL the client section requested, for the missing-call test. */
let fetchedUrls: string[] = [];

function mockClientFetch({ statsOk = true, funnelOk = true } = {}) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    fetchedUrls.push(url);
    const isFunnel = url.includes('/assignments/funnel');
    const ok = isFunnel ? funnelOk : statsOk;
    const body: Record<string, unknown> = isFunnel ? FUNNEL : STATS;
    return {
      ok,
      status: ok ? 200 : 500,
      json: async () => (ok
        ? { result: body, cachedAt: body.cachedAt ?? '', since: '7d' }
        : { error: 'boom' }),
    } as unknown as Response;
  }) as typeof fetch;
}

/** Drive the real async Server Component and mount whatever it returns. */
async function renderPage(since?: string) {
  const ui = await AdminAnalyticsPage({ searchParams: Promise.resolve(since ? { since } : {}) });
  return render(ui);
}

// Both helpers RETURN NOTHING, deliberately. mockImplementation() returns the mock
// itself, and Vitest treats a function returned from beforeEach as a teardown
// callback — so `beforeEach(posthogDown)` would call the mock during teardown and
// throw ServerFetchError out of the hook. The braces are load-bearing.
function posthogUp(): void {
  serverFetch.mockImplementation(async () => ({ result: BUNDLE, ...BUNDLE }));
}
function posthogDown(): void {
  serverFetch.mockImplementation(async () => { throw ANALYTICS_DISABLED(); });
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  fetchedUrls = [];
  mockClientFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── 1. THE REGRESSION TEST FOR THE REPORTED BUG ─────────────────────────────
describe('PostHog 503 (POSTHOG_PERSONAL_API_KEY unset) + Mongo healthy', () => {
  beforeEach(posthogDown);

  it('renders the assignments section AND its Mongo VALUES — the page is not just the notice', async () => {
    await renderPage();

    // The section mounts at all. Before the fix, the page short-circuited to a
    // full-page notice and this element never existed.
    expect(await screen.findByRole('region', { name: 'Take-home assignments' })).toBeTruthy();

    // Real Mongo-sourced VALUES are on screen, not merely a heading. A section that
    // renders its header and nothing else would still be the reported bug.
    await screen.findByTestId('assignment-stats-block');
    expect(screen.getByText('18.5h')).toBeTruthy(); // medianSubmissionToReviewHours
    expect(screen.getByText('47')).toBeTruthy();    // submissionsLast30Days
    expect(screen.getByText('12')).toBeTruthy();    // postingsWithAssignments
  });

  it('shows the PostHog notice INLINE, with the shell and time selector intact', async () => {
    await renderPage();

    expect(screen.getByText('Analytics not configured')).toBeTruthy();
    // Shell survived: page heading + the time selector are both still present.
    expect(screen.getByRole('heading', { name: 'Analytics', level: 1 })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Time range' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '7 days' })).toBeTruthy();
  });

  it('drops only the PostHog sections', async () => {
    await renderPage();
    expect(screen.queryByText('Overview')).toBeNull();
    expect(screen.queryByText('Traffic sources')).toBeNull();
  });
});

// ── 2. The mirror case ──────────────────────────────────────────────────────
describe('PostHog healthy + Mongo 500', () => {
  beforeEach(() => {
    posthogUp();
    mockClientFetch({ statsOk: false });
  });

  it('renders all PostHog sections', async () => {
    await renderPage();
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('Seeker funnel')).toBeTruthy();
    expect(screen.getByText('Employer funnel')).toBeTruthy();
    expect(screen.getByText('Employer engagement')).toBeTruthy();
    expect(screen.getByText('Team invites')).toBeTruthy();
    expect(screen.getByText('Traffic sources')).toBeTruthy();
  });

  it('shows the assignments inline error without blanking the page', async () => {
    await renderPage();
    expect(await screen.findByText('Could not load assignment stats.')).toBeTruthy();
    // Section header survives beside its own error, and the dashboard is untouched.
    expect(screen.getByRole('region', { name: 'Take-home assignments' })).toBeTruthy();
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.queryByText('Analytics not configured')).toBeNull();
  });
});

// ── 3. Everything healthy ───────────────────────────────────────────────────
describe('both sources healthy', () => {
  beforeEach(posthogUp);

  it('renders the full dashboard and the assignments section together', async () => {
    await renderPage();
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('Traffic sources')).toBeTruthy();

    await screen.findByTestId('assignment-stats-block');
    expect(screen.getByText('18.5h')).toBeTruthy();
    // The PostHog-dependent completion block inside the section renders too.
    expect(await screen.findByText('Postings with a take-home')).toBeTruthy();
    expect(screen.queryByText('Analytics not configured')).toBeNull();
  });
});

// ── 4. Both down ────────────────────────────────────────────────────────────
describe('both sources down', () => {
  beforeEach(() => {
    posthogDown();
    mockClientFetch({ statsOk: false, funnelOk: false });
  });

  it('renders the shell plus two notices — never a bare page', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Analytics', level: 1 })).toBeTruthy();
    expect(screen.getByText('Analytics not configured')).toBeTruthy();          // PostHog notice
    expect(await screen.findByText('Could not load assignment stats.')).toBeTruthy(); // Mongo notice
    expect(screen.getByRole('region', { name: 'Take-home assignments' })).toBeTruthy();
  });
});

// ── 5. Rule 4: access denied is still page-level ────────────────────────────
describe('401 / 403', () => {
  it.each([401, 403])('short-circuits the WHOLE page on %i', async (status) => {
    serverFetch.mockImplementation(async () => {
      throw new ServerFetchError(status, null, 'Unauthorized');
    });

    await renderPage();

    expect(screen.getByText('Access denied')).toBeTruthy();
    // Nothing else renders — not the shell, not the assignments section.
    expect(screen.queryByRole('heading', { name: 'Analytics', level: 1 })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Take-home assignments' })).toBeNull();
  });
});

// ── 6. THE MISSING-CALL REGRESSION ──────────────────────────────────────────
// Without this, a refactor could delete the assignments fetch entirely and every
// other test above would still pass on an empty section that never asked for data.
describe('the assignments endpoint is actually requested', () => {
  it.each([
    ['PostHog healthy', posthogUp],
    ['PostHog 503', posthogDown],
  ])('requests /admin/analytics/assignments when %s', async (_label, setup) => {
    setup();
    await renderPage();

    await waitFor(() => {
      expect(fetchedUrls.some((url) => url.includes('/admin/analytics/assignments'))).toBe(true);
    });
  });
});
