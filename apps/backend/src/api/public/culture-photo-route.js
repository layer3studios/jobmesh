// FILE: src/api/public/culture-photo-route.js
// Public (unauthenticated) culture-photo read, mounted at /api/public/culture-photo.
// The careers page is unauthenticated, so the photos it renders cannot sit behind
// requireEmployer — hence a separate public route.
//
// Keyed by the FILE's own uuid rather than by company. The filename is the only
// thing in the URL, so it is validated against a strict uuid.ext pattern before any
// read (isValidCulturePhotoName) — that is what stops `../../.env` from turning
// this into an arbitrary-file reader. Bytes only ever come from data/culture-photos/.

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import {
  readCulturePhotoFile, contentTypeForCulturePhoto, isValidCulturePhotoName,
} from '../../services/employer/culture-photo-storage-service.js';

const router = Router();
// Immutable in practice: a photo's uuid never gets different bytes, so replacing a
// photo produces a new URL rather than invalidating this one.
const CACHE_CONTROL = 'public, max-age=86400';

// GET /api/public/culture-photo/:fileName — stream one culture photo.
router.get('/:fileName', asyncHandler(async (req, res) => {
  const { fileName } = req.params;
  // A malformed name and a missing file are the same thing to a caller: no image.
  if (!isValidCulturePhotoName(fileName)) throw new HttpError(404, 'No photo', 'PHOTO_NOT_FOUND');

  const contentType = contentTypeForCulturePhoto(fileName);
  const buffer = contentType ? readCulturePhotoFile(fileName) : null;
  // The row references a photo whose bytes are gone (deleted by hand). Not a 500 —
  // the careers page simply renders one fewer image.
  if (!buffer) throw new HttpError(404, 'No photo', 'PHOTO_NOT_FOUND');

  res.set('Content-Type', contentType);
  res.set('Cache-Control', CACHE_CONTROL);
  res.set('Content-Length', String(buffer.length));
  res.send(buffer);
}));

export default router;
