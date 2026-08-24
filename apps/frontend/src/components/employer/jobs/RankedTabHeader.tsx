'use client';
// FILE: src/components/employer/jobs/RankedTabHeader.tsx
// Everything above the ranked table: the saved-views row, and on a narrow screen
// the drawer that holds the filter sidebar.
//
// Split from RankedTab for size (section 2). Pure composition — the sidebar itself
// is built by the orchestrator and passed in, so the same element renders in the
// drawer here and in the desktop aside without being constructed twice.

import type { ReactNode } from 'react';
import type { SavedView, ApplicantSort } from '@/types/employer-applicants';
import SavedViewsRow from './SavedViewsRow';
import RankedMobileFilters from './RankedMobileFilters';
import { serverFiltersToViewPayload, isServerFilterActive } from './ranked-filter-helpers';
import type { ServerFilterState } from './ranked-filter-helpers';

export interface RankedTabHeaderProps {
  postingId: string;
  sort: ApplicantSort;
  serverFilters: ServerFilterState;
  isViewActive: (view: SavedView) => boolean;
  onApplyView: (view: SavedView) => void;
  isNarrow: boolean;
  activeFilterCount: number;
  sidebar: ReactNode;
}

export default function RankedTabHeader({
  postingId, sort, serverFilters, isViewActive, onApplyView,
  isNarrow, activeFilterCount, sidebar,
}: RankedTabHeaderProps) {
  return (
    <>
      <SavedViewsRow
        postingId={postingId}
        isViewActive={isViewActive}
        canSave={isServerFilterActive(serverFilters) || sort !== 'score'}
        onApply={onApplyView}
        onSaveCurrent={() => ({ ...serverFiltersToViewPayload(serverFilters), sort })}
      />
      {isNarrow && <RankedMobileFilters activeFilterCount={activeFilterCount}>{sidebar}</RankedMobileFilters>}
    </>
  );
}
