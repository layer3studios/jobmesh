// FILE: src/models/employer/posting-queries.js
// Read side of native postings: list by company, fetch by id, fetch by slug (both
// active-only and any-status). Split out of posting-model.js (section 2).
//
// EVERY query still filters on source:'native' AND companyId, exactly as before.
// Scraped ATS rows share the jobs collection, and that filter is what keeps them
// out of every employer-facing read -- the split moved code, not a single clause.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const NATIVE = 'native';
const postingsCol = () => col('jobs');

function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** The filter every posting list read shares. Kept in one place so the list and
 *  its count can never drift apart and report a total for a different query. */
function postingListQuery(companyOid, status) {
  const query = { source: NATIVE, companyId: companyOid };
  if (status) query.status = status;
  return query;
}

/**
 * List a company's native postings, newest first; optional status filter.
 *
 * Still returns a plain array — callers and tests that pass no paging options get
 * exactly what they always got. `limit`/`skip` are opt-in so the route can page
 * without every other caller having to learn a new return shape.
 */
export async function listPostingsForCompany(companyId, { status, limit, skip } = {}) {
  const companyOid = toOid(companyId);
  if (!companyOid) return [];
  const collection = await postingsCol();
  let cursor = collection.find(postingListQuery(companyOid, status)).sort({ createdAt: -1 });
  if (skip) cursor = cursor.skip(skip);
  if (limit) cursor = cursor.limit(limit);
  return cursor.toArray();
}

/** How many postings that same filter matches — the total behind a page. */
export async function countPostingsForCompany(companyId, { status } = {}) {
  const companyOid = toOid(companyId);
  if (!companyOid) return 0;
  const collection = await postingsCol();
  return collection.countDocuments(postingListQuery(companyOid, status));
}

/** Fetch one native posting scoped to the company — cross-tenant returns null. */
export async function getPostingForCompany(companyId, postingId) {
  const companyOid = toOid(companyId);
  const postingOid = toOid(postingId);
  if (!companyOid || !postingOid) return null;
  const collection = await postingsCol();
  return collection.findOne({ _id: postingOid, source: NATIVE, companyId: companyOid });
}

/** Fetch an ACTIVE native posting by slug within a company (public apply, R7). */
export async function getActivePostingBySlugForCompany(companyId, slug) {
  const companyOid = toOid(companyId);
  if (!companyOid || typeof slug !== 'string' || !slug) return null;
  const collection = await postingsCol();
  return collection.findOne({ companyId: companyOid, slug, source: NATIVE, status: 'active' });
}

/**
 * Fetch a native posting by slug within a company at ANY status. Exists so the
 * apply path can tell "this role closed while you were working on it" apart from
 * "this slug never existed" — the active-only lookup collapses both into a 404.
 */
export async function getPostingBySlugForCompany(companyId, slug) {
  const companyOid = toOid(companyId);
  if (!companyOid || typeof slug !== 'string' || !slug) return null;
  const collection = await postingsCol();
  return collection.findOne({ companyId: companyOid, slug, source: NATIVE });
}

/** List a company's ACTIVE native postings for the public company page. */
export async function listActivePostingsForCompany(companyId) {
  const companyOid = toOid(companyId);
  if (!companyOid) return [];
  const collection = await postingsCol();
  return collection.find({ companyId: companyOid, source: NATIVE, status: 'active' })
    .sort({ postedAt: -1 }).toArray();
}
