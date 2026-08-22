// FILE: src/components/employer/jobs/interview-feedback-helpers.ts
// The ONE recommendation → label/colour mapping, shared by the feedback prompt,
// the completed InterviewCard state and the candidate timeline.

import type { CSSProperties } from 'react';
import type { Interview, InterviewRecommendation } from '@/types/employer-interviews';

const MINUTE_MS = 60000;

/** Past its END (start + duration) but never marked — the feedback window. */
export function isAwaitingFeedback(interview: Interview): boolean {
  return interview.status === 'scheduled'
    && interview.startAtUtc !== null
    && new Date(interview.startAtUtc).getTime() + interview.durationMinutes * MINUTE_MS < Date.now();
}

const LABELS: Record<InterviewRecommendation, string> = {
  strong_yes: 'Strong yes', yes: 'Yes', no: 'No', strong_no: 'Strong no',
};

export function recommendationLabel(value: InterviewRecommendation): string {
  return LABELS[value];
}

/** Badge colours for a recorded recommendation. */
export function recommendationBadgeStyle(value: InterviewRecommendation): CSSProperties {
  const positive = value === 'strong_yes' || value === 'yes';
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500,
    padding: '2px 8px', borderRadius: 999,
    background: positive ? 'var(--success-soft)' : 'var(--danger-soft)',
    color: positive ? 'var(--success)' : 'var(--danger)',
  };
}

const PILL_BASE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px',
  borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
};

/** Strong verdicts fill; mild ones outline. Green ↑, amber/red ↓. */
function pillStyle(fill: string, edge: string, filled: boolean) {
  return (selected: boolean): CSSProperties => ({
    ...PILL_BASE,
    border: `1px solid ${selected ? edge : 'var(--border)'}`,
    background: selected ? (filled ? edge : fill) : 'transparent',
    color: selected ? (filled ? 'var(--text-on-accent)' : edge) : 'var(--ink-2)',
  });
}

export const RECOMMENDATION_OPTIONS: Array<{
  value: InterviewRecommendation;
  positive: boolean;
  style: (selected: boolean) => CSSProperties;
}> = [
  { value: 'strong_yes', positive: true, style: pillStyle('var(--success-soft)', 'var(--success)', true) },
  { value: 'yes', positive: true, style: pillStyle('var(--success-soft)', 'var(--success)', false) },
  { value: 'no', positive: false, style: pillStyle('var(--warning-soft)', 'var(--warning)', false) },
  { value: 'strong_no', positive: false, style: pillStyle('var(--danger-soft)', 'var(--danger)', true) },
];
