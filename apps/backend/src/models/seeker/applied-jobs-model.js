// FILE: src/models/seeker/applied-jobs-model.js
// Applied-jobs list, stages, and enriched details.

import { ObjectId } from 'mongodb';
import { connectToDb } from '../../Db/connection.js';
import { usersCol, toOid, normaliseApplied, VALID_STAGES, SEEKER_LIST_MAX } from './seeker-user-shared-helpers.js';

/** Return the user's applied jobs array (normalised). */
export async function getAppliedJobs(userId) {
  const oid = toOid(userId);
  if (!oid) return [];
  const col = await usersCol();
  const user = await col.findOne({ _id: oid }, { projection: { appliedJobs: 1, _id: 0 } });
  return user ? normaliseApplied(user.appliedJobs) : [];
}

/**
 * Return applied jobs enriched with live JobTitle/Company/etc.
 * Sorted newest-first, capped at 50.
 */
export async function getAppliedJobDetails(userId) {
  const oid = toOid(userId);
  if (!oid) return [];
  const col = await usersCol();
  const user = await col.findOne({ _id: oid }, { projection: { appliedJobs: 1, _id: 0 } });
  if (!user) return [];

  const applied = normaliseApplied(user.appliedJobs)
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 50);

  const db = await connectToDb();
  const validIds = applied
    .map(e => e.jobId)
    .filter(j => ObjectId.isValid(j))
    .map(j => new ObjectId(j));

  const liveJobs = validIds.length > 0
    ? await db.collection('jobs').find(
        { _id: { $in: validIds } },
        { projection: { JobTitle: 1, Company: 1, ApplicationURL: 1, DirectApplyURL: 1, Location: 1, Department: 1 } },
      ).toArray()
    : [];

  const jobMap = new Map(liveJobs.map(j => [String(j._id), j]));

  return applied.map(entry => {
    const live = jobMap.get(entry.jobId);
    return {
      jobId: entry.jobId,
      jobTitle: live?.JobTitle || entry.jobTitle || 'Job no longer available',
      company: live?.Company || entry.company || 'Unknown company',
      applicationURL: live?.DirectApplyURL || live?.ApplicationURL || entry.applicationURL || null,
      location: live?.Location || entry.location || null,
      department: live?.Department || entry.department || null,
      stage: entry.stage || 'applied',
      stageUpdatedAt: entry.stageUpdatedAt || entry.appliedAt,
      appliedAt: entry.appliedAt,
      isListingActive: !!live,
    };
  });
}

/**
 * Add a job to appliedJobs and bump appliedCount.
 * Idempotent: re-applying the same job is a no-op.
 */
export async function addAppliedJob(userId, jobId, snapshot = {}) {
  const oid = toOid(userId);
  if (!oid || !jobId) return [];
  const col = await usersCol();

  // Wipe any legacy string entry for the same jobId so we don't double-store.
  await col.updateOne({ _id: oid }, { $pull: { appliedJobs: jobId } });

  const entry = {
    jobId,
    appliedAt: new Date(),
    jobTitle: snapshot.jobTitle || null,
    company: snapshot.company || null,
    applicationURL: snapshot.applicationURL || null,
    location: snapshot.location || null,
    department: snapshot.department || null,
    stage: 'applied',
    stageUpdatedAt: new Date(),
  };

  // Only push + increment if this jobId isn't already there. $slice keeps the
  // newest SEEKER_LIST_MAX entries; appliedCount is $inc'd independently and stays
  // the lifetime total rather than the array length.
  const result = await col.findOneAndUpdate(
    { _id: oid, 'appliedJobs.jobId': { $ne: jobId } },
    {
      $push: { appliedJobs: { $each: [entry], $slice: -SEEKER_LIST_MAX } },
      $inc: { appliedCount: 1 },
    },
    { returnDocument: 'after' },
  );
  if (result) return normaliseApplied(result.appliedJobs);

  // Already applied: just return current list.
  const existing = await col.findOne({ _id: oid }, { projection: { appliedJobs: 1, _id: 0 } });
  return existing ? normaliseApplied(existing.appliedJobs) : [];
}

/**
 * Remove a job from appliedJobs and decrement appliedCount.
 *
 * ONE ATOMIC OPERATION. This used to be four round trips — read to see whether the
 * job was there, pull the legacy string form, pull the object form, then decrement
 * if the first read had found something. Deciding the decrement from a read taken
 * before the pull is a race: two concurrent removes of the same job both saw it
 * present, both pulled (the second a no-op), and both decremented, so the count
 * drifted DOWN by two for one removal. A crash between the pull and the $inc left
 * it drifted the other way.
 *
 * The pipeline form fixes all of that at once. The filter admits only a user who
 * actually has the job, so the decrement cannot fire for a no-op; the $filter
 * removes it in the same operation; and $max clamps at zero so legacy bad data
 * still cannot go negative. Both element shapes are handled inline — legacy rows
 * stored a bare jobId string, current ones store { jobId, ... } — which is why
 * this reads the element's $type rather than running two separate pulls.
 */
export async function removeAppliedJob(userId, jobId) {
  const oid = toOid(userId);
  if (!oid || !jobId) return [];
  const col = await usersCol();

  const result = await col.findOneAndUpdate(
    { _id: oid, $or: [{ 'appliedJobs.jobId': jobId }, { appliedJobs: jobId }] },
    [{
      $set: {
        appliedJobs: {
          $filter: {
            input: { $ifNull: ['$appliedJobs', []] },
            cond: {
              $ne: [
                // Object rows carry the id under .jobId; legacy rows ARE the id.
                { $cond: [{ $eq: [{ $type: '$$this' }, 'object'] }, '$$this.jobId', '$$this'] },
                jobId,
              ],
            },
          },
        },
        appliedCount: { $max: [0, { $subtract: [{ $ifNull: ['$appliedCount', 0] }, 1] }] },
      },
    }],
    { returnDocument: 'after' },
  );
  if (result) return normaliseApplied(result.appliedJobs);

  // The user does not have this job applied (or does not exist). Removing twice is
  // idempotent, so report the list as it stands rather than an empty one.
  const existing = await col.findOne({ _id: oid }, { projection: { appliedJobs: 1, _id: 0 } });
  return existing ? normaliseApplied(existing.appliedJobs) : [];
}

/** Update the pipeline stage for an applied job. */
export async function updateAppliedJobStage(userId, jobId, stage) {
  const oid = toOid(userId);
  if (!oid) return null;
  if (!VALID_STAGES.includes(stage)) return null;
  const col = await usersCol();
  const result = await col.findOneAndUpdate(
    { _id: oid, 'appliedJobs.jobId': jobId },
    { $set: {
      'appliedJobs.$.stage': stage,
      'appliedJobs.$.stageUpdatedAt': new Date(),
    }},
    { returnDocument: 'after' },
  );
  return result ? normaliseApplied(result.appliedJobs) : null;
}
