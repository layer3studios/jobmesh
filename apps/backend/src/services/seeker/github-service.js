// FILE: src/services/seeker/github-service.js
// Reads a candidate's PUBLIC GitHub record through GitHub's GraphQL API.
//
// WHY THIS NEEDS A TOKEN WHEN LEETCODE DOES NOT. Nothing here is private — it is
// what any visitor sees on github.com/<username> — but GitHub caps unauthenticated
// REST at 60 requests/hour per IP and refuses GraphQL outright. The token is a
// fine-grained PAT with NO scopes: it buys rate limit, not access. Server-side
// only, and it must never be echoed into a response.
//
// THE USERNAME IS INTERPOLATED INTO A GRAPHQL DOCUMENT, so it is stripped to
// [A-Za-z0-9-] before it goes near the query. That is exactly GitHub's own
// character set, so the sanitiser rejects nothing a real account could be called
// while making a crafted value inert. Never relax it.
//
// Every failure mode is the caller's to survive: a missing token, a timeout, a
// 403 or a 5xx throws, and the read service falls back to whatever is cached.

import { HttpError } from '../../middleware/error-handler-middleware.js';
import { GITHUB_API_TOKEN, GITHUB_ENABLED } from '../../env.js';
import { shapeGitHubData } from './github-shape.js';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

/** GitHub is a third party on the critical path of a page render. Cap the wait. */
export const GITHUB_TIMEOUT_MS = 10000;

/** Ordered by stars so the first 100 are the ones worth showing. */
const REPO_FETCH_LIMIT = 100;
const PINNED_LIMIT = 6;

/**
 * GitHub's own username rule: 1–39 of [A-Za-z0-9-], no leading or trailing
 * hyphen and no two hyphens in a row. Note there are NO underscores — the one
 * character that quietly differs from LeetCode, and the reason these two
 * validators cannot be shared.
 */
const USERNAME_PATTERN = /^[A-Za-z0-9](?:-?[A-Za-z0-9])*$/;
const USERNAME_MAX = 39;

/**
 * Validate a username for storage and for interpolation.
 * Throws HttpError(400) rather than returning null: an invalid username is a
 * request the candidate can fix, and the message says how.
 */
export function validateGitHubUsername(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed || trimmed.length > USERNAME_MAX || !USERNAME_PATTERN.test(trimmed)) {
    throw new HttpError(
      400,
      'A GitHub username is 1–39 letters, numbers or single hyphens.',
      'INVALID_GITHUB_USERNAME',
    );
  }
  return trimmed;
}

/** Belt-and-braces: strip anything the pattern would have rejected. */
const sanitizeForQuery = (username) => String(username).replace(/[^A-Za-z0-9-]/g, '');

function buildQuery(username) {
  const safe = sanitizeForQuery(username);
  return `{
    user(login: "${safe}") {
      login name bio company location
      followers { totalCount }
      following { totalCount }
      repositories(first: ${REPO_FETCH_LIMIT}, ownerAffiliations: OWNER, privacy: PUBLIC,
                   orderBy: { field: STARGAZERS, direction: DESC }) {
        totalCount
        nodes {
          name description stargazerCount forkCount updatedAt url
          primaryLanguage { name color }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount date } }
        }
      }
      pinnedItems(first: ${PINNED_LIMIT}, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name description stargazerCount forkCount url
            primaryLanguage { name color }
          }
        }
      }
    }
  }`;
}

/**
 * Fetch and shape one public profile.
 *
 * @returns the shaped profile, or null when GitHub has no such user — a missing
 *   username is an ANSWER, not a failure, and the caller turns it into a 404 the
 *   candidate can act on. Every OTHER problem throws, so callers can tell "no such
 *   user" apart from "GitHub is having a bad day" and fall back to cache.
 */
export async function fetchGitHubProfile(username) {
  const safe = sanitizeForQuery(username);
  if (!safe) return null;
  // Thrown, not returned as null: an unconfigured token is an operator problem,
  // and reporting it as "no such user" would send the candidate off fixing a
  // username that was never wrong.
  if (!GITHUB_ENABLED) throw new Error('GITHUB_API_TOKEN is not configured');

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_API_TOKEN}`,
      'Content-Type': 'application/json',
      // GitHub rejects GraphQL requests without a User-Agent.
      'User-Agent': 'jobmesh',
    },
    body: JSON.stringify({ query: buildQuery(safe) }),
    signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('GitHub token invalid or expired');
    if (response.status === 403 || response.status === 429) {
      throw new Error(`GitHub rate limit reached (${response.status})`);
    }
    throw new Error(`GitHub API returned ${response.status}`);
  }

  const json = await response.json();
  // GraphQL answers 200 with a null user and a NOT_FOUND error for an unknown
  // login. Other errors (a malformed query, a revoked token) also land here, so
  // they are logged before being flattened into the same null.
  if (!json?.data?.user) {
    const reason = json?.errors?.[0]?.type ?? json?.errors?.[0]?.message;
    if (reason && reason !== 'NOT_FOUND') console.warn(`[github] query error: ${reason}`);
    return null;
  }
  return shapeGitHubData(json.data.user);
}

export { shapeGitHubData };
