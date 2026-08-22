// FILE: assignments/parts/assignment-row-actions.ts
// Builds one row's ⋯ menu for the assignment library, and owns the precedence
// between the two independent reasons an action can be blocked.
//
// Pure and separate from the table so the precedence rule is unit-testable and the
// table file stays a layout concern.

import type { ActionsMenuItem } from '@/components/ui/ActionsMenu';
import { COPY } from '@/theme/brand';
import {
  canEditAssignment, canCloneAssignment, canArchiveAssignment,
} from '@/lib/team-permissions';
import type { Role } from '@/types/employer-team';
import type { EmployerAssignment, AssignmentUsage } from '@/types/employer-assignments';

const C = COPY.employer.assignments;

/** The single source of the in-use sentence, so the table and the modal never drift. */
export function inUseReason(count: number): string {
  return `In use by ${count} ${count === 1 ? 'posting' : 'postings'}. `
    + 'Editing is locked so candidates answering it all see the same task. Clone it to make changes.';
}

function detachReason(count: number): string {
  return `In use by ${count} ${count === 1 ? 'posting' : 'postings'}. Detach it from them before archiving.`;
}

export interface RowHandlers {
  onEdit: (assignment: EmployerAssignment) => void;
  onView: (assignment: EmployerAssignment) => void;
  onClone: (assignment: EmployerAssignment) => void;
  onArchive: (assignment: EmployerAssignment) => void;
  onUnarchive: (assignment: EmployerAssignment) => void;
}

/**
 * Blocked items stay PRESENT and disabled, carrying the reason as a visible
 * description — never removed, and never explained by tooltip alone.
 */
export function buildAssignmentRowItems(
  assignment: EmployerAssignment,
  usage: AssignmentUsage[],
  role: Role,
  handlers: RowHandlers,
): ActionsMenuItem[] {
  const inUse = usage.length > 0;
  const isArchived = !!assignment.archivedAt;
  const mayEdit = canEditAssignment(role);
  const mayClone = canCloneAssignment(role);
  const mayArchive = canArchiveAssignment(role);

  // Precedence matters: the in-use lock applies to EVERY role, so it is reported
  // ahead of the role reason. Telling a Member "only Owners can do this" when the
  // real blocker is usage would send them to the wrong person.
  const editBlocked = inUse
    ? inUseReason(usage.length)
    : !mayEdit ? C.roleReasonEdit
      : isArchived ? C.unarchiveBeforeEdit
        : null;
  const archiveBlocked = !mayArchive
    ? C.roleReasonArchive
    : (inUse && !isArchived) ? detachReason(usage.length)
      : null;

  return [
    { id: 'view', label: C.view, onSelect: () => handlers.onView(assignment) },
    {
      id: 'edit',
      label: C.edit,
      disabled: editBlocked != null,
      description: editBlocked ?? undefined,
      onSelect: () => handlers.onEdit(assignment),
    },
    {
      id: 'clone',
      label: C.clone,
      disabled: !mayClone,
      description: mayClone ? undefined : C.roleReasonClone,
      onSelect: () => handlers.onClone(assignment),
    },
    isArchived
      ? {
        id: 'unarchive',
        label: C.unarchive,
        dividerBefore: true,
        disabled: !mayArchive,
        description: mayArchive ? undefined : C.roleReasonArchive,
        onSelect: () => handlers.onUnarchive(assignment),
      }
      : {
        id: 'archive',
        label: C.archive,
        dividerBefore: true,
        disabled: archiveBlocked != null,
        description: archiveBlocked ?? undefined,
        onSelect: () => handlers.onArchive(assignment),
      },
  ];
}
