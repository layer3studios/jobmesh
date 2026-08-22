'use client';
// FILE: src/components/employer/jobs/RankedTab.tsx
// Ranked view: 220px filter sidebar + candidate table. State, API calls and
// URL sync are identical to the old chip layout — visual restructure only.
// Below 768px the sidebar collapses into a Drawer (RankedMobileFilters).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Alert, Stack, EmptyState, SkeletonCard, useToast } from '@/components/ui';
import {
  listApplicantsWithStats, listStages, listArchiveReasons,
  fetchApplicantFacets, EmployerApplicantsApiError,
} from '@/api/employer-applicants-api';
import type {
  Applicant, ApplicantFacets, ArchiveReason, SavedView, Stage, ApplicantSort,
  AssignmentStats, AssignmentReviewFilter,
} from '@/types/employer-applicants';
import AssignmentFilters from '@/components/employer/jobs/parts/AssignmentFilters';
import { parseAssignmentFilter } from '@/components/employer/jobs/parts/review-helpers';
import {
  filterRankedApplicants, createInitialRankedFilterState, toggleSetValue,
  createInitialServerFilterState, isServerFilterActive, serverFiltersToQuery,
  readServerFiltersFromSearchParams, writeServerFiltersToSearchParams,
  serverFiltersToViewPayload, serverFiltersFromViewPayload,
} from './ranked-filter-helpers';
import type { RankedFilterState, ServerFilterState } from './ranked-filter-helpers';
import { deriveSidebarCounts, countAllActiveFilters } from './ranked-sidebar-helpers';
import { useIsNarrowViewport } from './useIsNarrowViewport';
import RankedFilterSidebar from './RankedFilterSidebar';
import RankedTableToolbar from './RankedTableToolbar';
import RankedCandidateTable from './RankedCandidateTable';
import RankedBulkActions from './RankedBulkActions';
import RankedMobileFilters from './RankedMobileFilters';
import SavedViewsRow from './SavedViewsRow';
import RankedToolbarActions from './RankedToolbarActions';
import { useRankedTriage } from './useRankedKeyboard';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canBulkArchive } from '@/lib/team-permissions';
type LoadState = 'loading' | 'loaded' | 'error';
const LOAD_ERROR_MESSAGE = 'Could not load applicants.';

