// FILE: src/models/public/assignment-submission-queries.js
// Read side of assignment_submissions: the per-application lookups and the
// per-job stats roll-up. Split out of assignment-submission-model.js (section 2).
//
// Every query stays companyId-scoped exactly as before.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const submissionsCol = () => col('assignment_submissions');

function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/**
 * Batch-fetch submissions for a page of applications: tenant-scoped by companyId
 * and bounded by an explicit id list (§6.5). An empty list returns [] WITHOUT a
 * query — an unbounded $in on nothing is never worth a round trip.
 */
export async function listAssignmentSubmissionsForApplications(companyId, applicationIds = []) {
  const companyOid = toOid(companyId);
  if (!companyOid) return [];
  const appOids = (Array.isArray(applicationIds) ? applicationIds : []).map(toOid).filter(Boolean);
  if (appOids.length === 0) return [];
  const collection = await submissionsCol();
  return collection
    .find({ companyId: companyOid, applicationId: { $in: appOids } })
    .sort({ submittedAt: -1 })
    .toArray();
}

/**
 * Submission + review counts for ONE posting, computed across every application
 * for it — never by reducing whatever rows a caller happens to be holding.
 *
 * These numbers describe the POSTING, so they must not move when the employer
 * paginates or filters the list. Deriving them from the fetched page would make
 * them drift as the employer flips pages, which turns a summary strip into noise.
 * Returns { submitted, reviewed, passing }; the caller supplies `total` from the
 * applications collection, which is the one number that lives outside this one.
 */
export async function getAssignmentSubmissionStatsForJob(companyId, jobId) {
  const companyOid = toOid(companyId);
  const jobOid = toOid(jobId);
  if (!companyOid || !jobOid) return { submitted: 0, reviewed: 0, passing: 0 };
  const collection = await submissionsCol();
  const [stats] = await collection.aggregate([
    { $match: { companyId: companyOid, jobId: jobOid } },
    {
      $lookup: {
        from: 'assignment_reviews',
        localField: '_id',
        foreignField: 'assignmentSubmissionId',
        as: 'review',
      },
    },
    { $addFields: { reviewDoc: { $first: '$review' } } },
    {
      $group: {
        _id: null,
        submitted: { $sum: 1 },
        reviewed: { $sum: { $cond: [{ $ifNull: ['$reviewDoc', false] }, 1, 0] } },
        passing: { $sum: { $cond: [{ $eq: ['$reviewDoc.passesBar', true] }, 1, 0] } },
      },
    },
  ]).toArray();
  return {
    submitted: stats?.submitted ?? 0,
    reviewed: stats?.reviewed ?? 0,
    passing: stats?.passing ?? 0,
  };
}
