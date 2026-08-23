// FILE: src/models/seeker/leetcode-cache-model.js
// leetcode_cache — one row per seeker holding their last successful LeetCode read.
//
// THE CACHE IS ALSO THE FALLBACK. Mongo's TTL monitor deletes an expired row
// eventually, but "expired" and "gone" are different states to us: an expired row
// is still the best answer available when LeetCode is down or rate-limiting, so
// reads are split in two. getCachedProfile() returns only fresh data; getStale-
// CachedProfile() returns whatever is there. The TTL is generous enough
// (expiresAt + a grace window) that a row survives long past the point it stops
// counting as fresh.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const cacheCol = () => col('leetcode_cache');

/** How long a read counts as fresh. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * How long past expiry Mongo keeps the row as a fallback. Six days: long enough
 * that a weekend outage still has something to serve, short enough that nobody is
 * shown a record from another era.
 */
const STALE_GRACE_SECONDS = 6 * 24 * 60 * 60;

function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** Idempotent index setup. Called on boot. */
export async function ensureLeetCodeCacheIndexes() {
  const collection = await cacheCol();
  await collection.createIndex({ seekerUserId: 1 }, { unique: true, name: 'leetcode_cache_seekerUserId' });
  // Deletes STALE_GRACE_SECONDS after expiresAt, not at it — see the header.
  await collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: STALE_GRACE_SECONDS, name: 'leetcode_cache_ttl' },
  );
}

/** The row for this seeker, fresh or not. Null when there has never been one. */
export async function getAnyCachedProfile(seekerUserId) {
  const oid = toOid(seekerUserId);
  if (!oid) return null;
  const collection = await cacheCol();
  return collection.findOne({ seekerUserId: oid });
}

/** The row only while it is still fresh. Null when absent or expired. */
export async function getCachedProfile(seekerUserId) {
  const row = await getAnyCachedProfile(seekerUserId);
  if (!row) return null;
  return new Date(row.expiresAt).getTime() > Date.now() ? row : null;
}

/** Upsert this seeker's cache row and restart its 24-hour clock. */
export async function setCachedProfile(seekerUserId, username, data) {
  const oid = toOid(seekerUserId);
  if (!oid) throw new Error('setCachedProfile: invalid seekerUserId');
  const now = new Date();
  const collection = await cacheCol();
  const doc = {
    seekerUserId: oid,
    username,
    data,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
  };
  await collection.updateOne({ seekerUserId: oid }, { $set: doc }, { upsert: true });
  return doc;
}

/** Drop this seeker's cache row. Called on disconnect. */
export async function deleteCachedProfile(seekerUserId) {
  const oid = toOid(seekerUserId);
  if (!oid) return;
  const collection = await cacheCol();
  await collection.deleteOne({ seekerUserId: oid });
}

/**
 * The client-facing profile from a cache row.
 * `isStale` is set ONLY when the row is past its freshness window, so the UI can
 * say "this may be out of date" instead of quietly presenting old numbers as current.
 */
export function toPublicLeetCodeProfile(row) {
  if (!row?.data) return null;
  const isStale = new Date(row.expiresAt).getTime() <= Date.now();
  return isStale ? { ...row.data, isStale: true } : row.data;
}
