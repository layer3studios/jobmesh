'use client';
// FILE: src/components/employer/jobs/parts/AssignmentPicker.tsx
// Assignment dropdown + preview for the posting form.
//
// Reuses 8a wholesale: the list client, the create modal, and the usage helper are
// all imported from settings/assignments. Nothing here is a second copy — a second
// create form in particular would immediately drift from the validators it mirrors.
//
// "Create new…" is the reason a MEMBER never has to visit Settings to attach a
// take-home. The Settings nav link is Owner+, but assignment creation is Member+ on
// the backend, so this side entrance is the whole path for that role. Do not gate it
// more tightly than the backend does.

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Select, Spinner } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { listAssignments } from '@/api/employer-assignments-api';
import { listEmployerPostings } from '@/api/employer-jobs-api';
import { groupUsageByAssignment } from '@/app/(employer)/employer/(app)/(onboarded)/assignments/parts/assignment-usage';
import AssignmentFormModal from '@/app/(employer)/employer/(app)/(onboarded)/assignments/parts/AssignmentFormModal';
import type { EmployerAssignment, AssignmentUsage } from '@/types/employer-assignments';

/** Sentinel option value — not a valid assignment id, so it cannot collide. */
const CREATE_NEW = '__create_new__';
const NONE = '';

const helperStyle: React.CSSProperties = { fontSize: TYPE.xs, color: 'var(--ink-muted)', margin: '6px 0 0', lineHeight: 1.5 };

interface Props {
  /** The currently attached / chosen assignment id, or null. */
  value: string | null;
  /**
   * The attached assignment as the SERVER returned it. Supplied separately from the
   * active list because it may be archived, in which case it is not in that list at
   * all — see the archived branch below.
   */
  attached: EmployerAssignment | null;
  /** Excluded from the "used by N other postings" count. Absent on create. */
  postingId?: string;
  disabled?: boolean;
  /** The assignment object rides along so callers can name it in confirm copy. */
  onChange: (assignmentId: string | null, assignment: EmployerAssignment | null) => void;
}

export default function AssignmentPicker({ value, attached, postingId, disabled, onChange }: Props) {
  const [assignments, setAssignments] = useState<EmployerAssignment[]>([]);
  const [usage, setUsage] = useState<Record<string, AssignmentUsage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Active only — an archived task cannot be attached (the backend refuses it
      // with ASSIGNMENT_ARCHIVED), so offering one would be a dead end.
      const [list, postings] = await Promise.all([
        listAssignments({ includeArchived: false }),
        // Usage is derived client-side; see 8a's assignment-usage.ts for why there
        // is no server-side count to read.
        listEmployerPostings().catch(() => []),
      ]);
      setAssignments(list);
      setUsage(groupUsageByAssignment(postings));
    } catch {
      setLoadError('Could not load your assignments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // The attached assignment may be archived and therefore missing from the active
  // list. Never blank the field in that case — the candidate is still being shown
  // this task, so the employer must be able to see which one it is.
  const attachedIsArchived = !!attached?.archivedAt && attached.id === value;
  const selected = assignments.find((a) => a.id === value)
    ?? (attached && attached.id === value ? attached : null);

  const options = [
    ...assignments.map((a) => ({ value: a.id, label: `${a.title} · ~${a.estimatedHours}h` })),
    // Rendered as an option so it is reachable by keyboard from the same control,
    // rather than a button someone has to discover separately.
    { value: CREATE_NEW, label: '+ Create new…' },
  ];
  if (attachedIsArchived && attached) {
    options.unshift({ value: attached.id, label: `${attached.title} · ~${attached.estimatedHours}h (archived)` });
  }

  const handleSelect = (next: string) => {
    if (next === CREATE_NEW) { setIsCreating(true); return; }
    if (next === NONE) { onChange(null, null); return; }
    onChange(next, assignments.find((a) => a.id === next) ?? attached ?? null);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner size={16} /><span style={helperStyle}>Loading assignments…</span></div>;
  }

  if (loadError) {
    return (
      <div>
        <p style={{ ...helperStyle, color: 'var(--danger)' }}>{loadError}</p>
        <Button variant="secondary" size="sm" onClick={() => void load()}>Retry</Button>
      </div>
    );
  }

  // An empty library gets a CTA, never an empty dropdown that looks broken.
  if (assignments.length === 0 && !attachedIsArchived) {
    return (
      <div>
        <p style={{ fontSize: TYPE.sm, color: 'var(--ink)', margin: '0 0 8px' }}>No assignments yet</p>
        <p style={helperStyle}>Create a reusable take-home task and attach it to this posting.</p>
        <div style={{ marginTop: 8 }}>
          <Button variant="secondary" size="sm" disabled={disabled} onClick={() => setIsCreating(true)}>
            Create an assignment
          </Button>
        </div>
        {isCreating && (
          <AssignmentFormModal
            mode="create"
            source={null}
            onClose={() => setIsCreating(false)}
            onSaved={async (created) => {
              setIsCreating(false);
              await load();
              onChange(created.id, created);
            }}
          />
        )}
      </div>
    );
  }

  const usedByOthers = selected
    ? (usage[selected.id] ?? []).filter((job) => job.id !== postingId)
    : [];

  return (
    <div>
      <Select
        label="Assignment"
        placeholder="Select an assignment…"
        options={options}
        value={value ?? NONE}
        disabled={disabled}
        onChange={(event) => handleSelect(event.target.value)}
      />

      {attachedIsArchived && (
        <p style={helperStyle}>
          <Badge variant="neutral" size="sm">Archived</Badge>
          {' '}Still shown to candidates. Pick another to replace it.
        </p>
      )}

      {selected && (
        <div style={{ marginTop: 10, border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: TYPE.sm, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{selected.title}</p>
          <p style={{ fontSize: TYPE.xs, color: 'var(--ink-2)', margin: '4px 0 0', lineHeight: 1.55 }}>
            {selected.publicSummary}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
            <Badge variant="brand" size="sm">{`~${selected.estimatedHours}h`}</Badge>
            {(selected.allowedFileTypes ?? []).length > 0
              ? (selected.allowedFileTypes ?? []).map((t) => <Badge key={t} variant="neutral" size="sm">{t.toUpperCase()}</Badge>)
              : <Badge variant="neutral" size="sm">Link only</Badge>}
          </div>
          <p style={helperStyle}>
            {usedByOthers.length === 0
              ? 'Not used by any other posting.'
              : `Used by ${usedByOthers.length} other ${usedByOthers.length === 1 ? 'posting' : 'postings'}: `
                + usedByOthers.map((job) => job.title ?? 'Untitled posting').join(', ')}
          </p>
        </div>
      )}

      {isCreating && (
        <AssignmentFormModal
          mode="create"
          source={null}
          onClose={() => setIsCreating(false)}
          onSaved={async (created) => {
            setIsCreating(false);
            await load();
            onChange(created.id, created); // auto-select what they just created
          }}
        />
      )}
    </div>
  );
}
