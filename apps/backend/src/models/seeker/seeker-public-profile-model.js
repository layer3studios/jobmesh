// FILE: src/models/seeker/seeker-public-profile-model.js
// The public-profile fields on the seeker users collection: profileSlug,
// profilePublic, profileSettings and profileViewCount. Additive — no new
// collection, matching how leetcodeUsername/githubUsername already live here.
//
// DEFAULTS LIVE IN CODE, NOT IN THE DOCUMENT. Every user predating this feature
// has none of these fields, and backfilling millions of docs to express "off" is
// work with no reader. withSettingDefaults() is the single place that turns an
// absent field into its default, so a legacy doc and a fresh one read identically.
//
// PRIVACY DEFAULTS ARE DELIBERATE: showEmail and showPhone default FALSE. A
// shareable link is pasted into group chats; contact details must be an explicit
// choice, never a consequence of turning the page on.

import { usersCol, toOid } from './seeker-user-shared-helpers.js';
import { SLUG_ERRORS } from './public-profile-slug.js';

/** Every visibility flag, with the default applied to docs that lack it. */
export const PROFILE_SETTING_DEFAULTS = Object.freeze({
  showEmail: false,
  showPhone: false,
  showResume: true,
  showLeetCode: true,
  showGitHub: true,
  showExperience: true,
  showSkills: true,
  headline: null,
  openToWork: true,
});

export const HEADLINE_MAX_LENGTH = 120;

/**
 * Who may read /u/{slug}.
 *   public     — anyone with the link.
 *   recruiters — only a signed-in employer. Everyone else gets the same 404 a
 *                private profile gets, so the two are indistinguishable.
 *   private    — nobody.
 * profilePublic stays the stored source of "has an address at all": it is kept
 * in sync (true for public and recruiters) so slug uniqueness, the sitemap query
 * and every older reader keep working without a migration.
 */
export const PROFILE_VISIBILITIES = Object.freeze(['public', 'recruiters', 'private']);

/** A doc's visibility. Legacy docs have no field: fall back to the boolean. */
export function visibilityOf(user) {
  if (PROFILE_VISIBILITIES.includes(user?.profileVisibility)) return user.profileVisibility;
  return user?.profilePublic ? 'public' : 'private';
}

const BOOLEAN_SETTING_KEYS = Object.keys(PROFILE_SETTING_DEFAULTS)
  .filter((key) => typeof PROFILE_SETTING_DEFAULTS[key] === 'boolean');

/** Idempotent index setup. Called on boot. */
export async function ensurePublicProfileIndexes() {
  const collection = await usersCol();
  // Sparse + unique: only the minority who publish a profile are indexed, and the
  // address they chose is theirs alone. Sparse is what lets every other user keep
  // no profileSlug at all without colliding on null.
  await collection.createIndex(
    { profileSlug: 1 },
    { unique: true, sparse: true, name: 'users_profileSlug' },
  );
}

/** Merge a stored (possibly partial, possibly absent) settings object onto the defaults. */
export function withSettingDefaults(stored) {
  const settings = { ...PROFILE_SETTING_DEFAULTS };
  if (!stored || typeof stored !== 'object') return settings;
  for (const key of BOOLEAN_SETTING_KEYS) {
    if (typeof stored[key] === 'boolean') settings[key] = stored[key];
  }
  if (typeof stored.headline === 'string') settings.headline = stored.headline;
  if (typeof stored.openToWork === 'boolean') settings.openToWork = stored.openToWork;
  return settings;
}

/**
 * Validate an incoming profileSettings patch. Returns { settings } with only the
 * keys the caller actually sent, or { error } with a stable code. Unknown keys are
 * a 400 rather than a silent drop — a typo'd flag that quietly does nothing is how
 * a candidate ends up believing their phone number is hidden when it is not.
 */
export function validateSettingsPatch(patch) {
  if (patch == null) return { settings: {} };
  if (typeof patch !== 'object' || Array.isArray(patch)) {
    return { error: 'INVALID_SETTINGS' };
  }
  const settings = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in PROFILE_SETTING_DEFAULTS)) return { error: 'UNKNOWN_SETTING' };
    if (key === 'headline') {
      if (value !== null && typeof value !== 'string') return { error: 'INVALID_HEADLINE' };
      const headline = value === null ? null : value.trim().slice(0, HEADLINE_MAX_LENGTH);
      settings.headline = headline || null;
      continue;
    }
    if (typeof value !== 'boolean') return { error: 'INVALID_SETTING_VALUE' };
    settings[key] = value;
  }
  return { settings };
}

