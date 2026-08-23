// FILE: src/api/employer/employer-culture-photo-routes.js
// Culture-photo upload for the careers page. Mounted alongside the company router
// at /api/employer/company. Split out of employer-company-routes.js, which was over
// the 200-line cap — an upload route carries its own multer wiring and error
// translation, and that is a different concern from company field patching.
//
// Deleting a photo's BYTES stays in the company router, because that happens as a
// side effect of saving the section, not as a request of its own.

import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getEmployerUserById } from '../../models/employer/employer-user-model.js';
import { getCompanyById } from '../../models/employer/company-model.js';
import { requireOwnerOrHigher } from '../../middleware/require-company-role-middleware.js';
import {
  storeCulturePhotoFile, ALLOWED_CULTURE_PHOTO_MIME_TYPES,
  MAXIMUM_CULTURE_PHOTO_BYTES, MAXIMUM_CULTURE_PHOTOS,
} from '../../services/employer/culture-photo-storage-service.js';

const router = Router();

// This router mounts on requireEmployer only, so the role middleware — which needs
// req.employerCompanyId — gets it here. Mirrors attachCompanyForRole next door.
async function attachCompanyForRole(req, _res, next) {
  try {
    const user = await getEmployerUserById(req.employerUser.employerUserId);
    if (!user?.companyId) return next(new HttpError(404, 'No company', 'NO_COMPANY'));
    req.employerCompanyId = user.companyId;
    next();
  } catch (err) {
    next(err);
  }
}

// ─── Culture photos ───────────────────────────────────────────────
// Same shape as the logo uploader: memory storage, validated before any write.
const uploadCulturePhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAXIMUM_CULTURE_PHOTO_BYTES },
  fileFilter: (_req, file, cb) => (ALLOWED_CULTURE_PHOTO_MIME_TYPES.includes(file.mimetype)
    ? cb(null, true)
    : cb(new HttpError(400, 'Photos must be PNG, JPG or WebP.', 'INVALID_FILE_TYPE'))),
}).single('photo');

function runCulturePhotoUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadCulturePhoto(req, res, (err) => {
      if (!err) return resolve();
      if (err instanceof HttpError) return reject(err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return reject(new HttpError(400, 'Each photo must be 5MB or smaller.', 'FILE_TOO_LARGE'));
      }
      return reject(new HttpError(400, 'Could not read the uploaded file.', 'UPLOAD_FAILED'));
    });
  });
}

/**
 * POST /api/employer/company/culture-photos — upload one photo. Owner+.
 *
 * Stores the bytes and returns the URL; it does NOT attach the photo to the
 * company. The editor holds the whole culture section in local state and saves it
 * with one PATCH, so attaching here would write half the section behind the
 * employer's back and leave the two halves able to disagree.
 */
router.post('/culture-photos', attachCompanyForRole, requireOwnerOrHigher, asyncHandler(async (req, res) => {
  await runCulturePhotoUpload(req, res);
  const company = await getCompanyById(req.employerCompanyId);
  if (!company) throw new HttpError(404, 'No company', 'NO_COMPANY');
  if (!req.file?.buffer) throw new HttpError(400, 'A photo file is required.', 'NO_FILE');

  const existing = company.cultureSection?.photoUrls ?? [];
  if (existing.length >= MAXIMUM_CULTURE_PHOTOS) {
    throw new HttpError(400, `You can add up to ${MAXIMUM_CULTURE_PHOTOS} photos.`, 'TOO_MANY_PHOTOS');
  }

  const stored = storeCulturePhotoFile(req.file.buffer, req.file.mimetype);
  res.json({ photoUrl: stored.url });
}));
export default router;
