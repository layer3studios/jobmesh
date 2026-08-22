import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChangeRoleModal from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/parts/ChangeRoleModal';
import type { TeamMember } from '@/types/employer-team';

vi.mock('@/api/employer-team-api', async (importActual) => {
  const actual = await importActual<typeof import('@/api/employer-team-api')>();
  return { ...actual, patchMember: vi.fn() };
});

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'm1', employerUserId: 'u1', name: 'Ada', email: 'ada@x.io', picture: null,
    role: 'member', isFounder: false, canMoveApplicants: false, canArchiveApplicants: false,
    invitedByEmployerUserId: null, joinedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

describe('ChangeRoleModal', () => {
  it('hides interviewer perms unless the role is interviewer', () => {
    render(<ChangeRoleModal member={member()} isSelf={false} onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />);
    expect(screen.queryByText('Can archive applicants')).toBeNull();
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'interviewer' } });
    expect(screen.getByText('Can archive applicants')).toBeTruthy();
  });

  it('shows the interviewer perms immediately for an interviewer member', () => {
    render(<ChangeRoleModal member={member({ role: 'interviewer', canMoveApplicants: true })} isSelf={false} onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByText('Can move applicants between stages')).toBeTruthy();
  });

  it('disables submit for a self target', () => {
    render(<ChangeRoleModal member={member()} isSelf onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />);
    expect((screen.getByText('Save changes').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});
