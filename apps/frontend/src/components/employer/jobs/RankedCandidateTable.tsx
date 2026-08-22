'use client';
// FILE: src/components/employer/jobs/RankedCandidateTable.tsx
// The candidate table card: header row, hairline-separated data rows, and the
// filtered-empty state. Row behaviour (navigate on click, checkbox exempt)
// lives in RankedCandidateRow.

import { Button } from '@/components/ui';
import type { Applicant, Stage, ArchiveReason } from '@/types/employer-applicants';
import RankedCandidateRow from './RankedCandidateRow';

const HEADER_CELL = { fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' } as const;

export default function RankedCandidateTable({
  applicants, postingId, stages, showSelect, showAssignment = false, selectedIds, onToggleSelect, onClearFilters,
  archiveReasons, canArchive, onArchived, activeId = null,
}: {
  applicants: Applicant[];
  postingId: string;
  stages: Stage[];
  showSelect: boolean;
  /** Passed straight through to each row's quick-archive popover. */
  archiveReasons: ArchiveReason[];
  canArchive: boolean;
  onArchived: (candidateName: string) => void;
  /**
   * True only for a posting with an assignment. When false the table renders
   * exactly as it did before 8c — no Task header, no Task cell.
   */
  showAssignment?: boolean;
  selectedIds: ReadonlySet<string>;
  onToggleSelect: (id: string) => void;
  onClearFilters: () => void;
  /** The keyboard-highlighted row, or null. Not the same as selection. */
  activeId?: string | null;
}) {
  const stageNameById = new Map(stages.map((stage) => [stage.id, stage.text]));

  if (applicants.length === 0) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)' }}>No applicants match these filters</p>
        <Button variant="link" size="sm" onClick={onClearFilters}>Clear filters</Button>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface-sunken)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div role="row" style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
        background: 'var(--surface-raised)', borderBottom: '0.5px solid var(--border)',
      }}>
        {showSelect && <span style={{ width: 15, flexShrink: 0 }} />}
        <span style={{ flex: 1, ...HEADER_CELL }}>Applicant</span>
        <span style={{ width: 120, flexShrink: 0, ...HEADER_CELL }}>{showAssignment ? 'Resume' : 'Score'}</span>
        {showAssignment && <span style={{ width: 110, flexShrink: 0, ...HEADER_CELL }}>Task</span>}
        <span style={{ width: 100, flexShrink: 0, ...HEADER_CELL }}>Stage</span>
        <span style={{ width: 80, flexShrink: 0, ...HEADER_CELL }}>Applied</span>
        <span style={{ width: 92, flexShrink: 0 }} />
      </div>
      {applicants.map((applicant, index) => (
        <div key={applicant.application.id} style={{ borderBottom: index < applicants.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
          <RankedCandidateRow
            applicant={applicant}
            postingId={postingId}
            stageName={stageNameById.get(applicant.application.stageId) ?? '—'}
            showSelect={showSelect}
            showAssignment={showAssignment}
            isSelected={selectedIds.has(applicant.application.id)}
            isActive={activeId === applicant.application.id}
            onToggleSelect={onToggleSelect}
            archiveReasons={archiveReasons}
            canArchive={canArchive}
            onArchived={onArchived}
          />
        </div>
      ))}
    </div>
  );
}