export default function RankedTab({ postingId }: { postingId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isNarrow = useIsNarrowViewport();
  const { showToast } = useToast();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  // Rendered exactly as the API returns it. undefined means the posting has no
  // assignment, which is the signal to render the plain list unchanged.
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStats | undefined>(undefined);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentReviewFilter | null>(
    () => parseAssignmentFilter(searchParams?.get('assignmentReview')),
  );
  const [stages, setStages] = useState<Stage[]>([]);
  const [reasons, setReasons] = useState<ArchiveReason[]>([]);
  const [facets, setFacets] = useState<ApplicantFacets>({ skills: [], cities: [] });
  const [sort, setSort] = useState<ApplicantSort>('score');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState<RankedFilterState>(createInitialRankedFilterState);
  const [serverFilters, setServerFilters] = useState<ServerFilterState>(
    () => readServerFiltersFromSearchParams(new URLSearchParams(searchParams?.toString() ?? '')),
  );
  const hasLoadedOnce = useRef(false);
  const { viewerRole, viewerCanArchiveApplicants, company } = useEmployer();
  const allowArchive = viewerRole ? canBulkArchive(viewerRole, viewerCanArchiveApplicants) : true;

  const load = useCallback(async (activeSort: ApplicantSort) => {
    setLoadState('loading');
    try {
      const filters = serverFiltersToQuery(serverFilters);
      // The assignment filter is a SERVER filter — the backend owns the predicate,
      // and applying it client-side would silently disagree with the stats.
      if (assignmentFilter) filters.assignmentReview = assignmentFilter;
      const [listResult, stagesResult, reasonsResult] = await Promise.all([
        listApplicantsWithStats(postingId, { sort: activeSort, filters }),
        listStages(),
        listArchiveReasons(),
      ]);
      const applicantsResult = listResult.applicants;
      setApplicants(applicantsResult);
      // Straight assignment, never a computation over the rows above.
      setAssignmentStats(listResult.stats);
      setStages(stagesResult);
      setReasons(reasonsResult);
      const presentIds = new Set(applicantsResult.map((item) => item.application.id));
      setSelectedIds((prev) => new Set([...prev].filter((id) => presentIds.has(id))));
      hasLoadedOnce.current = true;
      setLoadState('loaded');
    } catch (error) {
      setLastError(error instanceof EmployerApplicantsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId, serverFilters, assignmentFilter]);

  useEffect(() => {
    if (!hasLoadedOnce.current) { void load(sort); return; }
    const timer = setTimeout(() => { void load(sort); }, 300);
    return () => clearTimeout(timer);
  }, [load, sort]);

  useEffect(() => {
    let cancelled = false;
    fetchApplicantFacets(postingId)
      .then((result) => { if (!cancelled) setFacets(result); })
      .catch(() => { /* facet sections simply don't render counts */ });
    return () => { cancelled = true; };
  }, [postingId]);

  const handleServerFiltersChange = useCallback((next: ServerFilterState) => {
    setServerFilters(next);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    writeServerFiltersToSearchParams(next, params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  // A saved view restores the sort as well as the filters: "the view I was looking
  // at" includes how it was ordered.
  const activePayloadJson = JSON.stringify(serverFiltersToViewPayload(serverFilters));
  const handleApplyView = useCallback((view: SavedView) => {
    handleServerFiltersChange(serverFiltersFromViewPayload(view.filters));
    const savedSort = (view.filters as { sort?: ApplicantSort })?.sort;
    if (savedSort === 'score' || savedSort === 'date' || savedSort === 'assignment') setSort(savedSort);
  }, [handleServerFiltersChange]);
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
    handleServerFiltersChange(createInitialServerFilterState());
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

  // Chip changes are a server round trip AND a URL write, so a pasted link restores
  // the same filtered view.
  const handleAssignmentFilterChange = useCallback((next: AssignmentReviewFilter | null) => {
    setAssignmentFilter(next);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (next) params.set('assignmentReview', next);
    else params.delete('assignmentReview');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

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
      serverValue={serverFilters} onServerChange={handleServerFiltersChange}
      stages={stages} facets={facets} stageCounts={stageCounts} scoreCounts={scoreCounts}
    />
  );

  return (
    <Stack gap={12}>
      <SavedViewsRow
        postingId={postingId}
        isViewActive={isViewActive}
        canSave={isServerFilterActive(serverFilters) || sort !== 'score'}
        onApply={handleApplyView}
        onSaveCurrent={() => ({ ...serverFiltersToViewPayload(serverFilters), sort })}
      />
      {isNarrow && <RankedMobileFilters activeFilterCount={activeFilterCount}>{sidebar}</RankedMobileFilters>}
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {!isNarrow && (
          <aside className="panel-scroll" style={{ width: 240, flexShrink: 0, paddingRight: 16, borderRight: '0.5px solid var(--border)', position: 'sticky', top: 8, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            {sidebar}
          </aside>
        )}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: isNarrow ? 0 : 16, opacity: isRefetching ? 0.55 : 1, transition: 'opacity 0.15s ease' }} aria-busy={isRefetching}>
          {/* Stays ABOVE the table and outside the sidebar: `stats` is pre-filter,
              computed across every application for the posting, so it describes
              where the posting stands rather than what is on screen. */}
          {hasAssignment && assignmentStats && (
            <AssignmentFilters
              stats={assignmentStats}
              value={assignmentFilter}
              onChange={handleAssignmentFilterChange}
            />
          )}
          <RankedTableToolbar
            applicantCount={filteredApplicants.length}
            activeFilterCount={activeFilterCount}
            sort={sort} onSortChange={setSort}
            showSelect={allowArchive}
            showAssignmentSort={hasAssignment}
            allSelected={allSelected} someSelected={someSelected} onTogglePage={handleTogglePage}
            actions={(
              <RankedToolbarActions
                postingId={postingId}
                canManage={allowArchive}
                onImported={() => void load(sort)}
                helpOpen={isHelpOpen}
                onHelpOpen={openHelp}
                onHelpClose={closeHelp}
                onModalStateChange={setModalOpen}
              />
            )}
          />
          <RankedCandidateTable
            applicants={filteredApplicants}
            postingId={postingId}
            stages={stages}
            activeId={activeId}
            showSelect={allowArchive}
            showAssignment={hasAssignment}
            selectedIds={selectedIds}
            onToggleSelect={(id) => setSelectedIds((prev) => toggleSetValue(prev, id))}
            onClearFilters={clearAllFilters}
            archiveReasons={reasons}
            canArchive={allowArchive}
            onArchived={(name) => {
              showToast('success', `Archived ${name}`);
              void load(sort);
            }}
          />
        </div>
      </div>
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
