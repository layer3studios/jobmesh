'use client';
// FILE: src/components/employer/jobs/parts/AssignmentSection.tsx
// The collapsible "require a take-home" section of the posting form.
//
// OFF BY DEFAULT, ALWAYS. A posting with the toggle off behaves exactly as it did
// before this chunk existed — no assignment field is sent, no extra request is
// made. The toggle is never pre-enabled just because the company happens to own an
// assignment, and no assignment is ever auto-selected: requiring unpaid work from
// applicants is a decision an employer makes on purpose, not one they discover they
// already made.
//
// On the EDIT surface the toggle starts on iff a task is already attached, which is
// state, not a default.

import { useEffect, useState } from 'react';
import { Alert, Switch } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { getPostingAssignment } from '@/api/employer-jobs-api';
import type { EmployerAssignment } from '@/types/employer-assignments';
import AssignmentPicker from './AssignmentPicker';

const noticeStyle: React.CSSProperties = { fontSize: TYPE.xs, color: 'var(--ink-muted)', margin: '6px 0 0', lineHeight: 1.55 };

export interface AssignmentSectionState {
  enabled: boolean;
  assignmentId: string | null;
  /** Carried so the confirm dialog can name the task without a second lookup. */
  assignmentTitle: string | null;
}

interface Props {
  /** Absent on the create form. Its presence is what makes this the edit surface. */
  postingId?: string;
  /** The attachment as it exists on the server right now. */
  initialAssignmentId?: string | null;
  /**
   * Supplied by a caller that already knows the count. When omitted and postingId
   * is set, it is read from GET /jobs/:id/assignment — DetailSettings does not
   * carry an applicant count, and that endpoint returns it alongside the attached
   * assignment in a single call.
   */
  applicationCount?: number;
  disabled?: boolean;
  onChange: (state: AssignmentSectionState) => void;
  /** Reports the server-known applicant count + attached task up to the form. */
  onContextLoaded?: (context: { applicationCount: number; attached: EmployerAssignment | null }) => void;
}

export default function AssignmentSection({
  postingId, initialAssignmentId = null, applicationCount, disabled, onChange, onContextLoaded,
}: Props) {
  const [enabled, setEnabled] = useState(initialAssignmentId != null);
  const [assignmentId, setAssignmentId] = useState<string | null>(initialAssignmentId);
  const [assignmentTitle, setAssignmentTitle] = useState<string | null>(null);
  const [attached, setAttached] = useState<EmployerAssignment | null>(null);

  // Edit surface only. On create there is no posting to read a context from, and
  // nobody can have applied to a posting that does not exist yet.
  useEffect(() => {
    if (!postingId) return;
    let cancelled = false;
    void (async () => {
      try {
        const context = await getPostingAssignment(postingId);
        if (cancelled) return;
        setAttached(context.assignment);
        if (context.assignment) setAssignmentTitle(context.assignment.title);
        onContextLoaded?.({ applicationCount: context.applicationCount, attached: context.assignment });
      } catch {
        // A failed read leaves the picker working off the active list. The section
        // must not break the posting form it is embedded in.
      }
    })();
    return () => { cancelled = true; };
    // onContextLoaded is intentionally excluded — callers pass an inline closure and
    // depending on it would refetch on every render of the parent form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postingId]);

  const emit = (next: AssignmentSectionState) => {
    setEnabled(next.enabled);
    setAssignmentId(next.assignmentId);
    setAssignmentTitle(next.assignmentTitle);
    onChange(next);
  };

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <Switch
        label="Require a take-home with this application"
        checked={enabled}
        disabled={disabled}
        onChange={(checked) => emit(
          // Turning it off clears the selection: leaving a stale id behind would let
          // an invisible field decide what the posting does.
          checked
            ? { enabled: true, assignmentId, assignmentTitle }
            : { enabled: false, assignmentId: null, assignmentTitle: null },
        )}
      />

      {enabled && (
        <div style={{ marginTop: 12 }}>
          {/* Stated before they pick, not after they save. An employer choosing this
              is trading volume for signal, and they should know which way. */}
          <Alert type="info">
            Take-homes filter for commitment but reduce applications. Expect fewer,
            more-invested candidates.
          </Alert>

          <div style={{ marginTop: 12 }}>
            <AssignmentPicker
              value={assignmentId}
              attached={attached}
              postingId={postingId}
              disabled={disabled}
              onChange={(nextId, next) => emit({
                enabled: true, assignmentId: nextId, assignmentTitle: next?.title ?? null,
              })}
            />
          </div>

          {applicationCount != null && applicationCount > 0 && (
            <p style={noticeStyle}>
              {applicationCount === 1
                ? '1 person has already applied to this posting.'
                : `${applicationCount} people have already applied to this posting.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
