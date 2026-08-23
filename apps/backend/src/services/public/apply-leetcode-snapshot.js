// FILE: src/services/public/apply-leetcode-snapshot.js
// Attaches a LeetCode snapshot to an application the candidate has already
// submitted.
//
// FIRE-AND-FORGET, AND THAT IS THE WHOLE DESIGN. The application is committed and
// the candidate has their confirmation before this runs. LeetCode is a third party
// that can be slow, rate-limited or down, and none of that is allowed to cost
// somebody a job application — so nothing here is awaited on the apply path, and
// every failure ends as a warning in the log and a null column in the database.
//
// The snapshot is written with a plain $set rather than through the model's
// insert path: the row already exists, and this is the one field that arrives
// after it.

import { col } from '../../Db/connection.js';
import { ObjectId } from 'mongodb';
import { fetchLeetCodeProfile } from '../seeker/leetcode-service.js';

/**
 * Look up `username` and store the result on `applicationId`.
 *
 * Returns a promise for tests; production callers deliberately do not await it.
 * Never rejects — a caller that forgot the .catch() still cannot produce an
 * unhandled rejection on the apply path.
 */
export async function attachLeetCodeSnapshot(applicationId, username) {
  if (!applicationId || !username) return null;

  try {
    const data = await fetchLeetCodeProfile(username);
    if (!data) {
      // The username simply does not exist. The candidate is not told — they have
      // already applied, the field was optional and best-effort, and an email
      // saying "your LeetCode handle was wrong" would be worse than silence.
      console.warn(`[apply] LeetCode user not found for ${username}`);
      return null;
    }

    const applications = await col('applications');
    await applications.updateOne(
      { _id: new ObjectId(String(applicationId)) },
      { $set: { leetcodeData: data, updatedAt: new Date() } },
    );
    return data;
  } catch (error) {
    console.warn(`[apply] LeetCode fetch failed for ${username}: ${error.message}`);
    return null;
  }
}

/**
 * The apply path's entry point: start the work and return immediately.
 *
 * Split from the function above so the intent is legible at the call site — a
 * bare `attachLeetCodeSnapshot(...)` with no await reads like a missing await,
 * whereas `queueLeetCodeSnapshot(...)` says the omission is the point.
 */
export function queueLeetCodeSnapshot(applicationId, username) {
  if (!username) return;
  void attachLeetCodeSnapshot(applicationId, username);
}
