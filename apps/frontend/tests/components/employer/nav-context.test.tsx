// FILE: tests/components/employer/nav-context.test.tsx
// Navigation context: history-aware Cancel/Back, ?from= breadcrumbs, and the
// nav highlight staying on the origin section.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import EmployerTopNav from '@/components/layouts/parts/EmployerTopNav';
import EmployerJobsNew from '@/components/employer/jobs/New';
import ApplicantStickyHeader from '@/components/employer/jobs/ApplicantStickyHeader';
import { useBackOrFallback } from '@/hooks/employer/useBackOrFallback';
import { ToastProvider } from '@/components/ui/Toast';

const routerPush = vi.fn();
const routerBack = vi.fn();
let fromParam: string | null = null;
let pathname = '/employer/jobs/new';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, back: routerBack }),
  useSearchParams: () => ({ get: (key: string) => (key === 'from' ? fromParam : null) }),
  usePathname: () => pathname,
}));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ company: { name: 'Acme', slug: 'acme' } }),
}));
vi.mock('@/lib/from-route', () => ({ getFromRoute: () => '/employer' }));
vi.mock('@/api/employer-jobs-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-jobs-api')>();
  return { ...actual, createEmployerPosting: vi.fn() };
});

/** Give the tab a history entry so back-or-fallback prefers router.back(). */
function seedHistory() {
  window.history.pushState({}, '', '/employer');
  window.history.pushState({}, '', '/employer/jobs/new');
}

beforeEach(() => {
  routerPush.mockReset();
  routerBack.mockReset();
  fromParam = null;
  pathname = '/employer/jobs/new';
});

describe('Breadcrumbs ?from= origin', () => {
  const items = [{ label: 'Jobs', href: '/employer/jobs' }, { label: 'New posting' }];

  it('shows "Dashboard / New posting" for ?from=dashboard', () => {
    fromParam = 'dashboard';
    render(<Breadcrumbs items={items} />);
    const dashboard = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboard.getAttribute('href')).toBe('/employer');
    expect(screen.queryByRole('link', { name: 'Jobs' })).toBeNull();
    expect(screen.getByText('New posting')).toBeTruthy();
  });

  it('shows "Jobs / New posting" for ?from=jobs', () => {
    fromParam = 'jobs';
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('link', { name: 'Jobs' }).getAttribute('href')).toBe('/employer/jobs');
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
  });

  it('falls back to the route-based trail with no ?from param', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('link', { name: 'Jobs' }).getAttribute('href')).toBe('/employer/jobs');
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
  });

  it('never rewrites a single-item trail into a link', () => {
    fromParam = 'dashboard';
    render(<Breadcrumbs items={[{ label: 'Jobs' }]} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('Nav highlight follows the origin', () => {
  const renderNav = () => render(
    <EmployerTopNav isCompact={false} currentUser={null} companyName="Acme" role={null} onLogout={vi.fn()} />,
  );
  const isHighlighted = (label: string) =>
    (screen.getByRole('link', { name: label }) as HTMLElement).style.fontWeight === '600';

  it('highlights Dashboard on /employer/jobs/new?from=dashboard', () => {
    fromParam = 'dashboard';
    renderNav();
    expect(isHighlighted('Dashboard')).toBe(true);
    expect(isHighlighted('Jobs')).toBe(false);
  });

  it('highlights Jobs on ?from=jobs', () => {
    fromParam = 'jobs';
    renderNav();
    expect(isHighlighted('Jobs')).toBe(true);
    expect(isHighlighted('Dashboard')).toBe(false);
  });

  it('falls back to pathname highlighting with no ?from param', () => {
    renderNav();
    expect(isHighlighted('Jobs')).toBe(true);
    expect(isHighlighted('Dashboard')).toBe(false);
  });
});

describe('History-aware back navigation', () => {
  it('Cancel on the new posting form calls router.back()', () => {
    seedHistory();
    render(<ToastProvider><EmployerJobsNew /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(routerBack).toHaveBeenCalledTimes(1);
    expect(routerPush).not.toHaveBeenCalled();
  });

  // ApplicantStickyHeader's onBack hook: an UNLABELLED back control pops
  // history. NOTE: ApplicantDetail itself no longer wires this hook — a
  // labelled "Back to Ranked" navigates to its href deterministically, since
  // prev/next stacks applicant entries that router.back() would land on.
  it('an onBack handler intercepts the header link and pops history', () => {
    seedHistory();
    function Header() {
      const goBack = useBackOrFallback('/employer/jobs/p1?tab=ranked');
      return (
        <ApplicantStickyHeader
          backHref="/employer/jobs/p1?tab=ranked" backLabel="Back to Ranked"
          candidateName="Ada" candidateEmail="ada@x.io" onBack={goBack}
        />
      );
    }
    render(<Header />);
    fireEvent.click(screen.getByRole('link', { name: /Back to Ranked/ }));
    expect(routerBack).toHaveBeenCalledTimes(1);
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('falls back to the logical parent when there is no history to pop', () => {
    function Cancel() {
      const goBack = useBackOrFallback('/employer/jobs');
      return <button onClick={goBack}>Cancel</button>;
    }
    const originalLength = window.history.length;
    Object.defineProperty(window.history, 'length', { value: 1, configurable: true });
    render(<Cancel />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(routerPush).toHaveBeenCalledWith('/employer/jobs');
    expect(routerBack).not.toHaveBeenCalled();
    Object.defineProperty(window.history, 'length', { value: originalLength, configurable: true });
  });
});
