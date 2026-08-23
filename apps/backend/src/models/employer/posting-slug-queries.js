// FILE: src/models/employer/posting-slug-queries.js
// Slug allocation for a native posting: is this slug taken, what is the next free
// one, and is a given E11000 actually a slug collision. Split out of
// posting-model.js (section 2).
//
// Separate from posting-slug-helpers.js, which is PURE string work. Everything
// here touches the database.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';
import { slugifyPostingTitle, buildPostingSlugCandidate, randomPostingSlugSuffix } from './posting-slug-helpers.js';

const NATIVE = 'native';
const postingsCol = () => col('jobs');

function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** True when a native posting already owns this slug within the company. */
async function isPostingSlugTaken(companyOid, slug) {
  const collection = await postingsCol();
  const existing = await collection.findOne({ source: NATIVE, companyId: companyOid, slug });
  return existing != null;
}

/** Pick a slug not yet taken within this company: base → base-2 … → base-{random}. */
export async function generateUniquePostingSlugForCompany(companyId, title) {
  const companyOid = toOid(companyId);
  const base = slugifyPostingTitle(title);
  if (companyOid && !(await isPostingSlugTaken(companyOid, base))) return base;
  for (let suffixNumber = 2; suffixNumber <= 100; suffixNumber += 1) {
    const candidate = buildPostingSlugCandidate(base, String(suffixNumber));
    if (companyOid && !(await isPostingSlugTaken(companyOid, candidate))) return candidate;
  }
  return buildPostingSlugCandidate(base, randomPostingSlugSuffix());
}

const DUPLICATE_KEY_CODE = 11000;

/** Render an E11000's colliding index + values for internal diagnostics. */
function describeDuplicateKey(err) {
  return `keyPattern=${JSON.stringify(err?.keyPattern ?? null)} keyValue=${JSON.stringify(err?.keyValue ?? null)}`;
}

/**
 * True only for an E11000 from a slug-bearing unique index — the sole collision
 * a fresh slug can resolve. Any other index (e.g. the scraped-jobs JobID index)
 * must surface, not be retried into a misleading slug error.
 */
function isPostingSlugCollision(err) {
  const keyPattern = err?.keyPattern;
  return keyPattern != null && Object.prototype.hasOwnProperty.call(keyPattern, 'slug');
}

export { DUPLICATE_KEY_CODE, describeDuplicateKey, isPostingSlugCollision };
