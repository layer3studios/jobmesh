import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ApplicantReviewPanel from '@/components/employer/jobs/ApplicantReviewPanel';
import type { Stage } from '@/types/employer-applicants';

let viewer: { viewerRole: string | null; viewerCanMoveApplicants: boolean; viewerCanArchiveApplicants: boolean };
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => viewer }));

const stages: Stage[] = [
  { id: 's1', text: 'Applied' } as Stage,
  { id: 's2', text: 'Screen' } as Stage,
];

function renderPanel() {
  return render(
    <ApplicantReviewPanel
      score={null}
      applicationId="a1"
      currentStageId="s1"
      archived={false}
      stages={stages}
      reasons={[]}
      stageChanges={[]}
      onDone={() => {}}
    />,
  );
}

describe('ApplicantReviewPanel role gating', () => {
  it('Interviewer without perms: rescore + archive hidden, move select disabled', () => {
    viewer = { viewerRole: 'interviewer', viewerCanMoveApplicants: false, viewerCanArchiveApplicants: false };
    renderPanel();
    expect(screen.queryByText('Rescore')).toBeNull();
    expect(screen.queryByText('Archive')).toBeNull();
    expect((screen.getByLabelText('Move to') as HTMLSelectElement).disabled).toBe(true);
  });

  it('Member: rescore + archive shown, move select enabled', () => {
    cleanup();
    viewer = { viewerRole: 'member', viewerCanMoveApplicants: true, viewerCanArchiveApplicants: true };
    renderPanel();
    expect(screen.getByText('Rescore')).toBeTruthy();
    expect(screen.getByText('Archive')).toBeTruthy();
    expect((screen.getByLabelText('Move to') as HTMLSelectElement).disabled).toBe(false);
  });
});
