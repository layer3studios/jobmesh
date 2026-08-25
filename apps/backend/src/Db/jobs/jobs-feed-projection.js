// FILE: src/Db/jobs/jobs-feed-projection.js
// What the /api/jobs feed returns per row, and the ceiling on how many rows.
// Split out of queries.js the same way jobs-query-builder.js was: the shape of a
// job CARD changes for product reasons, while the file it left changes for
// pagination and caching reasons.

/**
 * What a job card needs, and nothing else.
 *
 * The feed previously shipped whole documents (`.project({ __v: 0 })` excludes one
 * field and keeps every other), which meant every row carried FOUR renderings of
 * the same description — `Description` (raw ATS HTML), `DescriptionCleaned`,
 * `DescriptionPlain` and `DescriptionLists` — for a card that shows none of them.
 *
 * `DescriptionPlain` STAYS. The client matches the seeker's skills against it to
 * draw the "N skills match" chip and to power sort-by-match (dashboard/index.tsx,
 * JobListColumn.tsx, today/index.tsx), so dropping it would silently empty a
 * visible feature rather than fail loudly. The other three go — the detail view
 * fetches the full document by id (findJobById), which is what that route is for.
 *
 * Scraper bookkeeping (JobID, sourceSite, ATSPlatform, Office, Team, updatedAt) is
 * dropped too: no client reads it, and the feed is public, so it was being handed
 * to unauthenticated callers for nothing.
 *
 * ANYTHING A CARD LEARNS TO RENDER MUST BE ADDED HERE. A missing field does not
 * throw, it arrives as undefined — so the failure mode is a blank in the UI, not a
 * stack trace. Grep the seeker components before trimming this further.
 */
export const FEED_PROJECTION = {
  JobTitle: 1, Company: 1, Location: 1, PostedDate: 1,
  ApplicationURL: 1, DirectApplyURL: 1,
  Department: 1, ContractType: 1, WorkplaceType: 1, IsRemote: 1,
  SalaryMin: 1, SalaryMax: 1, SalaryCurrency: 1, SalaryInfo: 1,
  Status: 1, isEntryLevel: 1, autoTags: 1,
  scrapedAt: 1, createdAt: 1,
  // Client-side skill matching only — never rendered as prose.
  DescriptionPlain: 1,
};

/** Hard ceiling on rows per feed request, whatever the caller asks for. */
export const MAX_FEED_LIMIT = 50;

/**
 * Coerce a caller-supplied limit into [1, MAX_FEED_LIMIT].
 *
 * The floor matters as much as the ceiling: parseInt lets a negative through, and
 * Mongo reads a negative limit as "return this many, then close the cursor" — a
 * different query than the one anybody intended.
 */
export function clampFeedLimit(limit) {
  return Math.min(Math.max(1, Math.trunc(limit) || 1), MAX_FEED_LIMIT);
}
