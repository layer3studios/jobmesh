'use client';
// FILE: src/components/seeker/dashboard/DashboardBody.tsx
// The list + detail panel area. Handles loading skeleton, empty state, and the
// desktop split vs mobile list layouts.

import { Briefcase } from 'lucide-react';
import type { IJob } from '../../../types';
import { Button, EmptyState } from '../../ui';
import { COPY } from '../../../theme/brand';
import JobDetailPanel from '../JobDetailPanel';
import JobListColumn from './JobListColumn';

interface Props {
  loading: boolean;
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

export default function DashboardBody(p: Props) {
  if (p.loading && p.jobs.length === 0) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 11 }} />)}
      </div>
    );
  }

  if (p.finalJobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase size={28} />}
        title={COPY.jobs.noJobsTitle}
        body={p.entryLevelFilter ? COPY.jobs.noEntryJobsBody : COPY.jobs.noJobsBody}
        action={p.activeFiltersCount > 0 ? (
          <Button variant="primary" size="md" onClick={p.onClearFilters}>{COPY.jobs.clearFilters}</Button>
        ) : null}
      />
    );
  }

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

  if (p.useSplit) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
        gap: 16, alignItems: 'start',
      }}>
        <div
          ref={p.listRef}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}
        >
          <JobListColumn {...listProps} selectedJobId={p.selectedJob?._id} />
        </div>

        <div
          className="thin-scroll"
          style={{
            position: 'sticky', top: 80,
            maxHeight: 'calc(100vh - 96px)', overflowY: 'auto',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          }}
        >
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
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>
              <Briefcase size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: '0.92rem' }}>Select a job to see details.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <JobListColumn {...listProps} compactMatchLabel />
    </div>
  );
}
