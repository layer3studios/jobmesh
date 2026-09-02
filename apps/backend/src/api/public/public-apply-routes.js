// FILE: src/api/public/public-apply-routes.js
// Public (unauthenticated) apply endpoints, mounted at /api/public. Company + job
// are looked up by slug; the apply POST is rate-limited per IP+job and per
// IP+company (R3) and takes a memory-stored PDF (never disk via multer, C8).

import { Router } from 'express';
import multer from 'multer';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getCompanyBySlug } from '../../models/employer/company-model.js';
import {
  getActivePostingBySlugForCompany, listActivePostingsForCompany,
} from '../../models/employer/posting-model.js';
import {
  companySummary, jobSummary, assignmentSummary, publicAssignment, publicJob,
} from './apply-projections.js';
import {
  getAssignmentForCompany, listAssignmentsForIds,
} from '../../models/employer/assignment-model.js';
import { processApplication } from '../../services/public/apply-service.js';
import { countPublicPostingView } from '../../services/public/posting-view-counter.js';
import {
  findReferralLinkByToken, incrementReferralClickCount,
} from '../../models/employer/referral-link-model.js';
import { isFeatureEnabled } from '../../models/admin/feature-flags-model.js';

const router = Router();
const HOUR = 60 * 60 * 1000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => (file.mimetype === 'application/pdf'
    ? cb(null, true) : cb(new HttpError(400, 'Only PDF resumes are accepted.', 'INVALID_FILE_TYPE'))),
}).single('resume');

const perJobLimiter = rateLimit({
  windowMs: HOUR, limit: 10, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.params.companySlug}:${req.params.jobSlug}`,
  message: { error: 'Too many applications for this job. Try again later.', code: 'RATE_LIMITED' },
});
const perCompanyLimiter = rateLimit({
  windowMs: HOUR, limit: 30, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.params.companySlug}`,
  message: { error: 'Too many applications. Try again later.', code: 'RATE_LIMITED' },
});

/** Run multer, translating size/type errors into stable codes. */
function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (!err) return resolve();
      if (err instanceof HttpError) return reject(err);
      if (err.code === 'LIMIT_FILE_SIZE') return reject(new HttpError(400, 'Resume must be 5MB or smaller.', 'FILE_TOO_LARGE'));
      return reject(new HttpError(400, 'Could not read the uploaded file.', 'UPLOAD_FAILED'));
    });
  });
}

// GET /companies/:companySlug — company info + active jobs.
router.get('/companies/:companySlug', asyncHandler(async (req, res) => {
  const company = await getCompanyBySlug(req.params.companySlug);
  if (!company) throw new HttpError(404, 'Company not found.', 'COMPANY_NOT_FOUND');
  const postings = await listActivePostingsForCompany(company._id);

  // ONE batched query for every posting's assignment — never a lookup per job.
  // Skipped entirely when no posting carries one, so a company with no assignments
  // issues exactly the queries it did before this existed.
  const assignmentIds = [...new Set(
    postings.map((posting) => posting.assignmentId?.toString()).filter(Boolean),
  )];
  const assignments = await listAssignmentsForIds(company._id, assignmentIds);
  const assignmentById = new Map(assignments.map((assignment) => [assignment._id.toString(), assignment]));

  const jobs = postings.map((posting) => {
    const assignment = posting.assignmentId
      ? assignmentById.get(posting.assignmentId.toString()) ?? null
      : null;
    return { ...jobSummary(posting), assignment: assignment ? assignmentSummary(assignment) : null };
  });
  res.json({ company: companySummary(company), jobs });
}));

