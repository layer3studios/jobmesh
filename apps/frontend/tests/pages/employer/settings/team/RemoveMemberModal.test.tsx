import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RemoveMemberModal from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/parts/RemoveMemberModal';
import type { TeamMember } from '@/types/employer-team';

vi.mock('@/api/employer-team-api', async (importActual) => {
  const actual = await importActual<typeof import('@/api/employer-team-api')>();
  return { ...actual, removeMember: vi.fn() };
});

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'm1', employerUserId: 'u1', name: 'Ada', email: 'ada@x.io', picture: null,
    role: 'member', isFounder: false, canMoveApplicants: false, canArchiveApplicants: false,
    invitedByEmployerUserId: null, joinedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

const confirmButton = () => screen.getByText('Remove').closest('button') as HTMLButtonElement;

describe('RemoveMemberModal', () => {
  it('keeps the confirm button disabled until the email matches', () => {
    render(<RemoveMemberModal member={member()} isSelf={false} onClose={vi.fn()} onRemoved={vi.fn()} onError={vi.fn()} />);
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Type ada@x.io/), { target: { value: 'ada@x.io' } });
    expect(confirmButton().disabled).toBe(false);
  });

  it('self-leave requires typing LEAVE', () => {
    render(<RemoveMemberModal member={member()} isSelf onClose={vi.fn()} onRemoved={vi.fn()} onError={vi.fn()} />);
    const leaveButton = screen.getByText('Leave').closest('button') as HTMLButtonElement;
    expect(leaveButton.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Type LEAVE to confirm'), { target: { value: 'LEAVE' } });
    expect(leaveButton.disabled).toBe(false);
  });
});
