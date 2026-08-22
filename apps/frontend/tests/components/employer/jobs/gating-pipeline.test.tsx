import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import PipelineCard from '@/components/employer/jobs/PipelineCard';
import { canMoveApplicant } from '@/lib/team-permissions';
import type { Applicant } from '@/types/employer-applicants';

const NO_MOVE_TOOLTIP = "You don't have permission to move applicants. Ask an admin.";

const applicant = {
  application: { id: 'a1', stageId: 's1', appliedAt: new Date().toISOString(), archived: false },
  contact: { fullName: 'Ada Lovelace', email: 'ada@x.io' },
  score: null,
} as unknown as Applicant;

function renderCard(canMove: boolean) {
  return render(<DndContext><PipelineCard applicant={applicant} canMove={canMove} /></DndContext>);
}

describe('PipelineCard drag gating', () => {
  it('is disabled (tooltip shown) for an Interviewer without canMoveApplicants', () => {
    renderCard(canMoveApplicant('interviewer', false));
    expect(screen.getByTitle(NO_MOVE_TOOLTIP)).toBeTruthy();
  });

  it('is enabled for an Interviewer WITH canMoveApplicants', () => {
    renderCard(canMoveApplicant('interviewer', true));
    expect(screen.queryByTitle(NO_MOVE_TOOLTIP)).toBeNull();
  });

  it('is enabled for Member/Owner/Founder regardless of the flag', () => {
    (['member', 'owner', 'founder'] as const).forEach((role) => {
      const { unmount } = renderCard(canMoveApplicant(role, false));
      expect(screen.queryByTitle(NO_MOVE_TOOLTIP)).toBeNull();
      unmount();
    });
  });
});
