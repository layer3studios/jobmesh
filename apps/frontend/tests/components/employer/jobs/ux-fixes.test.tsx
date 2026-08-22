// FILE: tests/components/employer/jobs/ux-fixes.test.tsx
// UX fixes: clickable jobs rows, breadcrumbs, edit-mode live preview + pills,
// single "New posting" heading.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import JobsTable from '@/components/employer/jobs/JobsTable';
import { PostingDetail } from '@/components/employer/jobs/Detail';
import PostingOverview from '@/components/employer/jobs/PostingOverview';
import EmployerJobsNew from '@/components/employer/jobs/New';
import { ToastProvider } from '@/components/ui/Toast';
import type { Posting } from '@/types/employer-jobs';

const routerPush = vi.fn();
let tabParam: string | null = null;
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
  usePathname: () => '/employer/jobs/p1',
  useSearchParams: () => ({ get: () => tabParam, toString: () => '' }),
}));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ company: { name: 'Acme Labs', slug: 'acme' }, viewerRole: 'founder' }),
}));
vi.mock('@/lib/from-route', () => ({ getFromRoute: () => '/employer/jobs' }));
vi.mock('@/components/employer/jobs/PipelineTab', () => ({ default: () => <div>pipeline-body</div> }));
vi.mock('@/components/employer/jobs/RankedTab', () => ({ default: () => <div>ranked-body</div> }));
vi.mock('@/components/employer/jobs/DetailSettings', () => ({ default: () => <div>settings-body</div> }));

const getEmployerPosting = vi.fn();
vi.mock('@/api/employer-jobs-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-jobs-api')>();
  return { ...actual, getEmployerPosting: (...args: unknown[]) => getEmployerPosting(...args) };
});
vi.mock('@/api/employer-applicants-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-applicants-api')>();
  return { ...actual, listApplicantsForPosting: async () => [], listStages: async () => [] };
});
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return {
    ...actual,
    listInterviewTimes: async () => [],
    getInterviewTimeCount: async () => ({ availableCount: 5 }),
  };
});

function posting(overrides: Partial<Posting> = {}): Posting {
  return {
    id: 'p1', slug: 'be', title: 'Backend Engineer', description: 'A long enough description body.',
    descriptionPlain: 'x', location: 'Bengaluru', workplaceType: 'hybrid', employmentType: 'full-time',
    salaryMin: 12, salaryMax: 18, salaryCurrency: 'INR', status: 'active',
    postedAt: '2026-07-01T00:00:00Z', createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  } as Posting;
}

beforeEach(() => {
  routerPush.mockReset();
  getEmployerPosting.mockReset();
  getEmployerPosting.mockResolvedValue(posting());
  tabParam = null;
  cleanup();
});

describe('Breadcrumbs', () => {
  it('renders links for all but the last item, with the correct hrefs', () => {
    render(<Breadcrumbs items={[{ label: 'Jobs', href: '/employer/jobs' }, { label: 'Backend Engineer', href: '/employer/jobs/p1' }, { label: 'Edit' }]} />);
    expect(screen.getByRole('link', { name: 'Jobs' }).getAttribute('href')).toBe('/employer/jobs');
    expect(screen.getByRole('link', { name: 'Backend Engineer' }).getAttribute('href')).toBe('/employer/jobs/p1');
    const current = screen.getByText('Edit');
    expect(current.closest('a')).toBeNull();
    expect(current.getAttribute('aria-current')).toBe('page');
  });
});

describe('JobsTable row click', () => {
  it('navigates to the posting detail when clicking anywhere on the row', () => {
    // ToastProvider is required now: the row's ⋯ menu reports close/delete
    // outcomes through a toast.
    render(
      <ToastProvider>
        <JobsTable
          postings={[posting()]}
          canEdit canClose canDelete={false}
          onFill={() => {}} onChanged={() => {}}
        />
      </ToastProvider>,
    );
    // The desktop table and the mobile cards are both in the DOM (CSS picks one),
    // so scope the click to the table to avoid matching the card's copy.
    const table = document.querySelector('.jobs-table-desktop') as HTMLElement;
    fireEvent.click(within(table).getByText('Bengaluru')); // a non-link cell
    expect(routerPush).toHaveBeenCalledWith('/employer/jobs/p1?from=jobs');
  });
});

describe('Posting detail breadcrumbs', () => {
  it('renders "Jobs / <title>" with a link back to the jobs list', async () => {
    render(<ToastProvider><PostingDetail postingId="p1" /></ToastProvider>);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    await waitFor(() => expect(nav.textContent).toContain('Backend Engineer'));
    expect(screen.getByRole('link', { name: 'Jobs' }).getAttribute('href')).toBe('/employer/jobs');
  });
});

describe('Edit posting layout', () => {
  function openEdit() {
    render(<ToastProvider><PostingOverview posting={posting()} onReload={async () => {}} /></ToastProvider>);
    fireEvent.click(screen.getByLabelText('Edit posting'));
  }

  it('shows the live preview beside the form', () => {
    openEdit();
    expect(screen.getByText('Live preview')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeTruthy();
  });

  it('uses pill toggles for workplace and employment type, not dropdowns', () => {
    openEdit();
    for (const label of ['Remote', 'Hybrid', 'On-site', 'Full-time', 'Contract']) {
      // The live preview may repeat a label — assert at least one is a pill button.
      expect(screen.getAllByText(label).some((el) => el.closest('button'))).toBe(true);
    }
    expect(document.querySelector('select')).toBeNull();
  });
});

describe('New posting page', () => {
  it('has exactly one "New posting" heading', () => {
    render(<ToastProvider><EmployerJobsNew /></ToastProvider>);
    expect(screen.getAllByRole('heading', { name: 'New posting' })).toHaveLength(1);
  });
});
