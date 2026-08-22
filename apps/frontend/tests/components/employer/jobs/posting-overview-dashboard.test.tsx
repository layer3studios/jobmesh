// FILE: tests/components/employer/jobs/posting-overview-dashboard.test.tsx
// Overview dashboard: KPI tiles, status badge, edit/copy actions, scrollable JD.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import PostingOverview from '@/components/employer/jobs/PostingOverview';
import { ToastProvider } from '@/components/ui/Toast';
import type { Posting } from '@/types/employer-jobs';

vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ company: { slug: 'acme' }, viewerRole: 'member' }),
}));

const listApplicantsForPosting = vi.fn();
vi.mock('@/api/employer-applicants-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-applicants-api')>();
  return {
    ...actual,
    listApplicantsForPosting: (...args: unknown[]) => listApplicantsForPosting(...args),
    listStages: async () => [{ id: 's1', text: 'Applied' }, { id: 's2', text: 'Interview' }],
  };
});
const listInterviewTimes = vi.fn();
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return { ...actual, listInterviewTimes: (...args: unknown[]) => listInterviewTimes(...args) };
});

function posting(overrides: Partial<Posting> = {}): Posting {
  return {
    id: 'p1', slug: 'be', title: 'Backend Engineer', description: 'JD-BODY-TEXT', descriptionPlain: 'x',
    location: 'Bengaluru', workplaceType: 'hybrid', employmentType: 'full-time',
    salaryMin: 12, salaryMax: 18, salaryCurrency: 'INR', status: 'active',
    applicationDeadline: null, autoCloseOnDeadline: false, closedAt: null,
    postedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignmentId: null,
    ...overrides,
  };
}

function applicant(id: string, score: number | null, stageId = 's1') {
  return {
    application: { id, stageId, appliedAt: '2026-07-10T00:00:00Z', archived: null },
    contact: { fullName: 'X Y', email: 'x@y.com' },
    score: score === null ? null : { score, tier: 'strong', processingError: null },
  };
}

beforeEach(() => {
  listApplicantsForPosting.mockReset(); listInterviewTimes.mockReset();
  listApplicantsForPosting.mockResolvedValue([applicant('a1', 80), applicant('a2', 60, 's2'), applicant('a3', null)]);
  listInterviewTimes.mockResolvedValue([{ id: 't1', status: 'booked' }]);
  // navigator.clipboard is getter-only in happy-dom — redefine the property.
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true,
  });
  cleanup();
});

function renderOverview(overrides: Partial<Posting> = {}) {
  return render(<ToastProvider><PostingOverview posting={posting(overrides)} onReload={async () => {}} /></ToastProvider>);
}

describe('PostingOverview dashboard', () => {
  it('"Days open" computes from createdAt; KPI values load from existing endpoints', async () => {
    renderOverview();
    expect(screen.getByText('28')).toBeTruthy(); // days open — synchronous
    await waitFor(() => expect(screen.getByText('Total applicants').nextElementSibling?.textContent).toBe('3'));
    expect(screen.getByText('Avg. AI score').nextElementSibling?.textContent).toBe('70'); // (80+60)/2
    expect(screen.getByText('Interviews scheduled').nextElementSibling?.textContent).toBe('1');
  });

  it('the status badge renders success styling for active', () => {
    renderOverview();
    const badge = screen.getByText('active') as HTMLElement;
    expect(badge.style.background).toContain('success');
  });

  it('the Edit pencil opens the edit form', async () => {
    renderOverview();
    fireEvent.click(screen.getByLabelText('Edit posting'));
    expect(screen.getByText('Save changes')).toBeTruthy();
  });

  it('Copy apply link writes the URL to the clipboard', async () => {
    renderOverview();
    fireEvent.click(screen.getByText('Copy apply link'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/apply/acme/be')));
  });

  it('the description card is a scrollable well containing the JD', () => {
    renderOverview();
    const well = screen.getByTestId('description-scroll') as HTMLElement;
    expect(well.style.maxHeight).toBe('380px');
    expect(well.style.overflowY).toBe('auto');
    expect(screen.getByText('JD-BODY-TEXT')).toBeTruthy();
  });

  it('the pipeline snapshot bar renders segments for stages with applicants', async () => {
    renderOverview();
    await waitFor(() => expect(screen.getByTestId('pipeline-snapshot-bar')).toBeTruthy());
    expect(screen.getByTestId('pipeline-snapshot-bar').children.length).toBe(2);
    expect(screen.getByText('Applied 2')).toBeTruthy();
    expect(screen.getByText('Interview 1')).toBeTruthy();
  });
});
