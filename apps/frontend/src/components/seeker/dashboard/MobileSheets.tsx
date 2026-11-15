'use client';
// FILE: src/components/seeker/dashboard/MobileSheets.tsx
// The two mobile-only modal sheets bundled together.

import type { IJob } from '../../../types';
import DashboardJobSheet from '../DashboardJobSheet';
import DashboardFilterSheet from '../DashboardFilterSheet';
import { ROLE_OPTIONS, EXPERIENCE_OPTIONS } from './constants';
import type { JobFacets } from './useJobFacets';
import type { FilterState } from './filter-schema';

interface Props {
  // Job sheet
  job: IJob | null;
  jobSheetOpen: boolean;
  onCloseJobSheet: () => void;
  companyDomainMap: Map<string, string>;
  appliedJobIds: Set<string>;
  comeBackMap: Record<string, string>;
  onToggleApplied: (id: string) => void;
  onToggleComeBack: (id: string, note?: string) => void;
  onRemoveComeBack: (id: string) => void;
  onSelectJob: (job: IJob) => void;
  // Filter sheet
  filterSheetOpen: boolean;
  onCloseFilterSheet: () => void;
  activeFilterCount: number;
  visibleJobsCount: number;
  clearAllFilters: () => void;
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  facets: JobFacets;
}

export default function MobileSheets(p: Props) {
  return (
    <>
      <DashboardJobSheet
        job={p.job}
        isOpen={p.jobSheetOpen}
        onClose={p.onCloseJobSheet}
        domain={p.job ? p.companyDomainMap.get(p.job.Company) : undefined}
        appliedJobIds={p.appliedJobIds}
        comeBackMap={p.comeBackMap}
        onToggleApplied={p.onToggleApplied}
        onToggleComeBack={p.onToggleComeBack}
        onRemoveComeBack={p.onRemoveComeBack}
        onSelectJob={p.onSelectJob}
      />
      <DashboardFilterSheet
        isOpen={p.filterSheetOpen}
        onClose={p.onCloseFilterSheet}
        activeFilterCount={p.activeFilterCount}
        visibleJobsCount={p.visibleJobsCount}
        clearAllFilters={p.clearAllFilters}
        filters={p.filters}
        setFilters={p.setFilters}
        roleOptions={ROLE_OPTIONS}
        experienceOptions={EXPERIENCE_OPTIONS}
        facets={p.facets}
      />
    </>
  );
}
