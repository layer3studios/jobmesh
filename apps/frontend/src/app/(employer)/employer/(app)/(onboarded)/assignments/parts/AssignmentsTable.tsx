'use client';
// FILE: assignments/parts/AssignmentsTable.tsx
// The library table. Column widths and row styling mirror the jobs table so the
// two employer tables read as one system.
//
// THE REASON A CONTROL IS BLOCKED IS STILL VISIBLE TEXT. The four per-row buttons
// and their two warning paragraphs collapsed into one ⋯ menu, but the blocked
// items keep their explanation as a second line INSIDE the menu item rather than
// as a hover tooltip: a tooltip is unreachable on touch and invisible to anyone
// who does not happen to hover, which would make a disabled item read as broken.
// The decluttering is real; the explanation did not become less reachable.

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/feedback';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { COPY } from '@/theme/brand';
import { buildAssignmentRowItems, inUseReason } from './assignment-row-actions';
import type { Role } from '@/types/employer-team';
import type { EmployerAssignment, AssignmentUsage } from '@/types/employer-assignments';

const C = COPY.employer.assignments;

const cell: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.875rem', color: 'var(--ink)' };
const headCell: React.CSSProperties = { ...cell, fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };

interface Props {
  assignments: EmployerAssignment[];
  usageByAssignmentId: Record<string, AssignmentUsage[]>;
  currentRole: Role;
  showArchived: boolean;
  busyId: string | null;
  onCreate: () => void;
  onEdit: (assignment: EmployerAssignment) => void;
  onView: (assignment: EmployerAssignment) => void;
  onClone: (assignment: EmployerAssignment) => void;
  onArchive: (assignment: EmployerAssignment) => void;
  onUnarchive: (assignment: EmployerAssignment) => void;
}

/** Count with the posting titles behind a native <details> expander. */
function UsedByCell({ usage }: { usage: AssignmentUsage[] }) {
  if (usage.length === 0) return <span style={{ color: 'var(--ink-muted)' }}>—</span>;
  return (
    <details>
      <summary style={{ cursor: 'pointer', color: 'var(--link)' }}>
        {`${usage.length} ${usage.length === 1 ? 'posting' : 'postings'}`}
      </summary>
      <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
        {usage.map((job) => (
          <li key={job.id}>{job.title ?? C.untitledPosting}{job.status ? ` · ${job.status}` : ''}</li>
        ))}
      </ul>
    </details>
  );
}

export { inUseReason };

export default function AssignmentsTable({
  assignments, usageByAssignmentId, currentRole, showArchived, busyId,
  onCreate, onEdit, onView, onClone, onArchive, onUnarchive,
}: Props) {
  const visible = showArchived ? assignments : assignments.filter((a) => !a.archivedAt);


  if (visible.length === 0) {
    return (
      <EmptyState
        heading={C.emptyTitle}
        description={C.emptyBody}
        action={<Button onClick={onCreate}>{C.emptyAction}</Button>}
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
        <colgroup>
          {/* Title takes the slack; every other column is sized to its content so
              the row does not sprawl across a wide screen. */}
          <col />
          <col style={{ width: 80 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 70 }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" style={headCell}>{C.columnTitle}</th>
            <th scope="col" style={headCell}>{C.columnHours}</th>
            <th scope="col" style={headCell}>{C.columnAccepts}</th>
            <th scope="col" style={headCell}>{C.columnUsedBy}</th>
            <th scope="col" style={headCell}>{C.columnStatus}</th>
            <th scope="col" style={{ ...headCell, textAlign: 'right' }}>
              <span className="sr-only">{C.columnActions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((assignment, i) => {
            const usage = usageByAssignmentId[assignment.id] ?? [];
            const isArchived = !!assignment.archivedAt;
            const border = i === visible.length - 1 ? 'none' : '1px solid var(--border)';
            const fileTypes = assignment.allowedFileTypes ?? [];

            return (
              <tr key={assignment.id} className="assignments-row">
                <td style={{ ...cell, borderBottom: border }}>
                  <div style={{ fontWeight: 500 }}>{assignment.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', maxWidth: 420 }}>
                    {assignment.publicSummary}
                  </div>
                </td>
                <td style={{ ...cell, borderBottom: border, whiteSpace: 'nowrap' }}>{assignment.estimatedHours}</td>
                <td style={{ ...cell, borderBottom: border }}>
                  {fileTypes.length > 0
                    ? <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{fileTypes.map((t) => <Badge key={t} variant="neutral" size="sm">{t.toUpperCase()}</Badge>)}</div>
                    : <span style={{ color: 'var(--ink-muted)' }}>{C.linkOnly}</span>}
                </td>
                <td style={{ ...cell, borderBottom: border }}><UsedByCell usage={usage} /></td>
                <td style={{ ...cell, borderBottom: border }}>
                  {isArchived
                    ? <Badge variant="neutral">{C.statusArchived}</Badge>
                    : <Badge variant="success">{C.statusActive}</Badge>}
                </td>
                <td style={{ ...cell, borderBottom: border, textAlign: 'right' }}>
                  <ActionsMenu
                    items={buildAssignmentRowItems(assignment, usage, currentRole, { onEdit, onView, onClone, onArchive, onUnarchive })}
                    label={`${C.columnActions} — ${assignment.title}`}
                  />
                  {busyId === assignment.id && (
                    <span className="sr-only" role="status">{COPY.employer.common.saving}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
