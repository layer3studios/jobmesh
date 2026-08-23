// FILE: src/models/employer/referral-link-model.js
// referral_links collection — one shareable link per (company, posting, teammate).
// A candidate arriving through the link is attributed to the person who shared it,
// and that attribution follows the application through the pipeline.
//
// Every query is companyId-scoped (§6.5) EXCEPT findReferralLinkByToken, which is
// reached from the unauthenticated apply page and therefore has only the token to
// go on. That is safe because the token is the credential: 12 random URL-safe
// characters, unguessable, and it carries no authority beyond attribution.

import { randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const referralLinksCol = () => col('referral_links');

/** Accept a string or ObjectId; return an ObjectId or null. */
function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** 9 random bytes → exactly 12 base64url characters. No padding, no '+' or '/'. */
export function generateReferralToken() {
  return randomBytes(9).toString('base64url');
}

/** Idempotent index setup. Called on boot. */
export async function ensureReferralLinkIndexes() {
  const collection = await referralLinksCol();
  await collection.createIndex({ token: 1 }, { unique: true, name: 'referral_links_token' });
  // One link per person per posting — the uniqueness that makes "create or return
  // the existing one" a single upsert rather than a read-then-write race.
  await collection.createIndex(
    { companyId: 1, postingId: 1, employerUserId: 1 },
    { unique: true, name: 'referral_links_companyId_postingId_employerUserId' },
  );
  await collection.createIndex({ companyId: 1, postingId: 1 }, { name: 'referral_links_companyId_postingId' });
}

/**
 * Return this teammate's link for the posting, creating it on first call.
 *
 * Upsert rather than find-then-insert: two tabs clicking Share at the same moment
 * would otherwise race, and the unique index would turn the loser into a 500. The
 * token and counters live in $setOnInsert so an existing link is returned with its
 * stats intact — re-sharing must never reset someone's numbers or invalidate a
 * link already sitting in a candidate's inbox.
 *
 * postingId null means a company-wide link.
 */
export async function findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName }) {
  const companyOid = toOid(companyId);
  const employerUserOid = toOid(employerUserId);
  if (!companyOid || !employerUserOid) throw new Error('findOrCreateReferralLink: invalid ids');
  const collection = await referralLinksCol();
  const now = new Date();

  return collection.findOneAndUpdate(
    { companyId: companyOid, postingId: toOid(postingId), employerUserId: employerUserOid },
    {
      $setOnInsert: {
        companyId: companyOid,
        postingId: toOid(postingId),
        employerUserId: employerUserOid,
        token: generateReferralToken(),
        clickCount: 0,
        applicationCount: 0,
        isActive: true,
        createdAt: now,
      },
      // Cached off the employer user so the public page can say who referred the
      // candidate without joining to a private table. Refreshed on every share, so
      // a rename propagates the next time the person opens the panel.
      $set: { referrerName: referrerName ?? null, updatedAt: now },
    },
    { upsert: true, returnDocument: 'after' },
  );
}

/** Look up a link by its public token. Returns null when missing. */
export async function findReferralLinkByToken(token) {
  if (typeof token !== 'string' || token.length < 8 || token.length > 64) return null;
  const collection = await referralLinksCol();
  return collection.findOne({ token });
}

/** Fire-and-forget click counter. Never throws — a metric must not break a page. */
export async function incrementReferralClickCount(token) {
  const collection = await referralLinksCol();
  await collection.updateOne({ token, isActive: true }, { $inc: { clickCount: 1 } });
}

/** Attribution counter, bumped once an application is committed. */
export async function incrementReferralApplicationCount(linkId) {
  const oid = toOid(linkId);
  if (!oid) return;
  const collection = await referralLinksCol();
  await collection.updateOne({ _id: oid }, { $inc: { applicationCount: 1 } });
}

/** Every link for one posting, most-used first. Company-scoped. */
export async function listReferralLinksForPosting(companyId, postingId) {
  const companyOid = toOid(companyId);
  const postingOid = toOid(postingId);
  if (!companyOid || !postingOid) return [];
  const collection = await referralLinksCol();
  return collection
    .find({ companyId: companyOid, postingId: postingOid })
    .sort({ applicationCount: -1, clickCount: -1 })
    .toArray();
}

/**
 * Deactivate a link. Company-scoped, so one tenant can never disable another's.
 * Deactivate rather than delete: applications already attributed to this link keep
 * pointing at a row that still explains where they came from.
 */
export async function deactivateReferralLink(companyId, linkId) {
  const companyOid = toOid(companyId);
  const linkOid = toOid(linkId);
  if (!companyOid || !linkOid) return null;
  const collection = await referralLinksCol();
  return collection.findOneAndUpdate(
    { _id: linkOid, companyId: companyOid },
    { $set: { isActive: false, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
}

/** Client-safe projection — ids as strings, no companyId. */
export function toPublicReferralLink(doc) {
  return {
    id: doc._id.toString(),
    token: doc.token,
    postingId: doc.postingId?.toString() ?? null,
    employerUserId: doc.employerUserId?.toString() ?? null,
    referrerName: doc.referrerName ?? null,
    clickCount: doc.clickCount ?? 0,
    applicationCount: doc.applicationCount ?? 0,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
  };
}
