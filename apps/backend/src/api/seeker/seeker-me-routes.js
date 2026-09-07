// FILE: src/api/seeker/seeker-me-routes.js
// All routes here assume req.user.userId is set by the requireSeeker middleware.
// Admin identity is served by /api/admin/auth/me. This endpoint never returns isAdmin.

import { Router } from 'express';
import multer from 'multer';
import {
  getUserById, touchVisit,
  getAppliedJobs, getAppliedJobDetails, addAppliedJob, removeAppliedJob, updateAppliedJobStage,
  updateSkills,
  getComeBackTo, upsertComeBackTo, removeComeBackTo,
  setDailyGoal,
  getDismissedJobs, addDismissedJob, removeDismissedJob,
  setSeekerAvatar, avatarUrlForUser,
} from '../../models/seeker/index.js';
import {
  storeAvatarFile, deleteAvatarFile, MAXIMUM_AVATAR_BYTES, ALLOWED_AVATAR_MIME_TYPES,
} from '../../services/employer/avatar-storage-service.js';
import { findJobById } from '../../Db/jobs/queries.js';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';

const VALID_STAGES = ['applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'ghosted'];
const router = Router();

/** The public read URL for a seeker's uploaded photo. */
function seekerAvatarUrl(userId) {
  return `/api/public/seeker-avatar/${String(userId)}`;
}

// Memory storage, never disk: the buffer is type- and size-checked before the
// storage service writes anything, so a rejected upload leaves no bytes behind.
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAXIMUM_AVATAR_BYTES },
  fileFilter: (_req, file, cb) => (ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)
    ? cb(null, true)
    : cb(new HttpError(400, 'Photo must be a PNG, JPG or WebP image.', 'INVALID_FILE_TYPE'))),
}).single('avatar');

/** Run multer, translating its size/type errors into our stable codes. */
function runAvatarUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadAvatar(req, res, (err) => {
      if (!err) return resolve();
      if (err instanceof HttpError) return reject(err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return reject(new HttpError(400, 'Photo must be 2MB or smaller.', 'FILE_TOO_LARGE'));
      }
      return reject(new HttpError(400, 'Could not read the uploaded image.', 'UPLOAD_FAILED'));
    });
  });
}

// GET /  — profile + dismissed IDs for initial load
router.get('/', asyncHandler(async (req, res) => {
  const [user, dismissed] = await Promise.all([
    getUserById(req.user.userId),
    getDismissedJobs(req.user.userId),
  ]);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({
    name: user.name,
    email: user.email,
    picture: avatarUrlForUser(user),
    /** The photo Google gave us, kept separate so the UI can offer to fall back to it. */
    googlePicture: user.picture ?? null,
    hasUploadedAvatar: Boolean(user.seekerAvatar?.storagePath),
    slug: user.slug,
    skills: Array.isArray(user.skills) ? user.skills : [],
    dailyGoal: typeof user.dailyGoal === 'number' ? user.dailyGoal : 5,
    appliedCount: typeof user.appliedCount === 'number' ? user.appliedCount : 0,
    dismissedJobIds: Array.isArray(dismissed) ? dismissed : [],
  });
}));

// ─── Avatar ─────────────────────────────────────────────────────────
// POST /avatar — upload or replace the caller's photo.
router.post('/avatar', asyncHandler(async (req, res) => {
  await runAvatarUpload(req, res);
  if (!req.file?.buffer) throw new HttpError(400, 'An image file is required.', 'NO_FILE');

  const stored = storeAvatarFile(req.file.buffer, req.file.mimetype);
  const url = seekerAvatarUrl(req.user.userId);
  const previous = await setSeekerAvatar(req.user.userId, {
    storagePath: stored.storagePath,
    sizeBytes: stored.sizeBytes,
    url,
    uploadedAt: new Date(),
  });
  // Replacing retires the old file, and only AFTER the row points at the new one:
  // an orphaned file is recoverable, a row pointing at a deleted file is a broken
  // <img> on a page someone might be looking at.
  if (previous?.storagePath) deleteAvatarFile(previous.storagePath);
  res.json({ picture: url, hasUploadedAvatar: true });
}));

