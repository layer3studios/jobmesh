import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import TeamMembersTable from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/parts/TeamMembersTable';
import type { TeamMember, Role } from '@/types/employer-team';

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'm1', employerUserId: 'u1', name: 'Ada Lovelace', email: 'ada@x.io', picture: null,
    role: 'member', isFounder: false, canMoveApplicants: false, canArchiveApplicants: false,
    invitedByEmployerUserId: null, joinedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

const founder = member({ id: 'mf', employerUserId: 'uf', name: 'Grace', email: 'grace@x.io', role: 'founder', isFounder: true });
const owner = member({ id: 'mo', employerUserId: 'uo', name: 'Owen', email: 'owen@x.io', role: 'owner' });

function renderTable(members: TeamMember[], currentRole: Role, currentUserId: string) {
  return render(
    <TeamMembersTable
      members={members}
      currentRole={currentRole}
      currentEmployerUserId={currentUserId}
      onChangeRole={vi.fn()}
      onRemove={vi.fn()}
      onTransfer={vi.fn()}
    />,
  );
}

describe('TeamMembersTable', () => {
  it('renders the Founder row with a pill and no actions', () => {
    renderTable([founder], 'founder', 'uf');
    const row = screen.getByText('Grace').closest('tr') as HTMLElement;
    expect(within(row).getByText('Founder')).toBeTruthy();
    expect(within(row).queryByText('Change role')).toBeNull();
    expect(within(row).queryByText(/Remove|Leave/)).toBeNull();
  });

  it('shows "(you)" for the self row', () => {
    renderTable([owner], 'owner', 'uo');
    expect(screen.getByText('(you)')).toBeTruthy();
  });

  it('hides Change Role on Founder rows even for a Founder viewer', () => {
    renderTable([founder, owner], 'founder', 'uf');
    const founderRow = screen.getByText('Grace').closest('tr') as HTMLElement;
    expect(within(founderRow).queryByText('Change role')).toBeNull();
  });

  it('shows Change Role only for Founder/Owner viewers on non-Founder targets', () => {
    renderTable([member()], 'owner', 'uo');
    expect(screen.getByText('Change role')).toBeTruthy();
    cleanup();
    renderTable([member()], 'interviewer', 'ux');
    expect(screen.queryByText('Change role')).toBeNull();
  });

  it('shows Transfer Founder only when viewer is Founder AND target is Owner', () => {
    renderTable([owner], 'founder', 'uf');
    expect(screen.getByText('Transfer Founder to…')).toBeTruthy();
    cleanup();
    renderTable([member()], 'founder', 'uf');
    expect(screen.queryByText('Transfer Founder to…')).toBeNull();
    cleanup();
    renderTable([owner], 'owner', 'uo');
    expect(screen.queryByText('Transfer Founder to…')).toBeNull();
  });

  it('renders the interviewer sub-label for both/one/no flags', () => {
    renderTable([member({ role: 'interviewer', canMoveApplicants: true, canArchiveApplicants: true })], 'owner', 'uo');
    expect(screen.getByText('Can move · Can archive')).toBeTruthy();
    renderTable([member({ role: 'interviewer', canMoveApplicants: true })], 'owner', 'uo');
    expect(screen.getByText('Can move')).toBeTruthy();
    renderTable([member({ role: 'interviewer' })], 'owner', 'uo');
    expect(screen.getByText('View + notes only')).toBeTruthy();
  });

  it('renders the empty state when there are no members', () => {
    renderTable([], 'owner', 'uo');
    expect(screen.getByText('No teammates yet')).toBeTruthy();
  });
});
