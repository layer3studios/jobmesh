'use client';
// FILE: src/components/employer/jobs/parts/AssignmentColumn.tsx
// The Ranked-table "Task" cell. Sibling of RankedScoreCell, and deliberately its own
// column: the AI resume score (0–100, tiered) and the human task score (1–5) measure
// different things on different scales. They are never combined into one cell, one
// number, or one sort. Pure presentational.

import { Badge } from '@/components/ui';
import type { Applicant } from '@/types/employer-applicants';
import { assignmentPillState } from './review-helpers';

export default function AssignmentColumn({ applicant }: { applicant: Applicant }) {
  const state = assignmentPillState(applicant.assignment);
  // "No submission" is an absence, not a status — muted text rather than a pill, so
  // it does not read as a fourth verdict.
  if (state.isEmpty) {
    return <span style={{ color: 'var(--ink-muted)', fontSize: '0.8125rem' }}>{state.label}</span>;
  }
  return <Badge variant={state.variant}>{state.label}</Badge>;
}
