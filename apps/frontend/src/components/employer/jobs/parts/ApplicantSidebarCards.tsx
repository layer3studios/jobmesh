'use client';
// FILE: src/components/employer/jobs/parts/ApplicantSidebarCards.tsx
// The stack of cards down the applicant sidebar, in reading order.
//
// Extracted from ApplicantDetailBody, which was over its line cap and enumerated
// this same sequence twice — once for the mobile stack and once for the desktop
// right column. Now there is ONE list, which is what stops the two layouts drifting
// into different orders the next time a card is added.
//
// ORDER IS THE ARGUMENT. Who they are (contact, other applications, tags), then what
// they said (cover note, assignment), then what we think (score panel), then what
// happens next (interviews), then the record (timeline, notes).

import { Stack } from '@/components/ui';
import type { ApplicantDetail, Stage, ArchiveReason } from '@/types/employer-applicants';
import ApplicantContactCard from '../ApplicantContactCard';
import ApplicantOtherApplications from '../ApplicantOtherApplications';
import ApplicantTagsCard from '../ApplicantTagsCard';
import ApplicantCoverNote from '../ApplicantCoverNote';
import ApplicantNotesCard from '../ApplicantNotesCard';
import InterviewSection from '../InterviewSection';
import CandidateTimeline from '../CandidateTimeline';
import AssignmentReviewPanel from './AssignmentReviewPanel';
import FeedbackSummaryCard from './FeedbackSummaryCard';

export default function ApplicantSidebarCards({
  detail, stages, reasons, canEditTags, currentEmployerUserId, reviewPanel, load,
}: {
  detail: ApplicantDetail;
  stages: Stage[];
  reasons: ArchiveReason[];
  /** Member+ — the same boundary the backend applies to tags. */
  canEditTags: boolean;
  currentEmployerUserId: string | null;
  /** Built by the parent because it also owns the archived/actions branch. */
  reviewPanel: React.ReactNode;
  load: () => Promise<void> | void;
}) {
  const candidateName = detail.contact?.fullName ?? null;
  const coverNote = detail.application.coverNote?.trim() || null;

  return (
    <Stack gap={16}>
      {detail.contact && <ApplicantContactCard contact={detail.contact} />}
      {/* Renders nothing for anyone who applied exactly once — the backend omits
          the key entirely rather than sending an empty array. */}
      <ApplicantOtherApplications otherApplications={detail.otherApplications ?? []} />
      <ApplicantTagsCard
        applicationId={detail.application.id}
        initialTags={detail.application.tags ?? []}
        canEdit={canEditTags}
      />
      {/* Candidate-voiced (R1/R2), shown only when non-empty (R3). */}
      {coverNote && <ApplicantCoverNote coverNote={coverNote} />}
      {/* Absent for a plain posting, and for a legacy application on a posting that
          gained an assignment later — in both cases this renders exactly as before. */}
      {detail.assignmentSubmission && (
        <AssignmentReviewPanel
          submission={detail.assignmentSubmission}
          review={detail.assignmentReview ?? null}
          currentEmployerUserId={currentEmployerUserId}
          onSaved={load}
        />
      )}
      {reviewPanel}
      {/* Above the interviews themselves: the aggregate is what you read first,
          the individual interviews are what you read when it surprises you.
          Renders nothing when this candidate has no interviews. */}
      <FeedbackSummaryCard applicationId={detail.application.id} />
      <InterviewSection
        applicationId={detail.application.id}
        candidateName={candidateName}
        candidatePhone={detail.contact?.phone ?? null}
        stages={stages}
        reasons={reasons}
        onApplicantChanged={() => void load()}
      />
      {/* Merged history sits ABOVE notes: the story first, the conversation below.
          Notes stay their own card — composing a note inline in a timeline is
          clumsy, and notes also appear inside the timeline as events. */}
      <CandidateTimeline applicationId={detail.application.id} candidateName={candidateName} />
      {/* Fetches its own list (D8) so the detail response stays lean. Grows inside
          the parent's own overflow-y region, so the page still never scrolls (P8). */}
      <ApplicantNotesCard applicationId={detail.application.id} />
    </Stack>
  );
}
