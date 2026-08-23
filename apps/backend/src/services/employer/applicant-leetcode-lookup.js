// FILE: src/services/employer/applicant-leetcode-lookup.js
// "Is this applicant also a JobMesh seeker who connected LeetCode?" — the one
// place the employer side crosses into seeker data.
//
// WHAT CROSSES THE AUDIENCE BOUNDARY, AND WHY IT IS ALLOWED (section 0). Only the
// public LeetCode record crosses, and only for a candidate who deliberately
// connected it in order to be seen. Nothing else about the seeker account is read
// or returned — not their name, not their job search, not their other
// applications. The join key is the email the candidate themselves put on the
// application.
//
// THIS FUNCTION NEVER THROWS AND NEVER BLOCKS FOR LONG. An applicant detail page
// is a working surface, and a third-party API is not allowed to take it down or
// slow it to a crawl: every failure yields null and the page renders without the
// LeetCode button.

import { findConnectedSeekerByEmail } from '../../models/seeker/seeker-leetcode-model.js';
import { readLeetCodeProfileForEmployer } from '../seeker/leetcode-read-service.js';

/** Hard ceiling for the whole lookup on a page-render path. */
const LOOKUP_TIMEOUT_MS = 5000;

/** Resolve after `ms`, so a slow lookup loses the race instead of holding the page. */
const timeout = (ms) => new Promise((resolve) => { setTimeout(() => resolve(null), ms); });

/**
 * @param {string|null} email  The applicant's contact email.
 * @returns the shaped LeetCode profile, or null when there is nothing to show.
 */
export async function resolveApplicantLeetCode(email) {
  if (!email) return null;

  try {
    return await Promise.race([
      (async () => {
        const seeker = await findConnectedSeekerByEmail(email);
        if (!seeker) return null;
        return readLeetCodeProfileForEmployer(seeker.seekerUserId, seeker.leetcodeUsername);
      })(),
      timeout(LOOKUP_TIMEOUT_MS),
    ]);
  } catch (error) {
    console.warn(`[leetcode] applicant lookup failed: ${error.message}`);
    return null;
  }
}
