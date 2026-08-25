// FILE: src/models/employer/recommendation-cache-model.js
// recommendation_cache — one row per (posting, seeker) candidate suggestion.
//
// WHY CACHE AT ALL. Stages 1 and 2 are cheap, but stage 3 is an AI call per
// candidate. Recomputing the ranking on every tab open would either throw those
// reviews away or re-buy them, so the ranking and the review live in the same row
// and expire together.
//
// THE ROW IS ALSO THE AUDIT TRAIL. addedToPipeline / notificationSentAt record
// that a real person was contacted because of a suggestion made here. They are
// never cleared by a recompute — see refreshRecommendations.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const cacheCol = () => col('recommendation_cache');

/** How long a computed ranking counts as fresh. */
export const RECOMMENDATION_TTL_MS = 6 * 60 * 60 * 1000;

/** Never suggest more than this many people for one posting. */
export const RECOMMENDATION_LIMIT = 10;

const toOid = (id) => {
  if (id instanceof ObjectId) return id;
  return typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : null;
};

/** Idempotent index setup. Called on boot. */
export async function ensureRecommendationCacheIndexes() {
  const collection = await cacheCol();
  await collection.createIndex(
    { postingId: 1, seekerUserId: 1 },
    { unique: true, name: 'recommendation_cache_posting_seeker' },
  );
  // The read path: one posting's live suggestions, best first.
  await collection.createIndex(
    { postingId: 1, isStale: 1, totalScore: -1 },
    { name: 'recommendation_cache_posting_rank' },
  );
  // { companyId } is not created: every read also carries postingId, which the two
  // indexes above already lead with.
}

/** This posting's suggestions, best first. Company-scoped (§6.5). */
export async function listRecommendations(companyId, postingId, { limit = RECOMMENDATION_LIMIT } = {}) {
  const collection = await cacheCol();
  return collection
    .find({ companyId: toOid(companyId), postingId: toOid(postingId), isStale: { $ne: true } })
    .sort({ totalScore: -1 })
    .limit(limit)
    .toArray();
}

/** One row, for the review and add-to-pipeline paths. Null when absent. */
export async function getRecommendation(companyId, postingId, seekerUserId) {
  const collection = await cacheCol();
  return collection.findOne({
    companyId: toOid(companyId), postingId: toOid(postingId), seekerUserId: toOid(seekerUserId),
  });
}

/** True when this posting's ranking was computed recently enough to serve as-is. */
export function isFresh(rows, now = Date.now()) {
  if (rows.length === 0) return false;
  return rows.every((row) => now - new Date(row.computedAt).getTime() < RECOMMENDATION_TTL_MS);
}

/**
 * Replace this posting's ranking with a freshly computed one.
 *
 * AI REVIEWS AND PIPELINE FLAGS SURVIVE. A recompute re-ranks; it does not undo
 * an employer's action or re-buy an AI call that is still accurate. Rows that
 * dropped out of the new top-N are marked stale rather than deleted, so a
 * candidate already added to the pipeline keeps their record of why.
 */
export async function replaceRecommendations(companyId, postingId, scored) {
  const collection = await cacheCol();
  const companyOid = toOid(companyId);
  const postingOid = toOid(postingId);
  const now = new Date();

  await collection.updateMany(
    { companyId: companyOid, postingId: postingOid },
    { $set: { isStale: true } },
  );
  if (scored.length === 0) return [];

  await collection.bulkWrite(scored.map((row) => ({
    updateOne: {
      filter: { postingId: postingOid, seekerUserId: toOid(row.seekerUserId) },
      update: {
        $set: {
          companyId: companyOid,
          totalScore: row.totalScore,
          matchedSkills: row.matchedSkills,
          matchedSkillCount: row.matchedSkillCount,
          hasLeetCode: row.hasLeetCode,
          hasGitHub: row.hasGitHub,
          hasResume: row.hasResume,
          isStale: false,
          computedAt: now,
        },
        // Only on insert: an existing row's review and pipeline history are facts
        // about what already happened and a re-rank must not rewrite them.
        $setOnInsert: {
          aiReview: null, aiRating: null, aiReviewedAt: null,
          addedToPipeline: false, addedToPipelineAt: null, notificationSentAt: null,
        },
      },
      upsert: true,
    },
  })));

  return listRecommendations(companyId, postingId);
}

/** Store a completed micro-review on one row. */
export async function setRecommendationReview(companyId, postingId, seekerUserId, { review, rating }) {
  const collection = await cacheCol();
  await collection.updateOne(
    { companyId: toOid(companyId), postingId: toOid(postingId), seekerUserId: toOid(seekerUserId) },
    { $set: { aiReview: review, aiRating: rating, aiReviewedAt: new Date() } },
  );
}

/** Record that this suggestion became a real application. */
export async function markAddedToPipeline(companyId, postingId, seekerUserId, { notified }) {
  const collection = await cacheCol();
  const now = new Date();
  await collection.updateOne(
    { companyId: toOid(companyId), postingId: toOid(postingId), seekerUserId: toOid(seekerUserId) },
    {
      $set: {
        addedToPipeline: true,
        addedToPipelineAt: now,
        ...(notified ? { notificationSentAt: now } : {}),
      },
    },
  );
}
