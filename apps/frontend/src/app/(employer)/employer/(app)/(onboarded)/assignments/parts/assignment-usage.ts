// FILE: assignments/parts/assignment-usage.ts
// Derives "which postings use which assignment" from the postings list.
//
// It lives here rather than in page.tsx because a Next page module may only export
// `default` and the framework's own reserved names — any extra named export is a
// build error. It is also the one piece of that page worth unit-testing on its own.
//
// See the comment on fetchPostings in ../page.tsx for WHY this is computed client-
// side at all: the assignment endpoints carry no usage count, and toPublicPosting
// already carries assignmentId.

import type { Posting } from '@/types/employer-jobs';
import type { AssignmentUsage } from '@/types/employer-assignments';

/** Group postings by the assignment they reference. Postings with none are skipped. */
export function groupUsageByAssignment(postings: Posting[]): Record<string, AssignmentUsage[]> {
  const usage: Record<string, AssignmentUsage[]> = {};
  for (const posting of postings ?? []) {
    if (!posting?.assignmentId) continue;
    (usage[posting.assignmentId] ??= []).push({
      id: posting.id,
      title: posting.title ?? null,
      status: posting.status ?? null,
    });
  }
  return usage;
}
