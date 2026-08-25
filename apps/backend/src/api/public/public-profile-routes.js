// FILE: src/api/public/public-profile-routes.js
// The unauthenticated shareable profile at /api/public/profile/:slug — the read
// behind /u/{slug}, its signed resume stream, and the contact form for profiles
// that keep their email hidden.
//
// NO CREDENTIAL IS REQUIRED AND NONE IS TRUSTED. optionalAuth runs only so a
// seeker looking at their own page is not counted as a visitor; a forged or absent
// cookie changes nothing else. profilePublic:false is indistinguishable from "no
// such slug" — both 404 — so an unpublished profile cannot be probed for.
//
// Mounted BEFORE the apply catch-all in register-routes.js, like every other
// specific /api/public/* route.

import fs from 'fs';
import { pipeline } from 'stream/promises';
import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { optionalAuth } from '../../middleware/require-seeker-middleware.js';
import {
  findPublishedProfileBySlug, incrementProfileViewCount, withSettingDefaults,
  listPublishedProfileSlugs,
} from '../../models/seeker/seeker-public-profile-model.js';
import { buildPublicProfile } from '../../services/seeker/public-profile-service.js';
import {
  signProfileResumeToken, verifyProfileResumeToken,
} from '../../services/seeker/public-profile-signed-url.js';
import { resolveSeekerResumePath } from '../../services/seeker/seeker-resume-storage.js';
import {
  validateContactSubmission, sendProfileContactMessage,
} from '../../services/email/profile-contact-service.js';
import { PUBLIC_PROFILE_BASE_URL } from '../../env.js';

const router = Router();
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

// Five messages per IP per day. A stranger with something to say needs one; a
// scraper working through a list of slugs needs thousands.
const contactLimiter = rateLimit({
  windowMs: DAY_MILLISECONDS, limit: 5, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: { error: 'Too many messages. Try again tomorrow.', code: 'RATE_LIMITED' },
});

/** Load a published profile or 404. The one place "private" and "missing" merge. */
async function requirePublishedProfile(slug) {
  const user = await findPublishedProfileBySlug(slug);
  if (!user) throw new HttpError(404, 'Profile not found.', 'PROFILE_NOT_FOUND');
  return user;
}

/** The signed, 24h resume URL for a slug — or null when there is no file to serve. */
function resumeLinkFor(user, settings) {
  if (!settings.showResume || !user.seekerResumeFile?.storagePath) return null;
  const { token, expires } = signProfileResumeToken(user.profileSlug);
  const path = `/api/public/profile/${encodeURIComponent(user.profileSlug)}/resume`;
  return { url: `${path}?token=${encodeURIComponent(token)}&expires=${expires}` };
}

// GET /profile — the slug index the frontend sitemap reads. Slugs only: this is a
// list of addresses that are already public, and nothing about the people behind
// them belongs in a response designed to be fetched in bulk. Mounted before
// /:slug so the bare path is not read as a slug.
router.get('/', asyncHandler(async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ slugs: await listPublishedProfileSlugs() });
}));

// GET /profile/:slug — the whole public profile, shaped by the owner's settings.
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const user = await requirePublishedProfile(req.params.slug);
  const settings = withSettingDefaults(user.profileSettings);
  const profile = await buildPublicProfile(user, resumeLinkFor(user, settings));

  // A candidate refreshing their own page is not a view. Awaiting is deliberate
  // and cheap ($inc on an indexed _id) — a fire-and-forget here would race the
  // response and lose counts under load.
  if (String(req.user?.userId ?? '') !== String(user._id)) {
    await incrementProfileViewCount(user._id);
  }

  // Five minutes: long enough that a link going round a group chat is served from
  // cache, short enough that turning the profile off takes effect while the
  // sender is still in the conversation.
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({ profile });
}));

// GET /profile/:slug/resume?token=…&expires=… — the PDF, inline.
//
// The token is checked FIRST (cheap, no I/O), then the profile is re-loaded so a
// profile turned private, or a showResume flag turned off, revokes every
// outstanding link immediately rather than at token expiry.
router.get('/:slug/resume', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  verifyProfileResumeToken(slug, req.query.token, req.query.expires);

  const user = await requirePublishedProfile(slug);
  const settings = withSettingDefaults(user.profileSettings);
  if (!settings.showResume) throw new HttpError(403, 'Resume is not shared.', 'RESUME_HIDDEN');

  const absolutePath = resolveSeekerResumePath(user.seekerResumeFile?.storagePath);
  if (!absolutePath) throw new HttpError(404, 'No resume on file.', 'RESUME_FILE_MISSING');

  let stat;
  try {
    stat = await fs.promises.stat(absolutePath);
  } catch {
    throw new HttpError(404, 'No resume on file.', 'RESUME_FILE_MISSING');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', stat.size);
  // inline, and named for the candidate rather than for the stored UUID: this
  // opens in a recruiter's browser tab, and the tab title is the filename.
  res.setHeader('Content-Disposition', `inline; filename="${slug}-resume.pdf"`);
  res.setHeader('Cache-Control', 'private, no-store');

  try {
    await pipeline(fs.createReadStream(absolutePath), res);
  } catch {
    if (!res.headersSent) throw new HttpError(404, 'No resume on file.', 'RESUME_FILE_MISSING');
  }
}));

// POST /profile/:slug/contact — a stranger's message, relayed by email.
//
// The response is the same for a delivered message and an undeliverable one (see
// profile-contact-service): anything else makes this an email-existence oracle.
router.post('/:slug/contact', contactLimiter, asyncHandler(async (req, res) => {
  // Honeypot: a hidden field no human ever fills. Accepted silently so the bot
  // learns nothing and does not retry with the field removed.
  if (String(req.body?.website ?? '').trim()) return res.json({ sent: true });

  const { value, error } = validateContactSubmission(req.body);
  if (error) throw new HttpError(400, 'Please check the form and try again.', error);

  const user = await requirePublishedProfile(req.params.slug);
  await sendProfileContactMessage({
    recipientEmail: user.parsedProfile?.email || user.email || null,
    ...value,
    profileUrl: `${PUBLIC_PROFILE_BASE_URL}/u/${user.profileSlug}`,
  });
  return res.json({ sent: true });
}));

export default router;
