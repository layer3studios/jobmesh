'use client';
// FILE: src/app/(admin)/admin/(app)/team/TeamManagementClient.tsx
// Team roster + mutations. super_admin sees the Actions column + Invite button;
// plain admins get a read-only roster (D1). No optimistic updates (D4): every
// mutation waits for the API row and replaces it in local state. The invite modal
// stays open after success so the copy-link URL is never lost (D3).
import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAdmin } from '@/context/admin/AdminContext';
import {
  deactivateAdmin, reactivateAdmin, updateAdminRole,
  resendAdminInvite, revokeAdminInvite, AdminTeamApiError,
} from '@/api/admin-team-api';
import type { TeamAdmin, AdminInvite, AdminRole } from '@/api/admin-team-api';
import TeamAdminsTable from './parts/TeamAdminsTable';
import InviteAdminModal from './parts/InviteAdminModal';

const ACTION_MESSAGES: Record<string, string> = {
  CANNOT_DEACTIVATE_SELF: 'You cannot deactivate yourself.',
  CANNOT_REMOVE_LAST_SUPER_ADMIN: 'You cannot deactivate the last super admin.',
  CANNOT_DEMOTE_SELF: 'You cannot change your own role.',
  CANNOT_DEMOTE_LAST_SUPER_ADMIN: 'You cannot demote the last super admin.',
  NOT_SUPER_ADMIN: 'You need super admin permission.',
  NOT_FOUND: 'That admin no longer exists — reload the page.',
  CANNOT_RESEND_ACTIVE_ADMIN: 'This admin is already active.',
  CANNOT_RESEND_ACTIVATED_ADMIN: 'Cannot resend — this admin was previously active.',
  CANNOT_REVOKE_ACTIVE_ADMIN: 'This admin is active. Deactivate first.',
  CANNOT_REVOKE_ACTIVATED_ADMIN: 'This admin was previously active. Deactivate instead.',
};

function messageForActionError(error: unknown): string {
  if (error instanceof AdminTeamApiError && error.code && ACTION_MESSAGES[error.code]) {
    return ACTION_MESSAGES[error.code];
  }
  return 'Something went wrong. Try again.';
}

export default function TeamManagementClient({ initialAdmins }: { initialAdmins: TeamAdmin[] }) {
  const { admin: currentAdmin } = useAdmin();
  const [admins, setAdmins] = useState<TeamAdmin[]>(initialAdmins);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [pendingRowAction, setPendingRowAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ adminUserId: string; message: string } | null>(null);
  const [lastInviteResult, setLastInviteResult] = useState<AdminInvite | null>(null);

  const isSuper = currentAdmin?.role === 'super_admin';

  async function runRowAction(adminUserId: string, action: () => Promise<TeamAdmin>) {
    setPendingRowAction(adminUserId);
    setActionError(null);
    try {
      const updated = await action();
      setAdmins((prev) => prev.map((row) => (row.adminUserId === updated.adminUserId ? updated : row)));
    } catch (error) {
      setActionError({ adminUserId, message: messageForActionError(error) });
    } finally {
      setPendingRowAction(null);
    }
  }

  // Resend: same URL-display UX as the initial invite — set lastInviteResult and
  // open the modal, which renders straight into its copy-link view (one code path,
  // D2 of this chunk). Row state needs no change: only inviteExpiresAt moved, and
  // TeamAdmin doesn't carry it.
  async function handleResendInvite(adminUserId: string) {
    setPendingRowAction(adminUserId);
    setActionError(null);
    try {
      const invite = await resendAdminInvite(adminUserId);
      setLastInviteResult(invite);
      setInviteModalOpen(true);
    } catch (error) {
      setActionError({ adminUserId, message: messageForActionError(error) });
    } finally {
      setPendingRowAction(null);
    }
  }

  // Revoke: native confirm (D1), then hard-delete → the row simply disappears.
  async function handleRevokeInvite(adminUserId: string, email: string) {
    if (!window.confirm(`Revoke invite for ${email}? This cannot be undone.`)) return;
    setPendingRowAction(adminUserId);
    setActionError(null);
    try {
      await revokeAdminInvite(adminUserId);
      setAdmins((prev) => prev.filter((row) => row.adminUserId !== adminUserId));
    } catch (error) {
      setActionError({ adminUserId, message: messageForActionError(error) });
    } finally {
      setPendingRowAction(null);
    }
  }

  // Invite success: prepend a pending row so the roster reflects it immediately,
  // and keep the result so the modal shows the copy-link URL (D3).
  function handleInvited(invite: AdminInvite) {
    setLastInviteResult(invite);
    setAdmins((prev) => [{
      adminUserId: invite.adminUserId,
      email: invite.email,
      role: invite.role,
      isActive: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      activatedAt: null,
      invitedByAdminUserId: currentAdmin?.adminUserId ?? null,
      invitedByEmail: currentAdmin?.email ?? null,
      notes: null,
    }, ...prev.filter((row) => row.adminUserId !== invite.adminUserId)]);
  }

  return (
    <div className="mx-auto w-full max-w-[1536px]" style={{ padding: '24px clamp(16px, 3vw, 32px) 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Team</h1>
          {!isSuper && (
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', margin: '4px 0 0' }}>
              Only super admins can manage the team.
            </p>
          )}
        </div>
        {isSuper && <Button onClick={() => setInviteModalOpen(true)}>Invite admin</Button>}
      </div>

      <TeamAdminsTable
        admins={admins}
        currentAdminId={currentAdmin?.adminUserId ?? null}
        showActions={isSuper}
        pendingRowAction={pendingRowAction}
        actionError={actionError}
        onDeactivate={(id) => void runRowAction(id, () => deactivateAdmin(id))}
        onReactivate={(id) => void runRowAction(id, () => reactivateAdmin(id))}
        onChangeRole={(id, role: AdminRole) => void runRowAction(id, () => updateAdminRole(id, role))}
        onResendInvite={(id) => void handleResendInvite(id)}
        onRevokeInvite={(id, email) => void handleRevokeInvite(id, email)}
      />

      {inviteModalOpen && (
        <InviteAdminModal
          onClose={() => { setInviteModalOpen(false); setLastInviteResult(null); }}
          onInvited={handleInvited}
          lastResult={lastInviteResult}
        />
      )}
    </div>
  );
}
