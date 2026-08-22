'use client';
// FILE: settings/team/parts/TeamMemberRow.tsx
// One accepted-member row: role-tinted initials avatar, "(you)" tag, role
// badge (chevron opens the existing ChangeRoleModal when permitted), short
// joined date, and permission-gated actions (transfer / remove / leave).

import { ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getInitials } from '@/components/employer/jobs/score-badge-helpers';
import { canChangeRole, canRemove, canTransferFounder } from '@/lib/team-permissions';
import { roleLabel } from '@/lib/role-labels';
import type { TeamMember, Role } from '@/types/employer-team';
import { ROLE_DOT_COLOR } from './RoleTiles';

const AVATAR_STYLE: Record<string, { bg: string; fg: string }> = {
  founder: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  owner: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  member: { bg: 'var(--status-accent-bg)', fg: 'var(--cat-green)' },
  interviewer: { bg: 'var(--status-warning-bg)', fg: 'var(--cat-amber)' },
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? `${date.getDate()} ${MONTHS[date.getMonth()]}` : '—';
};

export default function TeamMemberRow({
  member, currentRole, isSelf, narrow, onChangeRole, onRemove, onTransfer,
}: {
  member: TeamMember;
  currentRole: Role;
  isSelf: boolean;
  narrow: boolean;
  onChangeRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onTransfer: (member: TeamMember) => void;
}) {
  const avatar = AVATAR_STYLE[member.role] ?? AVATAR_STYLE.member;
  const showChangeRole = canChangeRole(currentRole, member.isFounder ? 'founder' : member.role, isSelf);
  const showRemove = canRemove(currentRole, member.isFounder ? 'founder' : member.role, isSelf);
  const showTransfer = canTransferFounder(currentRole, member.role) && !isSelf;

  const roleBadge = (
    <button
      type="button"
      disabled={!showChangeRole}
      aria-label={showChangeRole ? `Change role for ${member.name ?? member.email}` : undefined}
      onClick={() => showChangeRole && onChangeRole(member)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '2px 8px',
        borderRadius: 999, border: 0, background: 'var(--surface-sunken)', color: 'var(--ink)',
        cursor: showChangeRole ? 'pointer' : 'default',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: ROLE_DOT_COLOR[member.isFounder ? 'founder' : member.role] }} />
      {member.isFounder ? 'Founder' : roleLabel(member.role)}
      {showChangeRole && <ChevronDown size={11} />}
    </button>
  );

  return (
    <div style={{
      display: narrow ? 'flex' : 'grid',
      ...(narrow ? { flexDirection: 'column' as const, gap: 8 } : { gridTemplateColumns: '1fr 110px 90px 80px', alignItems: 'center' }),
      padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span aria-hidden style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600,
          background: avatar.bg, color: avatar.fg,
        }}>
          {getInitials(member.name ?? member.email)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name ?? member.email ?? 'Unknown'}</span>
            {isSelf && (
              <span style={{ fontSize: 10, background: 'var(--surface)', color: 'var(--ink-faint)', borderRadius: 999, padding: '1px 6px' }}>(you)</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
        </div>
      </div>
      <div>{roleBadge}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{shortDate(member.joinedAt)}</div>
      <div style={{ display: 'flex', gap: 4, justifyContent: narrow ? 'flex-start' : 'flex-end', alignItems: 'center' }}>
        {showTransfer && <Button variant="ghost" size="sm" onClick={() => onTransfer(member)}>Transfer</Button>}
        {showRemove ? (
          <Button variant="ghost" size="sm" aria-label={isSelf ? 'Leave company' : `Remove ${member.name ?? member.email}`} onClick={() => onRemove(member)}>
            <Trash2 size={14} style={{ color: 'var(--danger)' }} />
          </Button>
        ) : (!showTransfer && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>—</span>)}
      </div>
    </div>
  );
}
