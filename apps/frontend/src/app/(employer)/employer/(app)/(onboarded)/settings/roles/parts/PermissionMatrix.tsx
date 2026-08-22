// FILE: settings/roles/parts/PermissionMatrix.tsx
// Who can do what, as a table. Hardcoded from src/lib/team-permissions.ts and the
// backend role middleware — this is documentation, not a live read, so if a gate
// moves there it must be updated here too.
//
// Driven by a data structure rather than per-cell JSX so adding a fifth role means
// adding one key to each row, not editing fourteen blocks of markup.

import type { Role } from '@/types/employer-team';

/**
 * 'yes'      — the role always has it.
 * 'no'       — the role never has it.
 * 'optional' — granted per person. Interviewers can be given move/archive rights
 *              individually (canMoveApplicants / canArchiveApplicants), so a flat
 *              dash here would be a lie.
 */
type Access = 'yes' | 'no' | 'optional';

const ROLES: { key: Role; label: string }[] = [
  { key: 'founder', label: 'Founder' },
  { key: 'owner', label: 'Owner' },
  { key: 'member', label: 'Member' },
  { key: 'interviewer', label: 'Interviewer' },
];

// Shorthands matching team-permissions.ts: member+ is everyone but Interviewer;
// owner+ is Founder and Owner.
const ALL: Record<Role, Access> = { founder: 'yes', owner: 'yes', member: 'yes', interviewer: 'yes' };
const MEMBER_UP: Record<Role, Access> = { founder: 'yes', owner: 'yes', member: 'yes', interviewer: 'no' };
const OWNER_UP: Record<Role, Access> = { founder: 'yes', owner: 'yes', member: 'no', interviewer: 'no' };
const FOUNDER_ONLY: Record<Role, Access> = { founder: 'yes', owner: 'no', member: 'no', interviewer: 'no' };
const MEMBER_UP_OPT_IN: Record<Role, Access> = { ...MEMBER_UP, interviewer: 'optional' };

const PERMISSIONS: { label: string; access: Record<Role, Access> }[] = [
  { label: 'Create postings', access: MEMBER_UP },
  { label: 'Edit postings', access: MEMBER_UP },
  { label: 'Close postings', access: MEMBER_UP },
  { label: 'View candidates', access: ALL },
  { label: 'Move candidates', access: MEMBER_UP_OPT_IN },
  { label: 'Archive candidates', access: MEMBER_UP_OPT_IN },
  { label: 'Schedule interviews', access: MEMBER_UP },
  { label: 'Leave notes', access: ALL },
  { label: 'Leave feedback', access: ALL },
  { label: 'Manage team', access: OWNER_UP },
  { label: 'Edit company settings', access: OWNER_UP },
  { label: 'View analytics', access: ALL },
  { label: 'Billing', access: FOUNDER_ONLY },
  { label: 'Danger zone', access: FOUNDER_ONLY },
];

const CELL = { padding: '10px 12px', fontSize: 13, textAlign: 'center' } as const;
// The permission name stays visible while the role columns scroll on a phone.
const STICKY_LABEL = {
  padding: '10px 12px', fontSize: 13, color: 'var(--ink)', textAlign: 'left',
  position: 'sticky', left: 0, background: 'var(--surface-raised)', minWidth: 180,
} as const;

function AccessCell({ access }: { access: Access }) {
  if (access === 'yes') {
    return <span aria-label="Allowed" style={{ color: 'var(--success)', fontWeight: 600 }}>✓</span>;
  }
  if (access === 'optional') {
    return (
      <span aria-label="Optional, granted per person" title="Granted per person" style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 500 }}>
        Opt-in
      </span>
    );
  }
  return <span aria-label="Not allowed" style={{ color: 'var(--ink-faint)' }}>—</span>;
}

export default function PermissionMatrix() {
  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
        Permission matrix
      </p>
      <div style={{
        border: '0.5px solid var(--border)', borderRadius: 12,
        overflowX: 'auto', background: 'var(--surface-raised)',
      }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ ...STICKY_LABEL, fontWeight: 600, borderBottom: '0.5px solid var(--border)' }}>
                Permission
              </th>
              {ROLES.map((role) => (
                <th key={role.key} style={{
                  ...CELL, fontWeight: 600, color: 'var(--ink)',
                  borderBottom: '0.5px solid var(--border)',
                }}>
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((permission, index) => {
              const zebra = index % 2 === 1 ? 'var(--surface-sunken)' : 'var(--surface-raised)';
              return (
                <tr key={permission.label} style={{ background: zebra }}>
                  <td style={{ ...STICKY_LABEL, background: zebra }}>{permission.label}</td>
                  {ROLES.map((role) => (
                    <td key={role.key} style={CELL}>
                      <AccessCell access={permission.access[role.key]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
        &ldquo;Opt-in&rdquo; permissions are granted to an Interviewer individually from the Team page.
      </p>
    </div>
  );
}
