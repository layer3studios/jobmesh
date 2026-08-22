// FILE: src/components/employer/jobs/ranked-sidebar-helpers.ts
// Pure derivations for the sidebar layout: per-stage/score counts from the
// loaded list, and the combined active-filter count for the toolbar + mobile
// badge. No React, no I/O.

import type { Applicant } from '@/types/employer-applicants';
import { countActiveServerFilters, deriveScoreBucket } from './ranked-filter-helpers';
import type { RankedFilterState, ScoreFilterValue, ServerFilterState } from './ranked-filter-helpers';

export function deriveSidebarCounts(applicants: Applicant[]): {
  stageCounts: Map<string, number>;
  scoreCounts: Map<ScoreFilterValue, number>;
} {
  const stageCounts = new Map<string, number>();
  const scoreCounts = new Map<ScoreFilterValue, number>();
  for (const applicant of applicants) {
    const stageId = applicant.application.stageId;
    stageCounts.set(stageId, (stageCounts.get(stageId) ?? 0) + 1);
    const bucket = deriveScoreBucket(applicant);
    scoreCounts.set(bucket, (scoreCounts.get(bucket) ?? 0) + 1);
  }
  return { stageCounts, scoreCounts };
}

/** Client axes + server categories — one number for "{M} filters active". */
export function countAllActiveFilters(filterState: RankedFilterState, serverFilters: ServerFilterState): number {
  return countActiveServerFilters(serverFilters)
    + (filterState.searchText.trim() !== '' ? 1 : 0)
    + (filterState.stageIds.size > 0 ? 1 : 0)
    + (filterState.scoreValues.size > 0 ? 1 : 0)
    + (filterState.includeArchived ? 1 : 0);
}
