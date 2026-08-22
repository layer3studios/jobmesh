'use client';
// FILE: src/components/employer/jobs/parts/FeedbackSummaryCard.tsx
// The panel's verdicts on one candidate, in one card, above the individual
// interviews.
//
// THE ANTI-BIAS HOLD IS THE REASON THIS CARD IS SHAPED THIS WAY. An interviewer who
// reads "3 yes" before writing their own scorecard has already been anchored, so
// while they still owe feedback the server sends counts and nothing else — no
// names, no notes. The counts stay visible on purpose: hiding the card entirely
// would make the feature look broken, and knowing that four people have answered
// tells you nothing about what they said.
//
// It fetches its own summary rather than riding the detail payload: feedback lands
// from a different surface (the feedback prompt below it) and this card has to be
// able to refresh on its own after that.

import { useCallback, useEffect, useState } from 'react';
import { Card, Stack, Alert, SkeletonCard } from '@/components/ui';
import { fetchFeedbackSummary } from '@/api/employer-applicants-api';
import type { InterviewFeedbackSummary } from '@/types/employer-applicants';
import { COPY } from '@/theme/brand';
import { SIGNAL_LABEL, SIGNAL_COLOR, presentRecommendations, RECOMMENDATION_LABEL, RECOMMENDATION_COLOR } from './feedback-summary-helpers';
import FeedbackEntryRow from './FeedbackEntryRow';

const C = COPY.employer.applicants;

const HEADING_STYLE = { margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' };
const COUNT_STYLE = { fontSize: 12, color: 'var(--ink-faint)' };

function SignalBadge({ signal }: { signal: NonNullable<InterviewFeedbackSummary['overallSignal']> }) {
  const tone = SIGNAL_COLOR[signal];
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: tone.bg, color: tone.fg, whiteSpace: 'nowrap',
    }}>
      {SIGNAL_LABEL[signal]}
    </span>
  );
}

/** "2 Strong yes · 1 No" as pills. Only what actually occurred is shown. */
function RecommendationPills({ counts }: { counts: InterviewFeedbackSummary['recommendations'] }) {
  const present = presentRecommendations(counts);
  if (present.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {present.map(({ key, count }) => {
        const tone = RECOMMENDATION_COLOR[key];
        return (
          <span key={key} style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 12,
            background: tone.bg, color: tone.fg,
          }}>
            <strong style={{ fontWeight: 700 }}>{count}</strong> {RECOMMENDATION_LABEL[key]}
          </span>
        );
      })}
    </div>
  );
}

export default function FeedbackSummaryCard({ applicationId }: { applicationId: string }) {
  const [summary, setSummary] = useState<InterviewFeedbackSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setSummary(await fetchFeedbackSummary(applicationId));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { void load(); }, [load]);

  if (isLoading) return <SkeletonCard lines={3} />;
  // No interviews at all → no card. A failure is also silent: this is a summary of
  // information already shown below it, so an error banner would be noise.
  if (failed || !summary) return null;

  return (
    <Card>
      <Stack gap={12}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={HEADING_STYLE}>{C.feedbackTitle}</h3>
          <span style={COUNT_STYLE}>
            {C.feedbackCount
              .replace('{completed}', String(summary.completedInterviews))
              .replace('{total}', String(summary.totalInterviews))}
          </span>
          <span style={{ marginLeft: 'auto' }}>
            {summary.overallSignal && <SignalBadge signal={summary.overallSignal} />}
          </span>
        </div>

        <RecommendationPills counts={summary.recommendations} />

        {summary.averageScore != null && (
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            Average score: <strong style={{ color: 'var(--ink)' }}>{summary.averageScore.toFixed(1)}</strong>
          </div>
        )}

        {summary.viewerOwesFeedback ? (
          <Alert type="info">
            <strong style={{ display: 'block' }}>{C.feedbackHeldTitle}</strong>
            <span style={{ fontSize: 12 }}>{C.feedbackHeldBody}</span>
          </Alert>
        ) : summary.feedbackSummaries.length > 0 && (
          <Stack gap={12}>
            {summary.feedbackSummaries.map((entry) => (
              <FeedbackEntryRow key={entry.interviewId} entry={entry} />
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
