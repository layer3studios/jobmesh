'use client';
// FILE: src/components/employer/jobs/RankedTabContent.tsx
// The ranked view's body: the desktop filter aside, the assignment strip, the
// table toolbar and the candidate table.
//
// Split from RankedTab for size (section 2). Nothing decides anything here —
// every value and handler arrives as a prop.
//
// The refetch dim lives on the content column rather than the whole tab, which is
// what keeps the table on screen while a filter change is in flight instead of
// collapsing the page back to a skeleton.

import type { ReactNode } from 'react';
import type {
  Applicant, ArchiveReason, Stage, ApplicantSort,
  AssignmentStats, AssignmentReviewFilter,
} from '@/types/employer-applicants';
import AssignmentFilters from '@/components/employer/jobs/parts/AssignmentFilters';
import RankedTableToolbar from './RankedTableToolbar';
import RankedCandidateTable from './RankedCandidateTable';
import RankedToolbarActions from './RankedToolbarActions';

export interface RankedTabContentProps {
  postingId: string;
  isNarrow: boolean;
  isRefetching: boolean;
  sidebar: ReactNode;

  applicants: Applicant[];
  stages: Stage[];
  archiveReasons: ArchiveReason[];
  activeId: string | null;

  sort: ApplicantSort;
  onSortChange: (sort: ApplicantSort) => void;
  activeFilterCount: number;
  onClearFilters: () => void;

  hasAssignment: boolean;
  assignmentStats: AssignmentStats | undefined;
  assignmentFilter: AssignmentReviewFilter | null;
  onAssignmentFilterChange: (next: AssignmentReviewFilter | null) => void;

  allowArchive: boolean;
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  onTogglePage: () => void;
  onToggleSelect: (id: string) => void;
  onArchived: (name: string) => void;

  helpOpen: boolean;
  onHelpOpen: () => void;
  onHelpClose: () => void;
  onModalStateChange: (open: boolean) => void;
  onImported: () => void;
}

export default function RankedTabContent(p: RankedTabContentProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
      {!p.isNarrow && (
        <aside className="panel-scroll" style={{ width: 240, flexShrink: 0, paddingRight: 16, borderRight: '0.5px solid var(--border)', position: 'sticky', top: 8, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
          {p.sidebar}
        </aside>
      )}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: p.isNarrow ? 0 : 16, opacity: p.isRefetching ? 0.55 : 1, transition: 'opacity 0.15s ease' }} aria-busy={p.isRefetching}>
        {/* Stays ABOVE the table and outside the sidebar: `stats` is pre-filter,
            computed across every application for the posting, so it describes
            where the posting stands rather than what is on screen. */}
        {p.hasAssignment && p.assignmentStats && (
          <AssignmentFilters
            stats={p.assignmentStats}
            value={p.assignmentFilter}
            onChange={p.onAssignmentFilterChange}
          />
        )}
        <RankedTableToolbar
          applicantCount={p.applicants.length}
          activeFilterCount={p.activeFilterCount}
          sort={p.sort} onSortChange={p.onSortChange}
          showSelect={p.allowArchive}
          showAssignmentSort={p.hasAssignment}
          allSelected={p.allSelected} someSelected={p.someSelected} onTogglePage={p.onTogglePage}
          actions={(
            <RankedToolbarActions
              postingId={p.postingId}
              canManage={p.allowArchive}
              onImported={p.onImported}
              helpOpen={p.helpOpen}
              onHelpOpen={p.onHelpOpen}
              onHelpClose={p.onHelpClose}
              onModalStateChange={p.onModalStateChange}
            />
          )}
        />
        <RankedCandidateTable
          applicants={p.applicants}
          postingId={p.postingId}
          stages={p.stages}
          activeId={p.activeId}
          showSelect={p.allowArchive}
          showAssignment={p.hasAssignment}
          selectedIds={p.selectedIds}
          onToggleSelect={p.onToggleSelect}
          onClearFilters={p.onClearFilters}
          archiveReasons={p.archiveReasons}
          canArchive={p.allowArchive}
          onArchived={p.onArchived}
        />
      </div>
    </div>
  );
}
