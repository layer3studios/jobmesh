'use client';
// FILE: src/components/employer/jobs/parts/ApplicantActionBar.tsx
// Sticky action bar at the top of the applicant sidebar: stage move, archive,
// schedule interview, and prev/next.
//
// WHY IT EXISTS. The same three actions already lived inside ApplicantReviewPanel,
// but that panel sits below the contact card, the cover note and the whole score
// region — so on a real applicant the employer had to scroll past everything to
// reach the decision. The actions did not need inventing; they needed hoisting.
// ApplicantReviewPanel's own action bar is gone, so there is exactly one Archive
// button on the page.

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import QuickArchivePopover from '../QuickArchivePopover';
import ApplicantMoreActions from './ApplicantMoreActions';
import type { Stage, ArchiveReason } from '@/types/employer-applicants';

// Above the scrolling sidebar content, below Modal (100) and popovers.
const STICKY_Z_INDEX = 20;

export default function ApplicantActionBar({
  candidateName, applicationId, currentStageId, stages, reasons, archived,
  canMove, canArchive, canSchedule, canAnonymize, isMoving,
  contactId = null, isDoNotContact = false, canFlagContact = false,
  previousHref, nextHref, positionText,
  onMove, onArchived, onScheduleInterview, onAnonymized,
}: {
  candidateName: string;
  applicationId: string;
  currentStageId: string;
  stages: Stage[];
  reasons: ArchiveReason[];
  archived: boolean;
  canMove: boolean;
  canArchive: boolean;
  canSchedule: boolean;
  /** Owner+. Gates the destructive item in the ⋯ menu; the backend gates it too. */
  canAnonymize: boolean;
  /** Contact-level do-not-contact flag, surfaced through the same ⋯ menu. */
  contactId?: string | null;
  isDoNotContact?: boolean;
  canFlagContact?: boolean;
  isMoving: boolean;
  previousHref?: string | null;
  nextHref?: string | null;
  positionText?: string;
  onMove: (stageId: string) => void;
  onArchived: (candidateName: string) => void;
  onScheduleInterview?: () => void;
  /** Re-read the applicant: anonymizing rewrites the name, contact card and notes. */
  onAnonymized: () => void;
}) {
  const archiveAnchorRef = useRef<HTMLButtonElement>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: STICKY_Z_INDEX,
      background: 'var(--surface-raised)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 10, boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 150px', minWidth: 0 }}>
          <Select
            aria-label="Move to stage"
            value={currentStageId}
            disabled={!canMove || archived || isMoving}
            options={stages.map((stage) => ({ value: stage.id, label: stage.text }))}
            onChange={(event) => onMove(event.target.value)}
          />
        </div>

        {canSchedule && onScheduleInterview && (
          <Button
            variant="secondary"
            size="sm"
            disabled={archived}
            iconLeft={<CalendarPlus size={14} aria-hidden />}
            onClick={onScheduleInterview}
          >
            Interview
          </Button>
        )}

        {canArchive && !archived && (
          // Outlined rather than solid danger: archiving is routine triage, not a
          // destructive act, and a red block button on every candidate reads as a
          // warning the page does not mean.
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              ref={archiveAnchorRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isArchiveOpen}
              onClick={() => setIsArchiveOpen((open) => !open)}
              style={{
                fontSize: 13, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', color: 'var(--danger)',
                border: '1px solid var(--border)',
              }}
            >
              Archive
            </button>
            <QuickArchivePopover
              candidateName={candidateName}
              applicationId={applicationId}
              reasons={reasons}
              anchorRef={archiveAnchorRef}
              isOpen={isArchiveOpen}
              onClose={() => setIsArchiveOpen(false)}
              onArchived={onArchived}
            />
          </span>
        )}

        {/* Export + anonymize. Behind a ⋯ because neither is triage — see
            ApplicantMoreActions. Pushed right so it never sits under the thumb
            that is aiming for Archive. */}
        <span style={{ marginLeft: 'auto' }}>
          <ApplicantMoreActions
            applicationId={applicationId}
            candidateName={candidateName}
            canAnonymize={canAnonymize}
            onAnonymized={onAnonymized}
            contactId={contactId}
            isDoNotContact={isDoNotContact}
            canFlagContact={canFlagContact}
          />
        </span>
      </div>

      {/* Prev/next repeated here so triaging a list never needs a trip back to the
          page header — the decision and the navigation sit together. */}
      {(previousHref || nextHref) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <NavArrow href={previousHref ?? null} label="Previous applicant"><ChevronLeft size={14} aria-hidden /></NavArrow>
          {positionText && <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{positionText}</span>}
          <NavArrow href={nextHref ?? null} label="Next applicant"><ChevronRight size={14} aria-hidden /></NavArrow>
        </div>
      )}
    </div>
  );
}

const ARROW_STYLE = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
  color: 'var(--ink)', textDecoration: 'none',
} as const;

function NavArrow({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <span aria-hidden style={{ ...ARROW_STYLE, color: 'var(--ink-faint)', opacity: 0.5 }}>{children}</span>
    );
  }
  return <Link href={href} aria-label={label} style={ARROW_STYLE}>{children}</Link>;
}