const PUBLIC_PROFILE_PROJECTION = {
  name: 1, email: 1, picture: 1, parsedProfile: 1,
  profileSlug: 1, profilePublic: 1, profileVisibility: 1, profileSettings: 1, profileViewCount: 1,
  leetcodeUsername: 1, githubUsername: 1, seekerResumeFile: 1,
};

/** The caller's own public-profile state, defaults applied. Null when the user is gone. */
export async function getPublicProfileStateForUser(userId) {
  const oid = toOid(userId);
  if (!oid) return null;
  const collection = await usersCol();
  const user = await collection.findOne({ _id: oid }, { projection: PUBLIC_PROFILE_PROJECTION });
  return user ? toState(user) : null;
}

/** The seeker doc behind a public slug, or null when unknown OR not published. */
export async function findPublishedProfileBySlug(slug) {
  if (typeof slug !== 'string' || !slug.trim()) return null;
  const collection = await usersCol();
  const user = await collection.findOne(
    { profileSlug: slug.trim().toLowerCase(), profilePublic: true },
    { projection: PUBLIC_PROFILE_PROJECTION },
  );
  return user ?? null;
}

/** Shape a user doc into the settings envelope the seeker's own UI reads. */
export function toState(user) {
  return {
    userId: String(user._id),
    profileSlug: user.profileSlug ?? null,
    profilePublic: Boolean(user.profilePublic),
    profileVisibility: visibilityOf(user),
    profileViewCount: user.profileViewCount ?? 0,
    settings: withSettingDefaults(user.profileSettings),
    hasResume: Boolean(user.seekerResumeFile?.storagePath),
    hasLeetCode: Boolean(user.leetcodeUsername),
    hasGitHub: Boolean(user.githubUsername),
  };
}

/**
 * Every published slug, for the sitemap. Capped: a sitemap file has a 50,000-URL
 * ceiling and this is one of several sources feeding it, so an unbounded scan
 * here would eventually produce an invalid sitemap rather than a bigger one.
 */
export async function listPublishedProfileSlugs(limit = 5000) {
  const collection = await usersCol();
  const rows = await collection
    .find(
      {
        profilePublic: true,
        profileSlug: { $type: 'string' },
        // A recruiters-only page must never be advertised to a crawler.
        profileVisibility: { $ne: 'recruiters' },
      },
      { projection: { profileSlug: 1 } },
    )
    .limit(limit)
    .toArray();
  return rows.map((row) => row.profileSlug).filter(Boolean);
}

/**
 * Apply a validated patch. `$set` only the keys present, so toggling one flag can
 * never reset another. Returns the updated state.
 */
export async function updatePublicProfileState(userId, {
  profilePublic, profileVisibility, profileSlug, settings,
}) {
  const oid = toOid(userId);
  if (!oid) return null;
  const setOps = {};
  if (typeof profilePublic === 'boolean') setOps.profilePublic = profilePublic;
  // Visibility wins when both arrive, and always rewrites the boolean with it, so
  // the two can never disagree about whether the page has an address.
  if (PROFILE_VISIBILITIES.includes(profileVisibility)) {
    setOps.profileVisibility = profileVisibility;
    setOps.profilePublic = profileVisibility !== 'private';
  }
  if (typeof profileSlug === 'string') setOps.profileSlug = profileSlug;
  for (const [key, value] of Object.entries(settings ?? {})) {
    setOps[`profileSettings.${key}`] = value;
  }
  if (Object.keys(setOps).length === 0) return getPublicProfileStateForUser(userId);

  const collection = await usersCol();
  const user = await collection.findOneAndUpdate(
    { _id: oid },
    { $set: setOps },
    { returnDocument: 'after', projection: PUBLIC_PROFILE_PROJECTION },
  );
  return user ? toState(user) : null;
}

/**
 * Count one view. Fire-and-forget by contract: a failed counter must never fail
 * the page render, so this swallows its own errors.
 */
export async function incrementProfileViewCount(userId) {
  const oid = toOid(userId);
  if (!oid) return;
  try {
    const collection = await usersCol();
    await collection.updateOne({ _id: oid }, { $inc: { profileViewCount: 1 } });
  } catch (error) {
    console.warn('[public-profile] view count failed:', error.message);
  }
}

export { SLUG_ERRORS };
