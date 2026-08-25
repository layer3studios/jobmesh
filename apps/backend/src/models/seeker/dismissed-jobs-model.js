// FILE: src/models/seeker/dismissed-jobs-model.js
// Per-user "not interested" list, capped at SEEKER_LIST_MAX newest entries.
//
// This used $addToSet, which cannot be capped: $slice is a $push modifier and has
// no $addToSet equivalent. So the write is now a $push whose FILTER carries the
// uniqueness instead — `dismissedJobs: { $ne: jobId }` means the update matches no
// document when the id is already there, which is the same guarantee $addToSet
// gave, enforced by the server in the same single atomic operation.

import { usersCol, toOid, SEEKER_LIST_MAX } from './seeker-user-shared-helpers.js';

export async function getDismissedJobs(userId) {
  const oid = toOid(userId);
  if (!oid) return [];
  const col = await usersCol();
  const user = await col.findOne({ _id: oid }, { projection: { dismissedJobs: 1 } });
  return Array.isArray(user?.dismissedJobs) ? user.dismissedJobs : [];
}

export async function addDismissedJob(userId, jobId) {
  const oid = toOid(userId);
  if (!oid || !jobId) return [];
  const col = await usersCol();
  const result = await col.findOneAndUpdate(
    { _id: oid, dismissedJobs: { $ne: jobId } },
    { $push: { dismissedJobs: { $each: [jobId], $slice: -SEEKER_LIST_MAX } } },
    { returnDocument: 'after' },
  );
  if (result) return Array.isArray(result.dismissedJobs) ? result.dismissedJobs : [];

  // No match means the job was ALREADY dismissed (or the user is gone). Dismissing
  // twice stayed idempotent under $addToSet and must stay idempotent here, so read
  // the list back rather than reporting an empty one.
  const existing = await col.findOne({ _id: oid }, { projection: { dismissedJobs: 1 } });
  return Array.isArray(existing?.dismissedJobs) ? existing.dismissedJobs : [];
}

export async function removeDismissedJob(userId, jobId) {
  const oid = toOid(userId);
  if (!oid || !jobId) return [];
  const col = await usersCol();
  const result = await col.findOneAndUpdate(
    { _id: oid },
    { $pull: { dismissedJobs: jobId } },
    { returnDocument: 'after' },
  );
  return Array.isArray(result?.dismissedJobs) ? result.dismissedJobs : [];
}
