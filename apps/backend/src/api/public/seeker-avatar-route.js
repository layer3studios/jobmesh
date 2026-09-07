// FILE: src/api/public/seeker-avatar-route.js
// Public (unauthenticated) seeker-avatar read, mounted at /api/public/seeker-avatar.
// Mirrors employer-avatar-route exactly.
//
// Public because the surfaces that render it may have no session of the person in
// the picture: the app itself is served from a different origin than the API in
// production, so a cookie-authenticated <img> would not load. It serves ONE thing —
// bytes previously uploaded through the self-only seeker route, from data/avatars/
// only. The path comes from the user row (never from the URL) and is re-checked for
// directory containment before any read, so this can never be walked into an
// arbitrary-file reader.

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getUserById } from '../../models/seeker/seeker-auth-helpers.js';
import { readAvatarFile, contentTypeForAvatar } from '../../services/employer/avatar-storage-service.js';

const router = Router();
const CACHE_CONTROL = 'public, max-age=3600';

// GET /api/public/seeker-avatar/:userId — stream one seeker's uploaded photo.
router.get('/:userId', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.userId);
  // A bad id and a user who never uploaded are the same thing to a caller: no
  // image. 404 rather than a placeholder — the client falls back to its initials.
  const storagePath = user?.seekerAvatar?.storagePath;
  if (!storagePath) throw new HttpError(404, 'No avatar', 'AVATAR_NOT_FOUND');

  const contentType = contentTypeForAvatar(storagePath);
  const buffer = contentType ? readAvatarFile(storagePath) : null;
  // The row says there is a photo but the bytes are gone (deleted by hand). Not a
  // 500 — the <img> onError handler falls back to initials.
  if (!buffer) throw new HttpError(404, 'No avatar', 'AVATAR_NOT_FOUND');

  res.set('Content-Type', contentType);
  res.set('Cache-Control', CACHE_CONTROL);
  res.set('Content-Length', String(buffer.length));
  res.send(buffer);
}));

export default router;
