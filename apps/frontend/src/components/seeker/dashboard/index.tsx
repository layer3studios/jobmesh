'use client';
// FILE: src/components/seeker/dashboard/index.tsx
// Orchestrator. All state lives in hooks; all UI lives in sibling components.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import type { IJob, ICompany } from '../../../types';
import { COPY } from '../../../theme/brand';
import { buildSkillsRegex } from '../JobDetailPanel';

import { useViewport } from './useViewport';
import { useComeBack } from '../../../hooks/seeker/useComeBack';
import { useDashboardJobs } from './useDashboardJobs';
import { useDashboardFilters } from './useDashboardFilters';
import { useJobFacets } from './useJobFacets';
import DashboardLayout from './DashboardLayout';
import { countNewJobs, applyClientFilters } from './filter-helpers';
import { useDashboardAnalytics, trackJobResultClick } from './useDashboardAnalytics';

export default function Dashboard() {
  const f = useDashboardFilters();
  const [debouncedSearch, setDebouncedSearch] = useState(f.searchInput);

  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const [cos, setCos] = useState<ICompany[]>([]);
  const [jobSheetOpen, setJobSheetOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  /** Job ids whose full document has already been fetched — see the effect below. */
  const hydratedIds = useRef<Set<string>>(new Set());

  const { layoutMode } = useViewport();
  const { appliedJobIds, dismissedJobIds, toggleApplied, toggleDismissed, userSkills, currentUser } = useSeeker();
  const { comeBackMap, toggle: handleToggleComeBack, remove: handleRemoveComeBack } = useComeBack(currentUser);

  const {
    jobs, totalJobs, totalPages, currentPage, loading, loadingMore, error, retry, fetchJobs,
  } = useDashboardJobs({
    sel: f.sel,
    roleCategoryFilter: f.roleCategoryFilter,
    experienceBandFilter: f.experienceBandFilter,
    entryLevelFilter: f.entryLevelFilter,
    workplaceFilter: f.workplaceFilter,
    dateFilter: f.dateFilter,
    debouncedSearch,
    locationsFilter: f.locationsFilter,
    techStackFilter: f.techStackFilter,
    salaryMinFilter: f.salaryMinFilter,
    salaryMaxFilter: f.salaryMaxFilter,
  });

  const facets = useJobFacets();

  // Debounce search input → debouncedSearch → URL
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(f.searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [f.searchInput]);
  useEffect(() => {
    f.setSp(p => { if (debouncedSearch) p.set('q', debouncedSearch); else p.delete('q'); p.delete('page'); });
  }, [debouncedSearch]);

  useEffect(() => { document.title = COPY.site.documentTitleJobs; }, []);

  // Companies directory
  useEffect(() => {
    let cancelled = false;
    fetch('/api/seeker/jobs/directory', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((d: ICompany[]) => { if (!cancelled) setCos(Array.isArray(d) ? d : []); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Restore selectedJob from URL, then make sure it is the FULL document.
  //
  // The feed is projected down to what a card renders and deliberately carries no
  // description (see Db/jobs/jobs-feed-projection.js), but the detail panel is fed
  // from this same array — so a row picked out of `jobs` paints instantly and then
  // has to be topped up by id. `hydratedIds` makes that at most one fetch per job:
  // without it, the effect would see a still-partial doc and refetch forever.
  //
  // When restoring from URL in sheet mode, open the sheet automatically so that
  // deep links (/jobs?selectedJob=<id>) open the detail immediately.
  useEffect(() => {
    if (!f.selectedJobParam) return;
    const id = f.selectedJobParam;
    const found = jobs.find(j => j._id === id);

    // Paint immediately from the list row when we have one — the header, salary
    // and tags are all present there; only the body is missing.
    if (found && id !== selectedJob?._id) {
      setSelectedJob(found);
      // Deep-link: open the sheet so the user sees the job detail immediately.
      if (layoutMode === 'sheet') setJobSheetOpen(true);
    }

    // Completeness of the doc we actually hold decides this, never identity: a job
    // reached from the Similar Jobs rail is already `selectedJob` by the time this
    // runs and is not in `jobs` at all, yet still arrived without a body.
    const current = found ?? (selectedJob?._id === id ? selectedJob : null);
    const needsBody = !current || current.Description === undefined;
    if (!needsBody || hydratedIds.current.has(id)) return;
    hydratedIds.current.add(id);

    let cancelled = false;
    fetch(`/api/seeker/jobs/${encodeURIComponent(id)}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((j: IJob | null) => {
        // Ignore a response that lost the race to a newer selection.
        if (!cancelled && j && j._id === id) setSelectedJob(j);
      })
      .catch(() => { hydratedIds.current.delete(id); });
    return () => { cancelled = true; };
    // `selectedJob` in full, not just its id: the body reads the object to decide
    // whether it still needs a description. Re-running on the hydrated value is
    // harmless — the id then matches, so nothing is overwritten and `hydratedIds`
    // stops a second fetch.
  }, [f.selectedJobParam, jobs, selectedJob, layoutMode]);

  const companyDomainMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cos) if (c.companyName && c.domain) m.set(c.companyName, c.domain);
    return m;
  }, [cos]);

  const visibleJobs = useMemo(
    () => applyClientFilters(jobs, dismissedJobIds, appliedJobIds, f.hideApplied, f.showNewOnly),
    [jobs, dismissedJobIds, f.hideApplied, appliedJobIds, f.showNewOnly],
  );

  const skillRe = useMemo(() => buildSkillsRegex(userSkills), [userSkills]);
  const finalJobs = useMemo(() => {
    if (!f.sortByMatch || !skillRe) return visibleJobs;
    return [...visibleJobs].sort((a, b) => {
      const ha = `${a.JobTitle} ${a.DescriptionPlain || ''} ${(a.autoTags?.techStack || []).join(' ')}`;
      const hb = `${b.JobTitle} ${b.DescriptionPlain || ''} ${(b.autoTags?.techStack || []).join(' ')}`;
      return (hb.match(skillRe) || []).length - (ha.match(skillRe) || []).length;
    });
  }, [visibleJobs, f.sortByMatch, skillRe]);

  // Auto-select first job on desktop split view ONLY.
  // Must not run in sheet mode — it would write selectedJob into the URL on a
  // phone and trigger the sheet to open unprompted.
  useEffect(() => {
    if (layoutMode !== 'split') return;
    if (!selectedJob && finalJobs.length > 0) {
      setSelectedJob(finalJobs[0]);
      f.setSp(p => { p.set('selectedJob', finalJobs[0]._id); });
    }
  }, [layoutMode, finalJobs, selectedJob]);

  const handleSelectJob = useCallback((job: IJob) => {
    trackJobResultClick(job._id, finalJobs.findIndex(j => j._id === job._id));
    setSelectedJob(job);
    f.setSp(p => { p.set('selectedJob', job._id); });
    // In sheet mode (any viewport that is not split), open the bottom sheet.
    if (layoutMode === 'sheet') setJobSheetOpen(true);
  }, [layoutMode, finalJobs]);

  const handleCloseJobSheet = useCallback(() => {
    setJobSheetOpen(false);
    // Clear selectedJob from URL so the back button doesn't re-open the sheet.
    f.setSp(p => { p.delete('selectedJob'); });
  }, []);

  const newJobsCount = useMemo(() => countNewJobs(jobs), [jobs]);
  useDashboardAnalytics({ loading, totalResults: totalJobs, filterCount: f.activeFilters.length, searchInput: f.searchInput });

  // The sort toggle stays HERE rather than moving into the layout: it writes both
  // filter state and the URL, and the layout is deliberately free of state changes.
  const handleToggleSortByMatch = useCallback(() => {
    const v = !f.sortByMatch;
    f.setSortByMatch(v);
    f.setSp(p => { if (v) p.set('sort', 'match'); else p.delete('sort'); });
  }, [f.sortByMatch]);

  return (
    <DashboardLayout
      f={f}
      facets={facets}
      layoutMode={layoutMode}
      jobs={jobs}
      finalJobs={finalJobs}
      totalJobs={totalJobs}
      loading={loading}
      error={error}
      onRetry={retry}
      loadingMore={loadingMore}
      currentPage={currentPage}
      totalPages={totalPages}
      fetchJobs={fetchJobs}
      selectedJob={selectedJob}
      companyDomainMap={companyDomainMap}
      appliedJobIds={appliedJobIds}
      comeBackMap={comeBackMap}
      skillRe={skillRe}
      userSkillsLength={userSkills.length}
      hasSkills={userSkills.length > 0}
      newJobsCount={newJobsCount}
      listRef={listRef}
      jobSheetOpen={jobSheetOpen}
      filterSheetOpen={filterSheetOpen}
      onOpenFilterSheet={() => setFilterSheetOpen(true)}
      onCloseJobSheet={handleCloseJobSheet}
      onCloseFilterSheet={() => setFilterSheetOpen(false)}
      onToggleSortByMatch={handleToggleSortByMatch}
      onSelectJob={handleSelectJob}
      onDismiss={toggleDismissed}
      onToggleApplied={toggleApplied}
      onToggleComeBack={handleToggleComeBack}
      onRemoveComeBack={handleRemoveComeBack}
    />
  );
}
