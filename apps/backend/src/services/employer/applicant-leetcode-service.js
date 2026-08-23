// FILE: src/services/employer/applicant-leetcode-service.js
// The employer's manual LeetCode lookup: attach a record to one application, or
// clear it.
//
// WHY AN EMPLOYER CAN DO THIS AT ALL. Plenty of candidates put a LeetCode handle
// in their resume rather than on the form, and a recruiter reading the PDF should
// not have to leave the page to check it. The data is public either way — this
// saves a tab, it does not unlock anything.
//
// A manual lookup OVERWRITES whatever was there, including a snapshot from the
// apply form and (in the detail's priority order) any connected-seeker record.
// That is deliberate: the employer typed a specific username, and second-guessing
// them would leave the page showing a name they did not ask for.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import {
  fetchLeetCodeProfile, validateLeetCodeUsername,
} from '../seeker/leetcode-service.js';

const applicationsCol = () => col('applications');

/**
 * Look up `username` and store it on this application.
 *
 * Company-scoped in the WRITE FILTER as well as by the route's middleware: a
 * mis-wired route must still not be able to write across tenants (§6.5).
 *
 * @throws HttpError(400) on a malformed username, 404 when LeetCode has no such
 *   user, 503 when LeetCode cannot be reached — three states the employer can act
 *   on differently, so they are not collapsed into one message.
 */
export async function setApplicantLeetCode(companyId, applicationId, rawUsername) {
  const username = validateLeetCodeUsername(rawUsername);

  let data;
  try {
    data = await fetchLeetCodeProfile(username);
  } catch (error) {
    console.warn(`[leetcode] employer lookup failed for ${username}: ${error.message}`);
    throw new HttpError(
      503,
      'Could not reach LeetCode just now. Try again in a moment.',
      'LEETCODE_UNAVAILABLE',
    );
  }
  if (!data) {
    throw new HttpError(404, 'No LeetCode user with that username.', 'LEETCODE_USER_NOT_FOUND');
  }

  const applications = await applicationsCol();
  const result = await applications.updateOne(
    { _id: new ObjectId(String(applicationId)), companyId: new ObjectId(String(companyId)) },
    { $set: { leetcodeUsername: username, leetcodeData: data, updatedAt: new Date() } },
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
 * Only this application is touched. If the candidate connected LeetCode to their
 * seeker profile, the detail falls back to that — clearing here is not a way to
 * erase someone's own connection.
 */
export async function clearApplicantLeetCode(companyId, applicationId) {
  const applications = await applicationsCol();
  const result = await applications.updateOne(
    { _id: new ObjectId(String(applicationId)), companyId: new ObjectId(String(companyId)) },
    { $set: { leetcodeUsername: null, leetcodeData: null, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) {
    throw new HttpError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
  }
  return { cleared: true };
}
