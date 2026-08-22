'use client';
// FILE: assignments/AssignmentsClient.tsx
// Client subtree for the assignment-library page. Mirrors TeamSettingsClient: owns
// the list, which modal is open, and routes every mutation through
// employer-assignments-api with a toast on the outcome.
//
// ARCHIVE IS NOT OPTIMISTIC. Every other list in this app updates state first and
// reconciles later, and that is wrong here: archive can be refused 409 with the
// postings still using the task. An optimistic archive would move the row to
// Archived, then snap it back a moment later under an error toast — the employer
// sees their action half-happen and cannot tell what the real state is. We wait for
// the response and update from it. Half a second of latency is the cheaper cost.

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, Alert } from '@/components/ui/feedback';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { useEmployer } from '@/context/employer/EmployerContext';
import {
  listAssignments, cloneAssignment, archiveAssignment, unarchiveAssignment,
  EmployerAssignmentsApiError,
} from '@/api/employer-assignments-api';
import { canCreateAssignment } from '@/lib/team-permissions';
import { COPY } from '@/theme/brand';
import { trackEvent } from '@/lib/analytics-events';
import type { Role } from '@/types/employer-team';
import type { EmployerAssignment, AssignmentUsage } from '@/types/employer-assignments';
import AssignmentsTable from './parts/AssignmentsTable';
import AssignmentFormModal from './parts/AssignmentFormModal';
import type { FormMode } from './parts/AssignmentFormModal';
import AssignmentDetailView from './parts/AssignmentDetailView';

type ActiveModal =
  | { kind: 'form'; mode: FormMode; source: EmployerAssignment | null }
  | { kind: 'view'; assignment: EmployerAssignment }
  | null;

/** A blocked mutation, kept on the page (not a toast) so the posting names stay readable. */
interface BlockedNotice {
  message: string;
  jobs: AssignmentUsage[];
  assignment: EmployerAssignment;
}

export interface AssignmentsClientProps {
  assignments: EmployerAssignment[];
  usageByAssignmentId: Record<string, AssignmentUsage[]>;
  /** null when the roster read failed; treated as the least-privileged role. */
  currentRole: Role | null;
}

