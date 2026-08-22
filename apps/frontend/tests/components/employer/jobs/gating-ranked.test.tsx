import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ToastProvider } from '@/components/ui';
import RankedTab from '@/components/employer/jobs/RankedTab';

let viewer: { viewerRole: string | null; viewerCanArchiveApplicants: boolean };
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => viewer }));

vi.mock('@/api/employer-applicants-api', async (importActual) => {
  const actual = await importActual<typeof import('@/api/employer-applicants-api')>();
  return {
    ...actual,
    // No `stats` key — a plain posting, which is what this gating suite is about.
    listApplicantsWithStats: vi.fn(async () => ({
      applicants: [{
        application: { id: 'a1', stageId: 's1', appliedAt: new Date().toISOString(), archived: false },
        contact: { fullName: 'Ada', email: 'ada@x.io' }, score: null,
      }],
    })),
    listStages: vi.fn(async () => ([{ id: 's1', text: 'Applied' }])),
    listArchiveReasons: vi.fn(async () => ([])),
    bulkArchiveApplicants: vi.fn(),
  };
});

const SELECT_ALL = 'Select all applicants on this page';

function renderRanked() {
  return render(<ToastProvider><RankedTab postingId="p1" /></ToastProvider>);
}

describe('RankedTab bulk-archive gating', () => {
  beforeEach(() => cleanup());

  it('hides selection + bulk archive for an Interviewer without canArchiveApplicants', async () => {
    viewer = { viewerRole: 'interviewer', viewerCanArchiveApplicants: false };
    renderRanked();
    await screen.findByLabelText('Sort applicants'); // load complete
    expect(screen.queryByLabelText(SELECT_ALL)).toBeNull();
    expect(screen.queryByLabelText('Select Ada')).toBeNull();
  });

  it('shows selection for a Member', async () => {
    viewer = { viewerRole: 'member', viewerCanArchiveApplicants: true };
    renderRanked();
    await screen.findByLabelText('Sort applicants'); // load complete
    expect(screen.getByLabelText(SELECT_ALL)).toBeTruthy();
  });
});
