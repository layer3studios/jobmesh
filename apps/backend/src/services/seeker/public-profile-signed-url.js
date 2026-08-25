// FILE: src/services/seeker/public-profile-signed-url.js
// HMAC-signed resume links for the public profile page (/u/{slug}).
//
// SAME SHAPE AS THE EMPLOYER TOKEN, DIFFERENT SUBJECT AND DIFFERENT SECRET. The
// employer token grants one APPLICATION's resume for 15 minutes; this one grants
// one SLUG's resume for 24 hours, because the reader is a recruiter who opened a
// link from WhatsApp and may come back to it later the same day. A separate
// secret means rotating one audience's links never invalidates the other's, and a
// leak of either grants nothing on the other side.
//
// The token proves the link came from us. It does NOT prove the profile is still
// public — that is re-checked on every download, so revoking a profile revokes
// every outstanding link immediately.
//
// Pure module: no I/O. `secret` is injectable so tests can exercise wrong-secret.

import crypto from 'crypto';
import { PUBLIC_PROFILE_URL_SECRET } from '../../env.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';

export const PUBLIC_PROFILE_RESUME_TTL_MS = 24 * 60 * 60 * 1000;

function computeSignature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

/**
 * Sign a resume link for one slug. Returns { token, expires } rather than a URL:
 * the query-string layout belongs to the route, and the frontend needs the two
 * values separately to build `?token=…&expires=…`.
 */
export function signProfileResumeToken(
  slug, ttlMs = PUBLIC_PROFILE_RESUME_TTL_MS, secret = PUBLIC_PROFILE_URL_SECRET,
) {
  const expires = Date.now() + ttlMs;
  return { token: computeSignature(`${slug}.${expires}`, secret), expires };
}

/**
 * Validate a token against the slug it claims to cover. Throws HttpError(401,
 * INVALID_TOKEN) on ANY failure — malformed, tampered, wrong slug, wrong secret
 * or expired — without revealing which check failed.
 */
export function verifyProfileResumeToken(
  slug, token, expires, secret = PUBLIC_PROFILE_URL_SECRET,
) {
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    throw new HttpError(401, 'Invalid or expired link', 'INVALID_TOKEN');
  }
  const expected = computeSignature(`${slug}.${expires}`, secret);
  const provided = Buffer.from(String(token ?? ''));
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length
    || !crypto.timingSafeEqual(provided, expectedBuffer)) {
    throw new HttpError(401, 'Invalid or expired link', 'INVALID_TOKEN');
  }
  return true;
}
