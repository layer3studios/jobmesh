// The Mongo block and the PostHog block fail INDEPENDENTLY. A missing analytics key
// must degrade the completion rates alone and never blank the section.
//
// SCOPE — read this before adding a case here. This file renders the section with
// props and therefore can only prove behaviour INSIDE the section. It cannot see
// whether the page ever renders the section at all, which is exactly how the
// "analytics not configured shows nothing but a notice" bug survived a green suite:
// every assertion below passed while the page short-circuited before mounting this
// component. Anything about the section's relationship to the PAGE — that it is
// reached, that it survives a PostHog 503 upstream, that its endpoint is actually
// requested — belongs in tests/app/admin/analytics/page.test.tsx, which drives the
// real Server Component. Keep this file for the intra-section source split only.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

const { fetchAssignmentStats, fetchAssignmentFunnel } = vi.hoisted(() => ({
  fetchAssignmentStats: vi.fn(),
  fetchAssignmentFunnel: vi.fn(),
}));

vi.mock('@/api/admin-analytics-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/admin-analytics-api')>()),
  fetchAssignmentStats, fetchAssignmentFunnel,
}));

import AssignmentAnalyticsSection from '@/app/(admin)/admin/(app)/analytics/parts/AssignmentAnalyticsSection';
import { AdminAnalyticsApiError } from '@/api/admin-analytics-api';

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
  since: '2026-07-28T00:00:00.000Z',
};

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  fetchAssignmentStats.mockImplementation(async () => STATS);
  fetchAssignmentFunnel.mockImplementation(async () => FUNNEL);
});

describe('both sources available', () => {
  it('renders the Mongo stats', async () => {
    render(<AssignmentAnalyticsSection since="7d" />);
    await screen.findByTestId('assignment-stats-block');
    expect(screen.getByText('12')).toBeTruthy();  // postings with a task
    expect(screen.getByText('30')).toBeTruthy();  // library size
    expect(screen.getByText('18.5h')).toBeTruthy();
  });

  // A ratio without its denominator cannot be judged.
  it('renders BOTH populations with raw counts beside each ratio', async () => {
    render(<AssignmentAnalyticsSection since="7d" />);
    await screen.findByText('Postings with a take-home');
    expect(screen.getByText('Plain postings')).toBeTruthy();
    expect(screen.getByText(/40 \/ 100/)).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
    expect(screen.getByText(/120 \/ 200/)).toBeTruthy();
    expect(screen.getByText('60%')).toBeTruthy();
  });

  it('surfaces the review-conflict count', async () => {
    render(<AssignmentAnalyticsSection since="7d" />);
    // "2" also appears as the median-links figure, so scope to the tile: KpiTile
    // renders the label and the value as sibling divs inside one wrapper.
    const label = await screen.findByText('Review conflicts');
    expect(label.parentElement?.textContent).toContain('2');
    expect(screen.getByText('Assignments created')).toBeTruthy();
  });
});

describe('the funnel 503s (POSTHOG_PERSONAL_API_KEY unset)', () => {
  beforeEach(() => {
    fetchAssignmentFunnel.mockImplementation(async () => {
      throw new AdminAnalyticsApiError(503, 'ANALYTICS_DISABLED', 'Admin analytics is not configured.');
    });
  });

  it('still renders the Mongo block in full — the section does NOT blank', async () => {
    render(<AssignmentAnalyticsSection since="7d" />);
    await screen.findByTestId('assignment-stats-block');
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('47')).toBeTruthy();
    expect(screen.getByText('18.5h')).toBeTruthy();
    // The section heading survives too.
    expect(screen.getByRole('region', { name: 'Take-home assignments' })).toBeTruthy();
  });

  it('degrades only the completion block, and says the figures above are unaffected', async () => {
    render(<AssignmentAnalyticsSection since="7d" />);
    await screen.findByText(/Event analytics is not configured/);
    expect(screen.getByText(/come from the database and are unaffected/)).toBeTruthy();
    expect(screen.queryByText('Postings with a take-home')).toBeNull();
  });
});

describe('the Mongo endpoint fails', () => {
  it('degrades only the stats block, leaving the completion rates rendered', async () => {
    fetchAssignmentStats.mockImplementation(async () => { throw new Error('mongo down'); });
    render(<AssignmentAnalyticsSection since="7d" />);
    await screen.findByText('Could not load assignment stats.');
    await waitFor(() => expect(screen.getByText('Postings with a take-home')).toBeTruthy());
  });
});

describe('empty data', () => {
  it('renders a dash for a null median rather than 0 or NaN', async () => {
    fetchAssignmentStats.mockImplementation(async () => ({
      ...STATS, medianSubmissionToReviewHours: null, medianLinksPerSubmission: null, medianFilesPerSubmission: null,
    }));
    render(<AssignmentAnalyticsSection since="7d" />);
    await screen.findByTestId('assignment-stats-block');
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('renders a dash for a null ratio — "no sample", which 0% would misreport', async () => {
    fetchAssignmentFunnel.mockImplementation(async () => ({
      ...FUNNEL,
      assignment: { viewed: 0, submitted: 0, completionRatio: null },
    }));
    render(<AssignmentAnalyticsSection since="7d" />);
    await screen.findByText('Postings with a take-home');
    expect(screen.getByText(/0 \/ 0/)).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});
