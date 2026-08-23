// FILE: src/api/employer/employer-availability-routes.js
// The signed-in teammate's own weekly interview availability. Mounted at
// /api/employer/me behind requireEmployer only, alongside employer-me-routes.
//
// NO ROLE GATE. Every route here reads and writes exactly one row set: the
// caller's own, resolved from the session and never from input. An Interviewer
// declaring when they can interview is the whole point of the feature, not a
// permission question — they are the people being scheduled.
//
// The company DOES have to be resolved, because availability is company-scoped
// (§6.5) and this router is not mounted behind requireEmployerCompany. It is
// resolved from the caller's own user row, the same way the company router does it.

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getEmployerUserById } from '../../models/employer/employer-user-model.js';
import { toEmployerUserProfile } from '../../models/employer/employer-user-profile-model.js';
import {
  listAvailabilityForUser, replaceAvailabilityForUser, toPublicAvailability,
} from '../../models/employer/interviewer-availability-model.js';
import { validateWeeklyAvailability } from '../../services/employer/availability-validators.js';
import { suggestSlotsFromAvailability } from '../../services/interview/availability-helpers.js';

const router = Router();

/** The caller's user row plus their company. 404s a teammate who has not onboarded. */
async function loadCaller(req) {
  const user = await getEmployerUserById(req.employerUser.employerUserId);
  if (!user?.companyId) throw new HttpError(404, 'No company', 'NO_COMPANY');
  return { user, companyId: user.companyId, profile: toEmployerUserProfile(user) };
}

// GET /api/employer/me/availability — the caller's weekly windows.
router.get('/availability', asyncHandler(async (req, res) => {
  const { user, companyId, profile } = await loadCaller(req);
  const rows = await listAvailabilityForUser(companyId, user._id);
  res.json({
    availability: rows.map(toPublicAvailability),
    // Echoed so the editor can label the grid "Times shown in Asia/Kolkata"
    // without a second request, and can warn when it is only the fallback.
    timezone: profile.timezone,
    hasExplicitTimezone: Boolean(user.timezone),
  });
}));

// PUT /api/employer/me/availability — replace the whole week.
router.put('/availability', asyncHandler(async (req, res) => {
  const { user, companyId, profile } = await loadCaller(req);
  // The zone comes from the profile, never the body: one person's hours are
  // expressed in one zone, and a per-request zone would make "10:00" ambiguous.
  const entries = validateWeeklyAvailability(req.body?.availability, profile.timezone);
  const saved = await replaceAvailabilityForUser(companyId, user._id, entries);
  res.json({
    availability: saved.map(toPublicAvailability),
    timezone: profile.timezone,
    hasExplicitTimezone: Boolean(user.timezone),
  });
}));

/**
 * GET /api/employer/me/availability/suggestions?from=&to=&durationMinutes=
 *
 * Concrete slots derived from the caller's own weekly windows, minus anything
 * colliding with interviews they are already on. Read-only by design — see the
 * header of availability-helpers.js for why this never writes interview_times.
 */
router.get('/availability/suggestions', asyncHandler(async (req, res) => {
  const { user, companyId } = await loadCaller(req);
  const { from, to, durationMinutes } = req.query;
  if (!from || !to) {
    throw new HttpError(400, 'Provide a from and to date.', 'INVALID_DATE_RANGE');
  }
  const result = await suggestSlotsFromAvailability(
    companyId, user._id, from, to, Number(durationMinutes) || 30,
  );
  res.json(result);
}));

export default router;
