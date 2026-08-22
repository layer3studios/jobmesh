'use client';
// FILE: settings/team/parts/TeamUnifiedTable.tsx
// Members + pending invites in ONE card: header (count + search), column
// headers, accepted rows first (alphabetical) then pending (alphabetical).
// Below 768px each row renders as a stacked card instead of grid columns.

import { useState } from 'react';
import { useIsNarrowViewport } from '@/components/employer/jobs/useIsNarrowViewport';
import type { TeamMember, CompanyInvite, Role } from '@/types/employer-team';
import TeamMemberRow from './TeamMemberRow';
import PendingInviteRow from './PendingInviteRow';

const HEAD_CELL = { fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' } as const;

export default function TeamUnifiedTable({
  members, invites, currentRole, currentEmployerUserId, canManage,
  onChangeRole, onRemove, onTransfer, onResend, onRevoke,
}: {
  members: TeamMember[];
  invites: CompanyInvite[];
  currentRole: Role;
  currentEmployerUserId: string;
  canManage: boolean;
  onChangeRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onTransfer: (member: TeamMember) => void;
  onResend: (invite: CompanyInvite) => void;
  onRevoke: (invite: CompanyInvite) => void;
}) {
  const narrow = useIsNarrowViewport();
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();

  const matchMember = (member: TeamMember): boolean =>
    needle === '' || `${member.name ?? ''} ${member.email ?? ''}`.toLowerCase().includes(needle);
  const sortedMembers = members.filter(matchMember)
    .sort((a, b) => (a.name ?? a.email ?? '').localeCompare(b.name ?? b.email ?? ''));
  const sortedInvites = invites
    .filter((invite) => needle === '' || invite.email.toLowerCase().includes(needle))
    .sort((a, b) => a.email.localeCompare(b.email));

  const onlyMe = members.length === 1 && invites.length === 0;

  return (
    <div style={{ background: 'var(--surface-sunken)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: 'var(--surface-raised)', borderBottom: '0.5px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
          Members <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>{members.length + invites.length}</span>
        </span>
        <span style={{ flex: 1 }} />
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search members..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            width: 200, maxWidth: '50%', fontSize: 12, padding: '5px 9px',
            border: '0.5px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)',
          }}
        />
      </div>

      {!narrow && (
        <div role="row" style={{
          display: 'grid', gridTemplateColumns: '1fr 110px 90px 80px',
          padding: '8px 16px', borderBottom: '0.5px solid var(--border)',
        }}>
          <span style={HEAD_CELL}>Member</span>
          <span style={HEAD_CELL}>Role</span>
          <span style={HEAD_CELL}>Joined</span>
          <span style={{ ...HEAD_CELL, textAlign: 'right' }}>Actions</span>
        </div>
      )}

      {sortedMembers.map((member) => (
        <TeamMemberRow
          key={member.id}
          member={member}
          currentRole={currentRole}
          isSelf={member.employerUserId === currentEmployerUserId}
          narrow={narrow}
          onChangeRole={onChangeRole}
          onRemove={onRemove}
          onTransfer={onTransfer}
        />
      ))}
      {sortedInvites.map((invite) => (
        <PendingInviteRow
          key={invite.id}
          invite={invite}
          canManage={canManage}
          narrow={narrow}
          onResend={onResend}
          onRevoke={onRevoke}
        />
      ))}

      {onlyMe && (
        <p style={{ margin: 0, padding: '18px 16px', fontSize: 13, color: 'var(--ink-2)', textAlign: 'center' }}>
          Invite your first teammate to start collaborating.
        </p>
      )}
      {!onlyMe && sortedMembers.length === 0 && sortedInvites.length === 0 && (
        <p style={{ margin: 0, padding: '18px 16px', fontSize: 13, color: 'var(--ink-2)', textAlign: 'center' }}>
          No members match your search.
        </p>
      )}
    </div>
  );
}
