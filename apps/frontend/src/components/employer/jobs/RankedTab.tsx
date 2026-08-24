'use client';
// FILE: src/components/employer/jobs/RankedTab.tsx
// Ranked view orchestrator: loads applicants, owns filter and selection state,
// and composes the header, sidebar and table.
//
// The layout is a 240px filter sidebar plus a candidate table; below 768px the
// sidebar collapses into a Drawer (RankedMobileFilters). Everything visual lives
// in RankedTabHeader / RankedTabContent, and the URL-backed filters live in
// useRankedUrlSync — this file is state and composition only.

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Alert, Stack, EmptyState, SkeletonCard, useToast } from '@/components/ui';
import type { SavedView, ApplicantSort } from '@/types/employer-applicants';
import {
  filterRankedApplicants, createInitialRankedFilterState, toggleSetValue,
  isServerFilterActive,
  serverFiltersToViewPayload, serverFiltersFromViewPayload,
} from './ranked-filter-helpers';
import type { RankedFilterState } from './ranked-filter-helpers';
import { deriveSidebarCounts, countAllActiveFilters } from './ranked-sidebar-helpers';
import { useIsNarrowViewport } from './useIsNarrowViewport';
import { useRankedUrlSync } from './useRankedUrlSync';
import { useRankedApplicants } from './useRankedApplicants';
import RankedFilterSidebar from './RankedFilterSidebar';
import RankedBulkActions from './RankedBulkActions';
import RankedTabHeader from './RankedTabHeader';
import RankedTabContent from './RankedTabContent';
import { useRankedTriage } from './useRankedKeyboard';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canBulkArchive } from '@/lib/team-permissions';

export default function RankedTab({ postingId }: { postingId: string }) {
  const router = useRouter();
  const isNarrow = useIsNarrowViewport();
  const { showToast } = useToast();

  const [sort, setSort] = useState<ApplicantSort>('score');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState<RankedFilterState>(createInitialRankedFilterState);
  const {
    serverFilters, setServerFilters, assignmentFilter, setAssignmentFilter, clearServerFilters,
  } = useRankedUrlSync();
  const { viewerRole, viewerCanArchiveApplicants, company } = useEmployer();
  const allowArchive = viewerRole ? canBulkArchive(viewerRole, viewerCanArchiveApplicants) : true;

  const {
    applicants, assignmentStats, stages, reasons, facets,
    loadState, lastError, hasLoadedOnce, reload,
  } = useRankedApplicants({
    postingId, sort, serverFilters, assignmentFilter,
    // Drop any selection whose row is no longer in the list.
    onLoaded: (presentIds) => setSelectedIds(
      (prev) => new Set([...prev].filter((id) => presentIds.has(id))),
    ),
  });
  const load = reload;

  // A saved view restores the sort as well as the filters: "the view I was looking
  // at" includes how it was ordered.
  const activePayloadJson = JSON.stringify(serverFiltersToViewPayload(serverFilters));
  const handleApplyView = useCallback((view: SavedView) => {
    setServerFilters(serverFiltersFromViewPayload(view.filters));
    const savedSort = (view.filters as { sort?: ApplicantSort })?.sort;
    if (savedSort === 'score' || savedSort === 'date' || savedSort === 'assignment') setSort(savedSort);
  }, [setServerFilters]);
  const isViewActive = useCallback((view: SavedView) =>
    JSON.stringify(serverFiltersToViewPayload(serverFiltersFromViewPayload(view.filters))) === activePayloadJson,
  [activePayloadJson]);

  const filteredApplicants = useMemo(
    () => filterRankedApplicants(applicants, filterState), [applicants, filterState],
  );

  // Sidebar counts derive from the loaded (server-filtered) list.
  const { stageCounts, scoreCounts } = useMemo(() => deriveSidebarCounts(applicants), [applicants]);
  const activeFilterCount = countAllActiveFilters(filterState, serverFilters);

  const clearAllFilters = () => {
    setFilterState(createInitialRankedFilterState());
    clearServerFilters();
  };

  const visibleIds = useMemo(
    () => filteredApplicants.map((item) => item.application.id), [filteredApplicants],
  );
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));
  const handleTogglePage = () => setSelectedIds((prev) => {
    if (!allSelected) return new Set([...prev, ...visibleIds]);
    return new Set([...prev].filter((id) => !visibleIds.includes(id)));
  });

  // Keyboard triage: ↑/↓/j/k, Enter, a, m, s, ? — see useRankedKeyboard.
  const { activeId, isHelpOpen, openHelp, closeHelp, setModalOpen } = useRankedTriage({
    visibleIds, postingId,
    onNavigate: (href) => router.push(href),
    onSelect: (id) => setSelectedIds((prev) => new Set(prev).add(id)),
    onToggleSelect: (id) => setSelectedIds((prev) => toggleSetValue(prev, id)),
  });

  // The presence of `stats` IS the signal. A plain posting gets no strip, no chips,
  // no extra column and no extra sort option — markup identical to before 8c.
  const hasAssignment = assignmentStats !== undefined;

  // Full skeleton only before the first load; refetches keep the table visible
  // with a subtle dim (Chunk 1: no full-page spinner on filter change).
  if (loadState === 'loading' && !hasLoadedOnce.current) return <SkeletonCard lines={5} />;
  const isRefetching = loadState === 'loading';
  if (loadState === 'error') {
    return (
      <Alert type="error">
        <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
          <span>{lastError}</span>
          <Button variant="ghost" size="sm" onClick={() => void load(sort)}>Retry</Button>
        </Stack>
      </Alert>
    );
  }
  if (applicants.length === 0 && !isServerFilterActive(serverFilters)) {
    return <EmptyState title="No applications yet" description="Share your apply URL to start receiving applications." />;
  }

  const sidebar = (
    <RankedFilterSidebar
      value={filterState} onChange={setFilterState}
      serverValue={serverFilters} onServerChange={setServerFilters}
      stages={stages} facets={facets} stageCounts={stageCounts} scoreCounts={scoreCounts}
    />
  );

  return (
    <Stack gap={12}>
      <RankedTabHeader
        postingId={postingId}
        sort={sort}
        serverFilters={serverFilters}
        isViewActive={isViewActive}
        onApplyView={handleApplyView}
        isNarrow={isNarrow}
        activeFilterCount={activeFilterCount}
        sidebar={sidebar}
      />
      <RankedTabContent
        postingId={postingId}
        isNarrow={isNarrow}
        isRefetching={isRefetching}
        sidebar={sidebar}
        applicants={filteredApplicants}
        stages={stages}
        archiveReasons={reasons}
        activeId={activeId}
        sort={sort}
        onSortChange={setSort}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearAllFilters}
        hasAssignment={hasAssignment}
        assignmentStats={assignmentStats}
        assignmentFilter={assignmentFilter}
        onAssignmentFilterChange={setAssignmentFilter}
        allowArchive={allowArchive}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        onTogglePage={handleTogglePage}
        onToggleSelect={(id) => setSelectedIds((prev) => toggleSetValue(prev, id))}
        onArchived={(name) => { showToast('success', `Archived ${name}`); void load(sort); }}
        helpOpen={isHelpOpen}
        onHelpOpen={openHelp}
        onHelpClose={closeHelp}
        onModalStateChange={setModalOpen}
        onImported={() => void load(sort)}
      />
      {allowArchive && (
        <RankedBulkActions
          postingId={postingId}
          companyId={company?.id}
          reasons={reasons} stages={stages}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onArchived={() => void load(sort)}
        />
      )}
    </Stack>
  );
}
