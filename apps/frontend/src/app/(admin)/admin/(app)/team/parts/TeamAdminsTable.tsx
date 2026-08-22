'use client';
// FILE: src/app/(admin)/admin/(app)/team/parts/TeamAdminsTable.tsx
// Roster table for /admin/team. Actions column exists only for super_admin viewers
// (D1), and destructive controls are HIDDEN on the viewer's own row (D2 — the
// backend guards anyway; the UI just doesn't offer the footgun). Rendered in the
// order the backend returns (newest first — no client re-sort).
import { Card, Table, Button, Select, Badge } from '@/components/ui';
import type { Column } from '@/components/ui';
import type { TeamAdmin, AdminRole } from '@/api/admin-team-api';

const ROLE_LABEL: Record<AdminRole, string> = { super_admin: 'Super admin', admin: 'Admin' };
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// One status per row, mirrored from the backend guards. `pending` additionally
// requires no lastLoginAt so a deactivated BOOTSTRAP admin (activatedAt is null on
// bootstrap rows) is treated as inactive, matching the backend's refusal to
// resend/revoke it.
type RowStatus = 'active' | 'pending' | 'inactive';
function statusOf(row: TeamAdmin): RowStatus {
  if (row.isActive) return 'active';
  if (!row.activatedAt && !row.lastLoginAt) return 'pending';
  return 'inactive';
}

function StatusPill({ row }: { row: TeamAdmin }) {
  const status = statusOf(row);
  if (status === 'active') return <Badge variant="success">Active</Badge>;
  if (status === 'pending') return <Badge variant="warning">Pending invite</Badge>;
  return <Badge variant="neutral">Inactive</Badge>;
}

interface Props {
  admins: TeamAdmin[];
  currentAdminId: string | null;
  showActions: boolean;
  pendingRowAction: string | null;
  actionError: { adminUserId: string; message: string } | null;
  onDeactivate: (adminUserId: string) => void;
  onReactivate: (adminUserId: string) => void;
  onChangeRole: (adminUserId: string, role: AdminRole) => void;
  onResendInvite: (adminUserId: string) => void;
  onRevokeInvite: (adminUserId: string, email: string) => void;
}

export default function TeamAdminsTable({
  admins, currentAdminId, showActions, pendingRowAction, actionError,
  onDeactivate, onReactivate, onChangeRole, onResendInvite, onRevokeInvite,
}: Props) {
  const actionsColumn: Column<TeamAdmin> = { key: 'actions', header: 'Actions', render: (row) => {
    if (row.adminUserId === currentAdminId) {
      // Own row: no self-deactivate / self-demote footguns (D2).
      return <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>—</span>;
    }
    const busy = pendingRowAction === row.adminUserId;
    const rowError = actionError?.adminUserId === row.adminUserId ? actionError.message : null;
    const status = statusOf(row);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Action matrix: Active → role + Deactivate; Pending → Resend + Revoke;
            Inactive → Reactivate. Nothing else renders per status. */}
        {status === 'active' && (
          <>
            <div style={{ minWidth: 130 }}>
              <Select
                aria-label={`Role for ${row.email}`}
                value={row.role}
                options={ROLE_OPTIONS}
                disabled={busy}
                onChange={(e) => onChangeRole(row.adminUserId, e.target.value as AdminRole)}
              />
            </div>
            <Button variant="danger" size="sm" disabled={busy} onClick={() => onDeactivate(row.adminUserId)}>
              {busy ? '…' : 'Deactivate'}
            </Button>
          </>
        )}
        {status === 'pending' && (
          <>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => onResendInvite(row.adminUserId)}>
              {busy ? '…' : 'Resend invite'}
            </Button>
            <Button variant="danger" size="sm" disabled={busy} onClick={() => onRevokeInvite(row.adminUserId, row.email)}>
              {busy ? '…' : 'Revoke invite'}
            </Button>
          </>
        )}
        {status === 'inactive' && (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => onReactivate(row.adminUserId)}>
            {busy ? '…' : 'Reactivate'}
          </Button>
        )}
        {rowError && <span role="alert" style={{ fontSize: '0.75rem', color: 'var(--danger, #dc2626)' }}>{rowError}</span>}
      </div>
    );
  } };

  const columns: Column<TeamAdmin>[] = [
    { key: 'email', header: 'Email', render: (row) => (
      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
        {row.email}
        {row.adminUserId === currentAdminId && (
          <span style={{ marginLeft: 6, fontWeight: 500, fontSize: '0.75rem', color: 'var(--ink-faint)' }}>(you)</span>
        )}
      </span>
    ) },
    { key: 'role', header: 'Role', render: (row) => ROLE_LABEL[row.role] ?? row.role },
    { key: 'status', header: 'Status', render: (row) => <StatusPill row={row} /> },
    { key: 'lastLogin', header: 'Last login', render: (row) => formatDate(row.lastLoginAt) },
    { key: 'invitedBy', header: 'Invited by', render: (row) => row.invitedByEmail ?? '—' },
    ...(showActions ? [actionsColumn] : []),
  ];

  return (
    <Card padding="sm"><Table columns={columns} data={admins} /></Card>
  );
}
