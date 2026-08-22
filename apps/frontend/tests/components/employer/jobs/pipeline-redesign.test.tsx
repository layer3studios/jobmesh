// FILE: tests/components/employer/jobs/pipeline-redesign.test.tsx
// Kanban reskin: stage-coloured columns, count pills, card anatomy, empty
// drop zones, click-to-open, and the full-width column grid.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import PipelineTab from '@/components/employer/jobs/PipelineTab';
import { ToastProvider } from '@/components/ui/Toast';
import type { Applicant, Stage } from '@/types/employer-applicants';

const routerPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: routerPush, replace: vi.fn() }) }));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ viewerRole: 'member', viewerCanMoveApplicants: true, company: { id: 'c1' } }),
}));

const listApplicantsForPosting = vi.fn();
vi.mock('@/api/employer-applicants-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-applicants-api')>();
  return {
    ...actual,
    listApplicantsForPosting: (...args: unknown[]) => listApplicantsForPosting(...args),
    listStages: async () => STAGES,
    // PipelineTab now loads archive reasons for the quick-archive popover; the
    // real one would fetch and reject, failing the whole load.
    listArchiveReasons: async () => [],
    moveApplicant: vi.fn(),
  };
});

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied' } as Stage,
  { id: 's2', text: 'Interview' } as Stage,
  { id: 's3', text: 'Offer' } as Stage,
];

function applicant(id: string, name: string, score: number | null, stageId = 's1'): Applicant {
  return {
    application: {
      id, stageId, appliedAt: new Date(Date.now() - 10 * 86400000).toISOString(), archived: null,
      // 3 days in THIS stage (a real past instant — future dates render "now").
      lastStageMovedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    contact: { fullName: name, email: `${name.toLowerCase().replace(/\s/g, '')}@x.com` },
    score: score === null ? null : { score, tier: 'strong', processingError: null },
  } as unknown as Applicant;
}

beforeEach(() => {
  routerPush.mockReset(); listApplicantsForPosting.mockReset();
  listApplicantsForPosting.mockResolvedValue([
    applicant('a1', 'Ashish Ranjan', 92),
    applicant('a2', 'Priya', 45, 's2'),
    applicant('a3', 'Chirag M', null, 's2'),
  ]);
  cleanup();
});

async function renderPipeline() {
  const result = render(<ToastProvider><PipelineTab postingId="p1" /></ToastProvider>);
  await waitFor(() => expect(screen.getByText('Ashish Ranjan')).toBeTruthy());
  return result;
}

describe('Pipeline redesign', () => {
  it('columns carry their stage colour on the header underline', async () => {
    await renderPipeline();
    const applied = screen.getByTestId('pipeline-column-s1').querySelector('header') as HTMLElement;
    const interview = screen.getByTestId('pipeline-column-s2').querySelector('header') as HTMLElement;
    const offer = screen.getByTestId('pipeline-column-s3').querySelector('header') as HTMLElement;
    expect(applied.style.borderBottom).toContain('#1D9E75');
    expect(interview.style.borderBottom).toContain('#BA7517');
    expect(offer.style.borderBottom).toContain('#7F77DD');
  });

  it('count pills show the correct number per column', async () => {
    await renderPipeline();
    expect(within(screen.getByTestId('pipeline-column-s1')).getByText('1')).toBeTruthy();
    expect(within(screen.getByTestId('pipeline-column-s2')).getByText('2')).toBeTruthy();
    expect(within(screen.getByTestId('pipeline-column-s3')).getByText('0')).toBeTruthy();
  });

  it('cards show name, email, initials avatar, score badge and time-in-stage', async () => {
    await renderPipeline();
    expect(screen.getByText('ashishranjan@x.com')).toBeTruthy();
    expect(screen.getByText('AR')).toBeTruthy(); // two-word initials
    expect(screen.getByText('PR')).toBeTruthy(); // single-word initials
    expect(screen.getByText('92 · strong')).toBeTruthy();
    expect(screen.getByText('45 · partial')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy(); // unscored badge
    expect(screen.getAllByText('3d').length).toBeGreaterThan(0); // time in CURRENT stage
  });

  it('empty columns show a centered "Drop here" zone', async () => {
    await renderPipeline();
    expect(within(screen.getByTestId('pipeline-column-s3')).getByText('Drop here')).toBeTruthy();
  });

  it('clicking a card (no drag) navigates to the applicant detail', async () => {
    await renderPipeline();
    fireEvent.click(screen.getByText('Ashish Ranjan'));
    expect(routerPush).toHaveBeenCalledWith('/employer/jobs/p1/applicants/a1?from=pipeline');
  });

  it('the column grid spans full width with equal columns, no max-width', async () => {
    await renderPipeline();
    const grid = screen.getByTestId('pipeline-grid');
    expect(grid.style.display).toBe('grid');
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(grid.style.maxWidth).toBe('');
  });
});
