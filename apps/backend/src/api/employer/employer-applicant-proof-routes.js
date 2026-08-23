// FILE: src/api/employer/employer-applicant-proof-routes.js
// Attach or clear a candidate's public proof-of-work on ONE application: LeetCode
// and GitHub. Mounted inside employer-applicant-routes at the same base path, so
// these are /api/employer/applicants/:applicationId/<provider>.
//
// Split from the main applicant router purely for size (section 2). The two
// providers stay as SEPARATE endpoints rather than one parameterised by provider:
// they validate differently — GitHub allows no underscores and 39 characters,
// LeetCode allows underscores and 20 — and they fail differently, so collapsing
// them would hide both behind a generic message.
//
// Member+ on every route, and each service re-scopes its write by companyId, so a
// mis-wired mount still cannot reach across tenants (§6.5).

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { requireMemberOrHigher } from '../../middleware/require-company-role-middleware.js';
import { requireEmployerApplicant } from '../../middleware/require-employer-applicant-middleware.js';
import {
  setApplicantLeetCode, clearApplicantLeetCode,
} from '../../services/employer/applicant-leetcode-service.js';
import {
  setApplicantGitHub, clearApplicantGitHub,
} from '../../services/employer/applicant-github-service.js';

const router = Router({ mergeParams: true });

// PUT /:applicationId/leetcode — attach a LeetCode record by username. Member+.
// Overwrites whatever was there: the employer named a specific account, and this
// application is the thing being annotated.
router.put(
  '/:applicationId/leetcode',
  requireMemberOrHigher,
  requireEmployerApplicant,
  asyncHandler(async (req, res) => {
    const data = await setApplicantLeetCode(
      req.employerCompanyId, req.params.applicationId, req.body?.username,
    );
    res.json({ leetcode: data });
  }),
);

// DELETE /:applicationId/leetcode — remove it from THIS application only. Member+.
router.delete(
  '/:applicationId/leetcode',
  requireMemberOrHigher,
  requireEmployerApplicant,
  asyncHandler(async (req, res) => {
    res.json(await clearApplicantLeetCode(req.employerCompanyId, req.params.applicationId));
  }),
);

// PUT /:applicationId/github — attach a GitHub record by username. Member+.
// Same contract as the LeetCode pair above, kept as separate endpoints rather
// than one parameterised by provider: the two have different validation rules and
// different failure modes, and collapsing them would hide both.
router.put(
  '/:applicationId/github',
  requireMemberOrHigher,
  requireEmployerApplicant,
  asyncHandler(async (req, res) => {
    const data = await setApplicantGitHub(
      req.employerCompanyId, req.params.applicationId, req.body?.username,
    );
    res.json({ github: data });
  }),
);

// DELETE /:applicationId/github — remove it from THIS application only. Member+.
router.delete(
  '/:applicationId/github',
  requireMemberOrHigher,
  requireEmployerApplicant,
  asyncHandler(async (req, res) => {
    res.json(await clearApplicantGitHub(req.employerCompanyId, req.params.applicationId));
  }),
);

export default router;
