import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { listApplicantsWithStats, listStages, listArchiveReasons, fetchApplicantFacets, listSavedViews, replace } =
  vi.hoisted(() => ({
    listApplicantsWithStats: vi.fn(),
    listStages: vi.fn(),
    listArchiveReasons: vi.fn(),
    fetchApplicantFacets: vi.fn(),
    listSavedViews: vi.fn(),
    replace: vi.fn(),
  }));

vi.mock('@/api/employer-applicants-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/employer-applicants-api')>()),
  listApplicantsWithStats, listStages, listArchiveReasons, fetchApplicantFacets, listSavedViews,
}));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ viewerRole: 'owner', viewerCanArchiveApplicants: true, company: { id: 'c1' } }),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ replace }),
  usePathname: () => '/employer/jobs/j1',
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
// RankedTab toasts on bulk-archive outcomes; the provider is out of scope here.
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import RankedTab from '@/components/employer/jobs/RankedTab';
import AssignmentFilters from '@/components/employer/jobs/parts/AssignmentFilters';
import AssignmentColumn from '@/components/employer/jobs/parts/AssignmentColumn';
import type { Applicant, AssignmentStats } from '@/types/employer-applicants';

function makeApplicant(id: string, overrides: Partial<Applicant> = {}): Applicant {
  return {
    application: {
      id, jobId: 'j1', contactId: `c-${id}`, stageId: 'st1', archived: null,
      appliedAt: '2026-08-01T00:00:00.000Z', coverNote: null, lastStageMovedAt: '2026-08-01T00:00:00.000Z',
    },
    contact: { id: `c-${id}`, email: `${id}@x.io`, fullName: `Candidate ${id}`, phone: null },
    score: { id: `s-${id}`, score: 82, tier: 'strong', matchedSkills: [], missingSkills: [], explanation: null, processedAt: '2026-08-01T00:00:00.000Z', processingError: null },
    ...overrides,
  };
}

const STATS: AssignmentStats = { total: 47, submitted: 40, reviewed: 31, passing: 12 };

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  listStages.mockImplementation(async () => [{ id: 'st1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null }]);
  listArchiveReasons.mockImplementation(async () => []);
  fetchApplicantFacets.mockImplementation(async () => ({ skills: [], cities: [] }));
  listSavedViews.mockImplementation(async () => []);
});

// ── Rule 8: a plain posting renders exactly as it did before 8c ──────────────
describe('plain posting (no stats key)', () => {
  beforeEach(() => {
    // No `stats` and no `assignment` key on rows — exactly what the backend sends
    // when the posting has no assignment attached.
    listApplicantsWithStats.mockImplementation(async () => ({ applicants: [makeApplicant('a1')] }));
  });

  it('renders no stats strip, no chips and no Task column', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');

    expect(screen.queryByTestId('assignment-stats')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Filter by assignment review' })).toBeNull();
    // The redesigned table is a flex grid, not a <table>: headers are spans in a
    // role="row" strip, so these assert on header TEXT rather than columnheader.
    expect(screen.queryByText('Task')).toBeNull();
  });

  it('offers no "Task score" sort option', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');
    const sort = screen.getByLabelText('Sort applicants') as HTMLSelectElement;
    expect(Array.from(sort.options).map((option) => option.value)).toEqual(['score', 'date']);
  });

  it('never sends an assignmentReview filter', async () => {
    render(<RankedTab postingId="j1" />);
    await waitFor(() => expect(listApplicantsWithStats).toHaveBeenCalled());
    const options = listApplicantsWithStats.mock.calls[0][1] as { filters: Record<string, string> };
    expect('assignmentReview' in options.filters).toBe(false);
  });
});

