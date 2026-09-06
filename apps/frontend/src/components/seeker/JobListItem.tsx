'use client';
// FILE: src/components/seeker/JobListItem.tsx
// One row in the board's list: logo tile, title over company · location,
// the posted time and a chevron on the right. Hover, press and the indigo
// selection thread are CSS states (board.css .jb-row), not React state.
import { memo } from 'react';
import { CheckCircle2, Bookmark, ChevronRight } from 'lucide-react';
import type { IJob } from '../../types';
import CompanyLogo from './CompanyLogo';

export type CompactBadge = { key: string; label: string; bg: string; color: string };

export interface JobListItemProps {
  job: IJob;
  domain?: string;
  isSelected: boolean;
  isApplied: boolean;
  isComeBack: boolean;
  comeBackNote: string;
  isNew: boolean;
  relativeTime: string | null;
  visibleBadges: CompactBadge[];
  showSkillMatch: boolean;
  skillMatchText: string;
  skillMatchBg: string;
  skillMatchColor: string;
  onSelect: (job: IJob) => void;
  onDismiss?: (jobId: string) => void;
}

const JobListItem = memo(function JobListItem({
  job, domain, isSelected, isApplied, isComeBack, comeBackNote,
  isNew, relativeTime, visibleBadges, showSkillMatch, skillMatchText, onSelect,
}: JobListItemProps) {
  const tags = visibleBadges.slice(0, 3);
  return (
    <div
      className={`jb-row${isApplied ? ' jb-row--applied' : ''}`}
      onClick={() => onSelect(job)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(job); } }}
      aria-current={isSelected ? 'true' : undefined}
      aria-label={`${job.JobTitle} at ${job.Company}`}
      title={isComeBack && comeBackNote ? comeBackNote : undefined}
    >
      <CompanyLogo name={job.Company} url={job.ApplicationURL} domain={domain} size={36} borderRadius={9} />

      <div className="jb-row__main">
        <h3 className="jb-row__title">{job.JobTitle}</h3>
        <div className="jb-row__sub">
          <span className="jb-row__company">{job.Company}</span>
          <span className="jb-row__dot" aria-hidden>·</span>
          <span>{job.Location}</span>
        </div>
        {(isNew || tags.length > 0 || showSkillMatch) && (
          <div className="jb-row__tags">
            {isNew && <span className="jb-tag jb-tag--ink">New</span>}
            {showSkillMatch && <span className="jb-tag jb-tag--match">{skillMatchText}</span>}
            {tags.map(b => <span key={b.key} className="jb-tag">{b.label}</span>)}
          </div>
        )}
      </div>

      <div className="jb-row__side">
        <span className="jb-row__time">{isNew ? 'Today' : relativeTime ?? ''}</span>
        <span className="jb-row__state">
          {isApplied && <CheckCircle2 size={13} style={{ color: 'var(--success)' }} aria-label="Applied" />}
          {!isApplied && isComeBack && <Bookmark size={13} style={{ color: 'var(--warning)' }} aria-label="Saved" />}
          {!isApplied && !isComeBack && <ChevronRight size={14} className="jb-row__chev" aria-hidden />}
        </span>
      </div>
    </div>
  );
});

export default JobListItem;
