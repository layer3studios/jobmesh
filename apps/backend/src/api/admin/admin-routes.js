// FILE: src/api/admin/admin-routes.js
// Admin router index. Applies requireAdmin (jm_admin_token) once, then mounts the
// sub-routers. Mounted at /api/admin by server.js.
//
// The reclean-descriptions endpoint is GONE. It existed to regenerate the stored
// DescriptionCleaned field, which is no longer stored at all — it is derived on
// read in the single-job endpoint, because holding it cost 30% of every job
// document for text that is a pure function of Description. Keeping the route
// would have re-written the field back onto every job it touched.

import { Router } from 'express';
import { requireAdmin } from '../../middleware/require-admin-middleware.js';
import employerAccessRouter from './employer-access-routes.js';
import adminDpdpRouter from './admin-dpdp-routes.js';

const router = Router();

// Every admin endpoint requires a valid admin session (jm_admin_token). Standalone
// now — no seeker cookie needed (D5): admin + seeker sessions coexist independently.
router.use(requireAdmin);

router.use('/', employerAccessRouter);
router.use('/dpdp', adminDpdpRouter);

export default router;
