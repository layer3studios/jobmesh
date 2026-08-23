// FILE: src/api/employer/employer-company-routes.js
// Company create + read + update. Mounted at /api/employer/company behind
// requireEmployer (applied in server.js). The owning company is always read
// from the authenticated user — never from request input (§6.5).

import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getEmployerUserById } from '../../models/employer/employer-user-model.js';
import { getCompanyById, updateCompanyForOwner, toPublicCompany } from '../../models/employer/company-model.js';
import { onboardEmployerCompany } from '../../services/employer/onboarding-service.js';
import { buildCompanyPatch } from './company-patch-builder.js';
import {
  storeLogoFile, deleteLogoFile, publicLogoUrlFor,
  MAXIMUM_LOGO_BYTES, ALLOWED_LOGO_MIME_TYPES,
} from '../../services/employer/logo-storage-service.js';
import { deleteCulturePhotoFile, fileNameFromPublicUrl } from '../../services/employer/culture-photo-storage-service.js';
import {
  requireInterviewerOrHigher, requireOwnerOrHigher,
} from '../../middleware/require-company-role-middleware.js';

const router = Router();
// logoUrl is patchable so the UI can CLEAR a logo (null); it is never set to a
// caller-supplied string — the upload route below owns writing a real value.
// This router mounts on requireEmployer only (POST onboarding must work before a
// company exists), so the role middleware — which needs req.employerCompanyId — gets
// it here. Preserves the existing 404 NO_COMPANY for a caller who hasn't onboarded.
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

/** Validate a PATCH body: reject unknown keys, normalize each supplied field. */

// Memory storage, never disk: the buffer is validated (type + size) before
// logo-storage-service writes anything, so a rejected upload leaves no bytes.
const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAXIMUM_LOGO_BYTES },
  fileFilter: (_req, file, cb) => (ALLOWED_LOGO_MIME_TYPES.includes(file.mimetype)
    ? cb(null, true)
    : cb(new HttpError(400, 'Logo must be a PNG, JPG or WebP image.', 'INVALID_FILE_TYPE'))),
}).single('logo');

/** Run multer, translating its size/type errors into our stable codes. */
function runLogoUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadLogo(req, res, (err) => {
      if (!err) return resolve();
      if (err instanceof HttpError) return reject(err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return reject(new HttpError(400, 'Logo must be 2MB or smaller.', 'FILE_TOO_LARGE'));
      }
      return reject(new HttpError(400, 'Could not read the uploaded file.', 'UPLOAD_FAILED'));
    });
  });
}

// POST /api/employer/company — create + onboard.
router.post('/', asyncHandler(async (req, res) => {
  const { name, website, retentionDays } = req.body || {};
  const result = await onboardEmployerCompany({
    employerUserId: req.employerUser.employerUserId, name, website, retentionDays,
  });
  res.json(result);
}));

// GET /api/employer/company — the caller's company (404 NO_COMPANY when absent).
router.get('/', attachCompanyForRole, requireInterviewerOrHigher, asyncHandler(async (req, res) => {
  const user = await getEmployerUserById(req.employerUser.employerUserId);
  if (!user?.companyId) throw new HttpError(404, 'No company', 'NO_COMPANY');
  const company = await getCompanyById(user.companyId);
  if (!company) throw new HttpError(404, 'No company', 'NO_COMPANY');
  res.json({ company: toPublicCompany(company) });
}));

/**
 * GET /api/employer/company/rejection-templates — the company's custom rejection
 * bodies, or {} when none are set.
 *
 * A separate route rather than a field on toPublicCompany: what a company writes
 * when rejecting someone is internal, and toPublicCompany is the shape the careers
 * surface is modelled on. Owner+ matches who is allowed to edit them.
 */
router.get('/rejection-templates', attachCompanyForRole, requireOwnerOrHigher, asyncHandler(async (req, res) => {
  const company = await getCompanyById(req.employerCompanyId);
  if (!company) throw new HttpError(404, 'No company', 'NO_COMPANY');
  res.json({ rejectionEmailTemplates: company.rejectionEmailTemplates ?? {} });
}));

// PATCH /api/employer/company — update the caller's own company only. Owner+.
router.patch('/', attachCompanyForRole, requireOwnerOrHigher, asyncHandler(async (req, res) => {
  const user = await getEmployerUserById(req.employerUser.employerUserId);
  if (!user?.companyId) throw new HttpError(404, 'No company', 'NO_COMPANY');
  const patch = buildCompanyPatch(req.body || {});
  const previous = await getCompanyById(user.companyId);
  const company = await updateCompanyForOwner(user.companyId, user._id, patch);
  if (!company) throw new HttpError(404, 'No company', 'NO_COMPANY');
  // Clearing the logo also removes the bytes. After the row is updated, never
  // before: an orphaned file is recoverable, a row pointing at a deleted file is
  // what produces a broken <img> on a public page.
  if (patch.logoStoragePath === null && previous?.logoStoragePath) {
    deleteLogoFile(previous.logoStoragePath);
  }
  // Same rule for culture photos: any file the saved section no longer references
  // is now unreachable, so retire its bytes. After the write, best-effort — a
  // leftover file is harmless; deleting one the row still points at is not.
  if ('cultureSection' in patch) {
    const keptUrls = new Set(patch.cultureSection?.photoUrls ?? []);
    for (const url of previous?.cultureSection?.photoUrls ?? []) {
      if (keptUrls.has(url)) continue;
      const fileName = fileNameFromPublicUrl(url);
      if (fileName) deleteCulturePhotoFile(fileName);
    }
  }
  res.json({ company: toPublicCompany(company) });
}));

// POST /api/employer/company/logo — upload/replace the company logo. Owner+.
router.post('/logo', attachCompanyForRole, requireOwnerOrHigher, asyncHandler(async (req, res) => {
  await runLogoUpload(req, res);
  const user = await getEmployerUserById(req.employerUser.employerUserId);
  if (!user?.companyId) throw new HttpError(404, 'No company', 'NO_COMPANY');
  if (!req.file?.buffer) throw new HttpError(400, 'A logo file is required.', 'NO_FILE');

  const previous = await getCompanyById(user.companyId);
  const stored = storeLogoFile(req.file.buffer, req.file.mimetype);
  const company = await updateCompanyForOwner(user.companyId, user._id, {
    logoUrl: publicLogoUrlFor(user.companyId),
    logoStoragePath: stored.storagePath,
  });
  if (!company) {
    deleteLogoFile(stored.storagePath); // nothing references these bytes
    throw new HttpError(404, 'No company', 'NO_COMPANY');
  }
  // Replacing a logo retires the old file. Best-effort: a leftover file is
  // harmless, and failing the upload over it would be worse.
  if (previous?.logoStoragePath && previous.logoStoragePath !== stored.storagePath) {
    deleteLogoFile(previous.logoStoragePath);
  }
  res.json({ company: toPublicCompany(company), logoUrl: company.logoUrl });
}));

export default router;
