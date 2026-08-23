// FILE: src/api/employer/employer-referral-routes.js
// Employee referral links. Mounted at /api/employer behind requireEmployer +
// requireEmployerCompany, so the owning company always comes from
// req.employerCompanyId and never from request input (§6.5).
//
// Roles: a Member+ may create and read THEIR OWN link (that is the whole point —
// everyone shares roles). Listing the whole team's links and deactivating one are
// Owner+, because both are oversight actions rather than participation.

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { requireEmployerPosting } from '../../middleware/require-employer-posting-middleware.js';
import {
  requireMemberOrHigher, requireOwnerOrHigher,
} from '../../middleware/require-company-role-middleware.js';
import {
  findOrCreateReferralLink, listReferralLinksForPosting, deactivateReferralLink,
  toPublicReferralLink,
} from '../../models/employer/referral-link-model.js';
import { getCompanyById } from '../../models/employer/company-model.js';
import { getEmployerUserById } from '../../models/employer/employer-user-model.js';
import { buildReferralUrl } from '../../services/employer/referral-url-service.js';

const router = Router();

/** Attach the shareable URL to a link row. The token alone is not usable by a human. */
function withReferralUrl(link, companySlug, postingSlug) {
  return {
    ...toPublicReferralLink(link),
    referralUrl: buildReferralUrl(companySlug, postingSlug, link.token),
  };
}

// POST /postings/:postingId/referral-link — create, or return the caller's existing link.
router.post(
  '/postings/:postingId/referral-link',
  requireMemberOrHigher,
  requireEmployerPosting,
  asyncHandler(async (req, res) => {
    const companyId = req.employerCompanyId;
    const company = await getCompanyById(companyId);
    if (!company) throw new HttpError(404, 'Company not found.', 'COMPANY_NOT_FOUND');

    // The referrer's name is cached on the link so the public apply page can render
    // "Referred by Priya" without reading an employer table from an unauthenticated
    // request. Falls back to the email local-part when no name is set.
    const employerUser = await getEmployerUserById(req.employerUser.employerUserId);
    const referrerName = employerUser?.name?.trim()
      || employerUser?.email?.split('@')[0]
      || null;

    const link = await findOrCreateReferralLink({
      companyId,
      postingId: req.posting._id,
      employerUserId: req.employerUser.employerUserId,
      referrerName,
    });
    res.json({ referralLink: withReferralUrl(link, company.slug, req.posting.slug) });
  }),
);

// GET /postings/:postingId/referral-links — the whole team's links for this posting.
router.get(
  '/postings/:postingId/referral-links',
  requireOwnerOrHigher,
  requireEmployerPosting,
  asyncHandler(async (req, res) => {
    const company = await getCompanyById(req.employerCompanyId);
    if (!company) throw new HttpError(404, 'Company not found.', 'COMPANY_NOT_FOUND');
    const links = await listReferralLinksForPosting(req.employerCompanyId, req.posting._id);
    res.json({
      referralLinks: links.map((link) => withReferralUrl(link, company.slug, req.posting.slug)),
    });
  }),
);

// DELETE /referral-links/:linkId — deactivate. Owner+ only.
router.delete(
  '/referral-links/:linkId',
  requireOwnerOrHigher,
  asyncHandler(async (req, res) => {
    const link = await deactivateReferralLink(req.employerCompanyId, req.params.linkId);
    if (!link) throw new HttpError(404, 'Referral link not found.', 'REFERRAL_LINK_NOT_FOUND');
    res.json({ referralLink: toPublicReferralLink(link) });
  }),
);

export default router;
