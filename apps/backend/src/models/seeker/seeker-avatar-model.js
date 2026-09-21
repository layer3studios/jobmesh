// FILE: src/models/seeker/seeker-avatar-model.js
// The `seekerAvatar` record on a seeker user: where their uploaded photo lives on
// disk, and the public URL that serves it.
//
// ONE FILE PER USER, ALWAYS. setSeekerAvatar returns the record it replaced so the
// caller can unlink the old file in the same breath — that return value is what
// keeps this from growing a file per upload forever. Mirrors
// seeker-resume-file-model; the bytes are handled by the shared avatar storage
// service, the same one the employer side writes through.

import { usersCol, toOid } from './seeker-user-shared-helpers.js';

/**
 * Record the seeker's uploaded photo, returning the record it replaced (so the
 * caller can unlink the old file). Passing null clears it, which is how a seeker
 * falls back to the photo Google gave us.
 */
export async function setSeekerAvatar(userId, record) {
  const oid = toOid(userId);
  if (!oid) return null;
  const collection = await usersCol();
  const previous = await collection.findOneAndUpdate(
    { _id: oid },
    record ? { $set: { seekerAvatar: record } } : { $unset: { seekerAvatar: '' } },
    { returnDocument: 'before', projection: { seekerAvatar: 1 } },
  );
  return previous?.seekerAvatar ?? null;
}

/** The uploaded-photo record for a seeker, or null. */
export async function getSeekerAvatar(userId) {
  const oid = toOid(userId);
  if (!oid) return null;
  const collection = await usersCol();
  const user = await collection.findOne({ _id: oid }, { projection: { seekerAvatar: 1 } });
  return user?.seekerAvatar ?? null;
}

/**
 * The photo to show for a user doc: their upload when there is one, otherwise the
 * one Google gave us at sign-in. One place decides, so every surface agrees.
 */
export function avatarUrlForUser(user) {
  return user?.seekerAvatar?.url ?? user?.picture ?? null;
}
