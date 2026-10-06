'use client';
// FILE: src/components/seeker/dashboard/DashboardLayout.tsx
// The dashboard's JSX composition: page header, controls, body, mobile sheets.
//
// Split from index.tsx purely for size (section 2). Nothing decides anything here
// — every value and every handler arrives as a prop, so the orchestrator remains
// the only place state changes.
//
// The filters object `f` and `facets` are passed WHOLE rather than exploded into
// forty individual props. They are already cohesive hook returns, and their types
// are taken with ReturnType so this file cannot drift out of step with the hooks.

import type { RefObject } from 'react';
import type { IJob } from '../../../types';
import { Container } from '../../ui';
import { COPY } from '../../../theme/brand';
import type { useSeeker } from '../../../context/seeker/SeekerContext';
import type { useComeBack } from '../../../hooks/seeker/useComeBack';
import type { useDashboardFilters } from './useDashboardFilters';
import type { useJobFacets } from './useJobFacets';
import type { useDashboardJobs } from './useDashboardJobs';
import type { DashboardLayoutMode } from './useViewport';
import DashboardControls from './DashboardControls';
import DashboardBody from './DashboardBody';
import MobileSheets from './MobileSheets';

type Seeker = ReturnType<typeof useSeeker>;
type ComeBack = ReturnType<typeof useComeBack>;

export interface DashboardLayoutProps {
  f: ReturnType<typeof useDashboardFilters>;
  facets: ReturnType<typeof useJobFacets>;
  layoutMode: DashboardLayoutMode;

  jobs: IJob[];
  finalJobs: IJob[];
  totalJobs: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  loadingMore: boolean;
  currentPage: number;
  totalPages: number;
  fetchJobs: ReturnType<typeof useDashboardJobs>['fetchJobs'];

  selectedJob: IJob | null;
  companyDomainMap: Map<string, string>;
  appliedJobIds: Seeker['appliedJobIds'];
  comeBackMap: ComeBack['comeBackMap'];
  skillRe: RegExp | null;
  userSkillsLength: number;
  hasSkills: boolean;
  newJobsCount: number;
  listRef: RefObject<HTMLDivElement | null>;

  jobSheetOpen: boolean;
  filterSheetOpen: boolean;
  onOpenFilterSheet: () => void;
  onCloseJobSheet: () => void;
  onCloseFilterSheet: () => void;

  onToggleSortByMatch: () => void;
  onSelectJob: (job: IJob) => void;
  onDismiss: Seeker['toggleDismissed'];
  onToggleApplied: Seeker['toggleApplied'];
  onToggleComeBack: ComeBack['toggle'];
  onRemoveComeBack: ComeBack['remove'];
}

