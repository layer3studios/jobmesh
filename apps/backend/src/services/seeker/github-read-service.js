// FILE: src/services/seeker/github-read-service.js
// The read-through cache both audiences share: the candidate looking at their own
// profile, and the employer opening their applicant detail.
//
// ONE RULE GOVERNS EVERY PATH HERE — a GitHub outage, a rate limit or a missing
// token must never surface as an error. Fresh cache wins; otherwise fetch; and if
// the fetch fails for any reason the expired row is served with isStale so the UI
// can say so. Only a caller with no cache at all and a failing fetch gets null,
// and even that is "no data" rather than a thrown error.

import {
  getCachedGitHub, getAnyCachedGitHub, setCachedGitHub, toPublicGitHubProfile,
} from '../../models/seeker/github-cache-model.js';
import { fetchGitHubProfile } from './github-service.js';

/** Whatever is cached, marked stale — the answer to every failure below. */
async function staleFallback(seekerUserId) {
  const previous = await getAnyCachedGitHub(seekerUserId);
  return previous ? { ...toPublicGitHubProfile(previous), isStale: true } : null;
}

/**
 * Fresh-if-possible, stale-if-necessary.
 *
 * @param {string|ObjectId} seekerUserId
 * @param {string} username
 * @param {{ forceRefresh?: boolean }} options
 * @returns the shaped profile (with isStale when served from an expired row), or null.
 */
export async function readGitHubProfile(seekerUserId, username, { forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const fresh = await getCachedGitHub(seekerUserId);
    if (fresh) return toPublicGitHubProfile(fresh);
  }

  try {
    const data = await fetchGitHubProfile(username);
    if (data) {
      await setCachedGitHub(seekerUserId, username, data);
      return data;
    }
    // GitHub answered, and the account is gone or renamed. Anything cached is
    // still a true record of what that account looked like, so prefer it over null.
    return staleFallback(seekerUserId);
  } catch (error) {
    // Timeout, rate limit, missing token, or GitHub being down. Never retried
    // inline: a retry against a rate limiter is what turns a slow page into a
    // blocked one, and GitHub's limit is per-token — every caller shares it.
    console.warn(`[github] fetch failed for ${username}: ${error.message}`);
    return staleFallback(seekerUserId);
  }
}

/**
 * The employer-side read, on the applicant detail path.
 *
 * Deliberately CACHE-ONLY-OR-QUICK-FETCH: an applicant detail page must not wait
 * on a third party. A fresh row is returned instantly; a miss gets one short
 * attempt and otherwise yields whatever is cached, or null. The candidate's own
 * profile page is what keeps the row warm.
 */
export async function readGitHubProfileForEmployer(seekerUserId, username) {
  const fresh = await getCachedGitHub(seekerUserId);
  if (fresh) return toPublicGitHubProfile(fresh);
  return readGitHubProfile(seekerUserId, username);
}
