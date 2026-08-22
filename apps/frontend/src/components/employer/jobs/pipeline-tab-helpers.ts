// FILE: src/components/employer/jobs/pipeline-tab-helpers.ts
// Pure state transforms for the Kanban board (R3/R6). Extracted from PipelineTab so
// the move logic is unit-testable without simulating pointer events. The board
// state is a Map<stageId, Applicant[]>; moves remove the card from its source
// column and append it to the target (arrival order, no per-card ordering — R3).

import type { Applicant, Stage, ScoreTier } from '@/types/employer-applicants';

// ─── Score-chip copy (P1.3, R1) ────────────────────────────────────
// "35 · weak" is cryptic to anyone outside the team. Prefix with "AI"/"AI Score"
// and suffix "match" so the number reads as an AI fit score at a glance.
const SCORE_LABEL_KANBAN_PREFIX = 'AI';
const SCORE_LABEL_RANKED_PREFIX = 'AI Score';
const SCORE_LABEL_MATCH_SUFFIX = 'match';

/** Narrow Kanban card label, e.g. "AI 35 · weak match". */
export function formatKanbanScoreLabel(score: number, tier: ScoreTier): string {
  return `${SCORE_LABEL_KANBAN_PREFIX} ${score} · ${tier} ${SCORE_LABEL_MATCH_SUFFIX}`;
}

/** Wider Ranked-table label, e.g. "AI Score 35/100 · weak match". */
export function formatRankedScoreLabel(score: number, tier: ScoreTier): string {
  return `${SCORE_LABEL_RANKED_PREFIX} ${score}/100 · ${tier} ${SCORE_LABEL_MATCH_SUFFIX}`;
}

// ─── Scoring waiting-state (P1.5, R2/R3) ───────────────────────────
// A freshly-applied applicant sits in the Q1 scoring queue for up to ~90s. Showing
// "Not scored" during that window is misleading. Within the grace window an unscored
// applicant reads "Scoring…"; past it, a genuine "Not scored". Client-only, no poll.
export const SCORING_WAIT_WINDOW_MINUTES = 15;

// No magic strings for the two waiting-state labels (C2).
export const SCORING_STATE_LABEL = {
  IN_PROGRESS: 'Scoring…',
  NOT_SCORED: 'Not scored',
} as const;

/** True when the application was created within the scoring grace window (still queued). */
export function isScoringInProgress(appliedAtIso: string | null | undefined, now: Date = new Date()): boolean {
  if (!appliedAtIso) return false;
  const applied = new Date(appliedAtIso).getTime();
  if (!Number.isFinite(applied)) return false;
  return now.getTime() - applied < SCORING_WAIT_WINDOW_MINUTES * 60_000;
}

/** Group non-archived applicants by their stageId; every stage gets an entry (R3). */
export function groupApplicantsByStage(applicants: Applicant[], stages: Stage[]): Map<string, Applicant[]> {
  const byStage = new Map<string, Applicant[]>();
  for (const stage of stages) byStage.set(stage.id, []);
  for (const applicant of applicants) {
    if (applicant.application.archived) continue; // archived cards stay out of the board
    const stageId = applicant.application.stageId;
    if (!byStage.has(stageId)) byStage.set(stageId, []);
    byStage.get(stageId)!.push(applicant);
  }
  return byStage;
}

/** Find one applicant across every column by its application id. */
export function findApplicantById(byStage: Map<string, Applicant[]>, applicationId: string): Applicant | null {
  for (const applicants of byStage.values()) {
    const found = applicants.find((applicant) => applicant.application.id === applicationId);
    if (found) return found;
  }
  return null;
}

/**
 * Return a new map with `applicant` removed from its current column and appended to
 * `targetStageId`, its stageId updated. A no-op (returns the same map) when the
 * applicant is already in the target column.
 */
export function moveApplicantInMap(
  byStage: Map<string, Applicant[]>,
  applicant: Applicant,
  targetStageId: string,
): Map<string, Applicant[]> {
  if (applicant.application.stageId === targetStageId) return byStage;
  const next = new Map<string, Applicant[]>();
  for (const [stageId, applicants] of byStage) {
    next.set(stageId, applicants.filter((entry) => entry.application.id !== applicant.application.id));
  }
  if (!next.has(targetStageId)) next.set(targetStageId, []);
  const moved: Applicant = {
    ...applicant,
    application: { ...applicant.application, stageId: targetStageId },
  };
  next.set(targetStageId, [...next.get(targetStageId)!, moved]);
  return next;
}
