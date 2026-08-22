'use client';
// FILE: settings/team/parts/PendingInviteRow.tsx
// One pending-invite row: 0.7 opacity, mail-icon avatar, "pending" badge,
// invited/expires line, outlined role badge, resend + revoke actions.

import { Mail, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { roleLabel } from '@/lib/role-labels';
import type { CompanyInvite } from '@/types/employer-team';
import { ROLE_DOT_COLOR } from './RoleTiles';

const DAY_MS = 86400000;
const relDays = (iso: string): number => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
const daysUntil = (iso: string): number => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS));

export default function PendingInviteRow({
  invite, canManage, narrow, onResend, onRevoke,
}: {
  invite: CompanyInvite;
  canManage: boolean;
  narrow: boolean;
  onResend: (invite: CompanyInvite) => void;
  onRevoke: (invite: CompanyInvite) => void;
}) {
  const invitedDays = relDays(invite.createdAt);
  const metaLine = `Invited ${invitedDays === 0 ? 'today' : `${invitedDays} day${invitedDays === 1 ? '' : 's'} ago`} · Expires in ${daysUntil(invite.expiresAt)} days`;

  return (
    <div style={{
      opacity: 0.7,
      display: narrow ? 'flex' : 'grid',
      ...(narrow ? { flexDirection: 'column' as const, gap: 8 } : { gridTemplateColumns: '1fr 110px 90px 80px', alignItems: 'center' }),
      padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span aria-hidden style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', color: 'var(--ink-faint)',
        }}>
          <Mail size={14} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invite.email}</span>
            <span style={{ fontSize: 10, background: 'var(--warning-soft)', color: 'var(--warning)', borderRadius: 999, padding: '1px 6px' }}>pending</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{metaLine}</div>
        </div>
      </div>
      <div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '2px 8px',
          borderRadius: 999, border: '0.5px solid var(--border)', color: 'var(--ink-2)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ROLE_DOT_COLOR[invite.role] }} />
          {roleLabel(invite.role)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>—</div>
      <div style={{ display: 'flex', gap: 4, justifyContent: narrow ? 'flex-start' : 'flex-end' }}>
        {canManage && (
          <>
            <Button variant="ghost" size="sm" aria-label={`Resend invite to ${invite.email}`} onClick={() => onResend(invite)}>
              <RefreshCw size={13} />
            </Button>
            <Button variant="ghost" size="sm" aria-label={`Revoke invite for ${invite.email}`} onClick={() => onRevoke(invite)}>
              <X size={14} style={{ color: 'var(--danger)' }} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
