'use client';
// FILE: settings/team/parts/PendingInvitesTable.tsx
// Pending invites. "Copy link" only shows when the invite URL is held client-side
// (create/resend echoed it; the GET never re-exposes a token — D_impl_ui_4). Expired
// invites hide Resend and offer only Revoke. Actions render only for Founder/Owner.
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/feedback';
import { roleLabel, roleBadgeVariant } from '@/lib/role-labels';
import { formatRelativeExpiry, isExpired } from '@/lib/relative-time';
import type { CompanyInvite, TeamMember } from '@/types/employer-team';

interface Props {
  invites: CompanyInvite[];
  canManage: boolean;
  membersById: Map<string, TeamMember>;
  onCopy: (url: string) => void;
  onResend: (invite: CompanyInvite) => void;
  onRevoke: (invite: CompanyInvite) => void;
}

const cell: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.875rem', color: 'var(--ink)' };
const headCell: React.CSSProperties = { ...cell, fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };

function invitedByLabel(invite: CompanyInvite, membersById: Map<string, TeamMember>): string {
  if (!invite.invitedByEmployerUserId) return '—';
  const inviter = membersById.get(invite.invitedByEmployerUserId);
  return inviter?.name ?? inviter?.email ?? '—';
}

export default function PendingInvitesTable({ invites, canManage, membersById, onCopy, onResend, onRevoke }: Props) {
  if (invites.length === 0) {
    return <EmptyState heading="No pending invites" description="Invites you send will appear here until they’re accepted." />;
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr>
            <th scope="col" style={headCell}>Email</th>
            <th scope="col" style={headCell}>Role</th>
            <th scope="col" style={headCell}>Invited by</th>
            <th scope="col" style={headCell}>Expires</th>
            <th scope="col" style={{ ...headCell, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite, i) => {
            const expired = isExpired(invite.expiresAt);
            const border = i === invites.length - 1 ? 'none' : '1px solid var(--border)';
            return (
              <tr key={invite.id}>
                <td style={{ ...cell, borderBottom: border }}>{invite.email}</td>
                <td style={{ ...cell, borderBottom: border }}>
                  <Badge variant={roleBadgeVariant(invite.role)}>{roleLabel(invite.role)}</Badge>
                </td>
                <td style={{ ...cell, borderBottom: border, color: 'var(--ink-muted)' }}>{invitedByLabel(invite, membersById)}</td>
                <td style={{ ...cell, borderBottom: border }}>
                  {expired
                    ? <Badge variant="danger">Expired</Badge>
                    : <span style={{ color: 'var(--ink-muted)' }}>{formatRelativeExpiry(invite.expiresAt)}</span>}
                </td>
                <td style={{ ...cell, borderBottom: border }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {canManage && invite.inviteUrl && !expired && (
                      <Button variant="ghost" size="sm" onClick={() => onCopy(invite.inviteUrl as string)}>Copy link</Button>
                    )}
                    {canManage && !expired && (
                      <Button variant="secondary" size="sm" onClick={() => onResend(invite)}>Resend</Button>
                    )}
                    {canManage && (
                      <Button variant="danger" size="sm" onClick={() => onRevoke(invite)}>Revoke</Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
