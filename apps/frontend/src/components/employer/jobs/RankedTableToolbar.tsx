'use client';
// FILE: src/components/employer/jobs/RankedTableToolbar.tsx
// The line above the table: "{N} applicants · {M} filters active" on the left,
// select-all + sort on the right. Sort options are unchanged from the old tab.

import { Select } from '@/components/ui';
import type { ApplicantSort } from '@/types/employer-applicants';

const SORT_OPTIONS = [
  { value: 'score', label: 'Score: high to low' },
  { value: 'date', label: 'Applied: newest first' },
];
// Offered only for an assignment posting — sorting by a task score every row lacks
// would be a control that does nothing.
const ASSIGNMENT_SORT_OPTION = { value: 'assignment', label: 'Task score: high to low' };

export default function RankedTableToolbar({
  applicantCount, activeFilterCount, sort, onSortChange,
  showSelect, showAssignmentSort = false, allSelected, someSelected, onTogglePage, actions = null,
}: {
  applicantCount: number;
  activeFilterCount: number;
  sort: ApplicantSort;
  onSortChange: (sort: ApplicantSort) => void;
  showSelect: boolean;
  showAssignmentSort?: boolean;
  allSelected: boolean;
  someSelected: boolean;
  onTogglePage: () => void;
  /** Posting-level actions (export, import, shortcuts) — rendered before the sort. */
  actions?: React.ReactNode;
}) {
  const summary = activeFilterCount > 0
    ? `${applicantCount} applicant${applicantCount === 1 ? '' : 's'} · ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active`
    : `${applicantCount} applicant${applicantCount === 1 ? '' : 's'}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)' }}>{summary}</span>
      {showSelect && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-muted)', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={allSelected} aria-label="Select all applicants on this page"
            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
            onChange={onTogglePage}
            style={{ accentColor: 'var(--accent)' }}
          />
          Select all
        </label>
      )}
      {actions && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
      <div style={{ width: 200 }}>
        <Select aria-label="Sort applicants" value={sort}
          options={showAssignmentSort ? [...SORT_OPTIONS, ASSIGNMENT_SORT_OPTION] : SORT_OPTIONS}
          onChange={(event) => onSortChange(event.target.value as ApplicantSort)} />
      </div>
    </div>
  );
}
