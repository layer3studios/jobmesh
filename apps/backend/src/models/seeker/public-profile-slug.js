// FILE: src/models/seeker/public-profile-slug.js
// Pure slug rules for the shareable public profile (/u/{slug}). No I/O — the
// model layer owns uniqueness; this file owns SHAPE and the reserved list.
//
// DELIBERATELY SEPARATE from the existing `slug` field on the users collection.
// That one is an internal display slug generated at signup and never shown as a
// URL; `profileSlug` is a public, user-chosen address someone pastes into a DM.
// Conflating them would let a signup-time collision suffix ("ashish-ranjan-2")
// leak into a URL the candidate never chose, and would make a slug edit silently
// repoint an internal identifier.

/** Reserved: every top-level path the frontend already owns, plus /u itself. */
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'apply', 'employer', 'settings', 'login', 'signup', 'about',
  'privacy', 'legal', 'health', 'status', 'hire', 'jobs', 'companies', 'u',
]);

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 30;

// Lowercase alphanumerics and single interior hyphens. Anchored, so a leading or
// trailing hyphen and any run of two hyphens fail by construction rather than by
// a follow-up check that could drift out of sync with the pattern.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SLUG_ERRORS = {
  INVALID: 'SLUG_INVALID',
  RESERVED: 'SLUG_RESERVED',
  TAKEN: 'SLUG_TAKEN',
};

/**
 * Validate a candidate slug's shape. Returns null when it is well formed, or one
 * of SLUG_ERRORS. Uniqueness is NOT checked here — that needs the database.
 */
export function validateSlugShape(slug) {
  if (typeof slug !== 'string') return SLUG_ERRORS.INVALID;
  const value = slug.trim();
  if (value.length < SLUG_MIN_LENGTH || value.length > SLUG_MAX_LENGTH) return SLUG_ERRORS.INVALID;
  if (!SLUG_PATTERN.test(value)) return SLUG_ERRORS.INVALID;
  if (RESERVED_SLUGS.has(value)) return SLUG_ERRORS.RESERVED;
  return null;
}

/**
 * Best-effort slug from a display name: "Ashish Ranjan" → "ashish-ranjan".
 * Returns '' when nothing usable survives, so the caller can fall back rather
 * than persist an empty address.
 */
export function slugifyName(name) {
  const base = String(name ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, '');
  // A too-short base ('jo', or a name that was entirely non-Latin) is padded
  // rather than rejected: the caller has no better name to try.
  return base.length >= SLUG_MIN_LENGTH ? base : '';
}

/** A random 4-digit suffix, zero-padded so every suggestion is the same width. */
export function randomSuffix() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

/**
 * `base-4829`, trimmed so the result still fits SLUG_MAX_LENGTH. The suffix is
 * what makes the slug unique, so the BASE is what gets cut.
 */
export function withRandomSuffix(base) {
  const suffix = randomSuffix();
  const room = SLUG_MAX_LENGTH - suffix.length - 1;
  const trimmed = base.slice(0, Math.max(1, room)).replace(/-+$/, '');
  return `${trimmed}-${suffix}`;
}
