// FILE: src/api/employer/employer-discover-routes.js
// The Discover tab's three endpoints, mounted under /api/employer/postings.
//
// Member+ throughout: adding someone to a pipeline is a real write, and the two
// read endpoints spend AI budget, so neither is open to a viewer-only role.
//
// The split between GET and the review POST is deliberate. GET is the instant,
// deterministic part (stages 1-2, cached); the review is bought one candidate at
// a time as the employer actually looks at them.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { requireMemberOrHigher } from '../../middleware/require-company-role-middleware.js';
import {
  getRecommendations, hydrateRecommendations, reviewInputFor,
} from '../../services/employer/discover-service.js';
import {
  generateMicroReview, buildSeekerSummary,
} from '../../services/employer/discover-ai-review-service.js';
import { addSeekerToPipeline } from '../../services/employer/discover-pipeline-service.js';
import {
  getRecommendation, setRecommendationReview,
} from '../../models/employer/recommendation-cache-model.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { col } from '../../Db/connection.js';

const router = Router();

/**
 * Reviews are the only metered thing here — one Gemma call each, on a shared
 * per-token budget. Keyed by company so one busy recruiter cannot spend another
 * company's headroom.
 */
const reviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `discover-review:${req.employerCompanyId}`,
  message: { error: 'Too many reviews at once. Wait a moment.', code: 'DISCOVER_REVIEW_RATE_LIMITED' },
});

// GET /:postingId/discover — the ranked suggestions. Cached for 6 hours.
router.get('/:postingId/discover', requireMemberOrHigher, asyncHandler(async (req, res) => {
  const rows = await getRecommendations(
    req.employerCompanyId, req.params.postingId,
    { forceRefresh: req.query.refresh === 'true' },
  );
  res.json({ candidates: await hydrateRecommendations(rows) });
}));

// POST /:postingId/discover/:seekerUserId/review — stage 3, one candidate.
router.post(
  '/:postingId/discover/:seekerUserId/review',
  requireMemberOrHigher,
  reviewLimiter,
  asyncHandler(async (req, res) => {
    const { postingId, seekerUserId } = req.params;
    const companyId = req.employerCompanyId;

    // The cached row is also the authorisation check: a seeker who is not a
    // current suggestion for this posting cannot be summarised through here.
    const row = await getRecommendation(companyId, postingId, seekerUserId);
    if (!row) throw new HttpError(404, 'Not a current suggestion.', 'RECOMMENDATION_NOT_FOUND');
    if (row.aiReview) {
      res.json({ review: row.aiReview, rating: row.aiRating, cached: true });
      return;
    }

    const input = await reviewInputFor(companyId, postingId, seekerUserId);
    if (!input) throw new HttpError(404, 'Candidate not found', 'SEEKER_NOT_FOUND');

    const posting = await (await col('jobs')).findOne({ _id: row.postingId });

    const result = await generateMicroReview(
      buildSeekerSummary({
        matchedSkills: row.matchedSkills ?? [],
        allSkills: input.allSkills,
        experienceYears: input.seeker.parsedProfile?.totalExperienceYears ?? null,
        summary: input.seeker.parsedProfile?.summary ?? null,
        leetcode: input.leetcode,
        github: input.github,
      }),
      posting,
    );
    // null is a legitimate answer, not an error: the card renders without it.
    if (!result) { res.json({ review: null, rating: null, cached: false }); return; }

    await setRecommendationReview(companyId, postingId, seekerUserId, result);
    res.json({ ...result, cached: false });
  }),
);

// POST /:postingId/discover/:seekerUserId/add-to-pipeline
router.post(
  '/:postingId/discover/:seekerUserId/add-to-pipeline',
  requireMemberOrHigher,
  asyncHandler(async (req, res) => {
    const { application, notified } = await addSeekerToPipeline(
      req.employerCompanyId, req.params.postingId, req.params.seekerUserId,
    );
    res.status(201).json({ applicationId: String(application._id), notified });
  }),
);

export default router;
