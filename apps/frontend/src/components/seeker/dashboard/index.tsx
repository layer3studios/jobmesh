'use client';
// FILE: src/components/seeker/dashboard/index.tsx
// Orchestrator. All state lives in hooks; all UI lives in sibling components.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import type { IJob, ICompany } from '../../../types';
import { Container, PageHeader } from '../../ui';
import { COPY } from '../../../theme/brand';
import { buildSkillsRegex } from '../JobDetailPanel';

import { useViewport } from './useViewport';
import { useComeBack } from '../../../hooks/seeker/useComeBack';
import { useDashboardJobs } from './useDashboardJobs';
import { useDashboardFilters } from './useDashboardFilters';
import { useJobFacets } from './useJobFacets';
import DashboardControls from './DashboardControls';
import DashboardBody from './DashboardBody';
import MobileSheets from './MobileSheets';
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

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(16px, 4vw, 24px)', paddingBottom: isMobile ? 80 : 40, width: '100%' }}>
      <PageHeader
        label={COPY.jobs.pageLabel}
        title={COPY.jobs.pageTitle}
        subtitle={loading ? 'Loading…' : `${totalJobs.toLocaleString()} ${COPY.jobs.rolesAvailable}`}
      />

      <DashboardControls
        isMobile={isMobile}
        searchInput={f.searchInput} setSearchInput={f.setSearchInput}
        sortByMatch={f.sortByMatch}
        toggleSortByMatch={() => { const v = !f.sortByMatch; f.setSortByMatch(v); f.setSp(p => { if (v) p.set('sort', 'match'); else p.delete('sort'); }); }}
        hasSkills={userSkills.length > 0}
        sel={f.sel}
        roleCategoryFilter={f.roleCategoryFilter} setRoleCategoryFilter={f.setRoleCategoryFilter}
        experienceBandFilter={f.experienceBandFilter} setExperienceBandFilter={f.setExperienceBandFilter}
        workplaceFilter={f.workplaceFilter} setWorkplaceFilter={f.setWorkplaceFilter}
        dateFilter={f.dateFilter} setDateFilter={f.setDateFilter}
        entryLevelFilter={f.entryLevelFilter} setEntryLevelFilter={f.setEntryLevelFilter}
        hideApplied={f.hideApplied} setHideApplied={f.setHideApplied}
        showNewOnly={f.showNewOnly} setShowNewOnly={f.setShowNewOnly}
        newJobsCount={newJobsCount}
        facets={facets}
        locationsFilter={f.locationsFilter} setLocationsFilter={f.setLocationsFilter}
        techStackFilter={f.techStackFilter} setTechStackFilter={f.setTechStackFilter}
        salaryMinFilter={f.salaryMinFilter} salaryMaxFilter={f.salaryMaxFilter}
        setSalaryFilter={f.setSalaryFilter}
        activeFilters={f.activeFilters}
        onClearAllFilters={f.clearAll}
        onOpenMobileFilters={() => setFilterSheetOpen(true)}
        setSp={f.setSp}
      />

      <DashboardBody
        loading={loading} jobs={jobs} finalJobs={finalJobs}
        useSplit={useSplit}
        selectedJob={selectedJob}
        companyDomainMap={companyDomainMap}
        appliedJobIds={appliedJobIds} comeBackMap={comeBackMap}
        skillRe={skillRe} userSkillsLength={userSkills.length}
        hasMore={currentPage < totalPages} loadingMore={loadingMore} currentPage={currentPage}
        entryLevelFilter={f.entryLevelFilter}
        activeFiltersCount={f.activeFilters.length}
        listRef={listRef}
        onLoadMore={fetchJobs}
        onSelect={handleSelectJob}
        onDismiss={toggleDismissed}
        onToggleApplied={toggleApplied}
        onToggleComeBack={handleToggleComeBack}
        onRemoveComeBack={handleRemoveComeBack}
        onClearFilters={f.clearAll}
      />

      {isMobile && (
        <MobileSheets
          job={selectedJob}
          jobSheetOpen={jobSheetOpen}
          onCloseJobSheet={() => setJobSheetOpen(false)}
          companyDomainMap={companyDomainMap}
          appliedJobIds={appliedJobIds} comeBackMap={comeBackMap}
          onToggleApplied={toggleApplied}
          onToggleComeBack={handleToggleComeBack}
          onRemoveComeBack={handleRemoveComeBack}
          onSelectJob={handleSelectJob}
          filterSheetOpen={filterSheetOpen}
          onCloseFilterSheet={() => setFilterSheetOpen(false)}
          activeFilterCount={f.activeFilters.length}
          visibleJobsCount={finalJobs.length}
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
