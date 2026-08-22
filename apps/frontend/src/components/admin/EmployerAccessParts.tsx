'use client';
// FILE: src/components/admin/EmployerAccessParts.tsx
// Presentational pieces for the Employer Access page. All state and API calls
// live in EmployerAccess.tsx — these components only render and emit events.

import { Card, Switch, Input, Button, Table, EmptyState } from '@/components/ui';
import type { Column } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import type { EmployerAccessWhitelistEntry } from '@/api/admin-api';

function formatAddedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function SignupToggleCard({ isOpen, isMutating, onRequestToggle }: {
  isOpen: boolean; isMutating: boolean; onRequestToggle: (next: boolean) => void;
}) {
  return (
    <Card variant="raised">
      <h2 style={{ fontSize: TYPE.lg, fontWeight: 600, color: 'var(--ink)' }}>Global signup</h2>
      <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', margin: '6px 0 16px', lineHeight: 1.55 }}>
        When open, anyone with a Google account can create an employer account.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Switch
          label="Employer signup open"
          checked={isOpen}
          disabled={isMutating}
          onChange={(next) => onRequestToggle(next)}
        />
        <span style={{ fontSize: TYPE.sm, fontWeight: 500, color: isOpen ? 'var(--success)' : 'var(--ink-muted)' }}>
          {isOpen ? 'Open to everyone' : 'Closed — whitelist only'}
        </span>
      </div>
    </Card>
  );
}

export function WhitelistSection({
  whitelist, addEmail, addNote, addEmailError, isAdding, isMutating,
  onAddEmailChange, onAddNoteChange, onAdd, onRequestRemove,
}: {
  whitelist: EmployerAccessWhitelistEntry[];
  addEmail: string; addNote: string; addEmailError?: string;
  isAdding: boolean; isMutating: boolean;
  onAddEmailChange: (value: string) => void;
  onAddNoteChange: (value: string) => void;
  onAdd: () => void;
  onRequestRemove: (email: string) => void;
}) {
  const columns: Column<EmployerAccessWhitelistEntry>[] = [
    { key: 'email', header: 'Email' },
    { key: 'note', header: 'Note', render: (row) => row.note || '—' },
    { key: 'addedAt', header: 'Added', render: (row) => formatAddedAt(row.addedAt) },
    {
      key: 'actions', header: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" disabled={isMutating} onClick={() => onRequestRemove(row.email)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Card variant="raised">
      <h2 style={{ fontSize: TYPE.lg, fontWeight: 600, color: 'var(--ink)' }}>Whitelist</h2>
      <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', margin: '6px 0 16px', lineHeight: 1.55 }}>
        Emails allowed to sign up while the global gate is closed.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: '1 1 220px' }}>
          <Input
            label="Email" type="email" value={addEmail} error={addEmailError}
            placeholder="founder@startup.in"
            onChange={(event) => onAddEmailChange(event.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 220px' }}>
          <Input
            label="Note (optional)" value={addNote} maxLength={200}
            hint="Stored as a reason for adding this email"
            onChange={(event) => onAddNoteChange(event.target.value)}
          />
        </div>
        <Button onClick={onAdd} loading={isAdding} disabled={isMutating}>Add to whitelist</Button>
      </div>

      {whitelist.length === 0 ? (
        <EmptyState
          title="No whitelisted emails yet"
          body="Add an email above to let a specific person sign up while the global toggle stays closed."
        />
      ) : (
        <Table columns={columns} data={whitelist} />
      )}
    </Card>
  );
}