export default function AssignmentsClient({
  assignments: initialAssignments, usageByAssignmentId, currentRole: serverRole,
}: AssignmentsClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { viewerRole, company } = useEmployer();
  const companyId = company?.id ?? '';
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState<ActiveModal>(null);
  const [blocked, setBlocked] = useState<BlockedNotice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // The context role is authoritative once resolved (it comes from the roster); the
  // server-rendered role covers the first paint. Least privilege on both being null.
  const currentRole: Role = (viewerRole ?? serverRole ?? 'interviewer') as Role;
  const mayCreate = canCreateAssignment(currentRole);

  const close = () => setModal(null);

  /** Re-read the list from the server so a create/clone lands with fresh usage data. */
  async function refetch(includeArchived = showArchived): Promise<void> {
    try {
      setAssignments(await listAssignments({ includeArchived }));
    } catch {
      // A failed refetch is not a failed mutation — the write already succeeded.
      // Fall back to a route refresh rather than blanking the list.
      router.refresh();
    }
  }

  async function handleToggleArchived(next: boolean): Promise<void> {
    setShowArchived(next);
    // Archived rows are excluded by the backend unless asked for, so revealing them
    // is a refetch, not a filter over what we already hold.
    if (next) await refetch(true);
  }

  function handleApiError(err: unknown, assignment: EmployerAssignment, fallback: string): void {
    if (err instanceof EmployerAssignmentsApiError) {
      if (err.status === 409) {
        setBlocked({ message: err.message, jobs: err.jobs, assignment });
        return;
      }
      if (err.status === 403) {
        // Unreachable if the gating above is right — log it as the bug signal it is.
        console.error('[assignments] 403 on a control the UI offered — client role gating is out of sync with the backend.', err.code);
        showToast('error', 'You don\'t have permission to do this.');
        return;
      }
      showToast('error', err.message || fallback);
      return;
    }
    showToast('error', fallback);
  }

  async function handleClone(assignment: EmployerAssignment): Promise<void> {
    setBusyId(assignment.id);
    setBlocked(null);
    try {
      const clone = await cloneAssignment(assignment.id);
      // Ids only — the assignment title is employer-authored free text.
      trackEvent('assignment_cloned', { companyId, assignmentId: clone.id });
      await refetch();
      showToast('success', `Cloned as "${clone.title}".`);
      // Straight into the editor: cloning is almost always the first half of
      // "clone it to make changes", and stopping at a new row makes them hunt for it.
      setModal({ kind: 'form', mode: 'edit', source: clone });
    } catch (err) {
      handleApiError(err, assignment, 'Could not clone this assignment.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleArchive(assignment: EmployerAssignment): Promise<void> {
    setBusyId(assignment.id);
    setBlocked(null);
    try {
      // Awaited FIRST. The row is only rewritten from the server's response — see
      // the file header for why this one is deliberately not optimistic.
      const updated = await archiveAssignment(assignment.id);
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      trackEvent('assignment_archived', { companyId, assignmentId: updated.id });
      showToast('success', 'Assignment archived.');
    } catch (err) {
      handleApiError(err, assignment, 'Could not archive this assignment.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnarchive(assignment: EmployerAssignment): Promise<void> {
    setBusyId(assignment.id);
    setBlocked(null);
    try {
      const updated = await unarchiveAssignment(assignment.id);
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('success', 'Assignment restored.');
    } catch (err) {
      handleApiError(err, assignment, 'Could not restore this assignment.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaved(saved: EmployerAssignment): Promise<void> {
    // Read the mode BEFORE close() clears it. An edit is not a creation, and
    // counting it as one would inflate the library-growth number.
    const wasCreate = modal?.kind === 'form' && modal.mode !== 'edit';
    if (wasCreate) {
      trackEvent('assignment_created', {
        companyId, assignmentId: saved.id, estimatedHours: saved.estimatedHours,
      });
    }
    close();
    showToast('success', 'Assignment saved.');
    await refetch();
    if (!assignments.some((a) => a.id === saved.id)) {
      // Belt and braces: if the refetch raced, at least show the row we just made.
      setAssignments((prev) => (prev.some((a) => a.id === saved.id) ? prev : [saved, ...prev]));
    }
  }

  const usageFor = useMemo(
    () => (id: string): AssignmentUsage[] => usageByAssignmentId[id] ?? [],
    [usageByAssignmentId],
  );

  const createButton = mayCreate ? (
    <Button iconLeft={<Plus size={16} />} onClick={() => setModal({ kind: 'form', mode: 'create', source: null })}>
      {COPY.employer.assignments.newAssignment}
    </Button>
  ) : (
    // Disabled with a reason, never absent — the same rule the table follows.
    <Tooltip content="Only Members and above can create assignments.">
      <Button iconLeft={<Plus size={16} />} disabled>{COPY.employer.assignments.newAssignment}</Button>
    </Tooltip>
  );

  return (
    <div className="container-xl" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* No eyebrow. It read "SETTINGS" while this lived under settings/, which is
          now simply false — Assignments is its own top-level nav section. The other
          top-level employer pages (Jobs, Dashboard) pass no label either: the nav
          already says where you are, and an eyebrow repeating it is noise. */}
      <PageHeader
        title={COPY.employer.assignments.pageTitle}
        subtitle={COPY.employer.assignments.pageSubtitle}
        actions={(
          // The archived toggle belongs beside the primary action, not floating
          // loose above the table where it read as an orphaned control.
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--ink-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => handleToggleArchived(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              {COPY.employer.assignments.showArchived}
            </label>
            {createButton}
          </div>
        )}
      />

      {!mayCreate && (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', margin: 0 }}>
          Only Members and above can create assignments. You can read every task here.
        </p>
      )}

      {blocked && (
        <Alert type="warning">
          <p style={{ margin: 0 }}>{blocked.message}</p>
          {blocked.jobs.length > 0 && (
            <p style={{ margin: '4px 0 0' }}>
              {`Used by: ${blocked.jobs.map((job) => job.title ?? 'Untitled posting').join(', ')}`}
            </p>
          )}
          <div style={{ marginTop: 8 }}>
            <Button size="sm" variant="secondary" onClick={() => handleClone(blocked.assignment)}>
              Clone it instead
            </Button>
          </div>
        </Alert>
      )}

      <section aria-label="Assignment library">
        <AssignmentsTable
          assignments={assignments}
          usageByAssignmentId={usageByAssignmentId}
          currentRole={currentRole}
          showArchived={showArchived}
          busyId={busyId}
          onCreate={() => setModal({ kind: 'form', mode: 'create', source: null })}
          onEdit={(assignment) => setModal({ kind: 'form', mode: 'edit', source: assignment })}
          onView={(assignment) => setModal({ kind: 'view', assignment })}
          onClone={handleClone}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
        />
      </section>

      {modal?.kind === 'form' && (
        <AssignmentFormModal
          mode={modal.mode}
          source={modal.source}
          onClose={close}
          onSaved={handleSaved}
        />
      )}

      {modal?.kind === 'view' && (
        <Modal
          isOpen
          onClose={close}
          title={modal.assignment.title}
          size="lg"
          footer={(
            <>
              <Button variant="secondary" onClick={close}>Close</Button>
              <Button onClick={() => handleClone(modal.assignment)}>Clone to edit</Button>
            </>
          )}
        >
          <AssignmentDetailView assignment={modal.assignment} usedBy={usageFor(modal.assignment.id)} />
        </Modal>
      )}
    </div>
  );
}
