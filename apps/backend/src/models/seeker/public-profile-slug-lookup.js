// FILE: src/models/seeker/public-profile-slug-lookup.js
// The database half of the slug rules: is this address free, what free address
// should we derive for this name, and what should we suggest when the one they
// asked for is taken.
//
// SPLIT FROM public-profile-slug.js, which stays pure (shape + reserved list) and
// therefore testable without a database, and from seeker-public-profile-model.js,
// which owns the profile document. What lives here is exactly the logic that needs
// to ask the collection a question.

import { usersCol, toOid } from './seeker-user-shared-helpers.js';
import { validateSlugShape, slugifyName, withRandomSuffix } from './public-profile-slug.js';

/** validateSlugShape returns an error code, so "no code" is the valid case. */
const isWellFormed = (slug) => validateSlugShape(slug) === null;

/** True when some OTHER user already holds this slug. */
export async function isSlugTaken(slug, excludeUserId = null) {
  const collection = await usersCol();
  const filter = { profileSlug: slug };
  const oid = toOid(excludeUserId);
  if (oid) filter._id = { $ne: oid };
  return Boolean(await collection.findOne(filter, { projection: { _id: 1 } }));
}

/**
 * A free slug derived from `name`, or from `fallback` when the name yields
 * nothing usable. Tries the bare base first, then random-suffixed candidates.
 * Returns null in the (practically unreachable) case where every attempt collided.
 */
export async function generateAvailableSlug(name, fallback, excludeUserId = null) {
  const base = slugifyName(name) || slugifyName(fallback) || 'member';
  if (isWellFormed(base) && !(await isSlugTaken(base, excludeUserId))) return base;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = withRandomSuffix(base);
    if (!isWellFormed(candidate)) continue;
    if (!(await isSlugTaken(candidate, excludeUserId))) return candidate;
  }
  return null;
}

/** Up to `count` free suggestions for a taken slug, for the 409 body. */
export async function suggestAlternativeSlugs(base, excludeUserId = null, count = 3) {
  const suggestions = [];
  for (let attempt = 0; attempt < count * 5 && suggestions.length < count; attempt += 1) {
    const candidate = withRandomSuffix(base);
    if (!isWellFormed(candidate) || suggestions.includes(candidate)) continue;
    if (!(await isSlugTaken(candidate, excludeUserId))) suggestions.push(candidate);
  }
  return suggestions;
}
