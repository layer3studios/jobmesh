// FILE: src/models/seeker/seeker-resume-file-model.js
// The `seekerResumeFile` record on a seeker user: where their retained resume PDF
// lives on disk, what it was called and how big it is.
//
// ONE DOCUMENT PER USER, ALWAYS. setSeekerResumeFile returns the record it
// replaced so the caller can unlink the old file in the same breath — that
// return value is what keeps this from growing a file per upload forever.
// The bytes themselves are handled by services/seeker/seeker-resume-storage.js.

import { usersCol, toOid } from './seeker-user-shared-helpers.js';

/**
 * Record the seeker's retained resume PDF, returning the record it replaced (so
 * the caller can unlink the old file). One document per user, always.
 */
export async function setSeekerResumeFile(userId, record) {
  const oid = toOid(userId);
  if (!oid) return null;
  const collection = await usersCol();
  const previous = await collection.findOneAndUpdate(
    { _id: oid },
    { $set: { seekerResumeFile: record } },
    { returnDocument: 'before', projection: { seekerResumeFile: 1 } },
  );
  return previous?.seekerResumeFile ?? null;
}

/** The retained resume record for a seeker, or null. */
export async function getSeekerResumeFile(userId) {
  const oid = toOid(userId);
  if (!oid) return null;
  const collection = await usersCol();
  const user = await collection.findOne({ _id: oid }, { projection: { seekerResumeFile: 1 } });
  return user?.seekerResumeFile ?? null;
}
