// FILE: tests/components/employer/jobs/ranked-redesign.test.tsx
// Sidebar-layout Ranked tab: sections, filter wiring, table rows, navigation,
// score pills, empty state, sort, and the mobile drawer trigger.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import RankedTab from '@/components/employer/jobs/RankedTab';
import { ToastProvider } from '@/components/ui/Toast';
import type { Applicant, Stage } from '@/types/employer-applicants';

const routerPush = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/employer/jobs/p1',
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
}));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ viewerRole: 'member', viewerCanArchiveApplicants: true, company: { id: 'c1' } }),
}));
vi.mock('@/components/employer/jobs/SavedViewsRow', () => ({ default: () => <div /> }));

const listApplicantsWithStats = vi.fn();
const fetchApplicantFacets = vi.fn();
vi.mock('@/api/employer-applicants-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-applicants-api')>();
  return {
    ...actual,
    listApplicantsWithStats: (...args: unknown[]) => listApplicantsWithStats(...args),
    listStages: async () => STAGES,
    listArchiveReasons: async () => [],
    fetchApplicantFacets: (...args: unknown[]) => fetchApplicantFacets(...args),
  };
});

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied' } as Stage,
  { id: 's2', text: 'Interview' } as Stage,
];

function applicant(id: string, name: string, score: number | null, stageId = 's1'): Applicant {
  return {
    application: { id, stageId, appliedAt: '2030-08-01T00:00:00Z', archived: null } ,
    contact: { fullName: name, email: `${name.toLowerCase().replace(/\s/g, '')}@x.com` },
    score: score === null ? null : {
      score, tier: score >= 80 ? 'strong' : score >= 60 ? 'good' : score >= 40 ? 'partial' : score >= 20 ? 'weak' : 'poor',
      processingError: null,
    },
  } as unknown as Applicant;
}

let matchMediaMatches = false;
beforeEach(() => {
  routerPush.mockReset(); listApplicantsWithStats.mockReset(); fetchApplicantFacets.mockReset();
  // No `stats` key: these fixtures are plain postings, so the tab renders the
  // pre-assignment markup this suite was written against.
  listApplicantsWithStats.mockResolvedValue({
    applicants: [applicant('a1', 'Asha Rao', 92), applicant('a2', 'Bela Iyer', 65, 's2'), applicant('a3', 'Chirag M', null)],
  });
  fetchApplicantFacets.mockResolvedValue({
    skills: Array.from({ length: 10 }, (_, i) => ({ skill: `Skill${i + 1}`, count: 10 - i })),
    cities: [],
  });
  matchMediaMatches = false;
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matchMediaMatches, media: query,
    addEventListener: () => {}, removeEventListener: () => {},
  }));
  cleanup();
});

async function renderRanked() {
  const result = render(<ToastProvider><RankedTab postingId="p1" /></ToastProvider>);
  await waitFor(() => expect(screen.getByText('Asha Rao')).toBeTruthy());
  return result;
}