// ── Assignment posting ──────────────────────────────────────────────────────
describe('assignment posting', () => {
  beforeEach(() => {
    listApplicantsWithStats.mockImplementation(async () => ({
      applicants: [
        makeApplicant('a1', { assignment: { submissionId: 's1', submittedAt: null, linkCount: 1, fileCount: 0, review: { overallScore: 4, passesBar: true, reviewedAt: null } } }),
        makeApplicant('a2', { assignment: null }),
      ],
      stats: STATS,
    }));
  });

  it('renders the strip, the chips and the Task column', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');

    expect(screen.getByTestId('assignment-stats').textContent)
      .toBe('47 applications · 31 reviewed · 12 passing');
    expect(screen.getByRole('group', { name: 'Filter by assignment review' })).toBeTruthy();
    expect(screen.getByText('Task')).toBeTruthy();
  });

  // Two scales, two columns, two labels — never one blended number.
  it('labels the resume score and the task score separately', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');
    expect(screen.getByText('Resume')).toBeTruthy();
    expect(screen.getByText('Task')).toBeTruthy();
    // The AI score keeps its 0–100 form; the task score keeps its n/5 form. Both
    // rows carry the same resume score, hence getAllByText.
    expect(screen.getAllByText(/82/).length).toBeGreaterThan(0);
    expect(screen.getByText('4/5 · Passed')).toBeTruthy();
    // No cell anywhere blends the two into a single figure.
    expect(screen.queryByText(/82.*4\/5|4\/5.*82/)).toBeNull();
  });

  it('adds the Task score sort option', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');
    const sort = screen.getByLabelText('Sort applicants') as HTMLSelectElement;
    expect(Array.from(sort.options).map((option) => option.value)).toEqual(['score', 'date', 'assignment']);
  });

  it('sends sort=assignment to the server, which owns the ordering', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');
    fireEvent.change(screen.getByLabelText('Sort applicants'), { target: { value: 'assignment' } });
    await waitFor(() => {
      const last = listApplicantsWithStats.mock.calls.at(-1)?.[1] as { sort: string };
      expect(last.sort).toBe('assignment');
    });
  });

  // Rule 7: the strip describes the POSTING, not the view.
  it('the stats are IDENTICAL before and after a chip is clicked', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');
    const before = screen.getByTestId('assignment-stats').textContent;

    // The filtered response returns one row but the SAME pre-filter stats.
    listApplicantsWithStats.mockImplementation(async () => ({
      applicants: [makeApplicant('a1', { assignment: { submissionId: 's1', submittedAt: null, linkCount: 1, fileCount: 0, review: { overallScore: 4, passesBar: true, reviewedAt: null } } })],
      stats: STATS,
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Passed bar' }));

    await waitFor(() => {
      const last = listApplicantsWithStats.mock.calls.at(-1)?.[1] as { filters: Record<string, string> };
      expect(last.filters.assignmentReview).toBe('passed');
    });
    await waitFor(() => expect(screen.queryByText('Candidate a2')).toBeNull());
    expect(screen.getByTestId('assignment-stats').textContent).toBe(before);
    expect(screen.getByTestId('assignment-stats').textContent).toBe('47 applications · 31 reviewed · 12 passing');
  });

  it('writes the chip to the URL so a pasted link restores the view', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');
    fireEvent.click(screen.getByRole('button', { name: 'Not reviewed' }));
    expect(replace).toHaveBeenCalledWith('/employer/jobs/j1?assignmentReview=not_reviewed', { scroll: false });
  });

  it('the All chip clears the filter entirely', async () => {
    render(<RankedTab postingId="j1" />);
    await screen.findByText('Candidate a1');
    fireEvent.click(screen.getByRole('button', { name: 'Passed bar' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(replace).toHaveBeenLastCalledWith('/employer/jobs/j1', { scroll: false });
  });
});

describe('AssignmentColumn', () => {
  it.each([
    [null, 'No submission'],
    [{ submissionId: 's1', submittedAt: null, linkCount: 0, fileCount: 0, review: null }, 'Not reviewed'],
    [{ submissionId: 's1', submittedAt: null, linkCount: 0, fileCount: 0, review: { overallScore: 4, passesBar: true, reviewedAt: null } }, '4/5 · Passed'],
    [{ submissionId: 's1', submittedAt: null, linkCount: 0, fileCount: 0, review: { overallScore: 2, passesBar: false, reviewedAt: null } }, '2/5 · Failed'],
  ])('renders %#', (assignment, expected) => {
    render(<AssignmentColumn applicant={makeApplicant('a1', { assignment })} />);
    expect(screen.getByText(expected)).toBeTruthy();
  });
});

describe('AssignmentFilters in isolation', () => {
  it('renders the five chips with All active by default', () => {
    render(<AssignmentFilters stats={STATS} value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('marks the active chip pressed', () => {
    render(<AssignmentFilters stats={STATS} value="failed" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Failed bar' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports null for the All chip', () => {
    const onChange = vi.fn();
    render(<AssignmentFilters stats={STATS} value="passed" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
