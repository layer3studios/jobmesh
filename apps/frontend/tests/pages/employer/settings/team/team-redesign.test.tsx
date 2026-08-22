// FILE: tests/pages/employer/settings/team/team-redesign.test.tsx
// Redesigned team page: role tiles, unified members+invites table (accepted
// first), pending-row affordances, self row, search, and the invite button.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import TeamSettingsClient from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/TeamSettingsClient';
import RoleTiles, { ROLE_DOT_COLOR } from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/parts/RoleTiles';
import type { TeamMember, CompanyInvite } from '@/types/employer-team';

// useSearchParams: the page's Breadcrumbs reads ?from= to root the trail.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => ({ logout: vi.fn() }) }));
vi.mock('@/api/employer-team-api', () => ({
  resendInvite: vi.fn(), revokeInvite: vi.fn(),
  EmployerTeamApiError: class extends Error {},
}));
vi.mock('@/components/employer/jobs/useIsNarrowViewport', () => ({ useIsNarrowViewport: () => false }));
vi.mock('@/app/(employer)/employer/(app)/(onboarded)/settings/team/parts/InviteTeammateModal', () => ({
  default: () => <div data-testid="invite-modal" />,
}));

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'm1', employerUserId: 'u1', name: 'Ada Lovelace', email: 'ada@x.io', picture: null,
    role: 'member', isFounder: false, canMoveApplicants: false, canArchiveApplicants: false,
    invitedByEmployerUserId: null, joinedAt: '2026-07-03T00:00:00.000Z', ...overrides,
  };
}
function invite(overrides: Partial<CompanyInvite> = {}): CompanyInvite {
  return {
    id: 'i1', email: 'zoe@x.io', role: 'interviewer', canMoveApplicants: false,
    canArchiveApplicants: false, invitedByEmployerUserId: 'uf',
    createdAt: '2026-07-30T00:00:00.000Z', expiresAt: '2026-08-06T00:00:00.000Z', ...overrides,
  };
}

const founder = member({ id: 'mf', employerUserId: 'uf', name: 'Grace', email: 'grace@x.io', role: 'founder', isFounder: true });

function renderPage(members: TeamMember[], invites: CompanyInvite[], currentMember: TeamMember | null = founder) {
  return render(<TeamSettingsClient members={members} invites={invites} currentMember={currentMember} />);
}

describe('RoleTiles', () => {
  it('renders all four tiles with the correct dot color and description', () => {
    render(<RoleTiles />);
    const expected = [
      ['founder', 'Founder', 'Full access. Billing, team, danger zone.'],
      ['owner', 'Owner', 'Team, postings, candidates, settings.'],
      ['member', 'Member', 'Postings, candidates, scheduling.'],
      ['interviewer', 'Interviewer', 'View candidates. No scheduling.'],
    ] as const;
    for (const [role, name, description] of expected) {
      const tile = screen.getByTestId(`role-tile-${role}`);
      expect(within(tile).getByText(name)).toBeTruthy();
      expect(within(tile).getByText(description)).toBeTruthy();
      const dot = within(tile).getByTestId('role-dot') as HTMLElement;
      expect(dot.style.background).toContain(ROLE_DOT_COLOR[role]);
    }
  });
});

describe('Team unified table', () => {
  it('shows accepted members before pending invites', () => {
    renderPage([founder, member()], [invite({ email: 'aaa@x.io' })]);
    const pending = screen.getByText('aaa@x.io');
    for (const name of ['Ada Lovelace', 'Grace']) {
      const memberEl = screen.getByText(name);
      // DOCUMENT_POSITION_FOLLOWING (4): pending row comes after the member row.
      expect(memberEl.compareDocumentPosition(pending) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(4);
    }
  });

  it('shows the pending badge and resend/revoke buttons on invite rows', () => {
    renderPage([founder], [invite()]);
    expect(screen.getByText('pending')).toBeTruthy();
    expect(screen.getByLabelText('Resend invite to zoe@x.io')).toBeTruthy();
    expect(screen.getByLabelText('Revoke invite for zoe@x.io')).toBeTruthy();
  });

  it("shows '(you)' on the current user's row and no action buttons for them", () => {
    renderPage([founder], []);
    expect(screen.getByText('(you)')).toBeTruthy();
    expect(screen.queryByLabelText('Leave company')).toBeNull();
    expect(screen.queryByLabelText('Remove Grace')).toBeNull();
    expect(screen.queryByLabelText('Change role for Grace')).toBeNull();
  });

  it('filters the member list by name or email via the search input', () => {
    renderPage([founder, member()], [invite()]);
    const search = screen.getByLabelText('Search members');
    fireEvent.change(search, { target: { value: 'ada' } });
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.queryByText('Grace')).toBeNull();
    expect(screen.queryByText('zoe@x.io')).toBeNull();
    fireEvent.change(search, { target: { value: 'grace@x.io' } });
    expect(screen.getByText('Grace')).toBeTruthy();
    expect(screen.queryByText('Ada Lovelace')).toBeNull();
  });

  it('shows the empty state when the roster is just you', () => {
    renderPage([founder], []);
    expect(screen.getByText('Invite your first teammate to start collaborating.')).toBeTruthy();
  });

  it('opens the InviteTeammateModal from the header Invite button', () => {
    renderPage([founder], []);
    expect(screen.queryByTestId('invite-modal')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Invite/ }));
    expect(screen.getByTestId('invite-modal')).toBeTruthy();
  });
});
