// FILE: src/components/employer/jobs/parts/feedback-summary-helpers.ts
// Labels and colours for the interview-feedback summary. Pure — no React, no I/O.

import type { InterviewRecommendation, OverallSignal } from '@/types/employer-applicants';
import { COPY } from '@/theme/brand';

const C = COPY.employer.applicants;

/** The four-point scale, in the order a panel reads it: best to worst. */
export const RECOMMENDATION_ORDER: InterviewRecommendation[] = ['strong_yes', 'yes', 'no', 'strong_no'];

export const RECOMMENDATION_LABEL: Record<InterviewRecommendation, string> = {
  strong_yes: C.recStrongYes,
  yes: C.recYes,
  no: C.recNo,
  strong_no: C.recStrongNo,
};

/**
 * Colour carries the direction, weight carries the strength.
 *
 * "Strong yes" and "yes" share the success hue rather than getting two different
 * greens: the panel is answering one question in one direction, and inventing a
 * second colour for the emphatic version turns a two-way read into a four-way one.
 */
export const RECOMMENDATION_COLOR: Record<InterviewRecommendation, { fg: string; bg: string }> = {
  strong_yes: { fg: 'var(--success)', bg: 'var(--success-soft)' },
  yes: { fg: 'var(--success)', bg: 'var(--success-soft)' },
  no: { fg: 'var(--danger)', bg: 'var(--danger-soft)' },
  strong_no: { fg: 'var(--danger)', bg: 'var(--danger-soft)' },
};

export const SIGNAL_LABEL: Record<OverallSignal, string> = {
  strong_hire: C.signalStrongHire,
  hire: C.signalHire,
  mixed: C.signalMixed,
  no_hire: C.signalNoHire,
};

/** Amber for Mixed is the point of the whole badge: a split needs a human. */
export const SIGNAL_COLOR: Record<OverallSignal, { fg: string; bg: string }> = {
  strong_hire: { fg: 'var(--success)', bg: 'var(--success-soft)' },
  hire: { fg: 'var(--accent)', bg: 'var(--accent-soft)' },
  mixed: { fg: 'var(--warning)', bg: 'var(--warning-soft)' },
  no_hire: { fg: 'var(--danger)', bg: 'var(--danger-soft)' },
};

/** Only the recommendations that actually occurred, in scale order. */
export function presentRecommendations(
  counts: Partial<Record<InterviewRecommendation, number>>,
): Array<{ key: InterviewRecommendation; count: number }> {
  return RECOMMENDATION_ORDER
    .map((key) => ({ key, count: counts[key] ?? 0 }))
    .filter((entry) => entry.count > 0);
}
