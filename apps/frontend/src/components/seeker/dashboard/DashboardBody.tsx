'use client';
// FILE: src/components/seeker/dashboard/DashboardBody.tsx
// The list + detail area. Owns the four states a list can be in — loading
// (a skeleton shaped like the rows), failed (a retry), empty (clear filters)
// and full — and the desktop split vs mobile list layouts.

import { Briefcase, RefreshCw, WifiOff } from 'lucide-react';
import type { IJob } from '../../../types';
import { Button, EmptyState } from '../../ui';
import { COPY } from '../../../theme/brand';
import JobDetailPanel from '../JobDetailPanel';
import JobListColumn from './JobListColumn';

interface Props {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  jobs: IJob[];
  finalJobs: IJob[];
  useSplit: boolean;
  selectedJob: IJob | null;
  companyDomainMap: Map<string, string>;
  appliedJobIds: Set<string>;
  comeBackMap: Record<string, string>;
  skillRe: RegExp | null;
  userSkillsLength: number;
  hasMore: boolean;
  loadingMore: boolean;
  currentPage: number;
  entryLevelFilter: boolean;
  activeFiltersCount: number;
  listRef: React.RefObject<HTMLDivElement | null>;
  onLoadMore: (page: number, append: boolean) => void;
  onSelect: (job: IJob) => void;
  onDismiss: (id: string) => void;
  onToggleApplied: (id: string) => void;
  onToggleComeBack: (id: string, note?: string) => void;
  onRemoveComeBack: (id: string) => void;
  onClearFilters: () => void;
}

/** Rows-shaped placeholders: a logo tile, two lines, a time stamp. */
export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="jb-list" aria-busy="true" aria-label="Loading jobs">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="jb-skel-row" style={{ opacity: 1 - i * 0.08 }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 9 }} />
          <div style={{ display: 'grid', gap: 7 }}>
            <div className="skeleton" style={{ height: 13, width: `${58 + ((i * 17) % 30)}%` }} />
            <div className="skeleton" style={{ height: 11, width: `${34 + ((i * 11) % 24)}%` }} />
          </div>
          <div className="skeleton" style={{ height: 10, width: 38 }} />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="jb-skel-detail" aria-busy="true" aria-label="Loading job">
      <div className="skeleton" style={{ height: 11, width: 90 }} />
      <div className="skeleton" style={{ height: 30, width: '72%', marginTop: 4 }} />
      <div className="skeleton" style={{ height: 30, width: '46%' }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 120, alignSelf: 'center' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <div className="skeleton" style={{ height: 38, width: 160, borderRadius: 10 }} />
        <div className="skeleton" style={{ height: 38, width: 120, borderRadius: 10 }} />
        <div className="skeleton" style={{ height: 38, width: 80, borderRadius: 10 }} />
      </div>
      <div className="skeleton" style={{ height: 150, borderRadius: 12, marginTop: 10 }} />
      <div className="skeleton" style={{ height: 14, width: '95%', marginTop: 10 }} />
      <div className="skeleton" style={{ height: 14, width: '88%' }} />
      <div className="skeleton" style={{ height: 14, width: '60%' }} />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="jb-error rise" role="alert">
      <WifiOff size={22} style={{ color: 'var(--ink-faint)' }} />
      <p className="jb-error__title">Couldn’t load roles</p>
      <p className="jb-error__body">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry} iconLeft={<RefreshCw size={13} />}>Try again</Button>
    </div>
  );
}

export default function DashboardBody(p: Props) {
  const listProps = {
    jobs: p.finalJobs,
    companyDomainMap: p.companyDomainMap,
    appliedJobIds: p.appliedJobIds,
    comeBackMap: p.comeBackMap,
    skillRe: p.skillRe,
    userSkillsLength: p.userSkillsLength,
    hasMore: p.hasMore,
    loadingMore: p.loadingMore,
    onLoadMore: () => p.onLoadMore(p.currentPage + 1, true),
    onSelect: p.onSelect,
    onDismiss: p.onDismiss,
  };

  const initialLoading = p.loading && p.jobs.length === 0;

  let list: React.ReactNode;
  if (p.error && p.jobs.length === 0) list = <ErrorState message={p.error} onRetry={p.onRetry} />;
  else if (initialLoading) list = <ListSkeleton />;
  else if (p.finalJobs.length === 0) {
    list = (
      <EmptyState
        icon={<Briefcase size={28} />}
        title={COPY.jobs.noJobsTitle}
        body={p.entryLevelFilter ? COPY.jobs.noEntryJobsBody : COPY.jobs.noJobsBody}
        action={p.activeFiltersCount > 0 ? (
          <Button variant="primary" size="md" onClick={p.onClearFilters}>{COPY.jobs.clearFilters}</Button>
        ) : null}
      />
    );
  } else {
    list = (
      <div className="jb-list" style={{ opacity: p.loading ? 0.55 : 1, transition: 'opacity var(--m-ui) var(--ease-out)' }} aria-busy={p.loading || undefined}>
        <JobListColumn {...listProps} selectedJobId={p.useSplit ? p.selectedJob?._id : undefined} compactMatchLabel={!p.useSplit} />
      </div>
    );
  }

  if (!p.useSplit) return <div ref={p.listRef}>{list}</div>;

  return (
    <div className="jb-board">
      <div ref={p.listRef}>{list}</div>
      <div className="glass jb-detail">
        {p.selectedJob ? (
          <JobDetailPanel
            job={p.selectedJob}
            domain={p.companyDomainMap.get(p.selectedJob.Company)}
            appliedJobIds={p.appliedJobIds}
            comeBackMap={p.comeBackMap}
            onToggleApplied={p.onToggleApplied}
            onToggleComeBack={p.onToggleComeBack}
            onRemoveComeBack={p.onRemoveComeBack}
            onSelectJob={p.onSelect}
          />
        ) : initialLoading ? (
          <DetailSkeleton />
        ) : (
          <div className="jb-detail__empty">
            <Briefcase size={26} style={{ opacity: 0.4, marginBottom: 8 }} />
            <p>Pick a role on the left to read it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
