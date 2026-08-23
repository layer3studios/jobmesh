// FILE: tests/components/employer/jobs/detail-tabs.test.tsx
// Tab order (Overview | Pipeline | Ranked | Settings), default tab, ?tab=
// deep-link stability, and the Settings low-pool badge.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { PostingDetail } from '@/components/employer/jobs/Detail';

let tabParam: string | null = null;
const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));
// useRouter/usePathname: the tab click mirrors the active tab into ?tab=.
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => tabParam, toString: () => (tabParam ? `tab=${tabParam}` : '') }),
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => '/employer/jobs/p1',
}));
vi.mock('@/components/employer/jobs/PostingOverview', () => ({ default: () => <div>overview-body</div> }));
vi.mock('@/components/employer/jobs/DetailSettings', () => ({ default: () => <div>settings-body</div> }));
vi.mock('@/components/employer/jobs/PipelineTab', () => ({ default: () => <div>pipeline-body</div> }));
vi.mock('@/components/employer/jobs/RankedTab', () => ({ default: () => <div>ranked-body</div> }));

const getEmployerPosting = vi.fn();
vi.mock('@/api/employer-jobs-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-jobs-api')>();
  return { ...actual, getEmployerPosting: (...args: unknown[]) => getEmployerPosting(...args) };
});
const getInterviewTimeCount = vi.fn();
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return { ...actual, getInterviewTimeCount: (...args: unknown[]) => getInterviewTimeCount(...args) };
});

const POSTING = {
  id: 'p1', slug: 'be', title: 'Backend Engineer', description: 'x', descriptionPlain: 'x',
  location: 'Bengaluru', workplaceType: 'onsite', employmentType: 'full-time',
  salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
  postedAt: null, createdAt: '2030-01-01T00:00:00Z', updatedAt: '2030-01-01T00:00:00Z',
};

beforeEach(() => {
  getEmployerPosting.mockReset(); getInterviewTimeCount.mockReset();
  getEmployerPosting.mockResolvedValue(POSTING);
  getInterviewTimeCount.mockResolvedValue({ availableCount: 5 });
  tabParam = null;
  cleanup();
});

describe('PostingDetail tabs', () => {
  it('orders tabs Overview | Pipeline | Ranked | Settings, defaulting to Overview', async () => {
    const { container } = render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    const labels = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(labels).toEqual(['Overview', 'Pipeline', 'Ranked', 'Settings']);
    expect(screen.getByText('overview-body')).toBeTruthy();
    // The page shell owns width and padding now (sprint 7 item 2): this is a
    // data-dense working surface, so it takes the WIDE width rather than the
    // reading width, and its padding comes from the shared page tokens instead
    // of a hand-written '24px 16px' that had drifted across comparable pages.
    const pageContainer = container.firstElementChild as HTMLElement;
    expect(pageContainer.style.maxWidth).toBe('var(--page-max-width-wide)');
    expect(pageContainer.style.padding).toBe('var(--page-padding-y) var(--page-padding-x)');
  });

  it('?tab=ranked still lands on the Ranked tab (deep links stay stable)', async () => {
    tabParam = 'ranked';
    render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getByText('ranked-body')).toBeTruthy());
  });

  it('shows a "0" badge on Settings when the pool is empty, none at 2+', async () => {
    getInterviewTimeCount.mockResolvedValue({ availableCount: 0 });
    render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    await waitFor(() => expect(screen.getAllByRole('tab')[3].textContent).toBe('Settings0'));
    cleanup();
    getInterviewTimeCount.mockResolvedValue({ availableCount: 3 });
    render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    expect(screen.getAllByRole('tab')[3].textContent).toBe('Settings');
  });

  it('shows an amber "1" badge at one remaining time', async () => {
    getInterviewTimeCount.mockResolvedValue({ availableCount: 1 });
    render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    await waitFor(() => expect(screen.getAllByRole('tab')[3].textContent).toBe('Settings1'));
  });
});