describe('RankedTab sidebar redesign', () => {
  it('renders the filter sections with Stage/Score open and the rest collapsed', async () => {
    await renderRanked();
    // Section headers are buttons with aria-expanded ("Stage" also exists as a
    // table column header, so match the section toggles specifically).
    expect(screen.getByRole('button', { name: 'Stage' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Score' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Experience' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: /Skills/ }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Applied' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Strong (80+)')).toBeTruthy(); // score rows visible
    expect(screen.queryByText('Junior (1-3y)')).toBeNull(); // experience collapsed
    expect(screen.queryByLabelText('Filter skills')).toBeNull(); // skills collapsed
    expect(screen.queryByText('Last 7 days')).toBeNull(); // applied collapsed
  });

  it('checking a stage filters the table; summary shows the active count', async () => {
    await renderRanked();
    fireEvent.click(screen.getByText('Interview', { selector: 'label span' }));
    await waitFor(() => expect(screen.getByText('1 applicant · 1 filter active')).toBeTruthy());
    expect(screen.queryByText('Asha Rao')).toBeNull();
    expect(screen.getByText('Bela Iyer')).toBeTruthy();
  });

  it('"Clear all filters" resets everything and hides itself', async () => {
    await renderRanked();
    fireEvent.click(screen.getByText('Interview', { selector: 'label span' }));
    await waitFor(() => expect(screen.getByText('Clear all filters')).toBeTruthy());
    fireEvent.click(screen.getByText('Clear all filters'));
    await waitFor(() => expect(screen.getByText('3 applicants')).toBeTruthy());
    expect(screen.queryByText('Clear all filters')).toBeNull();
  });

  it('skills: max 8 by default, "Show all", and the mini-search filters the list', async () => {
    await renderRanked();
    fireEvent.click(screen.getByText('Skills')); // expand
    expect(screen.getByText('Skill8')).toBeTruthy();
    expect(screen.queryByText('Skill9')).toBeNull();
    fireEvent.click(screen.getByText('Show all 10'));
    expect(screen.getByText('Skill10')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Filter skills'), { target: { value: 'Skill1' } });
    expect(screen.getByText('Skill1')).toBeTruthy();
    expect(screen.getByText('Skill10')).toBeTruthy(); // substring match
    expect(screen.queryByText('Skill2')).toBeNull();
  });

  it('rows render name, email, score pill, stage and date; pills carry tier colors', async () => {
    await renderRanked();
    expect(screen.getByText('asharao@x.com')).toBeTruthy();
    const strongPill = screen.getByText('92 · strong') as HTMLElement;
    expect(strongPill.style.background).toBe('var(--success-soft)');
    const goodPill = screen.getByText('65 · good') as HTMLElement;
    expect(goodPill.style.background).toBe('var(--accent-soft)');
    expect(screen.getByText('—')).toBeTruthy(); // unscored
    expect(screen.getAllByText('Applied', { selector: 'div span, div div, span' }).length).toBeGreaterThan(0);
  });

  it('clicking a row navigates; clicking the checkbox does not', async () => {
    await renderRanked();
    fireEvent.click(screen.getByText('Asha Rao'));
    expect(routerPush).toHaveBeenCalledWith('/employer/jobs/p1/applicants/a1?from=ranked');
    routerPush.mockReset();
    fireEvent.click(screen.getByLabelText('Select Bela Iyer'));
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('empty state appears when nothing matches, with a working clear link', async () => {
    await renderRanked();
    fireEvent.change(screen.getByLabelText('Search name or email'), { target: { value: 'zzz-no-match' } });
    await waitFor(() => expect(screen.getByText('No applicants match these filters')).toBeTruthy());
    fireEvent.click(screen.getByText('Clear filters'));
    await waitFor(() => expect(screen.getByText('Asha Rao')).toBeTruthy());
  });

  it('the sort dropdown triggers a refetch with the new sort', async () => {
    await renderRanked();
    fireEvent.change(screen.getByLabelText('Sort applicants'), { target: { value: 'date' } });
    await waitFor(() => {
      const lastCall = listApplicantsWithStats.mock.calls.at(-1) as [string, { sort: string }];
      expect(lastCall[1].sort).toBe('date');
    });
  });

  it('below 768px the sidebar hides and a Filters button with badge count appears', async () => {
    matchMediaMatches = true;
    await renderRanked();
    const filtersButton = screen.getByText('Filters').closest('button') as HTMLButtonElement;
    expect(filtersButton).toBeTruthy();
    expect(screen.queryByText('Strong (80+)')).toBeNull(); // sidebar not inline
    // Opening the drawer reveals the sidebar; toggling a filter shows the badge.
    fireEvent.click(filtersButton);
    fireEvent.click(screen.getByText('Strong (80+)'));
    await waitFor(() => expect(filtersButton.textContent).toBe('Filters1'));
  });
});
