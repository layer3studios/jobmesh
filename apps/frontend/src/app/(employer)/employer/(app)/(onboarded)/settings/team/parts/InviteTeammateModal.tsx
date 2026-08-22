'use client';
// FILE: settings/team/parts/InviteTeammateModal.tsx
// Invite a teammate. Founder is never offered as a role (it is transferred, D_impl_ui_1).
// On success the invite URL is shown once via a copyable input (D_impl_ui_4). Inline
// errors map the backend codes: ALREADY_MEMBER / INVITE_ALREADY_PENDING (with a
// revoke-and-retry) / CANNOT_INVITE_SELF / INVALID_EMAIL.
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { createInvite, revokeInvite, EmployerTeamApiError } from '@/api/employer-team-api';
import type { CompanyInvite, InvitableRole } from '@/types/employer-team';
import { useEmployer } from '@/context/employer/EmployerContext';
import { trackEvent } from '@/lib/analytics-events';
import CopyLinkField from './CopyLinkField';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // mirrors the backend invite-service regex
const ROLE_OPTIONS: { value: InvitableRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'member', label: 'Member' },
  { value: 'interviewer', label: 'Interviewer' },
];

interface Props {
  onClose: () => void;
  onCreated: (invite: CompanyInvite) => void;
  onCopied: () => void;
}

export default function InviteTeammateModal({ onClose, onCreated, onCopied }: Props) {
  const { company } = useEmployer();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole>('member');
  const [canMove, setCanMove] = useState(false);
  const [canArchive, setCanArchive] = useState(false);
  const [error, setError] = useState('');
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const isInterviewer = role === 'interviewer';

  async function submit(): Promise<void> {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) { setError('Enter a valid email address.'); return; }
    setError('');
    setPendingInviteId(null);
    setIsSaving(true);
    try {
      const { invite, inviteUrl } = await createInvite({
        email: trimmed, role,
        canMoveApplicants: isInterviewer ? canMove : false,
        canArchiveApplicants: isInterviewer ? canArchive : false,
      });
      // New invites only — resend/revoke never fire this (metric counts fresh sends).
      trackEvent('team_invite_sent', {
        companyId: company?.id ?? '', inviteId: invite.id, role,
        canMoveApplicants: isInterviewer ? canMove : false,
        canArchiveApplicants: isInterviewer ? canArchive : false,
      });
      onCreated({ ...invite, inviteUrl });
      setCreatedUrl(inviteUrl);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleError(err: unknown): void {
    if (!(err instanceof EmployerTeamApiError)) { setError('Something went wrong. Please try again.'); return; }
    if (err.code === 'ALREADY_MEMBER') setError('This person is already a member of your team.');
    else if (err.code === 'INVITE_ALREADY_PENDING') {
      setError('This email already has a pending invite.');
      setPendingInviteId(err.existingInviteId ?? null);
    } else if (err.code === 'CANNOT_INVITE_SELF') setError('You cannot invite yourself.');
    else if (err.code === 'INVALID_EMAIL') setError('Enter a valid email address.');
    else setError(err.message || 'Something went wrong. Please try again.');
  }

  async function revokeAndRetry(): Promise<void> {
    if (!pendingInviteId) return;
    setIsSaving(true);
    try {
      await revokeInvite(pendingInviteId);
      setPendingInviteId(null);
      await submit();
    } catch (err) {
      handleError(err);
      setIsSaving(false);
    }
  }

  if (createdUrl !== null) {
    return (
      <Modal isOpen onClose={onClose} title="Invite created" footer={<Button onClick={onClose}>Done</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--ink-2)' }}>Invite link — copy this and share:</p>
          <CopyLinkField url={createdUrl} onCopied={onCopied} />
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            This link is shown once. If you lose it, resend the invite to generate a new one.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Invite a teammate"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isSaving} disabled={email.trim().length === 0}>Send invite</Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Input
            label="Email" type="email" value={email} error={error || undefined}
            onChange={(e) => { setEmail(e.target.value); setError(''); setPendingInviteId(null); }}
            placeholder="teammate@company.com" autoComplete="off"
          />
          {pendingInviteId && (
            <div style={{ marginTop: 8 }}>
              <Button variant="ghost" size="sm" onClick={revokeAndRetry} loading={isSaving}>Revoke and re-invite</Button>
            </div>
          )}
        </div>
        <Select label="Role" value={role} options={ROLE_OPTIONS} onChange={(e) => setRole(e.target.value as InvitableRole)} />
        {isInterviewer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Checkbox label="Can move applicants between stages" checked={canMove} onChange={setCanMove} />
            <Checkbox label="Can archive applicants" checked={canArchive} onChange={setCanArchive} />
          </div>
        )}
      </div>
    </Modal>
  );
}
