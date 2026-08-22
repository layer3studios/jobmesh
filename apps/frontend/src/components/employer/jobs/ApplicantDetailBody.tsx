'use client';
// FILE: src/components/employer/jobs/ApplicantDetailBody.tsx
// Body of the applicant detail page, split out of ApplicantDetail to keep both files
// under the line cap. Owns the desktop two-column / mobile-stack layout (P8) and the
// per-load-state rendering (skeleton / not-found / error / loaded). Behaviour is
// identical to the original single-file page — this is a mechanical extraction.

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Alert, Stack, SkeletonCard, useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canMoveApplicant, canArchiveApplicant, canScheduleInterview, canAnonymizeCandidate } from '@/lib/team-permissions';
import { moveApplicant, EmployerApplicantsApiError } from '@/api/employer-applicants-api';
import type { ApplicantDetail, Stage, ArchiveReason } from '@/types/employer-applicants';
import ApplicantResumeViewer from './ApplicantResumeViewer';
import ApplicantReviewPanel from './ApplicantReviewPanel';
import ApplicantActionBar from './parts/ApplicantActionBar';
import ApplicantSidebarCards from './parts/ApplicantSidebarCards';

export type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';

// No-page-scroll (P8/D2/D3): grid children own their height and scroll internally.
const GRID_STYLE: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
  gap: 20, alignItems: 'stretch', flex: 1, minHeight: 0,
};
const LEFT_COLUMN_STYLE: CSSProperties = { height: '100%', overflow: 'hidden', minHeight: 0 };
const RIGHT_COLUMN_STYLE: CSSProperties = { height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingRight: 6, minHeight: 0 };

export default function ApplicantDetailBody({
  loadState, detail, stages, reasons, lastError, load, twoColumn, backHref, currentEmployerUserId = null,
  previousHref = null, nextHref = null, positionText = '',
}: {
  loadState: LoadState;
  detail: ApplicantDetail | null;
  stages: Stage[];
  reasons: ArchiveReason[];
  lastError: string;
  load: () => Promise<void> | void;
  twoColumn: boolean;
  backHref: string;
  /** Distinguishes "my review" from "a teammate's" — see AssignmentReviewPanel. */
  currentEmployerUserId?: string | null;
  /** Prev/next, mirrored into the sticky action bar so triage never leaves it. */
  previousHref?: string | null;
  nextHref?: string | null;
  positionText?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { viewerRole, viewerCanMoveApplicants, viewerCanArchiveApplicants } = useEmployer();
  const [isMoving, setIsMoving] = useState(false);

  // UX gates only — the backend enforces each of these. Unknown role → allow.
  const canMove = viewerRole ? canMoveApplicant(viewerRole, viewerCanMoveApplicants) : true;
  const canArchive = viewerRole ? canArchiveApplicant(viewerRole, viewerCanArchiveApplicants) : true;
  const canSchedule = viewerRole ? canScheduleInterview(viewerRole) : true;
  // Defaults to FALSE with an unknown role, unlike the others: hiding an
  // irreversible action we are unsure about is the safe direction to be wrong in.
  const canAnonymize = viewerRole ? canAnonymizeCandidate(viewerRole) : false;

  const applicationId = detail?.application.id ?? '';
  const onMove = async (stageId: string) => {
    if (!applicationId || stageId === detail?.application.stageId) return;
    setIsMoving(true);
    try {
      await moveApplicant(applicationId, { stageId });
      showToast('success', `Moved to ${stages.find((s) => s.id === stageId)?.text ?? 'stage'}`);
      await load();
    } catch (error) {
      showToast('error', error instanceof EmployerApplicantsApiError ? error.message : 'Could not move this applicant.');
    } finally {
      setIsMoving(false);
    }
  };

  // Archiving removes the applicant from the active pipeline, so staying on a page
  // that now describes an archived record is disorienting — go back to the list.
  const onArchived = (candidateName: string) => {
    showToast('success', `Archived ${candidateName}`);
    router.push(backHref);
  };

  if (loadState === 'loading') return <SkeletonCard lines={6} />;
  if (loadState === 'not_found') {
    return (
      <Card>
        <Stack gap={14}>
          <Alert type="error">Applicant not found. The application may have been removed, or you may not have access to it.</Alert>
          <div><Link href={backHref}><Button variant="secondary">Back to posting</Button></Link></div>
        </Stack>
      </Card>
    );
  }
  if (loadState === 'error' || !detail) {
    return (
      <Alert type="error">
        <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
          <span>{lastError}</span>
          <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
        </Stack>
      </Alert>
    );
  }

  const viewer = <ApplicantResumeViewer applicationId={detail.application.id} resumeMeta={detail.resumeMeta} initialUrl={detail.resumeDownloadUrl} />;
  const isArchived = Boolean(detail.application.archived);
  const sidebar = (
    <ApplicantReviewPanel
      score={detail.score}
      scoreJobStatus={detail.scoreJobStatus}
      applicationId={detail.application.id}
      currentStageId={detail.application.stageId}
      archived={isArchived}
      stages={stages}
      reasons={reasons}
      stageChanges={detail.stageChanges}
      onDone={load}
      // While active, the sticky bar owns move + archive. Once archived it hands
      // back, because unarchive lives on the panel and nowhere else.
      showActions={isArchived}
    />
  );
  // Pinned to the top of the sidebar so the decision is reachable without scrolling
  // past the contact card, the cover note and the whole score region.
  const actionBar = (
    <ApplicantActionBar
      candidateName={detail.contact?.fullName ?? 'this candidate'}
      applicationId={detail.application.id}
      currentStageId={detail.application.stageId}
      stages={stages}
      reasons={reasons}
      archived={isArchived}
      canMove={canMove}
      canArchive={canArchive}
      canSchedule={canSchedule}
      canAnonymize={canAnonymize}
      contactId={detail.contact?.id ?? null}
      isDoNotContact={Boolean(detail.contact?.doNotContact?.flag)}
      // Member+ — the same boundary the backend applies. canMove is that boundary.
      canFlagContact={canMove}
      isMoving={isMoving}
      previousHref={previousHref}
      nextHref={nextHref}
      positionText={positionText}
      onMove={onMove}
      onArchived={onArchived}
      onAnonymized={load}
    />
  );
  // The whole sidebar stack, in one place for both layouts — see ApplicantSidebarCards.
  const cards = (
    <ApplicantSidebarCards
      detail={detail}
      stages={stages}
      reasons={reasons}
      canEditTags={canMove}
      currentEmployerUserId={currentEmployerUserId}
      reviewPanel={sidebar}
      load={load}
    />
  );

  if (!twoColumn) {
    return <Stack gap={16}>{viewer}{actionBar}{cards}</Stack>;
  }
  return (
    <div style={GRID_STYLE}>
      <div style={LEFT_COLUMN_STYLE}>{viewer}</div>
      <div style={RIGHT_COLUMN_STYLE}>
        <Stack gap={16}>{actionBar}{cards}</Stack>
      </div>
    </div>
  );
}
