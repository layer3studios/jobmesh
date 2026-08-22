'use client';
// FILE: src/components/employer/jobs/PipelineColumn.tsx
// One Kanban column: stage-coloured 2px header underline, count pill, and the
// droppable body. Drop wiring is UNCHANGED — useDroppable spans the body (empty
// columns included) and exposes stageId via data; SortableContext keeps
// keyboard navigation. isOver now paints a dashed accent inside the body.

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PipelineCard from '@/components/employer/jobs/PipelineCard';
import type { Applicant, Stage, ArchiveReason } from '@/types/employer-applicants';

/** Stage accent by (case-insensitive) name; custom stages fall back to grey. */
const STAGE_COLOR_BY_NAME: Record<string, string> = {
  applied: 'var(--cat-green)', shortlisted: 'var(--accent)', interview: 'var(--cat-amber)',
  offer: 'var(--cat-purple)', hired: 'var(--cat-green)',
};
export const stageColor = (stageName: string): string =>
  STAGE_COLOR_BY_NAME[stageName.trim().toLowerCase()] ?? 'var(--ink-2)';

export default function PipelineColumn({
  stage, applicants, canMove = true, onOpen, scrollMode = false,
  archiveReasons = [], canArchive = false, onArchived,
}: {
  stage: Stage;
  applicants: Applicant[];
  canMove?: boolean;
  onOpen?: (applicantId: string) => void;
  /** >6 stages: fixed-width columns inside a horizontal scroller. */
  scrollMode?: boolean;
  /** Passed straight through to each card's quick-archive popover. */
  archiveReasons?: ArchiveReason[];
  canArchive?: boolean;
  onArchived?: (candidateName: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { stageId: stage.id } });
  const color = stageColor(stage.text);

  return (
    <div
      data-testid={`pipeline-column-${stage.id}`}
      style={{
        background: 'var(--surface-raised)', border: '0.5px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
        ...(scrollMode ? { minWidth: 260, flexShrink: 0 } : { minWidth: 0 }),
      }}
    >
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: `2px solid ${color}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{stage.text}</span>
        <span style={{
          fontSize: 12, color: 'var(--ink-faint)', background: 'var(--surface)',
          borderRadius: 999, padding: '1px 8px',
        }}>
          {applicants.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        style={{
          padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200,
          outline: isOver ? '2px dashed var(--accent)' : 'none', outlineOffset: -4,
          background: isOver ? 'var(--accent-soft)' : 'transparent',
        }}
      >
        <SortableContext
          items={applicants.map((applicant) => applicant.application.id)}
          strategy={verticalListSortingStrategy}
        >
          {applicants.map((applicant) => (
            <PipelineCard
              key={applicant.application.id}
              applicant={applicant}
              canMove={canMove}
              onOpen={onOpen}
              archiveReasons={archiveReasons}
              canArchive={canArchive}
              onArchived={onArchived}
            />
          ))}
          {applicants.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--ink-faint)' }}>
              Drop here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
