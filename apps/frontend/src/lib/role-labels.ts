// FILE: src/lib/role-labels.ts
// Single source of truth for how a team role renders — its human label and its
// Badge variant. Every table, modal and nav badge imports from here so the wording
// and colour of a role never drift between surfaces.
import type { Role } from '../types/employer-team';

const LABELS: Record<Role, string> = {
  founder: 'Founder',
  owner: 'Owner',
  member: 'Member',
  interviewer: 'Interviewer',
};

// Badge variants are drawn from the documented Badge set (neutral|brand|info|
// warning) so the colours stay inside the design tokens.
const BADGE_VARIANTS: Record<Role, 'brand' | 'info' | 'neutral' | 'warning'> = {
  founder: 'brand',
  owner: 'info',
  member: 'neutral',
  interviewer: 'warning',
};

/** Human label for a role. A founder is a founder regardless of how role reads. */
export function roleLabel(role: Role, isFounder?: boolean): string {
  if (isFounder) return LABELS.founder;
  return LABELS[role] ?? LABELS.member;
}

/** Stable Badge variant name for a role (used across every team surface). */
export function roleBadgeVariant(role: Role): 'brand' | 'info' | 'neutral' | 'warning' {
  return BADGE_VARIANTS[role] ?? 'neutral';
}
