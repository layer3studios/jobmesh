// FILE: src/components/seeker/dashboard/filter-helpers.ts
import type { IJob } from '../../../types';

/** How many jobs were posted/scraped in the last 3 days. */
export function countNewJobs(jobs: IJob[]): number {
  const now = Date.now();
  return jobs.filter(j => {
    const d = j.PostedDate || j.createdAt || j.scrapedAt;
    if (!d) return false;
    return (now - new Date(d).getTime()) / 86400000 <= 3;
  }).length;
}

/** Filter jobs by client-side toggles (dismissed, hide applied, show new only). */
export function applyClientFilters(
  jobs: IJob[],
  dismissedJobIds: Set<string>,
  appliedJobIds: Set<string>,
  hideApplied: boolean,
  showNewOnly: boolean,
): IJob[] {
  const now = Date.now();
  return jobs.filter(j => {
    if (dismissedJobIds.has(j._id)) return false;
    if (hideApplied && appliedJobIds.has(j._id)) return false;
    if (showNewOnly) {
      const d = j.PostedDate || j.createdAt || j.scrapedAt;
      if (!d) return false;
      if ((now - new Date(d).getTime()) / 86400000 > 3) return false;
    }
    return true;
  });
}
