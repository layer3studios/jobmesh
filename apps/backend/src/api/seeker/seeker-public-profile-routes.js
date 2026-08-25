// FILE: src/api/seeker/seeker-public-profile-routes.js
// The seeker's own controls for their shareable public profile, mounted at
// /api/seeker/me behind requireSeeker. Identity is always req.user.userId (§6.5) —
// the slug in the body is an address the caller is claiming, never an identifier
// we trust to select a document.
//
// TURNING THE PROFILE ON GENERATES THE SLUG. A candidate should be able to flip
// one switch and get a link; making them invent an address first is a step that
// earns nothing. They can rename it afterwards, and the old address 404s
// immediately (no redirects — a stale link that still resolves is a privacy leak
// waiting to happen).

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getUserById } from '../../models/seeker/seeker-auth-helpers.js';
import { validateSlugShape, SLUG_ERRORS } from '../../models/seeker/public-profile-slug.js';
import {
  getPublicProfileStateForUser, updatePublicProfileState, validateSettingsPatch,
} from '../../models/seeker/seeker-public-profile-model.js';
import {
  isSlugTaken, generateAvailableSlug, suggestAlternativeSlugs,
} from '../../models/seeker/public-profile-slug-lookup.js';
import { PUBLIC_PROFILE_BASE_URL } from '../../env.js';

const router = Router();

/** The absolute URL a candidate pastes into a DM. Null until a slug exists. */
function profileUrlFor(slug) {
  return slug ? `${PUBLIC_PROFILE_BASE_URL}/u/${slug}` : null;
}

function envelope(state) {
  return { ...state, profileUrl: profileUrlFor(state.profileSlug) };
}

/** Resolve the slug this PATCH should end up with, generating one if needed. */
async function resolveSlug(userId, body, state) {
  const requested = typeof body.profileSlug === 'string' ? body.profileSlug.trim().toLowerCase() : null;

  if (requested) {
    if (requested === state.profileSlug) return null; // unchanged — nothing to write
    const shapeError = validateSlugShape(requested);
    if (shapeError === SLUG_ERRORS.RESERVED) {
      throw new HttpError(400, 'That address is reserved.', SLUG_ERRORS.RESERVED);
    }
    if (shapeError) {
      throw new HttpError(400, 'Use 3–30 lowercase letters, numbers and single hyphens.', SLUG_ERRORS.INVALID);
    }
    if (await isSlugTaken(requested, userId)) {
      const error = new HttpError(409, 'That address is already taken.', SLUG_ERRORS.TAKEN);
      error.details = { suggestions: await suggestAlternativeSlugs(requested, userId) };
      throw error;
    }
    return requested;
  }

  // Turning the profile on for the first time: derive an address from their name.
  if (body.profilePublic === true && !state.profileSlug) {
    const user = await getUserById(userId);
    const generated = await generateAvailableSlug(user?.name, user?.email, userId);
    if (!generated) throw new HttpError(409, 'Could not create a profile address.', SLUG_ERRORS.TAKEN);
    return generated;
  }
  return null;
}

// GET /profile-settings — current state plus the full public URL.
router.get('/profile-settings', asyncHandler(async (req, res) => {
  const state = await getPublicProfileStateForUser(req.user.userId);
  if (!state) throw new HttpError(404, 'User not found.', 'USER_NOT_FOUND');
  res.json(envelope(state));
}));

// GET /profile-slug-available?slug=… — the debounced availability check the slug
// editor calls on blur. Deliberately separate from PATCH so typing a candidate
// address never writes anything.
router.get('/profile-slug-available', asyncHandler(async (req, res) => {
  const slug = String(req.query.slug ?? '').trim().toLowerCase();
  const shapeError = validateSlugShape(slug);
  if (shapeError) return res.json({ available: false, code: shapeError, suggestions: [] });
  if (await isSlugTaken(slug, req.user.userId)) {
    return res.json({
      available: false,
      code: SLUG_ERRORS.TAKEN,
      suggestions: await suggestAlternativeSlugs(slug, req.user.userId),
    });
  }
  return res.json({ available: true, code: null, suggestions: [] });
}));

// PATCH /profile-settings — profilePublic, profileSlug and any subset of the
// visibility flags. Every key is optional; absent keys are left alone.
router.patch('/profile-settings', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (body.profilePublic !== undefined && typeof body.profilePublic !== 'boolean') {
    throw new HttpError(400, 'profilePublic must be a boolean.', 'INVALID_PROFILE_PUBLIC');
  }

  const { settings, error } = validateSettingsPatch(body.profileSettings);
  if (error) throw new HttpError(400, 'Invalid profile settings.', error);

  const state = await getPublicProfileStateForUser(req.user.userId);
  if (!state) throw new HttpError(404, 'User not found.', 'USER_NOT_FOUND');

  const profileSlug = await resolveSlug(req.user.userId, body, state);
  const updated = await updatePublicProfileState(req.user.userId, {
    profilePublic: body.profilePublic,
    ...(profileSlug ? { profileSlug } : {}),
    settings,
  });
  res.json(envelope(updated));
}));

export default router;
