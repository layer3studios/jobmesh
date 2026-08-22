// FILE: src/api/health-detailed-routes.js
// GET /api/health/detailed — internal monitoring. Admin-only (requireAdmin), since
// it exposes memory, queue depth and collection counts. Everything the public
// /api/health returns, plus process and datastore internals.

import { Router } from 'express';
import { requireAdmin } from '../middleware/require-admin-middleware.js';
import { asyncHandler } from '../middleware/async-handler-middleware.js';
import { col } from '../Db/connection.js';
import { buildHealthReport, HEALTH_PROBE_TIMEOUT_MS } from '../services/health/health-service.js';

const router = Router();

/** Collections worth a row count on the internal dashboard. */
const COUNTED_COLLECTIONS = ['jobs', 'applications', 'companies', 'postings'];

/** Queue collections and the field marking a row as still outstanding. */
const QUEUE_COLLECTIONS = [
  { name: 'resume_score_jobs', key: 'resumeScoringQueue' },
  { name: 'resume_parse_jobs', key: 'resumeParseQueue' },
];

const toMegabytes = (bytes) => Math.round((bytes / 1024 / 1024) * 10) / 10;

/** Count documents with a per-probe timeout; null means "could not read". */
async function safeCount(collectionName, filter = {}) {
  try {
    const collection = await col(collectionName);
    return await collection.countDocuments(filter, { maxTimeMS: HEALTH_PROBE_TIMEOUT_MS });
  } catch {
    return null;
  }
}

router.get('/detailed', requireAdmin, asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  const memory = process.memoryUsage();
  const [report, collectionCounts, queueCounts] = await Promise.all([
    buildHealthReport(),
    Promise.all(COUNTED_COLLECTIONS.map((name) => safeCount(name))),
    Promise.all(QUEUE_COLLECTIONS.map((queue) => safeCount(queue.name, { status: 'pending' }))),
  ]);

  res.json({
    ...report,
    process: {
      nodeVersion: process.version,
      platform: process.platform,
      processId: process.pid,
      memory: {
        residentSetSizeMegabytes: toMegabytes(memory.rss),
        heapUsedMegabytes: toMegabytes(memory.heapUsed),
        heapTotalMegabytes: toMegabytes(memory.heapTotal),
        externalMegabytes: toMegabytes(memory.external),
      },
    },
    queues: Object.fromEntries(
      QUEUE_COLLECTIONS.map((queue, index) => [queue.key, queueCounts[index]]),
    ),
    database: {
      ...report.services.database,
      collectionCounts: Object.fromEntries(
        COUNTED_COLLECTIONS.map((name, index) => [name, collectionCounts[index]]),
      ),
    },
  });
}));

export default router;
