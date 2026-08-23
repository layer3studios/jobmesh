// FILE: src/models/seeker/github-cache-model.js
// github_cache — one row per seeker holding their last successful GitHub read.
//
// THE CACHE IS ALSO THE FALLBACK, exactly as leetcode_cache is. Mongo's TTL
// monitor deletes an expired row eventually, but "expired" and "gone" are
// different states to us: an expired row is still the best answer available when
// GitHub is down or rate-limiting, so reads are split in two. getCachedGitHub()
// returns only fresh data; getAnyCachedGitHub() returns whatever is there. The TTL
// is generous enough (expiresAt + a grace window) that a row survives long past
// the point it stops counting as fresh.
//
// A SEPARATE COLLECTION from leetcode_cache rather than a shared one keyed by
// provider: the two expire independently, and a single row would make one
// provider's outage evict the other's good data.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const cacheCol = () => col('github_cache');

/** How long a read counts as fresh. Named for its provider — the seeker models
    barrel re-exports with `export *`, and a bare CACHE_TTL_MS would collide with
    leetcode_cache's and be silently dropped from the barrel by ESM. */
export const GITHUB_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
export async function ensureGitHubCacheIndexes() {
  const collection = await cacheCol();
  await collection.createIndex({ seekerUserId: 1 }, { unique: true, name: 'github_cache_seekerUserId' });
  // Deletes STALE_GRACE_SECONDS after expiresAt, not at it — see the header.
  await collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: STALE_GRACE_SECONDS, name: 'github_cache_ttl' },
  );
}

/** The row for this seeker, fresh or not. Null when there has never been one. */
export async function getAnyCachedGitHub(seekerUserId) {
  const oid = toOid(seekerUserId);
  if (!oid) return null;
  const collection = await cacheCol();
  return collection.findOne({ seekerUserId: oid });
}

/** The row only while it is still fresh. Null when absent or expired. */
export async function getCachedGitHub(seekerUserId) {
  const row = await getAnyCachedGitHub(seekerUserId);
  if (!row) return null;
  return new Date(row.expiresAt).getTime() > Date.now() ? row : null;
}

/** Upsert this seeker's cache row and restart its 24-hour clock. */
export async function setCachedGitHub(seekerUserId, username, data) {
  const oid = toOid(seekerUserId);
  if (!oid) throw new Error('setCachedGitHub: invalid seekerUserId');
  const now = new Date();
  const collection = await cacheCol();
  const doc = {
    seekerUserId: oid,
    username,
    data,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + GITHUB_CACHE_TTL_MS),
  };
  await collection.updateOne({ seekerUserId: oid }, { $set: doc }, { upsert: true });
  return doc;
}

/** Drop this seeker's cache row. Called on disconnect. */
export async function deleteCachedGitHub(seekerUserId) {
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
export function toPublicGitHubProfile(row) {
  if (!row?.data) return null;
  const isStale = new Date(row.expiresAt).getTime() <= Date.now();
  return isStale ? { ...row.data, isStale: true } : row.data;
}
