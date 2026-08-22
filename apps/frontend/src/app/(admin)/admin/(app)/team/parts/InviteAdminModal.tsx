'use client';
// FILE: src/app/(admin)/admin/(app)/team/parts/InviteAdminModal.tsx
// Invite an admin. On success the modal does NOT auto-close (D3): it shows the
// one-time invite URL with a copy button — the inviter shares it manually
// (WhatsApp/Slack; email delivery is a future chunk).
import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { inviteAdmin, AdminTeamApiError } from '@/api/admin-team-api';
import type { AdminInvite, AdminRole } from '@/api/admin-team-api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
];

const INVITE_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_ADMIN: 'That email is already an admin.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_ROLE: 'Please pick a role.',
  NOT_SUPER_ADMIN: 'You need super admin permission.',
};

function messageForInviteError(error: unknown): string {
  if (error instanceof AdminTeamApiError && error.code && INVITE_MESSAGES[error.code]) {
    return INVITE_MESSAGES[error.code];
  }
  return 'Something went wrong. Try again.';
}

interface Props {
  onClose: () => void;
  onInvited: (invite: AdminInvite) => void;
  lastResult: AdminInvite | null;
}

export default function InviteAdminModal({ onClose, onInvited, lastResult }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('admin');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit() {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) { setError('Please enter a valid email address.'); return; }
    setError('');
    setIsSaving(true);
    try {
      onInvited(await inviteAdmin(trimmed, role));
    } catch (err) {
      setError(messageForInviteError(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy — select the URL and copy it manually.');
    }
  }

  if (lastResult) {
    return (
      <Modal isOpen onClose={onClose} title="Invite created" footer={<Button onClick={onClose}>Done</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: '0.9rem' }}>
            Share this link with <strong>{lastResult.email}</strong> — they sign in with that
            Google account to accept. The link expires in 7 days.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input aria-label="Invite URL" value={lastResult.inviteUrl} readOnly style={{ flex: 1 }} onFocus={(e) => e.target.select()} />
            <Button variant="secondary" onClick={() => void copyUrl(lastResult.inviteUrl)}>
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
          </div>
          {error && <p role="alert" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--danger, #dc2626)' }}>{error}</p>}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Invite an admin"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void submit()} loading={isSaving} disabled={email.trim().length === 0}>Send invite</Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Email" type="email" value={email} error={error || undefined}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="teammate@company.com" autoComplete="off"
        />
        <Select label="Role" value={role} options={ROLE_OPTIONS} onChange={(e) => setRole(e.target.value as AdminRole)} />
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
          Super admins can manage this team; admins can view everything else.
        </p>
      </div>
    </Modal>
  );
}
