// FILE: src/api/public/public-flags-routes.js
// GET /api/public/flags — the handful of feature flags the public site needs
// in order to decide what to render.
//
// Deliberately NOT the admin payload: that one carries who changed what and
// when, and every operational kill switch. This returns only the flags that
// change what an anonymous visitor sees, so turning the scraper off never
// leaks out of the admin panel.

import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { getFeatureFlags as defaultGetFeatureFlags } from '../../models/admin/feature-flags-model.js';

/** The flags a visitor's browser is allowed to know about. */
const PUBLIC_FLAGS = ['employerSideEnabled', 'publicApplyEnabled'];

export function createPublicFlagsRouter(deps = {}) {
  const { getFeatureFlags = defaultGetFeatureFlags } = deps;
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const { flags } = await getFeatureFlags();
    const data = {};
    for (const name of PUBLIC_FLAGS) data[name] = flags[name] === true;
    // Short cache: flipping a flag in the admin panel should show up on the
    // site within a minute, not after a deploy.
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json({ data });
  }));

  return router;
}

export default createPublicFlagsRouter;
