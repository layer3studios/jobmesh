// FILE: src/models/seeker/seeker-github-model.js
// The `githubUsername` field on a seeker user, and the reverse lookup the employer
// side needs (email → connected seeker).
//
// The field lives on the seeker user rather than in the cache row because it is a
// STATED CONNECTION, not derived data: it survives a cache eviction, and clearing
// it is how a candidate withdraws their record from employer view.

import { usersCol, toOid } from './seeker-user-shared-helpers.js';

/** Idempotent index setup. Called on boot. */
export async function ensureGitHubUserIndexes() {
  const collection = await usersCol();
  // Sparse: only the minority who connect an account are indexed, and the index
  // is NOT unique — two people may legitimately point at the same public profile
  // (we cannot prove ownership, and the data is public either way).
  await collection.createIndex(
    { githubUsername: 1 },
    { sparse: true, name: 'users_githubUsername' },
  );
}

/** Store the connected username. Returns the stored value, or null when the user is gone. */
export async function setGitHubUsername(userId, username) {
  const oid = toOid(userId);
  if (!oid) return null;
  const collection = await usersCol();
  const result = await collection.findOneAndUpdate(
    { _id: oid },
    { $set: { githubUsername: username } },
    { returnDocument: 'after', projection: { githubUsername: 1 } },
  );
  return result?.githubUsername ?? null;
}

/**
 * Disconnect. $set null rather than $unset so the field's absence always means
 * "this user predates the feature" and never "they turned it off" — the two are
 * indistinguishable after an $unset, and only one of them should be re-promptable.
 */
export async function clearGitHubUsername(userId) {
  const oid = toOid(userId);
  if (!oid) return;
  const collection = await usersCol();
  await collection.updateOne({ _id: oid }, { $set: { githubUsername: null } });
}

/** The connected username for one seeker, or null. */
export async function getGitHubUsername(userId) {
  const oid = toOid(userId);
  if (!oid) return null;
  const collection = await usersCol();
  const user = await collection.findOne({ _id: oid }, { projection: { githubUsername: 1 } });
  return user?.githubUsername ?? null;
}

/**
 * The seeker behind an applicant's email, when they have connected GitHub.
 *
 * Email is the join key because it is the same key contacts are deduped on, and it
 * is the only identifier both sides share — an applicant who applied through the
 * public form has no seeker session to link by.
 *
 * Returns null for an unknown email OR a seeker who never connected, so the caller
 * has one falsy case rather than two.
 */
export async function findGitHubSeekerByEmail(email) {
  if (typeof email !== 'string' || !email.trim()) return null;
  const collection = await usersCol();
  const user = await collection.findOne(
    { email: email.trim().toLowerCase(), githubUsername: { $type: 'string', $ne: '' } },
    { projection: { githubUsername: 1 } },
  );
  return user ? { seekerUserId: user._id, githubUsername: user.githubUsername } : null;
}
