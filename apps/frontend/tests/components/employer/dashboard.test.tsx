// FILE: tests/components/employer/dashboard.test.tsx
// Employer dashboard: KPI tiles, active-jobs table, top candidates, activity
// dots, loading/error states, navigation.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import EmployerDashboard from '@/components/employer/Dashboard';
import type { DashboardSummary, DashboardActivityEvent } from '@/types/employer-dashboard';

const routerPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ employerUser: { id: 'u1', name: 'Ashish Ranjan', email: 'a@x.io' } }),
}));

const fetchDashboardSummary = vi.fn();
const fetchDashboardActivity = vi.fn();
vi.mock('@/api/employer-dashboard-api', () => ({
  fetchDashboardSummary: () => fetchDashboardSummary(),
  fetchDashboardActivity: () => fetchDashboardActivity(),
}));

const STAGE_COUNTS = { applied: 2, shortlisted: 1, interview: 0, offer: 0, hired: 0 };

function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    kpis: { activeJobs: 2, totalApplicants: 5, interviewsThisWeek: 1, avgAiScore: 71.5, avgDaysToHire: null },
    activeJobs: [
      { id: 'p1', title: 'React Dev', location: 'Remote', workplaceType: 'remote', applicantCount: 3, daysOpen: 4, stageCounts: STAGE_COUNTS },
      { id: 'p2', title: 'Backend Dev', location: 'Bengaluru', workplaceType: 'onsite', applicantCount: 2, daysOpen: 9, stageCounts: STAGE_COUNTS },
    ],
    topCandidates: [
      { applicationId: 'a1', contactName: 'Ada', contactEmail: 'ada@x.io', postingTitle: 'React Dev', stage: 'Applied', score: 90, appliedAt: '2026-07-30T00:00:00Z' },
      { applicationId: 'a2', contactName: 'Bea', contactEmail: 'bea@x.io', postingTitle: 'React Dev', stage: 'Applied', score: 70, appliedAt: '2026-07-30T00:00:00Z' },
    ],
    ...overrides,
  };
}

const ACTIVITY: DashboardActivityEvent[] = [
  { type: 'application', candidateName: 'Ada', postingTitle: 'React Dev', timestamp: '2026-07-31T10:00:00Z' },
  { type: 'stage_move', candidateName: 'Bea', postingTitle: 'React Dev', fromStage: 'Applied', toStage: 'Shortlisted', timestamp: '2026-07-31T09:00:00Z' },
  { type: 'interview_cancelled', candidateName: 'Cid', postingTitle: 'React Dev', timestamp: '2026-07-31T08:00:00Z' },
];

async function renderDashboard(data = summary(), activity = ACTIVITY) {
  fetchDashboardSummary.mockResolvedValue(data);
  fetchDashboardActivity.mockResolvedValue(activity);
  render(<EmployerDashboard />);
  await waitFor(() => expect(screen.getByText(/Welcome back/)).toBeTruthy());
}

beforeEach(() => {
  routerPush.mockReset();
  fetchDashboardSummary.mockReset();
  fetchDashboardActivity.mockReset();
});

describe('EmployerDashboard', () => {
  it('renders 5 KPI tiles with correct labels', async () => {
    await renderDashboard();
    const tiles = screen.getAllByTestId('kpi-tile');
    expect(tiles).toHaveLength(5);
    const labels = ['Active jobs', 'Total applicants', 'Interviews this week', 'Avg. AI score', 'Avg. time to hire'];
    labels.forEach((label, index) => expect(within(tiles[index]).getByText(label)).toBeTruthy());
  });

  it('null KPI values show "—", never "null" or "NaN"', async () => {
    await renderDashboard(summary({
      kpis: { activeJobs: 0, totalApplicants: 0, interviewsThisWeek: 0, avgAiScore: null, avgDaysToHire: null },
      activeJobs: [], topCandidates: [],
    }), []);
    const tiles = screen.getAllByTestId('kpi-tile');
    const tileText = tiles.map((tile) => tile.textContent).join(' ');
    expect(tileText).toContain('—');
    expect(tileText).not.toContain('null');
    expect(tileText).not.toContain('NaN');
  });

  it('renders one active-jobs row per job and navigates on row click', async () => {
    await renderDashboard();
    expect(screen.getByTestId('active-job-row-p1')).toBeTruthy();
    expect(screen.getByTestId('active-job-row-p2')).toBeTruthy();
    fireEvent.click(screen.getByTestId('active-job-row-p1'));
    // ?from=dashboard keeps the nav + breadcrumb rooted on the Dashboard.
    expect(routerPush).toHaveBeenCalledWith('/employer/jobs/p1?tab=overview&from=dashboard');
  });

  it('top candidates are sorted by score descending', async () => {
    await renderDashboard();
    const pills = screen.getAllByTestId('score-pill').map((el) => Number(el.textContent));
    expect(pills).toEqual([...pills].sort((a, b) => b - a));
  });

  it('top candidates navigate to the applicant detail via title-matched postingId', async () => {
    await renderDashboard();
    fireEvent.click(screen.getAllByTestId('top-candidate-row')[0]);
    expect(routerPush).toHaveBeenCalledWith('/employer/jobs/p1/applicants/a1?from=dashboard');
  });

  it('rendered HTML never contains companyId or contactId', async () => {
    const { container } = { container: document.body };
    await renderDashboard();
    expect(container.innerHTML).not.toContain('companyId');
    expect(container.innerHTML).not.toContain('contactId');
  });

  it('activity events render with the correct dot color per type', async () => {
    await renderDashboard();
    const dotOf = (type: string) =>
      (within(screen.getByTestId(`activity-${type}`)).getByTestId('activity-dot') as HTMLElement)
        .style.background.toLowerCase();
    // happy-dom may keep hex or normalize to rgb — accept either encoding.
    expect(['#1d9e75', 'rgb(29, 158, 117)']).toContain(dotOf('application'));       // green
    expect(['#378add', 'rgb(55, 138, 221)']).toContain(dotOf('stage_move'));        // blue
    expect(['#ba7517', 'rgb(186, 117, 23)']).toContain(dotOf('interview_cancelled')); // amber
  });

  it('shows skeleton placeholders while loading', () => {
    fetchDashboardSummary.mockReturnValue(new Promise(() => {}));
    fetchDashboardActivity.mockReturnValue(new Promise(() => {}));
    render(<EmployerDashboard />);
    expect(screen.getAllByTestId('dashboard-skeleton').length).toBeGreaterThanOrEqual(9);
  });

  it('shows the error state with a Retry button on failure', async () => {
    fetchDashboardSummary.mockRejectedValue(new Error('boom'));
    fetchDashboardActivity.mockResolvedValue([]);
    render(<EmployerDashboard />);
    await waitFor(() => expect(screen.getByText(/Couldn't load the dashboard/)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('"New posting" button navigates to /employer/jobs/new', async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /New posting/ }));
    expect(routerPush).toHaveBeenCalledWith('/employer/jobs/new?from=dashboard');
  });
});
