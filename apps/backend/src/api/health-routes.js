// FILE: src/api/health-routes.js
// GET /api/health — public, unauthenticated liveness + dependency report. Mounted
// before every auth middleware so monitoring can reach it with no credentials.
//
// Contract: this endpoint MUST answer even when Mongo is down. Each probe is
// time-boxed inside health-service.js, so a hung dependency degrades the report
// instead of hanging the request. A degraded system still returns 200 (it is
// reachable); 503 is reserved for a report we could not build at all.

import { Router } from 'express';
import { buildHealthReport } from '../services/health/health-service.js';

const router = Router();

router.get('/', async (_req, res) => {
  // Monitoring must never be served a cached body.
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    res.json(await buildHealthReport());
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

export default router;