// DELETE /avatar — clear the upload and fall back to the photo Google gave us.
router.delete('/avatar', asyncHandler(async (req, res) => {
  const previous = await setSeekerAvatar(req.user.userId, null);
  if (previous?.storagePath) deleteAvatarFile(previous.storagePath);
  const user = await getUserById(req.user.userId);
  res.json({ picture: user?.picture ?? null, hasUploadedAvatar: false });
}));

// PATCH /visit
router.patch('/visit', asyncHandler(async (req, res) => {
  const result = await touchVisit(req.user.userId);
  if (!result) throw new HttpError(404, 'User not found');
  res.json(result);
}));

// ─── Applied ────────────────────────────────────────────────────────
router.get('/applied', asyncHandler(async (req, res) => {
  res.json(await getAppliedJobs(req.user.userId));
}));

router.get('/applied/details', asyncHandler(async (req, res) => {
  res.json(await getAppliedJobDetails(req.user.userId));
}));

router.post('/applied/:jobId', asyncHandler(async (req, res) => {
  // Snapshot the job for resilience: if the listing is later deleted, the
  // user can still see what they applied to.
  let snapshot = {};
  try {
    const job = await findJobById(req.params.jobId);
    if (job) {
      snapshot = {
        jobTitle: job.JobTitle || null,
        company: job.Company || null,
        applicationURL: job.DirectApplyURL || job.ApplicationURL || null,
        location: job.Location || null,
        department: job.Department || null,
      };
    }
  } catch { /* snapshot is optional */ }
  res.json(await addAppliedJob(req.user.userId, req.params.jobId, snapshot));
}));

router.delete('/applied/:jobId', asyncHandler(async (req, res) => {
  res.json(await removeAppliedJob(req.user.userId, req.params.jobId));
}));

router.patch('/applied/:jobId/stage', asyncHandler(async (req, res) => {
  const { stage } = req.body || {};
  if (!stage || typeof stage !== 'string') throw new HttpError(400, 'stage is required');
  if (!VALID_STAGES.includes(stage)) {
    throw new HttpError(400, `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`);
  }
  const applied = await updateAppliedJobStage(req.user.userId, req.params.jobId, stage);
  if (applied === null) throw new HttpError(404, 'User or applied job not found');
  res.json(applied);
}));

// ─── Skills ─────────────────────────────────────────────────────────
const handleSkills = asyncHandler(async (req, res) => {
  res.json(await updateSkills(req.user.userId, req.body?.skills));
});
router.put('/skills', handleSkills);
router.patch('/skills', handleSkills);

// ─── Comeback (save for later) ──────────────────────────────────────
router.get('/comeback', asyncHandler(async (req, res) => {
  res.json(await getComeBackTo(req.user.userId));
}));

router.post('/comeback/:jobId', asyncHandler(async (req, res) => {
  const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 200) : '';
  res.json(await upsertComeBackTo(req.user.userId, req.params.jobId, note));
}));

router.delete('/comeback/:jobId', asyncHandler(async (req, res) => {
  res.json(await removeComeBackTo(req.user.userId, req.params.jobId));
}));

// ─── Daily goal ─────────────────────────────────────────────────────
router.patch('/goal', asyncHandler(async (req, res) => {
  const goal = await setDailyGoal(req.user.userId, req.body?.goal);
  if (goal === null) throw new HttpError(404, 'User not found');
  res.json({ dailyGoal: goal });
}));

// ─── Dismissed ──────────────────────────────────────────────────────
router.get('/dismissed', asyncHandler(async (req, res) => {
  res.json(await getDismissedJobs(req.user.userId));
}));

router.post('/dismissed/:jobId', asyncHandler(async (req, res) => {
  res.json(await addDismissedJob(req.user.userId, req.params.jobId));
}));

router.delete('/dismissed/:jobId', asyncHandler(async (req, res) => {
  res.json(await removeDismissedJob(req.user.userId, req.params.jobId));
}));

export default router;
