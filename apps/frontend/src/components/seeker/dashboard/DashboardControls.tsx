'use client';
// FILE: src/components/seeker/dashboard/DashboardControls.tsx
// Search bar + filter bar + active chips row, picked based on viewport.

import DashboardSearchBar from '../DashboardSearchBar';
import DashboardMobileFilters from '../DashboardMobileFilters';
import DashboardFilterBar from '../DashboardFilterBar';
import ActiveChips from './ActiveChips';
import { ROLE_OPTIONS, EXPERIENCE_OPTIONS, desktopSelectStyle } from './constants';
import type { JobFacets } from './useJobFacets';

interface Props {
  isMobile: boolean;
  // Search
  searchInput: string;
  setSearchInput: (v: string) => void;
  sortByMatch: boolean;
  toggleSortByMatch: () => void;
  hasSkills: boolean;
  // Filters
  sel: string;
  roleCategoryFilter: string;
  experienceBandFilter: string[];
  workplaceFilter: string[];
  dateFilter: string;
  entryLevelFilter: boolean;
  hideApplied: boolean;
  showNewOnly: boolean;
  newJobsCount: number;
  setRoleCategoryFilter: (v: string) => void;
  setExperienceBandFilter: (v: string[]) => void;
  setWorkplaceFilter: (v: string[]) => void;
  setDateFilter: (v: string) => void;
  setEntryLevelFilter: (v: boolean) => void;
  setHideApplied: (v: boolean) => void;
  setShowNewOnly: (v: boolean) => void;
  facets: JobFacets;
  locationsFilter: string[];
  setLocationsFilter: (v: string[]) => void;
  techStackFilter: string[];
  setTechStackFilter: (v: string[]) => void;
  salaryMinFilter: string;
  salaryMaxFilter: string;
  setSalaryFilter: (min: string, max: string) => void;
  // Chips
  activeFilters: { label: string; clear: () => void }[];
  onClearAllFilters: () => void;
  onOpenMobileFilters: () => void;
  setSp: (fn: (sp: URLSearchParams) => void) => void;
}

export default function DashboardControls(p: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      <DashboardSearchBar
        search={p.searchInput}
        onSearchChange={p.setSearchInput}
        sortByMatch={p.sortByMatch}
        onToggleSortByMatch={p.toggleSortByMatch}
        hasSkills={p.hasSkills}
      />
      {p.isMobile ? (
        <DashboardMobileFilters
          hideApplied={p.hideApplied}
          entryLevelFilter={p.entryLevelFilter}
          showNewOnly={p.showNewOnly}
          newJobsCount={p.newJobsCount}
          setHideApplied={p.setHideApplied}
          setEntryLevelFilter={p.setEntryLevelFilter}
          setShowNewOnly={p.setShowNewOnly}
          setSp={p.setSp}
          activeMobileFilters={p.activeFilters.length}
          onOpenFilters={p.onOpenMobileFilters}
        />
      ) : (
        <DashboardFilterBar
          roleCategoryFilter={p.roleCategoryFilter}
          experienceBandFilter={p.experienceBandFilter}
          workplaceFilter={p.workplaceFilter}
          dateFilter={p.dateFilter}
          sel={p.sel} cos="" roleOptions={ROLE_OPTIONS} experienceOptions={EXPERIENCE_OPTIONS}
          desktopSelectStyle={desktopSelectStyle}
          setRoleCategoryFilter={p.setRoleCategoryFilter}
          setExperienceBandFilter={p.setExperienceBandFilter}
          setWorkplaceFilter={p.setWorkplaceFilter}
          setDateFilter={p.setDateFilter}
          setSel={() => { }} setCos={() => { }}
          setSp={p.setSp}
          facets={p.facets}
          locationsFilter={p.locationsFilter}
          setLocationsFilter={p.setLocationsFilter}
          techStackFilter={p.techStackFilter}
          setTechStackFilter={p.setTechStackFilter}
          salaryMinFilter={p.salaryMinFilter}
          salaryMaxFilter={p.salaryMaxFilter}
          setSalaryFilter={p.setSalaryFilter}
        />
      )}
      <ActiveChips filters={p.activeFilters} onClearAll={p.onClearAllFilters} />
    </div>
  );
}
