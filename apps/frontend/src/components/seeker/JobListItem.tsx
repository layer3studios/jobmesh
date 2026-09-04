'use client';
// FILE: src/components/seeker/JobListItem.tsx
// One job card in the board's list column. Flat hairline card on the
// canvas; hover and selection are CSS states (board.css), not React state.
// Selected = the indigo thread on the left edge + the highest surface.
import { memo } from 'react';
import { CheckCircle2, Clock, X } from 'lucide-react';
import type { IJob } from '../../types';
import CompanyLogo from './CompanyLogo';
import { MONO } from './JobDetailPanel/job-detail-helpers';

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

const monoTag = {
  fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
  padding: '3px 8px', borderRadius: 999, border: '1px solid var(--border)',
  color: 'var(--ink-muted)', whiteSpace: 'nowrap' as const,
};

const JobListItem = memo(function JobListItem({
  job, domain, isSelected, isApplied, isComeBack, comeBackNote,
  isNew, relativeTime, visibleBadges, showSkillMatch,
  skillMatchText, skillMatchBg, skillMatchColor, onSelect, onDismiss,
}: JobListItemProps) {
  return (
    <div
      className={`jb-card${isSelected ? ' jb-card--selected' : ''}`}
      onClick={() => onSelect(job)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(job); } }}
      aria-current={isSelected ? 'true' : undefined}
      style={{
        position: 'relative',
        padding: '14px 16px 12px',
        paddingRight: onDismiss ? 40 : 16,
        background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border)'}`,
        borderLeft: `4px solid ${isSelected ? 'var(--thread-indigo)' : 'transparent'}`,
        borderRadius: 12,
        cursor: 'pointer',
        opacity: isApplied ? 0.6 : 1,
      }}
    >
      {onDismiss && (
        <button
          className="jb-card__dismiss jb-icon-btn"
          onClick={e => { e.stopPropagation(); onDismiss(job._id); }}
          title="Not interested"
          aria-label="Not interested"
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 24, height: 24, borderRadius: 6,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--ink-faint)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={11} />
        </button>
      )}

      {/* Row 1 — title left, posted time right */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <h3 style={{
          flex: 1, minWidth: 0, margin: 0,
          fontSize: 15, fontWeight: 600, color: 'var(--ink)',
          lineHeight: 1.3, letterSpacing: '-0.01em',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {job.JobTitle}
        </h3>
        {relativeTime && (
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--ink-faint)', whiteSpace: 'nowrap', marginTop: 2 }}>
            {relativeTime}
          </span>
        )}
      </div>

      {/* Row 2 — logo tile, company, location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, minWidth: 0 }}>
        <CompanyLogo name={job.Company} url={job.ApplicationURL} domain={domain} size={22} borderRadius={6} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.Company}
        </span>
        <span style={{ color: 'var(--ink-faint)' }}>·</span>
        <span style={{ fontSize: 13, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.Location}
        </span>
        {isApplied && <CheckCircle2 size={13} style={{ flexShrink: 0, color: 'var(--success)', marginLeft: 'auto' }} />}
        {!isApplied && isComeBack && <Clock size={13} style={{ flexShrink: 0, color: 'var(--warning)', marginLeft: 'auto' }} />}
      </div>

      {/* Row 3 — mono tags: status first, then workplace/role, then match */}
      {(isNew || visibleBadges.length > 0 || showSkillMatch) && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {isNew && <span style={{ ...monoTag, color: 'var(--ink)', borderColor: 'var(--border-strong)' }}>New</span>}
          {visibleBadges.map(badge => <span key={badge.key} style={monoTag}>{badge.label}</span>)}
          {showSkillMatch && (
            <span style={{ ...monoTag, background: skillMatchBg, color: skillMatchColor, borderColor: 'transparent' }}>
              {skillMatchText}
            </span>
          )}
        </div>
      )}

      {isComeBack && comeBackNote && (
        <div style={{
          fontSize: 12, color: 'var(--warning)', fontStyle: 'italic', marginTop: 8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85,
        }}>
          {comeBackNote.length > 50 ? comeBackNote.slice(0, 50) + '…' : comeBackNote}
        </div>
      )}
    </div>
  );
});

export default JobListItem;
