'use client';
// FILE: src/components/seeker/dashboard/JobListColumn.tsx
import type { IJob } from '../../../types';
import { Button } from '../../ui';
import JobListItem from '../JobListItem';
import { getAutoTags, relTime } from '../JobDetailPanel';
import { compactJobBadges } from './job-badges';

interface Props {
  jobs: IJob[];
  selectedJobId?: string | null;
  companyDomainMap: Map<string, string>;
  appliedJobIds: Set<string>;
  comeBackMap: Record<string, string>;
  skillRe: RegExp | null;
  userSkillsLength: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onSelect: (job: IJob) => void;
  onDismiss: (id: string) => void;
  /** Compact match percentage label (mobile uses "X%", desktop "X% match"). */
  compactMatchLabel?: boolean;
}

export default function JobListColumn({
  jobs, selectedJobId, companyDomainMap, appliedJobIds, comeBackMap,
  skillRe, userSkillsLength, hasMore, loadingMore, onLoadMore, onSelect, onDismiss,
  compactMatchLabel = false,
}: Props) {
  return (
    <>
      {jobs.map(j => {
        const auto = getAutoTags(j);
        const matched = skillRe
          ? Array.from(new Set((`${j.JobTitle} ${j.DescriptionPlain || ''} ${(auto.techStack || []).join(' ')}`).match(skillRe) || [])).length
          : 0;
        const matchPct = userSkillsLength > 0 ? Math.round((matched / userSkillsLength) * 100) : 0;
        const rt = relTime(j.PostedDate || j.createdAt || j.scrapedAt || null);
        const isNew = rt === 'Today' || rt === '1d ago';
        return (
          <JobListItem
            key={j._id}
            job={j}
            domain={companyDomainMap.get(j.Company)}
            isSelected={selectedJobId === j._id}
            isApplied={appliedJobIds.has(j._id)}
            isComeBack={!!comeBackMap[j._id]}
            comeBackNote={comeBackMap[j._id] || ''}
            isNew={isNew}
            relativeTime={isNew ? null : rt}
            visibleBadges={compactJobBadges(j)}
            showSkillMatch={matched > 0}
            skillMatchText={compactMatchLabel ? `${matchPct}%` : `${matchPct}% match`}
            skillMatchBg="var(--accent-soft)"
            skillMatchColor="var(--accent)"
            onSelect={onSelect}
            onDismiss={onDismiss}
          />
        );
      })}

      {hasMore && (
        <div style={{ padding: 12, display: 'flex', justifyContent: 'center', borderTop: compactMatchLabel ? '1px solid var(--border)' : undefined }}>
          <Button variant="ghost" size="sm" loading={loadingMore} onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
