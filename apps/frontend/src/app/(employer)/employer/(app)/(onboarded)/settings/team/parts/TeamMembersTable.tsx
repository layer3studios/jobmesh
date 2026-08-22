'use client';
// FILE: settings/team/parts/TeamMembersTable.tsx
// Roster table. Action visibility is computed from the viewer's role + the target
// row (team-permissions). The Founder row shows a "Founder" pill and never exposes
// edit/remove. Interviewer permission flags render as an inline sub-label (D_impl_ui_10).
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/feedback';
import { roleLabel, roleBadgeVariant } from '@/lib/role-labels';
import { canChangeRole, canRemove, canTransferFounder } from '@/lib/team-permissions';
import type { TeamMember, Role } from '@/types/employer-team';

interface Props {
  members: TeamMember[];
  currentRole: Role;
  currentEmployerUserId: string;
  onChangeRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onTransfer: (member: TeamMember) => void;
}

function interviewerPermsLabel(member: TeamMember): string | null {
  if (member.role !== 'interviewer') return null;
  if (member.canMoveApplicants && member.canArchiveApplicants) return 'Can move · Can archive';
  if (member.canMoveApplicants) return 'Can move';
  if (member.canArchiveApplicants) return 'Can archive';
  return 'View + notes only';
}

const cell: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.875rem', color: 'var(--ink)' };
const headCell: React.CSSProperties = { ...cell, fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };

export default function TeamMembersTable({
  members, currentRole, currentEmployerUserId, onChangeRole, onRemove, onTransfer,
}: Props) {
  if (members.length === 0) {
    return <EmptyState heading="No teammates yet" description="Invite one to get started." />;
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr>
            <th scope="col" style={headCell}>Member</th>
            <th scope="col" style={headCell}>Role</th>
            <th scope="col" style={headCell}>Joined</th>
            <th scope="col" style={{ ...headCell, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, i) => {
            const isSelf = member.employerUserId === currentEmployerUserId;
            const perms = interviewerPermsLabel(member);
            const showChangeRole = canChangeRole(currentRole, member.role, isSelf);
            const showRemove = canRemove(currentRole, member.role, isSelf);
            const showTransfer = canTransferFounder(currentRole, member.role);
            const border = i === members.length - 1 ? 'none' : '1px solid var(--border)';
            return (
              <tr key={member.id}>
                <td style={{ ...cell, borderBottom: border }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar src={member.picture ?? undefined} name={member.name ?? member.email ?? '?'} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>{member.name ?? member.email ?? 'Unknown'}</span>
                        {isSelf && <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(you)</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{member.email}</div>
                      {perms && <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: 2 }}>{perms}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ ...cell, borderBottom: border }}>
                  {member.isFounder
                    ? <Badge variant="brand">Founder</Badge>
                    : <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>}
                </td>
                <td style={{ ...cell, borderBottom: border, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                  {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                </td>
                <td style={{ ...cell, borderBottom: border }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {showTransfer && <Button variant="ghost" size="sm" onClick={() => onTransfer(member)}>Transfer Founder to…</Button>}
                    {showChangeRole && <Button variant="secondary" size="sm" onClick={() => onChangeRole(member)}>Change role</Button>}
                    {showRemove && <Button variant="danger" size="sm" onClick={() => onRemove(member)}>{isSelf ? 'Leave' : 'Remove'}</Button>}
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
