'use client';
// FILE: src/components/employer/jobs/RankedScoreCell.tsx
// The Ranked-table Score cell. Extracted from RankedTab to keep that component under
// the line cap. A tier Badge for a usable score; a muted "Scoring…"/"Not scored"
// label otherwise (P1). Pure presentational.

import { Badge } from '@/components/ui';
import type { Applicant } from '@/types/employer-applicants';
import { tierBadgeVariant } from '@/components/employer/jobs/applicant-view-helpers';
import { formatRankedScoreLabel, isScoringInProgress, SCORING_STATE_LABEL } from '@/components/employer/jobs/pipeline-tab-helpers';

export default function ScoreCell({ applicant }: { applicant: Applicant }) {
  if (!applicant.score || applicant.score.processingError) {
    const label = isScoringInProgress(applicant.application.appliedAt)
      ? SCORING_STATE_LABEL.IN_PROGRESS : SCORING_STATE_LABEL.NOT_SCORED;
    return <span style={{ color: 'var(--ink-muted)', fontSize: '0.8125rem' }}>{label}</span>;
  }
  const { score, tier } = applicant.score;
  return <Badge variant={tierBadgeVariant(tier)}>{formatRankedScoreLabel(score, tier)}</Badge>;
}
