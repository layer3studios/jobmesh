'use client';
// FILE: src/components/employer/jobs/PipelineCard.tsx
// A draggable applicant card: name/email + initials avatar (score-tinted) on
// top, score pill + time-in-current-stage below. Drag wiring (useSortable with
// stageId data, canMove gating, transform/opacity) is UNCHANGED from the old
// card — this is a reskin. Clicking (no drag movement) opens the applicant.

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock } from 'lucide-react';
import type { Applicant, ArchiveReason } from '@/types/employer-applicants';
import { getScoreBadgeStyle, usableScore, getInitials } from './score-badge-helpers';
import TimeInStage from './parts/TimeInStage';
import QuickArchiveButton from './QuickArchiveButton';

const NO_MOVE_TOOLTIP = "You don't have permission to move applicants. Ask an admin.";

/** `canMove` gates drag (UX only — the backend still enforces the move). */
export default function PipelineCard({
  applicant, isDragging, canMove = true, onOpen,
  archiveReasons = [], canArchive = false, onArchived,
}: {
  applicant: Applicant;
  isDragging?: boolean;
  canMove?: boolean;
  onOpen?: (applicantId: string) => void;
  /** Omitted by the drag overlay, which renders a non-interactive copy. */
  archiveReasons?: ArchiveReason[];
  canArchive?: boolean;
  onArchived?: (candidateName: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isActive } = useSortable({
    id: applicant.application.id,
    data: { stageId: applicant.application.stageId },
    disabled: !canMove,
  });
  const [hovered, setHovered] = useState(false);

  const { contact } = applicant;
  const score = usableScore(applicant.score);
  const badge = getScoreBadgeStyle(score);
  const dragging = isDragging || isActive;
  // Time in CURRENT stage (lastStageMovedAt), not since applied. Falls back to
  // appliedAt so a candidate who has never moved still shows an age.
  const stageMovedAt = applicant.application.lastStageMovedAt ?? applicant.application.appliedAt;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(canMove ? listeners : {})}
      className="pipeline-card"
      title={canMove ? undefined : NO_MOVE_TOOLTIP}
      onClick={() => onOpen?.(applicant.application.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: dragging ? 0.5 : 1,
        touchAction: 'none',
        background: 'var(--surface-sunken)',
        border: `0.5px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: canMove ? (dragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact?.fullName ?? '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact?.email ?? ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {onArchived && (
            <QuickArchiveButton
              candidateName={contact?.fullName ?? 'this candidate'}
              applicationId={applicant.application.id}
              reasons={archiveReasons}
              canArchive={canArchive}
              isArchived={applicant.application.archived != null}
              onArchived={onArchived}
            />
          )}
          <span aria-hidden style={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, background: badge.background, color: badge.color,
          }}>
            {getInitials(contact?.fullName)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: badge.background, color: badge.color, fontWeight: 600 }}>
          {score == null ? '—' : `${score} · ${badge.label}`}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--ink-faint)' }}>
          <Clock size={12} /> <TimeInStage movedAt={stageMovedAt} />
        </span>
      </div>
    </div>
  );
}
