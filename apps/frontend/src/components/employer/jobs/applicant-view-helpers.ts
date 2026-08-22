// FILE: src/components/employer/jobs/applicant-view-helpers.ts
// Pure presentation helpers shared by the Ranked table and Kanban cards: map an AI
// score tier to a Badge variant (R2 colour language) and format the applied date
// as a compact relative string. No React, no I/O — trivially unit-testable.

import type { ScoreTier } from '@/types/employer-applicants';

type BadgeVariant = 'success' | 'brand' | 'warning' | 'neutral';

const TIER_VARIANT: Record<ScoreTier, BadgeVariant> = {
  strong: 'success',
  good: 'brand',
  partial: 'warning',
  weak: 'neutral',
  poor: 'neutral',
};

/** Badge variant for a score tier (strong=success, good=brand, partial=warning, weak/poor=neutral). */
export function tierBadgeVariant(tier: ScoreTier): BadgeVariant {
  return TIER_VARIANT[tier] ?? 'neutral';
}

/** Compact relative time, e.g. "just now", "3h ago", "2d ago", else a locale date. */
export function formatRelativeTime(isoDate: string, now: number = Date.now()): string {
  const then = new Date(isoDate).getTime();
  if (!Number.isFinite(then)) return '—';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}
