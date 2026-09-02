// FILE: admin/jobs-browser/parts/DeleteJobModal.tsx
// Delete confirmation for a SCRAPED job. Deleting is irreversible, so the
// button stays disabled until the admin types DELETE exactly — a modal you can
// dismiss with one reflexive click is not a real confirmation.
//
// Native postings never reach this modal; the server refuses them regardless.

import { useEffect, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import type { JobRow } from '@/types/admin-job-browser';

const REQUIRED_WORD = 'DELETE';

interface Props {
  job: JobRow | null;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteJobModal({ job, isBusy, onCancel, onConfirm }: Props) {
  const [typed, setTyped] = useState('');

  // Clear between jobs so a previous confirmation never carries over.
  useEffect(() => { setTyped(''); }, [job?.id]);

  const canDelete = typed.trim() === REQUIRED_WORD && !isBusy;

  return (
    <Modal
      isOpen={job !== null}
      onClose={onCancel}
      title="Delete this job permanently?"
      footer={(
        <>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" disabled={!canDelete} onClick={onConfirm}>
            {isBusy ? 'Deleting…' : 'Delete job'}
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
          <strong>{job?.title ?? 'This job'}</strong>
          {job?.company ? ` at ${job.company}` : ''} will be removed from the database
          permanently. This cannot be undone — the audit log entry will be the only
          record that it existed.
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          If you only want it off the seeker-facing pages, cancel and use Hide instead.
        </p>
        <label style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Type <strong style={{ color: 'var(--ink)' }}>{REQUIRED_WORD}</strong> to confirm:
          <input
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            aria-label={`Type ${REQUIRED_WORD} to confirm deletion`}
            autoComplete="off"
            style={{
              display: 'block', width: '100%', marginTop: 6, padding: '8px 10px',
              borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--ink)', fontSize: '0.88rem',
            }}
          />
        </label>
      </div>
    </Modal>
  );
}
