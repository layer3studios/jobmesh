'use client';
// FILE: src/components/seeker/JobListItem.tsx
import { useEffect, useState, memo } from 'react';
import { Clock, CheckCircle2, X } from 'lucide-react';
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
  isNew, relativeTime, visibleBadges, showSkillMatch,
  skillMatchText, skillMatchBg, skillMatchColor, onSelect, onDismiss,
}: JobListItemProps) {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  return (
    <div
      onClick={() => onSelect(job)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: isMobile ? '13px 14px 13px 14px' : '13px 16px',
        paddingRight: 40,
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: isSelected
          ? 'var(--accent-soft)'
          : hovered ? 'var(--paper-2)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
        opacity: isApplied ? 0.55 : 1,
        transition: 'all 140ms ease',
      }}
    >
      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={e => { e.stopPropagation(); onDismiss(job._id); }}
          title="Not interested"
          style={{
            position: 'absolute',
            top: 10, right: 10,
            background: hovered || isMobile ? 'var(--surface)' : 'transparent',
            border: hovered || isMobile ? '1px solid var(--border)' : '1px solid transparent',
            borderRadius: 6,
            padding: 4,
            cursor: 'pointer',
            color: 'var(--ink-faint)',
            display: 'flex',
            alignItems: 'center',
            opacity: hovered || isMobile ? 1 : 0,
            transition: 'opacity 140ms ease',
            zIndex: 1,
          }}
        >
          <X size={11} />
        </button>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <CompanyLogo
          name={job.Company}
          url={job.ApplicationURL}
          domain={domain}
          size={36}
          borderRadius={9}
          style={{ flexShrink: 0 }}
        />

        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Title */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--ink)',
            lineHeight: 1.3,
            letterSpacing: '-0.012em',
          }}>
            <span style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {job.JobTitle}
            </span>
            {isApplied && <CheckCircle2 size={13} style={{ flexShrink: 0, color: 'var(--success)', marginTop: 2 }} />}
            {!isApplied && isComeBack && <Clock size={13} style={{ flexShrink: 0, color: 'var(--warning)', marginTop: 2 }} />}
          </div>

          {/* Company · Location */}
          <div style={{
            display: 'flex', gap: 5, alignItems: 'center',
            marginTop: 3,
            fontSize: '0.76rem', color: 'var(--ink-muted)',
            overflow: 'hidden',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.Company}</span>
            <span style={{ color: 'var(--ink-faint)' }}>·</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.Location}</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
        {isNew && (
          <span style={{
            fontSize: '0.6rem', padding: '1px 7px', borderRadius: 6,
            background: 'var(--danger-soft)', color: 'var(--danger)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>NEW</span>
        )}
        {relativeTime && (
          <span style={{
            fontSize: '0.62rem', padding: '1px 7px', borderRadius: 6,
            background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            <Clock size={8} />{relativeTime}
          </span>
        )}
        {visibleBadges.map(badge => (
          <span key={badge.key} style={{
            fontSize: '0.62rem', padding: '1px 7px', borderRadius: 6,
            background: badge.bg, color: badge.color, fontWeight: 600,
          }}>
            {badge.label}
          </span>
        ))}
        {showSkillMatch && (
          <span style={{
            fontSize: '0.62rem', padding: '1px 7px', borderRadius: 6,
            background: skillMatchBg, color: skillMatchColor, fontWeight: 600,
          }}>
            {skillMatchText}
          </span>
        )}
      </div>

      {isComeBack && comeBackNote && (
        <div style={{
          fontSize: '0.72rem', color: 'var(--warning)', fontStyle: 'italic',
          marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', opacity: 0.85,
        }}>
          {comeBackNote.length > 50 ? comeBackNote.slice(0, 50) + '…' : comeBackNote}
        </div>
      )}
    </div>
  );
});

export default JobListItem;
