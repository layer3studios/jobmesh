'use client';
// FILE: settings/team/parts/ChangeRoleModal.tsx
// Change a member's role (+ interviewer flags). Owner/Founder-only surface; the
// Founder row and the self row never open it, but we assert self as defence-in-depth.
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { patchMember, EmployerTeamApiError, type MemberPatchResult } from '@/api/employer-team-api';
import type { TeamMember, InvitableRole } from '@/types/employer-team';

const ROLE_OPTIONS: { value: InvitableRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'member', label: 'Member' },
  { value: 'interviewer', label: 'Interviewer' },
];

interface Props {
  member: TeamMember;
  isSelf: boolean;
  onClose: () => void;
  onSuccess: (patched: MemberPatchResult) => void;
  onError: (message: string) => void;
}

export default function ChangeRoleModal({ member, isSelf, onClose, onSuccess, onError }: Props) {
  const initialRole: InvitableRole = member.role === 'founder' ? 'owner' : member.role;
  const [role, setRole] = useState<InvitableRole>(initialRole);
  const [canMove, setCanMove] = useState(member.canMoveApplicants);
  const [canArchive, setCanArchive] = useState(member.canArchiveApplicants);
  const [isSaving, setIsSaving] = useState(false);

  const isInterviewer = role === 'interviewer';

  async function handleSubmit() {
    if (isSelf) return; // defence-in-depth: backend also 400s SELF_ROLE_CHANGE_FORBIDDEN
    setIsSaving(true);
    try {
      const patched = await patchMember(member.id, {
        role,
        canMoveApplicants: isInterviewer ? canMove : false,
        canArchiveApplicants: isInterviewer ? canArchive : false,
      });
      onSuccess(patched);
      onClose();
    } catch (error) {
      const message = error instanceof EmployerTeamApiError ? error.message : 'Something went wrong. Please try again.';
      onError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Change role — ${member.name ?? member.email ?? 'member'}`}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isSaving} disabled={isSelf}>Save changes</Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Select
          label="Role"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(e) => setRole(e.target.value as InvitableRole)}
        />
        {isInterviewer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Checkbox label="Can move applicants between stages" checked={canMove} onChange={setCanMove} />
            <Checkbox label="Can archive applicants" checked={canArchive} onChange={setCanArchive} />
          </div>
        )}
        {isSelf && (
          <p style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>You cannot change your own role.</p>
        )}
      </div>
    </Modal>
  );
}
