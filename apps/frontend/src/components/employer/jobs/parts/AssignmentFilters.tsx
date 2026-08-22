'use client';
// FILE: src/components/employer/jobs/parts/AssignmentFilters.tsx
// The take-home stats strip + filter chips above the Ranked table.
//
// THE STRIP IS PRE-FILTER AND MUST NOT MOVE. `stats` arrives from the API computed
// across every application for the posting, deliberately ignoring the
// assignmentReview filter — so a filtered response legitimately says "47
// applications" beside a single row. Nothing here derives a number from the visible
// rows; there is no reduce, no filter, no length in this file. The copy says
// "47 applications", never "showing 47", because the strip describes where the
// posting stands, not what is on screen.

import { TYPE } from '@/theme/tokens';
import type { AssignmentReviewFilter, AssignmentStats } from '@/types/employer-applicants';
import { ASSIGNMENT_FILTER_CHIPS, formatStatsLine } from './review-helpers';

interface Props {
  stats: AssignmentStats;
  value: AssignmentReviewFilter | null;
  onChange: (next: AssignmentReviewFilter | null) => void;
}

export default function AssignmentFilters({ stats, value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p
        data-testid="assignment-stats"
        style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', margin: 0 }}
      >
        {formatStatsLine(stats)}
      </p>

      <div role="group" aria-label="Filter by assignment review" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {ASSIGNMENT_FILTER_CHIPS.map((chip) => {
          const isActive = value === chip.id;
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(chip.id)}
              style={{
                padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: TYPE.xs, fontWeight: 500,
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: isActive ? 'var(--accent-soft)' : 'var(--surface)',
                color: isActive ? 'var(--accent)' : 'var(--ink-2)',
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
