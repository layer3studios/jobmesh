'use client';
// FILE: settings/team/TeamSettingsClient.tsx
// Client subtree for the team-settings page (content area only — the settings
// layout renders the sidebar). Header + role tiles + the unified members/invites
// table. Owns the optimistic member/invite lists and which modal is open; every
// mutation goes through employer-team-api and toasts its outcome. On a mutation
// error we router.refresh() to re-sync from the server.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useEmployer } from '@/context/employer/EmployerContext';
import { resendInvite, revokeInvite, EmployerTeamApiError, type MemberPatchResult } from '@/api/employer-team-api';
import { canInvite } from '@/lib/team-permissions';
import type { TeamMember, CompanyInvite, TeamPageData } from '@/types/employer-team';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import RoleTiles from './parts/RoleTiles';
import TeamUnifiedTable from './parts/TeamUnifiedTable';
import InviteTeammateModal from './parts/InviteTeammateModal';
import ChangeRoleModal from './parts/ChangeRoleModal';
import RemoveMemberModal from './parts/RemoveMemberModal';
import TransferFounderModal from './parts/TransferFounderModal';
import ConfirmDialog from './parts/ConfirmDialog';

type ActiveModal =
  | { kind: 'invite' }
  | { kind: 'changeRole'; member: TeamMember }
  | { kind: 'remove'; member: TeamMember }
  | { kind: 'transfer' }
  | { kind: 'revoke'; invite: CompanyInvite }
  | null;

export default function TeamSettingsClient({ members: initialMembers, invites: initialInvites, currentMember }: TeamPageData) {
  const router = useRouter();
  const { showToast } = useToast();
  const { logout } = useEmployer();
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [modal, setModal] = useState<ActiveModal>(null);

  const currentRole = currentMember?.role ?? 'interviewer';
  const currentUserId = currentMember?.employerUserId ?? '';
  const canManage = canInvite(currentRole);
  const owners = useMemo(() => members.filter((m) => m.role === 'owner' && !m.isFounder), [members]);

  const close = () => setModal(null);
  const fail = (message: string) => { showToast('error', message); router.refresh(); };

  function applyPatch(patched: MemberPatchResult) {
    setMembers((prev) => prev.map((m) => (m.id === patched.id
      ? { ...m, role: patched.role, isFounder: patched.isFounder, canMoveApplicants: patched.canMoveApplicants, canArchiveApplicants: patched.canArchiveApplicants }
      : m)));
    showToast('success', 'Role updated.');
  }

  async function handleRemoved(memberId: string, isSelf: boolean) {
    if (isSelf) { await logout(); router.replace('/employer/login'); return; } // D_impl_ui_5
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    showToast('success', 'Member removed.');
    close();
  }

  async function handleResend(invite: CompanyInvite) {
    try {
      const { invite: fresh, inviteUrl } = await resendInvite(invite.id);
      setInvites((prev) => prev.map((i) => (i.id === invite.id ? { ...fresh, inviteUrl } : i)));
      showToast('success', 'Invite resent — a new link was generated.');
    } catch (error) {
      fail(error instanceof EmployerTeamApiError ? error.message : 'Something went wrong. Please try again.');
    }
  }

  async function handleRevoke(invite: CompanyInvite) {
    try {
      await revokeInvite(invite.id);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      showToast('success', 'Invite revoked.');
      close();
    } catch (error) {
      close();
      fail(error instanceof EmployerTeamApiError ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* "Settings" has no landing page yet, so it renders as plain text. */}
      <Breadcrumbs items={[{ label: 'Settings' }, { label: 'Team' }]} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>Team</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>
            Manage who has access to your company and what they can do.
          </p>
        </div>
        {canManage && (
          <Button iconLeft={<UserPlus size={15} />} onClick={() => setModal({ kind: 'invite' })} style={{ fontSize: 13 }}>
            Invite
          </Button>
        )}
      </div>

      <RoleTiles />

      <TeamUnifiedTable
        members={members}
        invites={invites}
        currentRole={currentRole}
        currentEmployerUserId={currentUserId}
        canManage={canManage}
        onChangeRole={(member) => setModal({ kind: 'changeRole', member })}
        onRemove={(member) => setModal({ kind: 'remove', member })}
        onTransfer={() => setModal({ kind: 'transfer' })}
        onResend={handleResend}
        onRevoke={(invite) => setModal({ kind: 'revoke', invite })}
      />

      {modal?.kind === 'invite' && (
        <InviteTeammateModal
          onClose={close}
          onCreated={(invite) => setInvites((prev) => [invite, ...prev])}
          onCopied={() => showToast('success', 'Link copied.')}
        />
      )}
      {modal?.kind === 'changeRole' && (
        <ChangeRoleModal
          member={modal.member}
          isSelf={modal.member.employerUserId === currentUserId}
          onClose={close}
          onSuccess={applyPatch}
          onError={fail}
        />
      )}
      {modal?.kind === 'remove' && (
        <RemoveMemberModal
          member={modal.member}
          isSelf={modal.member.employerUserId === currentUserId}
          onClose={close}
          onRemoved={handleRemoved}
          onError={(message) => { close(); fail(message); }}
        />
      )}
      {modal?.kind === 'transfer' && (
        <TransferFounderModal
          owners={owners}
          onClose={close}
          onSuccess={() => { close(); showToast('success', 'Founder transferred.'); router.refresh(); }}
          onError={(message) => { close(); fail(message); }}
        />
      )}
      {modal?.kind === 'revoke' && (
        <ConfirmDialog
          title="Revoke invite"
          message={`Revoke the invite for ${modal.invite.email}? The current link will stop working.`}
          confirmLabel="Revoke"
          onConfirm={() => handleRevoke(modal.invite)}
          onClose={close}
        />
      )}
    </div>
  );
}