export default function DashboardLayout(p: DashboardLayoutProps) {
  const { f, facets, layoutMode } = p;

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(16px, 4vw, 24px)', paddingBottom: layoutMode === 'sheet' ? 80 : 40, width: '100%' }}>
      {/* No page title: the search band is the header. One mono line states scale. */}
      <p style={{
        fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
        fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--ink-muted)', marginBottom: 12,
      }}>
        {COPY.jobs.pageLabel} · {p.loading && p.jobs.length === 0 ? 'Loading…' : <span className="jb-count">{p.totalJobs.toLocaleString()} {COPY.jobs.rolesAvailable}</span>}
      </p>

      <DashboardControls
        isMobile={layoutMode === 'sheet'}
        searchInput={f.searchInput} setSearchInput={f.setSearchInput}
        sortByMatch={f.sortByMatch}
        toggleSortByMatch={p.onToggleSortByMatch}
        hasSkills={p.hasSkills}
        sel={f.sel}
        roleCategoryFilter={f.roleCategoryFilter} setRoleCategoryFilter={f.setRoleCategoryFilter}
        experienceBandFilter={f.experienceBandFilter} setExperienceBandFilter={f.setExperienceBandFilter}
        workplaceFilter={f.workplaceFilter} setWorkplaceFilter={f.setWorkplaceFilter}
        dateFilter={f.dateFilter} setDateFilter={f.setDateFilter}
        entryLevelFilter={f.entryLevelFilter} setEntryLevelFilter={f.setEntryLevelFilter}
        hideApplied={f.hideApplied} setHideApplied={f.setHideApplied}
        showNewOnly={f.showNewOnly} setShowNewOnly={f.setShowNewOnly}
        newJobsCount={p.newJobsCount}
        facets={facets}
        locationsFilter={f.locationsFilter} setLocationsFilter={f.setLocationsFilter}
        techStackFilter={f.techStackFilter} setTechStackFilter={f.setTechStackFilter}
        salaryMinFilter={f.salaryMinFilter} salaryMaxFilter={f.salaryMaxFilter}
        setSalaryFilter={f.setSalaryFilter}
        activeFilters={f.activeFilters}
        onClearAllFilters={f.clearAll}
        onOpenMobileFilters={p.onOpenFilterSheet}
        setSp={f.setSp}
      />

      <DashboardBody
        loading={p.loading} error={p.error} onRetry={p.onRetry} jobs={p.jobs} finalJobs={p.finalJobs}
        useSplit={layoutMode === 'split'}
        selectedJob={p.selectedJob}
        companyDomainMap={p.companyDomainMap}
        appliedJobIds={p.appliedJobIds} comeBackMap={p.comeBackMap}
        skillRe={p.skillRe} userSkillsLength={p.userSkillsLength}
        hasMore={p.currentPage < p.totalPages} loadingMore={p.loadingMore} currentPage={p.currentPage}
        entryLevelFilter={f.entryLevelFilter}
        activeFiltersCount={f.activeFilters.length}
        listRef={p.listRef}
        onLoadMore={p.fetchJobs}
        onSelect={p.onSelectJob}
        onDismiss={p.onDismiss}
        onToggleApplied={p.onToggleApplied}
        onToggleComeBack={p.onToggleComeBack}
        onRemoveComeBack={p.onRemoveComeBack}
        onClearFilters={f.clearAll}
      />

      {/* Sheet-mode mobile sheets: rendered for ALL non-split layouts, not just
          phones narrower than 768px. Portaled to document.body in each component
          so they escape the .page-enter containing block. */}
      {layoutMode === 'sheet' && (
        <MobileSheets
          job={p.selectedJob}
          jobSheetOpen={p.jobSheetOpen}
          onCloseJobSheet={p.onCloseJobSheet}
          companyDomainMap={p.companyDomainMap}
          appliedJobIds={p.appliedJobIds} comeBackMap={p.comeBackMap}
          onToggleApplied={p.onToggleApplied}
          onToggleComeBack={p.onToggleComeBack}
          onRemoveComeBack={p.onRemoveComeBack}
          onSelectJob={p.onSelectJob}
          filterSheetOpen={p.filterSheetOpen}
          onCloseFilterSheet={p.onCloseFilterSheet}
          activeFilterCount={f.activeFilters.length}
          visibleJobsCount={p.finalJobs.length}
          clearAllFilters={f.clearAll}
          roleCategoryFilter={f.roleCategoryFilter}
          experienceBandFilter={f.experienceBandFilter}
          workplaceFilter={f.workplaceFilter}
          dateFilter={f.dateFilter}
          setRoleCategoryFilter={f.setRoleCategoryFilter}
          setExperienceBandFilter={f.setExperienceBandFilter}
          setWorkplaceFilter={f.setWorkplaceFilter}
          setDateFilter={f.setDateFilter}
          setSp={f.setSp}
          facets={facets}
          locationsFilter={f.locationsFilter} setLocationsFilter={f.setLocationsFilter}
          techStackFilter={f.techStackFilter} setTechStackFilter={f.setTechStackFilter}
          salaryMinFilter={f.salaryMinFilter} salaryMaxFilter={f.salaryMaxFilter}
          setSalaryFilter={f.setSalaryFilter}
        />
      )}
    </Container>
  );
}
