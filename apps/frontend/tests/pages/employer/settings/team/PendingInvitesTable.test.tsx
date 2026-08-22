import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import PendingInvitesTable from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/parts/PendingInvitesTable';
import type { CompanyInvite, TeamMember } from '@/types/employer-team';

const FUTURE = new Date(Date.now() + 5 * 864e5).toISOString();
const PAST = new Date(Date.now() - 864e5).toISOString();

function invite(overrides: Partial<CompanyInvite> = {}): CompanyInvite {
  return {
    id: 'i1', email: 'new@x.io', role: 'member', canMoveApplicants: false, canArchiveApplicants: false,
    invitedByEmployerUserId: null, expiresAt: FUTURE, createdAt: FUTURE, ...overrides,
  };
}

function renderTable(invites: CompanyInvite[], canManage = true) {
  return render(
    <PendingInvitesTable
      invites={invites}
      canManage={canManage}
      membersById={new Map<string, TeamMember>()}
      onCopy={vi.fn()}
      onResend={vi.fn()}
      onRevoke={vi.fn()}
    />,
  );
}

describe('PendingInvitesTable', () => {
  it('renders Copy link only when an invite URL is held client-side', () => {
    renderTable([invite({ inviteUrl: 'https://x/tok' })]);
    expect(screen.getByText('Copy link')).toBeTruthy();
    cleanup();
    renderTable([invite()]);
    expect(screen.queryByText('Copy link')).toBeNull();
  });

  it('hides Resend and shows only Revoke for expired invites', () => {
    renderTable([invite({ id: 'ix', expiresAt: PAST, inviteUrl: 'https://x/tok' })]);
    const row = screen.getByText('new@x.io').closest('tr') as HTMLElement;
    expect(within(row).getByText('Expired')).toBeTruthy();
    expect(within(row).queryByText('Resend')).toBeNull();
    expect(within(row).queryByText('Copy link')).toBeNull();
    expect(within(row).getByText('Revoke')).toBeTruthy();
  });

  it('hides all actions when the viewer cannot manage', () => {
    renderTable([invite({ inviteUrl: 'https://x/tok' })], false);
    expect(screen.queryByText('Revoke')).toBeNull();
    expect(screen.queryByText('Resend')).toBeNull();
  });

  it('renders the empty state when there are no invites', () => {
    renderTable([]);
    expect(screen.getByText('No pending invites')).toBeTruthy();
  });
});
