// FILE: src/components/apply/careers-helpers.ts
// Pure helpers for the careers page roles list. Separated so the filtering and
// recency rules are unit-testable without mounting a component.

import type { PublicJobSummary } from '@/types/public-apply';

/** Past this, a listing reads as stale and the rail dims it. */
export const STALE_AFTER_DAYS = 30;
const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * "2d" / "3w" / "5mo" — compact posted-recency for the rail.
 *
 * Returns null (render nothing) rather than a placeholder when postedAt is absent:
 * a draft that was never published has no posting date, and inventing "—" in a
 * column candidates read as recency would be worse than an empty cell.
 */
export function postedAgo(postedAt: string | null, now: number = Date.now()): string | null {
  if (!postedAt) return null;
  const then = new Date(postedAt).getTime();
  if (!Number.isFinite(then)) return null;
  const days = Math.max(0, Math.floor((now - then) / MILLISECONDS_PER_DAY));
  if (days < 1) return 'today';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

/** True once a posting is old enough that the rail should visually de-emphasise it. */
export function isStale(postedAt: string | null, now: number = Date.now()): boolean {
  if (!postedAt) return false;
  const then = new Date(postedAt).getTime();
  if (!Number.isFinite(then)) return false;
  return (now - then) / MILLISECONDS_PER_DAY > STALE_AFTER_DAYS;
}

/**
 * Distinct locations, in first-seen order.
 *
 * The brief asked for DEPARTMENT chips, but no posting in this schema carries a
 * department — not on the model, not in the public projection. Location is the one
 * real dimension a candidate filters on here, and for an India-focused board
 * ("Bengaluru vs Remote") it is arguably the more useful axis anyway. Swapping in a
 * guessed department parsed from job titles would invent data.
 */
export function distinctLocations(jobs: PublicJobSummary[]): string[] {
  const seen = new Set<string>();
  for (const job of jobs) {
    const location = job.location?.trim();
    if (location) seen.add(location);
  }
  return [...seen];
}

/** Case-insensitive title match plus an exact location match. Both optional. */
export function filterJobs(
  jobs: PublicJobSummary[],
  { query, location }: { query: string; location: string | null },
): PublicJobSummary[] {
  const needle = query.trim().toLowerCase();
  return jobs.filter((job) => {
    if (location && job.location?.trim() !== location) return false;
    if (!needle) return true;
    return job.title.toLowerCase().includes(needle);
  });
}
