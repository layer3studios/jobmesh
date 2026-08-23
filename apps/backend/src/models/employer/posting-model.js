// FILE: src/models/employer/posting-model.js
// Native postings live in the shared `jobs` collection alongside scraped jobs,
// distinguished by source:'native'. EVERY query here filters on
// { source: 'native', companyId } so scraped jobs (PascalCase schema) are never
// read or mutated, and tenants never see each other's postings (C7, §6.5, R1).

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';
import { getPostingForCompany } from './posting-queries.js';
export { toPublicPosting } from './posting-projection.js';
import {
  generateUniquePostingSlugForCompany, DUPLICATE_KEY_CODE,
  describeDuplicateKey, isPostingSlugCollision,
} from './posting-slug-queries.js';

// Re-exported so existing imports of this module keep resolving unchanged.
export { generateUniquePostingSlugForCompany } from './posting-slug-queries.js';
export {
  listPostingsForCompany, getPostingForCompany, getActivePostingBySlugForCompany,
  getPostingBySlugForCompany, listActivePostingsForCompany,
} from './posting-queries.js';
import {
  slugifyPostingTitle, buildPostingSlugCandidate, randomPostingSlugSuffix,
} from './posting-slug-helpers.js';

const NATIVE = 'native';
const postingsCol = () => col('jobs');

/** Accept a string or ObjectId; return an ObjectId or null. */
function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** Idempotent index setup (additive — partial on source:'native'). Called on boot. */
export async function ensurePostingIndexes() {
  const collection = await postingsCol();
  await collection.createIndex(
    { companyId: 1, slug: 1 },
    { unique: true, partialFilterExpression: { source: NATIVE }, name: 'jobs_companyId_slug_native' },
  );
  await collection.createIndex(
    { companyId: 1, source: 1, status: 1 },
    { partialFilterExpression: { source: NATIVE }, name: 'jobs_companyId_source_status_native' },
  );
  // "Which native postings use this assignment." The $type clause keeps the explicit
  // nulls out of the index; a query must repeat source:'native' to use it.
  await collection.createIndex(
    { assignmentId: 1 },
    {
      partialFilterExpression: { source: NATIVE, assignmentId: { $type: 'objectId' } },
      name: 'jobs_assignmentId_native',
    },
  );
}






/** Insert a native posting; retries up to 3 times on a slug race (E11000). */
export async function createPostingForCompany(companyId, input, createdByEmployerUserId) {
  const companyOid = toOid(companyId);
  if (!companyOid) throw new Error('createPostingForCompany: invalid companyId');
  const collection = await postingsCol();
  const status = input.status || 'active';
  let lastSlugCollision = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const now = new Date();
    const slug = await generateUniquePostingSlugForCompany(companyOid, input.title);
    const doc = {
      source: NATIVE,
      companyId: companyOid,
      slug,
      title: input.title,
      description: input.description,
      descriptionPlain: input.description,
      location: input.location,
      workplaceType: input.workplaceType,
      employmentType: input.employmentType,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: 'INR',
      status,
      assignmentId: null,
      // Employer-authored questions shown on the apply form. [] means "ask nothing",
      // which is the default and the common case.
      screeningQuestions: Array.isArray(input.screeningQuestions) ? input.screeningQuestions : [],
      // Deadline after which the apply endpoint refuses new applications, and
      // whether the nightly task should close the posting when it passes.
      applicationDeadline: input.applicationDeadline ?? null,
      autoCloseOnDeadline: input.autoCloseOnDeadline === true,
      // Public apply-page views, incremented by posting-view-counter. Employer
      // and bot requests are excluded there, never here.
      viewCount: 0,
      postedAt: status === 'active' ? now : null,
      closedAt: status === 'closed' ? now : null,
      createdAt: now,
      updatedAt: now,
      createdByEmployerUserId: toOid(createdByEmployerUserId),
    };
    try {
      const result = await collection.insertOne(doc);
      return { ...doc, _id: result.insertedId };
    } catch (err) {
      if (err?.code !== DUPLICATE_KEY_CODE) throw err;
      if (!isPostingSlugCollision(err)) {
        throw new Error(`createPostingForCompany: duplicate key on a non-slug index — ${describeDuplicateKey(err)}`);
      }
      lastSlugCollision = err;
    }
  }
  throw new Error(`Could not generate a unique posting slug after retries (last ${describeDuplicateKey(lastSlugCollision)})`);
}






/**
 * $set only the explicit patch keys. When status transitions to 'active' and
 * postedAt is still null, stamp postedAt once (R4). Returns null on a miss.
 */
export async function updatePostingForCompany(companyId, postingId, patch) {
  const companyOid = toOid(companyId);
  const postingOid = toOid(postingId);
  if (!companyOid || !postingOid) return null;
  const current = await getPostingForCompany(companyOid, postingOid);
  if (!current) return null;
  const setOps = { ...patch, updatedAt: new Date() };
  if (patch.status === 'active' && current.postedAt == null) setOps.postedAt = new Date();
  // Symmetric with postedAt: stamp when the posting actually transitions to closed,
  // and clear it on reopen so the field always describes the CURRENT closure.
  if (patch.status === 'closed' && current.status !== 'closed') setOps.closedAt = new Date();
  if (patch.status === 'active' && current.status === 'closed') setOps.closedAt = null;
  const collection = await postingsCol();
  return collection.findOneAndUpdate(
    { _id: postingOid, source: NATIVE, companyId: companyOid },
    { $set: setOps },
    { returnDocument: 'after' },
  );
}

/**
 * Attach or detach the take-home assignment on one native posting. Deliberately
 * NOT routed through updatePostingForCompany: that helper carries postedAt
 * stamping tied to status transitions, and attaching an assignment has nothing to
 * do with status. toOid(null) is null, so detach needs no separate branch.
 *
 * Filters on source:'native' like every other read here, so a scraped ATS job
 * (shared `jobs` collection, PascalCase, no companyId) can never be mutated.
 * Returns the updated doc, or null on a cross-tenant / scraped / missing id.
 */
export async function setPostingAssignmentForCompany(companyId, postingId, assignmentId, { session } = {}) {
  const companyOid = toOid(companyId);
  const postingOid = toOid(postingId);
  if (!companyOid || !postingOid) return null;
  const collection = await postingsCol();
  return collection.findOneAndUpdate(
    { _id: postingOid, source: NATIVE, companyId: companyOid },
    { $set: { assignmentId: toOid(assignmentId), updatedAt: new Date() } },
    { returnDocument: 'after', session },
  );
}

/**
 * Hard-delete one native posting. Scoped to the company AND to source:'native', so
 * a scraped ATS row sharing this collection can never be removed through it.
 * Returns true when a row was actually deleted.
 *
 * Callers enforce the draft/no-applicants rule — this helper deliberately does not,
 * so the guard lives in one place (the route) rather than being half-checked twice.
 */
export async function deletePostingForCompany(companyId, postingId) {
  const companyOid = toOid(companyId);
  const postingOid = toOid(postingId);
  if (!companyOid || !postingOid) return false;
  const collection = await postingsCol();
  const result = await collection.deleteOne({
    _id: postingOid, source: NATIVE, companyId: companyOid,
  });
  return result.deletedCount === 1;
}

export function closePostingForCompany(companyId, postingId) {
  return updatePostingForCompany(companyId, postingId, { status: 'closed' });
}

export function reopenPostingForCompany(companyId, postingId) {
  return updatePostingForCompany(companyId, postingId, { status: 'active' });
}

