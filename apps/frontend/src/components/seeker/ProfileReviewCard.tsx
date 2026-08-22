'use client';
// FILE: src/components/seeker/ProfileReviewCard.tsx
// Orchestrates the resume-review card on /profile (D5). Five states: loading
// (initial GET), empty (review null → Run review CTA), running, failed (mapped
// copy + Try again), and loaded (scores + improvements + stale badge + Refresh).
// The run/refresh button follows the accessible-loading pattern (C11/R2):
// disabled + a sibling aria-live status node, NEVER aria-busy on the button, and
// the label flips to "Reviewing…". No navigation or toasts fire from here.

import { Card, Button, Alert, Spinner, Badge, Stack } from '../ui';
import { useResumeReview } from '../../hooks/seeker/useResumeReview';
import ProfileReviewScores from './ProfileReviewScores';
import ProfileReviewImprovements from './ProfileReviewImprovements';

// Frontend copy is a UX concern, not part of the API contract (D8).
const RESUME_REVIEW_ERROR_MESSAGES: Record<string, string> = {
  NO_PROFILE: 'Upload your resume first to run a review.',
  GEMMA_UNAVAILABLE: 'Review is temporarily unavailable. Please try again in a minute.',
  REVIEW_PARSE_FAILED: "We couldn't parse the review response. Please try again.",
};
const GENERIC_REVIEW_ERROR = 'Something went wrong. Please try again.';

function resolveReviewError(errorCode: string | null, errorMessage: string | null): string {
  if (errorCode && RESUME_REVIEW_ERROR_MESSAGES[errorCode]) return RESUME_REVIEW_ERROR_MESSAGES[errorCode];
  // Unmapped code — a backend error the copy map hasn't caught up with. Fall back
  // to the server message and warn once so it surfaces in dev (C5 exception).
  if (errorCode) console.warn(`[ProfileReviewCard] unmapped errorCode: ${errorCode}`);
  return errorMessage || GENERIC_REVIEW_ERROR;
}

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function CardTitle({ children }: { children: string }) {
  return <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{children}</h3>;
}

function RunButton({
  isRunning, idleLabel, onClick, variant,
}: { isRunning: boolean; idleLabel: string; onClick: () => void; variant?: 'primary' | 'ghost' }) {
  return (
    <Stack gap={8} dir="row" align="center">
      <Button variant={variant ?? 'primary'} disabled={isRunning} onClick={onClick}>
        {isRunning ? <><Spinner size={14} />Reviewing…</> : idleLabel}
      </Button>
      <span aria-live="polite" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
        {isRunning ? 'Analysing your resume…' : ''}
      </span>
    </Stack>
  );
}

export default function ProfileReviewCard({ profileUpdatedAt }: { profileUpdatedAt: string | null }) {
  const { review, status, errorCode, errorMessage, run, computeStale } = useResumeReview();
  const isRunning = status === 'running';

  if (status === 'loading' || status === 'idle') {
    return (
      <Card>
        <Stack gap={10} dir="row" align="center">
          <Spinner size={18} />
          <span style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>Loading your resume review…</span>
        </Stack>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card>
        <Stack gap={12}>
          <CardTitle>Resume review</CardTitle>
          <Alert type="error">{resolveReviewError(errorCode, errorMessage)}</Alert>
          <RunButton isRunning={false} idleLabel="Try again" onClick={() => void run()} />
        </Stack>
      </Card>
    );
  }

  // 'loaded' or 'running'. A running refresh keeps the previous review visible.
  if (review === null) {
    return (
      <Card>
        <Stack gap={12}>
          <CardTitle>Resume review</CardTitle>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>
            Get a review of your resume. Takes about 10–15 seconds.
          </p>
          <RunButton isRunning={isRunning} idleLabel="Run review" onClick={() => void run()} />
        </Stack>
      </Card>
    );
  }

  const isStale = computeStale(profileUpdatedAt);
  return (
    <Card>
      <Stack gap={14}>
        <Stack gap={10} dir="row" align="center" justify="space-between" wrap>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <CardTitle>Resume review</CardTitle>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Reviewed {relativeTime(review.reviewedAt)}</span>
            {isStale && <Badge variant="warning" size="sm">Profile changed after this review</Badge>}
          </div>
          <RunButton isRunning={isRunning} idleLabel="Refresh review" variant="ghost" onClick={() => void run()} />
        </Stack>
        <ProfileReviewScores scores={review.scores} />
        <ProfileReviewImprovements strengths={review.strengths} topImprovements={review.topImprovements} />
      </Stack>
    </Card>
  );
}
