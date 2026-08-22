// FILE: src/components/seeker/ProfileReviewScores.tsx
// Renders the four review dimensions as labelled score bars plus a prominent
// Overall (D6). Colour band: green >=80, amber 60-79, red <60. No inline
// dimension strings — SCORE_DIMENSION_LABELS is the single source of truth.

import type { CSSProperties } from 'react';
import { Stack } from '../ui';
import type { ResumeReview, ReviewScoreDimension } from '../../types/seeker-profile';

const SCORE_DIMENSION_LABELS: Record<ReviewScoreDimension, string> = {
  parseability: 'Parseability',
  contentStrength: 'Content strength',
  indiaMarketFit: 'India market fit',
  skillsDepth: 'Skills depth',
};

const DIMENSION_ORDER: ReviewScoreDimension[] = [
  'parseability', 'contentStrength', 'indiaMarketFit', 'skillsDepth',
];

function bandColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = bandColor(score);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
        <span style={{ color: 'var(--ink-2)' }}>{label}</span>
        <span data-testid="score-value" style={{ color, fontWeight: 600 }}>{score}/100</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--paper-2)' }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: color }} />
      </div>
    </div>
  );
}

export default function ProfileReviewScores({ scores }: { scores: ResumeReview['scores'] }) {
  const overallColor = bandColor(scores.overall);
  const overallStyle: CSSProperties = {
    fontSize: '1.9rem', fontWeight: 700, color: overallColor, lineHeight: 1,
  };
  return (
    <Stack gap={12}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={overallStyle}>{scores.overall}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Overall — {scores.overall}/100</span>
      </div>
      <Stack gap={10}>
        {DIMENSION_ORDER.map((dimension) => (
          <ScoreBar key={dimension} label={SCORE_DIMENSION_LABELS[dimension]} score={scores[dimension]} />
        ))}
      </Stack>
    </Stack>
  );
}
