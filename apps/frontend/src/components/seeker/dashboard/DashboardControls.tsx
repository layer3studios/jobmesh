'use client';
// FILE: src/components/seeker/dashboard/DashboardControls.tsx
// Search bar + filter bar + applied-chips row, picked based on viewport.
//
// The filters hook arrives whole rather than exploded into forty props: it is
// one cohesive value (state + the single writer), and passing it through means
// a new filter needs no change here.

import DashboardSearchBar from '../DashboardSearchBar';
import DashboardMobileFilters from '../DashboardMobileFilters';
import DashboardFilterBar from '../DashboardFilterBar';
import ActiveChips from './ActiveChips';
import { ROLE_OPTIONS, EXPERIENCE_OPTIONS, desktopSelectStyle } from './constants';
import type { DashboardFilters } from './useDashboardFilters';
import type { JobFacets } from './useJobFacets';

interface Props {
  isMobile: boolean;
  f: DashboardFilters;
  facets: JobFacets;
  hasSkills: boolean;
  newJobsCount: number;
  onOpenMobileFilters: () => void;
}

export default function DashboardControls({
  isMobile, f, facets, hasSkills, newJobsCount, onOpenMobileFilters,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      <DashboardSearchBar
        search={f.searchInput}
        onSearchChange={f.setSearchInput}
        sortByMatch={f.filters.sortByMatch}
        onToggleSortByMatch={() => f.setFilters({ sortByMatch: !f.filters.sortByMatch })}
        hasSkills={hasSkills}
      />
      {isMobile ? (
        <DashboardMobileFilters
          filters={f.filters}
          setFilters={f.setFilters}
          newJobsCount={newJobsCount}
          activeMobileFilters={f.chips.length}
          onOpenFilters={onOpenMobileFilters}
        />
      ) : (
        <DashboardFilterBar
          filters={f.filters}
          setFilters={f.setFilters}
          moreCount={f.moreCount}
          roleOptions={ROLE_OPTIONS}
          experienceOptions={EXPERIENCE_OPTIONS}
          desktopSelectStyle={desktopSelectStyle}
          facets={facets}
          newJobsCount={newJobsCount}
        />
      )}
      <ActiveChips
        chips={f.chips}
        onRemove={chip => f.setFilters(chip.patch)}
        onClearAll={f.clearAll}
      />
    </div>
  );
}
