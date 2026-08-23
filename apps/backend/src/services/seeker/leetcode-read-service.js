// FILE: src/services/seeker/leetcode-read-service.js
// The read-through cache both audiences share: the candidate looking at their own
// profile, and the employer opening their applicant detail.
//
// ONE RULE GOVERNS EVERY PATH HERE — a LeetCode outage must never surface as an
// error. Fresh cache wins; otherwise fetch; and if the fetch fails for any reason
// (timeout, 429, 5xx) the expired row is served with isStale so the UI can say so.
// Only a caller with no cache at all and a failing fetch gets null, and even that
// is "no data" rather than a thrown error.

import {
  getCachedProfile, getAnyCachedProfile, setCachedProfile, toPublicLeetCodeProfile,
} from '../../models/seeker/leetcode-cache-model.js';
import { fetchLeetCodeProfile } from './leetcode-service.js';

/**
 * Fresh-if-possible, stale-if-necessary.
 *
 * @param {string|ObjectId} seekerUserId
 * @param {string} username
 * @param {{ forceRefresh?: boolean }} options
 * @returns the shaped profile (with isStale when served from an expired row), or null.
 */
export async function readLeetCodeProfile(seekerUserId, username, { forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const fresh = await getCachedProfile(seekerUserId);
    if (fresh) return toPublicLeetCodeProfile(fresh);
  }

  try {
    const data = await fetchLeetCodeProfile(username);
    if (data) {
      await setCachedProfile(seekerUserId, username, data);
      return data;
    }
    // LeetCode answered, and the account is gone or renamed. Anything cached is
    // still a true record of what that account looked like, so prefer it over null.
    const previous = await getAnyCachedProfile(seekerUserId);
    return previous ? { ...toPublicLeetCodeProfile(previous), isStale: true } : null;
  } catch (error) {
    // Timeout, rate limit, or LeetCode being down. Never retried inline: a retry
    // against a rate limiter is what turns a slow page into a blocked one.
    console.warn(`[leetcode] fetch failed for ${username}: ${error.message}`);
    const previous = await getAnyCachedProfile(seekerUserId);
    return previous ? { ...toPublicLeetCodeProfile(previous), isStale: true } : null;
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
export async function readLeetCodeProfileForEmployer(seekerUserId, username) {
  const fresh = await getCachedProfile(seekerUserId);
  if (fresh) return toPublicLeetCodeProfile(fresh);
  return readLeetCodeProfile(seekerUserId, username);
}
