// FILE: src/services/seeker/leetcode-service.js
// Reads a candidate's PUBLIC LeetCode record through LeetCode's own GraphQL
// endpoint. No auth, no scraping, no credentials — everything here is what any
// visitor sees on leetcode.com/u/<username>.
//
// THE USERNAME IS INTERPOLATED INTO A GRAPHQL DOCUMENT, so it is stripped to
// [A-Za-z0-9_-] before it goes near the query. That character class is exactly
// what LeetCode itself allows in a username, so the sanitiser rejects nothing a
// real account could be called while making a crafted value inert. Never relax it.
//
// Every failure mode here is the caller's to survive, not the candidate's: a
// timeout, a 429 or a 5xx throws, and the routes fall back to whatever is cached.

import { HttpError } from '../../middleware/error-handler-middleware.js';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql/';

/** LeetCode is a third party on the critical path of a page render. Cap the wait. */
export const LEETCODE_TIMEOUT_MS = 10000;

/** The most contests worth charting — beyond this the line is noise, not signal. */
const CONTEST_HISTORY_LIMIT = 20;
const TOP_SKILLS_LIMIT = 10;

/** LeetCode usernames are alphanumerics, underscores and hyphens, up to 20 chars. */
const USERNAME_PATTERN = /^[A-Za-z0-9_-]{1,20}$/;

/**
 * Validate a username for storage and for interpolation.
 * Throws HttpError(400) rather than returning null: an invalid username is a
 * request the candidate can fix, and the message says how.
 */
export function validateLeetCodeUsername(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!USERNAME_PATTERN.test(trimmed)) {
    throw new HttpError(
      400,
      'A LeetCode username is 1–20 letters, numbers, underscores or hyphens.',
      'INVALID_LEETCODE_USERNAME',
    );
  }
  return trimmed;
}

/** Belt-and-braces: strip anything the pattern would have rejected. */
const sanitizeForQuery = (username) => String(username).replace(/[^A-Za-z0-9_-]/g, '');

function buildQuery(username) {
  const safe = sanitizeForQuery(username);
  return `{
    matchedUser(username: "${safe}") {
      username
      profile { ranking reputation starRating }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
      tagProblemCounts {
        advanced { tagName problemsSolved }
        intermediate { tagName problemsSolved }
        fundamental { tagName problemsSolved }
      }
      languageProblemCount { languageName problemsSolved }
      userCalendar { submissionCalendar }
      badges { name icon }
    }
    userContestRanking(username: "${safe}") {
      attendedContestsCount rating globalRanking topPercentage
    }
    userContestRankingHistory(username: "${safe}") {
      attended rating ranking
      contest { title startTime }
    }
  }`;
}

const countFor = (submissions, difficulty) =>
  submissions.find((entry) => entry.difficulty === difficulty)?.count ?? 0;

/**
 * Raw GraphQL response → the shape everything downstream reads.
 *
 * Exported for its own sake: it is pure, it is where every defensive default
 * lives, and it is the only part of this file testable without a network.
 */
export function shapeLeetCodeData(data) {
  const user = data.matchedUser;
  const contest = data.userContestRanking;
  const history = data.userContestRankingHistory;
  const submissions = user.submitStatsGlobal?.acSubmissionNum ?? [];
  const tags = user.tagProblemCounts ?? {};

  return {
    username: user.username,
    ranking: user.profile?.ranking ?? null,

    totalSolved: countFor(submissions, 'All'),
    easySolved: countFor(submissions, 'Easy'),
    mediumSolved: countFor(submissions, 'Medium'),
    hardSolved: countFor(submissions, 'Hard'),

    contestRating: contest?.rating ? Math.round(contest.rating) : null,
    contestsAttended: contest?.attendedContestsCount ?? 0,
    contestGlobalRanking: contest?.globalRanking ?? null,
    // Explicit null check, NOT a falsy one: a top-0.04% competitor rounds to 0.0,
    // and treating that as "no data" would delete the single best number on the
    // page from exactly the people who earned it. `rating` keeps the falsy test —
    // LeetCode reports unrated as null, and a literal 0 rating does not occur.
    contestTopPercentage: contest?.topPercentage == null
      ? null
      : Math.round(contest.topPercentage * 10) / 10,

    // Only contests they actually sat: an unattended entry carries a flat rating
    // that would draw a misleading horizontal run through the chart.
    contestHistory: (history ?? [])
      .filter((entry) => entry.attended)
      .slice(-CONTEST_HISTORY_LIMIT)
      .map((entry) => ({
        contestTitle: entry.contest?.title ?? 'Contest',
        rating: Math.round(entry.rating),
        ranking: entry.ranking,
        date: new Date(entry.contest.startTime * 1000).toISOString(),
      })),

    // The three tiers are LeetCode's own grouping of topics by difficulty. Merged
    // and re-sorted by volume, because "what have they actually done a lot of" is
    // the question a recruiter is asking, not "which tier does LeetCode file it under".
    topSkills: [
      ...(tags.advanced ?? []), ...(tags.intermediate ?? []), ...(tags.fundamental ?? []),
    ]
      .filter((tag) => tag.problemsSolved > 0)
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, TOP_SKILLS_LIMIT)
      .map((tag) => ({ name: tag.tagName, count: tag.problemsSolved })),

    languages: (user.languageProblemCount ?? [])
      .filter((language) => language.problemsSolved > 0)
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .map((language) => ({ name: language.languageName, count: language.problemsSolved })),

    submissionCalendar: user.userCalendar?.submissionCalendar || '{}',
    badges: (user.badges ?? []).map((badge) => ({ name: badge.name, icon: badge.icon })),
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch and shape one public profile.
 *
 * @returns the shaped profile, or null when LeetCode has no such user — a missing
 *   username is an answer, not a failure, and the caller turns it into a 404 the
 *   candidate can act on. Every OTHER problem throws, so the routes can tell
 *   "no such user" apart from "LeetCode is having a bad day" and fall back to cache.
 */
export async function fetchLeetCodeProfile(username) {
  const safe = sanitizeForQuery(username);
  if (!safe) return null;

  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: buildQuery(safe) }),
    signal: AbortSignal.timeout(LEETCODE_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`LeetCode API returned ${response.status}`);

  const json = await response.json();
  // GraphQL answers 200 with a null user for an unknown username.
  if (!json?.data?.matchedUser) return null;
  return shapeLeetCodeData(json.data);
}
