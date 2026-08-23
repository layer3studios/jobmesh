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

/** List a company's native postings, newest first; optional status filter. */
export async function listPostingsForCompany(companyId, { status } = {}) {
  const companyOid = toOid(companyId);
  if (!companyOid) return [];
  const collection = await postingsCol();
  const query = { source: NATIVE, companyId: companyOid };
  if (status) query.status = status;
  return collection.find(query).sort({ createdAt: -1 }).toArray();
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
