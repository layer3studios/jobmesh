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

  const { isMobile, useSplit } = useViewport();
  const { appliedJobIds, dismissedJobIds, toggleApplied, toggleDismissed, userSkills, currentUser } = useSeeker();
  const { comeBackMap, toggle: handleToggleComeBack, remove: handleRemoveComeBack } = useComeBack(currentUser);

  const {
    jobs, totalJobs, totalPages, currentPage, loading, loadingMore, fetchJobs,
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

  // Restore selectedJob from URL
  useEffect(() => {
    if (!f.selectedJobParam) return;
    const found = jobs.find(j => j._id === f.selectedJobParam);
    if (found) setSelectedJob(found);
    else if (f.selectedJobParam !== selectedJob?._id) {
      fetch(`/api/seeker/jobs/${encodeURIComponent(f.selectedJobParam)}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then((j: IJob | null) => { if (j) setSelectedJob(j); })
        .catch(() => { });
    }
  }, [f.selectedJobParam, jobs, selectedJob?._id]);

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

  // Auto-select first job on desktop
  useEffect(() => {
    if (!useSplit) return;
    if (!selectedJob && finalJobs.length > 0) {
      setSelectedJob(finalJobs[0]);
      f.setSp(p => { p.set('selectedJob', finalJobs[0]._id); });
    }
  }, [useSplit, finalJobs, selectedJob]);

  const handleSelectJob = useCallback((job: IJob) => {
    trackJobResultClick(job._id, finalJobs.findIndex(j => j._id === job._id));
    setSelectedJob(job);
    f.setSp(p => { p.set('selectedJob', job._id); });
    if (isMobile) setJobSheetOpen(true);
  }, [isMobile, finalJobs]);

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
      isMobile={isMobile}
      useSplit={useSplit}
      jobs={jobs}
      finalJobs={finalJobs}
      totalJobs={totalJobs}
      loading={loading}
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
      onCloseJobSheet={() => setJobSheetOpen(false)}
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
