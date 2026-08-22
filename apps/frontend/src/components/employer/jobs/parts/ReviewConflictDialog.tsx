'use client';
// FILE: src/components/employer/jobs/parts/ReviewConflictDialog.tsx
// Two reviewers saved at once. This dialog is the reason the backend's 409 carries a
// full payload instead of a code.
//
// SHOW BOTH REVIEWS, DECIDE NOTHING. There is no auto-merge (the two verdicts are
// judgements, not fields to combine), no silent discard, and no force flag — the
// override is expressed by echoing back the winning review's reviewedAt, so the
// version IS the intent. A generic "someone else got there first" toast would throw
// away everything the backend went out of its way to send: what the colleague
// actually scored, what they wrote, and who they are. "Rahul reviewed this 4 minutes
// ago, and here is what he said" is actionable; "conflict" is not.
//
// The reviewer's own typed notes survive both choices — this component never clears
// the form, it only reports which way they went.

import Markdown from '@/components/shared/Markdown';
import { Badge, Button, Modal } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import type { AssignmentReview } from '@/types/employer-applicants';
import type { ConflictingReviewer } from '@/api/employer-assignment-reviews-api';
import { formatRelativeTime, anchorFor } from './review-helpers';

export interface PendingReview {
  overallScore: number;
  passesBar: boolean;
  reviewNotesMarkdown: string;
}

const columnStyle: React.CSSProperties = {
  flex: '1 1 240px', minWidth: 0, border: '1px solid var(--border)',
  borderRadius: 10, padding: '12px 14px',
};
const headingStyle: React.CSSProperties = {
  fontSize: TYPE.sm, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px',
};

function ScoreLine({ score, passesBar }: { score: number | null; passesBar: boolean }) {
  const anchor = anchorFor(score);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
      <Badge variant="neutral">{score == null ? '—' : `${score}/5`}</Badge>
      <Badge variant={passesBar ? 'success' : 'danger'}>{passesBar ? 'Passed' : 'Failed'}</Badge>
      {anchor && <span style={{ fontSize: TYPE.xs, color: 'var(--ink-muted)' }}>{anchor.label}</span>}
    </div>
  );
}

interface Props {
  /** null closes the dialog. */
  currentReview: AssignmentReview | null;
  conflictingReviewer: ConflictingReviewer | null;
  /** What this reviewer was trying to save. Never discarded by this component. */
  pending: PendingReview | null;
  isSubmitting: boolean;
  /** Keep theirs — closes, makes no request, leaves the form untouched. */
  onKeepTheirs: () => void;
  /** Replace — re-submits using the reviewedAt from the 409 body as the lock. */
  onReplace: (expectedReviewedAt: string | null) => void;
}

export default function ReviewConflictDialog({
  currentReview, conflictingReviewer, pending, isSubmitting, onKeepTheirs, onReplace,
}: Props) {
  if (!currentReview || !pending) return null;

  const theirName = conflictingReviewer?.name
    ?? conflictingReviewer?.email
    // The user row can be gone (removed teammate); the review still stands.
    ?? 'A teammate';
  const savedAgo = currentReview.reviewedAt ? formatRelativeTime(currentReview.reviewedAt) : null;

  return (
    <Modal
      isOpen
      onClose={() => { if (!isSubmitting) onKeepTheirs(); }}
      title="Another reviewer saved first"
      size="lg"
      closeOnOverlayClick={false}
      footer={(
        <>
          <Button variant="secondary" disabled={isSubmitting} onClick={onKeepTheirs}>
            Keep theirs, discard mine
          </Button>
          {/* The reviewedAt from the 409 IS the override token. */}
          <Button
            variant="primary" loading={isSubmitting}
            onClick={() => onReplace(currentReview.reviewedAt)}
          >
            Replace with mine
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: TYPE.sm, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          {`${theirName} saved a review while you were writing yours. Read both, then decide — nothing is discarded until you choose.`}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <section style={columnStyle} aria-label="Your review">
            <h3 style={headingStyle}>Your review</h3>
            <ScoreLine score={pending.overallScore} passesBar={pending.passesBar} />
            {pending.reviewNotesMarkdown.trim()
              ? <Markdown>{pending.reviewNotesMarkdown}</Markdown>
              : <p style={{ fontSize: TYPE.xs, color: 'var(--ink-muted)', margin: 0 }}>No notes.</p>}
          </section>

          <section style={columnStyle} aria-label={`${theirName}'s review`}>
            <h3 style={headingStyle}>
              {`${theirName}'s review${savedAgo ? ` · saved ${savedAgo}` : ''}`}
            </h3>
            <ScoreLine score={currentReview.overallScore} passesBar={currentReview.passesBar} />
            {currentReview.reviewNotesMarkdown?.trim()
              ? <Markdown>{currentReview.reviewNotesMarkdown}</Markdown>
              : <p style={{ fontSize: TYPE.xs, color: 'var(--ink-muted)', margin: 0 }}>No notes.</p>}
          </section>
        </div>
      </div>
    </Modal>
  );
}
