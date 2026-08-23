// FILE: src/services/employer/applicant-github-service.js
// The employer's manual GitHub lookup: attach a record to one application, or
// clear it.
//
// WHY AN EMPLOYER CAN DO THIS AT ALL. Plenty of candidates put a GitHub handle in
// their resume rather than on the form, and a recruiter reading the PDF should not
// have to leave the page to check it. The data is public either way — this saves a
// tab, it does not unlock anything.
//
// A manual lookup OVERWRITES whatever was there, including a snapshot from the
// apply form and (in the detail's priority order) any connected-seeker record.
// That is deliberate: the employer typed a specific username, and second-guessing
// them would leave the page showing a name they did not ask for.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { GITHUB_ENABLED } from '../../env.js';
import { fetchGitHubProfile, validateGitHubUsername } from '../seeker/github-service.js';

const applicationsCol = () => col('applications');

/**
 * Look up `username` and store it on this application.
 *
 * Company-scoped in the WRITE FILTER as well as by the route's middleware: a
 * mis-wired route must still not be able to write across tenants (§6.5).
 *
 * @throws HttpError(400) on a malformed username, 404 when GitHub has no such
 *   user, 503 when GitHub cannot be reached or is unconfigured — states the
 *   employer acts on differently, so they are not collapsed into one message.
 */
export async function setApplicantGitHub(companyId, applicationId, rawUsername) {
  const username = validateGitHubUsername(rawUsername);
  if (!GITHUB_ENABLED) {
    throw new HttpError(503, 'GitHub is not configured on this server yet.', 'GITHUB_DISABLED');
  }

  let data;
  try {
    data = await fetchGitHubProfile(username);
  } catch (error) {
    console.warn(`[github] employer lookup failed for ${username}: ${error.message}`);
    throw new HttpError(
      503,
      'Could not reach GitHub just now. Try again in a moment.',
      'GITHUB_UNAVAILABLE',
    );
  }
  if (!data) {
    throw new HttpError(404, 'No GitHub user with that username.', 'GITHUB_USER_NOT_FOUND');
  }

  const applications = await applicationsCol();
  const result = await applications.updateOne(
    { _id: new ObjectId(String(applicationId)), companyId: new ObjectId(String(companyId)) },
    { $set: { githubUsername: username, githubData: data, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) {
    throw new HttpError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
  }
  return data;
}

/**
 * Remove the record from this application.
 *
 * $set null rather than $unset, matching the rest of the schema: an absent field
 * means "predates the feature", an explicit null means "there is nothing here",
 * and the employer's lookup box needs to tell those apart from a stale snapshot.
 *
 * Only this application is touched. If the candidate connected GitHub to their
 * seeker profile, the detail falls back to that — clearing here is not a way to
 * erase someone's own connection.
 */
export async function clearApplicantGitHub(companyId, applicationId) {
  const applications = await applicationsCol();
  const result = await applications.updateOne(
    { _id: new ObjectId(String(applicationId)), companyId: new ObjectId(String(companyId)) },
    { $set: { githubUsername: null, githubData: null, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) {
    throw new HttpError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
  }
  return { cleared: true };
}
