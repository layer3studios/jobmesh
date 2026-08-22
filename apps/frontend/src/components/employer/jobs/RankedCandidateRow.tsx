'use client';
// FILE: src/components/employer/jobs/RankedCandidateRow.tsx
// One table row. The whole row navigates to the applicant detail; the checkbox
// stops propagation so selecting never navigates. Score renders as a compact
// pill ("98 · strong") coloured by tier; unscored shows a muted "—".

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import type { Applicant, ArchiveReason } from '@/types/employer-applicants';
import QuickArchiveButton from './QuickArchiveButton';
import { getScoreBadgeStyle, usableScore } from './score-badge-helpers';
import { formatRelativeTime } from './applicant-view-helpers';
import AssignmentColumn from './parts/AssignmentColumn';
import TimeInStage from './parts/TimeInStage';
import TagPill from './TagPill';
import { COPY } from '@/theme/brand';
import { Ban } from 'lucide-react';

/** Two pills, then a count. A row is scanned, not read — three pills already crowd
 *  the name they sit beside, and the detail page holds the full list. */
function RowTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  const visible = tags.slice(0, 2);
  const overflow = tags.length - visible.length;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      {visible.map((tag) => <TagPill key={tag} name={tag} size="sm" />)}
      {overflow > 0 && (
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)' }}>+{overflow}</span>
      )}
    </span>
  );
}

/** "3 roles" — this person is already in the pipeline elsewhere. Neutral on purpose:
 *  it is context for the recruiter, not a score and not a warning. */
function CrossApplicationPill({ count }: { count: number }) {
  return (
    <span
      title={COPY.employer.applicants.rolesPillLabel.replace('{count}', String(count))}
      style={{
        flexShrink: 0, padding: '1px 6px', borderRadius: 999,
        fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        background: 'var(--surface-sunken)', color: 'var(--ink-muted)',
      }}
    >
      {COPY.employer.applicants.rolesPill.replace('{count}', String(count))}
    </span>
  );
}

/** A red slash beside the name. Icon plus a title/sr-only label — colour alone is
 *  not a signal, and this one matters too much to be conveyed by hue. */
function DoNotContactMark() {
  return (
    <span
      title={COPY.employer.applicants.doNotContactRowLabel}
      style={{ display: 'inline-flex', color: 'var(--danger)', flexShrink: 0 }}
    >
      <Ban size={13} aria-hidden="true" />
      <span className="sr-only">{COPY.employer.applicants.doNotContactRowLabel}</span>
    </span>
  );
}

export function ScorePill({ applicant }: { applicant: Applicant }) {
  // One source of truth for score colours — shared with the Pipeline card.
  const score = usableScore(applicant.score);
  const badge = getScoreBadgeStyle(score);
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: badge.background, color: badge.color }}>
      {score == null ? '—' : `${score} · ${badge.label}`}
    </span>
  );
}

export default function RankedCandidateRow({
  applicant, postingId, stageName, showSelect, showAssignment, isSelected, onToggleSelect,
  archiveReasons, canArchive, onArchived, isActive = false,
}: {
  applicant: Applicant;
  postingId: string;
  stageName: string;
  showSelect: boolean;
  /** Only an assignment posting gets the Task cell — see AssignmentColumn. */
  showAssignment: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  /** Cached by RankedTab — the popover never fetches these itself. */
  archiveReasons: ArchiveReason[];
  canArchive: boolean;
  onArchived: (candidateName: string) => void;
  /** The keyboard highlight (↑/↓/j/k). Distinct from checkbox selection. */
  isActive?: boolean;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const id = applicant.application.id;
  const detailHref = `/employer/jobs/${postingId}/applicants/${id}?from=ranked`;
  const candidateName = applicant.contact?.fullName ?? 'this candidate';

  return (
    <div
      role="row"
      className="ranked-row"
      // The keyboard layer finds rows and their controls through this id.
      data-application-id={id}
      onClick={() => router.push(detailHref)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
        background: isActive || hovered ? 'var(--surface-raised)' : 'transparent',
        // An inset marker rather than an outline: it marks the row without shifting
        // any of its content by a pixel.
        boxShadow: isActive ? 'inset 3px 0 0 var(--accent)' : 'none',
      }}
    >
      {showSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          aria-label={`Select ${applicant.contact?.fullName ?? 'applicant'}`}
          onClick={(event) => event.stopPropagation()}
          onChange={() => onToggleSelect(id)}
          style={{ width: 15, height: 15, accentColor: 'var(--accent)', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {applicant.contact?.fullName ?? '—'}
          </span>
          {applicant.contact?.doNotContact?.flag && <DoNotContactMark />}
          {applicant.applicationCount != null && applicant.applicationCount > 1 && (
            <CrossApplicationPill count={applicant.applicationCount} />
          )}
          <RowTags tags={applicant.application.tags ?? []} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {applicant.contact?.email ?? ''}
        </div>
      </div>
      <div style={{ width: 120, flexShrink: 0 }}><ScorePill applicant={applicant} /></div>
      {/* Resume 0–100 and Task 1–5 stay in SEPARATE cells with separate labels.
          Nothing anywhere blends them into one number or one ordering. */}
      {showAssignment && <div style={{ width: 110, flexShrink: 0 }}><AssignmentColumn applicant={applicant} /></div>}
      <div style={{
        width: 100, flexShrink: 0, fontSize: 13, color: 'var(--ink)',
        display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stageName}</span>
        <TimeInStage movedAt={applicant.application.lastStageMovedAt} />
      </div>
      <div style={{ width: 80, flexShrink: 0, fontSize: 12, color: 'var(--ink-2)' }}>
        {formatRelativeTime(applicant.application.appliedAt)}
      </div>
      <div style={{
        width: 92, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
      }} onClick={(event) => event.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={() => router.push(detailHref)}>View</Button>
        <QuickArchiveButton
          candidateName={candidateName}
          applicationId={id}
          reasons={archiveReasons}
          canArchive={canArchive}
          isArchived={applicant.application.archived != null}
          onArchived={onArchived}
        />
      </div>
    </div>
  );
}
