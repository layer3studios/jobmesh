// FILE: src/services/employer/applicant-github-lookup.js
// "Is this applicant also a JobMesh seeker who connected GitHub?" — one of the two
// places the employer side crosses into seeker data.
//
// WHAT CROSSES THE AUDIENCE BOUNDARY, AND WHY IT IS ALLOWED (section 0). Only the
// public GitHub record crosses, and only for a candidate who deliberately
// connected it in order to be seen. Nothing else about the seeker account is read
// or returned — not their name, not their job search, not their other
// applications. The join key is the email the candidate themselves put on the
// application.
//
// THIS FUNCTION NEVER THROWS AND NEVER BLOCKS FOR LONG. An applicant detail page
// is a working surface, and a third-party API is not allowed to take it down or
// slow it to a crawl: every failure yields null and the page renders without the
// GitHub button.

import { findGitHubSeekerByEmail } from '../../models/seeker/seeker-github-model.js';
import { readGitHubProfileForEmployer } from '../seeker/github-read-service.js';

/** Hard ceiling for the whole lookup on a page-render path. */
const LOOKUP_TIMEOUT_MS = 5000;

/** Resolve after `ms`, so a slow lookup loses the race instead of holding the page. */
const timeout = (ms) => new Promise((resolve) => { setTimeout(() => resolve(null), ms); });

/**
 * @param {string|null} email  The applicant's contact email.
 * @returns the shaped GitHub profile, or null when there is nothing to show.
 */
export async function resolveApplicantGitHub(email) {
  if (!email) return null;

  try {
    return await Promise.race([
      (async () => {
        const seeker = await findGitHubSeekerByEmail(email);
        if (!seeker) return null;
        return readGitHubProfileForEmployer(seeker.seekerUserId, seeker.githubUsername);
      })(),
      timeout(LOOKUP_TIMEOUT_MS),
    ]);
  } catch (error) {
    console.warn(`[github] applicant lookup failed: ${error.message}`);
    return null;
  }
}