// GET /jobs/:companySlug/:jobSlug — active job detail.
router.get('/jobs/:companySlug/:jobSlug', asyncHandler(async (req, res) => {
  const company = await getCompanyBySlug(req.params.companySlug);
  if (!company) throw new HttpError(404, 'Company not found.', 'COMPANY_NOT_FOUND');
  const posting = await getActivePostingBySlugForCompany(company._id, req.params.jobSlug);
  if (!posting) throw new HttpError(404, 'This job is no longer accepting applications.', 'POSTING_NOT_FOUND');

  // Fire-and-forget: a candidate opened this job. Employer and bot requests are
  // filtered inside countPublicPostingView, and nothing here awaits the write.
  countPublicPostingView(req, posting);

  // The assignment rides as a SIBLING of `job`, not nested inside it —
  // toPublicPosting is shared with the employer routes and its shape stays fixed.
  let assignment = null;
  if (posting.assignmentId) {
    const found = await getAssignmentForCompany(company._id, posting.assignmentId);
    // A dangling reference is a data bug on our side, never a reason to 500 a
    // public page. Log it and render the job without its task.
    if (!found) {
      console.warn(`[apply] posting ${posting._id} references missing assignment ${posting.assignmentId}`);
    } else {
      assignment = publicAssignment(found);
    }
  }
  res.json({ company: companySummary(company), job: publicJob(posting), assignment });
}));

/**
 * GET /referrals/:token — resolve a referral token to the referrer's name.
 *
 * A SEPARATE endpoint, deliberately, rather than a field on the job response.
 * The job page is ISR-cached for an hour (revalidate = 3600 in the Next route), so
 * a referral resolved there would be baked into the shared cache entry: the second
 * candidate to open the page would be told they were referred by the first one's
 * referrer, and clicks would be counted once per revalidation instead of once per
 * visit. This route is called from the browser, is never cached, and is the only
 * place the click counter moves.
 *
 * Unknown, deactivated and malformed tokens all return 200 with referrerName:null.
 * A 404 would let anyone probe which tokens exist, and there is nothing here the
 * caller can fix — the page simply renders without a banner.
 */
router.get('/referrals/:token', asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const link = await findReferralLinkByToken(req.params.token);
  if (!link || link.isActive === false) {
    res.json({ referrerName: null });
    return;
  }

  // Fire-and-forget: a counter must never delay or fail a public page.
  incrementReferralClickCount(link.token)
    .catch((err) => console.warn('[referral] click count failed:', err.message));

  // The referrer's NAME only. Never the token's company, id, or owning teammate —
  // this response is public and unauthenticated.
  res.json({ referrerName: link.referrerName ?? null });
}));

/**
 * multipart repeats a field name for each value, so `assignmentLinks` arrives as a
 * string for one value and an array for several. The service validates every one of
 * these — nothing here is trusted, this only normalizes the shape.
 */
function normalizeAssignmentFields(body) {
  const toArray = (value) => {
    if (value === undefined || value === null || value === '') return [];
    return Array.isArray(value) ? value : [value];
  };
  return {
    ...body,
    assignmentLinks: toArray(body.assignmentLinks),
    assignmentFileIds: toArray(body.assignmentFileIds),
  };
}

// POST /jobs/:companySlug/:jobSlug/apply — submit an application.
router.post('/jobs/:companySlug/:jobSlug/apply', perCompanyLimiter, perJobLimiter, asyncHandler(async (req, res) => {
  // Submission only — the public job pages stay readable while applying is
  // paused, so a candidate sees the role and a clear message rather than a 404.
  // isFeatureEnabled fails open: a DB problem must not close applications.
  if (!(await isFeatureEnabled('publicApplyEnabled'))) {
    return res.status(503).json({
      error: 'Applications are temporarily disabled. Please try again shortly.',
      code: 'APPLY_TEMPORARILY_DISABLED',
    });
  }
  await runUpload(req, res);
  const resume = req.file
    ? { buffer: req.file.buffer, originalFilename: req.file.originalname, mimeType: req.file.mimetype }
    : null;
  const meta = { applicantIp: req.ip, userAgent: req.get('user-agent') || null, referer: req.get('referer') || null };
  const form = normalizeAssignmentFields(req.body || {});
  const result = await processApplication(req.params.companySlug, req.params.jobSlug, form, resume, meta);
  return res.json(result);
}));

export default router;
