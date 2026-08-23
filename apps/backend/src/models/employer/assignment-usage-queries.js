// FILE: src/models/employer/assignment-usage-queries.js
// "Which postings use this assignment?" -- the count and the titles behind the
// in-use warning. Split out of assignment-model.js (section 2): these read the
// JOBS collection, not the assignments one, which is why they sit apart.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const NATIVE = 'native';
const jobsCol = () => col('jobs');

function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

// listJobTitlesUsingAssignment exists to NAME the blocking postings in a Chunk 2
// error message, not to paginate. A hard cap keeps that read bounded.
const MAX_USAGE_TITLES = 20;

/** How many native postings currently reference this assignment. Read-only. */
export async function countJobsUsingAssignment(companyId, assignmentId) {
  const companyOid = toOid(companyId);
  const assignmentOid = toOid(assignmentId);
  if (!companyOid || !assignmentOid) return 0;
  const collection = await jobsCol();
  return collection.countDocuments({ source: NATIVE, companyId: companyOid, assignmentId: assignmentOid });
}

/**
 * The referencing postings, capped at 20, so Chunk 2's archive-blocked / edit-blocked
 * errors can name them. Read-only — this never mutates a job.
 */
export async function listJobTitlesUsingAssignment(companyId, assignmentId) {
  const companyOid = toOid(companyId);
  const assignmentOid = toOid(assignmentId);
  if (!companyOid || !assignmentOid) return [];
  const collection = await jobsCol();
  const docs = await collection
    .find({ source: NATIVE, companyId: companyOid, assignmentId: assignmentOid })
    .project({ title: 1, status: 1 })
    .limit(MAX_USAGE_TITLES)
    .toArray();
  return docs.map((doc) => ({ id: doc._id.toString(), title: doc.title ?? null, status: doc.status ?? null }));
}
