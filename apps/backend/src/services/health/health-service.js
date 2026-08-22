// FILE: src/services/health/health-service.js
// Builds the payload behind GET /api/health. Every probe is individually
// try/caught and time-boxed: health.jobmesh.in must answer even when Mongo is
// down, so a failing dependency degrades the report rather than throwing.

import { readFile } from 'node:fs/promises';
import { connectToDb, col } from '../../Db/connection.js';
import {
  RESEND_API_KEY, GEMMA_API_KEYS, EMPLOYER_AI_MODELS, NODE_ENV,
} from '../../env.js';

/** Hard ceiling per probe. Nginx gives /api/health a 5s read timeout (§6). */
export const HEALTH_PROBE_TIMEOUT_MS = 2000;

/** Resolve to `fallback` rather than reject when `promise` outruns the budget. */
async function withTimeout(promise, fallback, timeoutMs = HEALTH_PROBE_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

/** Ping Mongo and report round-trip latency. Never throws. */
export async function checkDatabase() {
  const startedAt = Date.now();
  return withTimeout(
    (async () => {
      const database = await connectToDb();
      await database.command({ ping: 1 });
      return { status: 'connected', latencyMilliseconds: Date.now() - startedAt };
    })(),
    { status: 'disconnected', latencyMilliseconds: null },
  );
}

/** Outbound email is configured when a Resend key is present. Synchronous. */
export function checkEmail() {
  return RESEND_API_KEY
    ? { status: 'configured', provider: 'resend' }
    : { status: 'not_configured', provider: null };
}

/**
 * AI availability = key count × employer-cascade model count, matching the
 * "N models × M keys = K combos" line the server logs at boot.
 */
export function checkAi() {
  const keyCount = GEMMA_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean).length;
  const modelCount = EMPLOYER_AI_MODELS.split(',').map((m) => m.trim()).filter(Boolean).length;
  return keyCount > 0
    ? { status: 'available', modelCount: keyCount * modelCount }
    : { status: 'not_configured', modelCount: 0 };
}

/** Most recent scraped job stands in for "when did the scraper last succeed". */
export async function checkScraper() {
  return withTimeout(
    (async () => {
      const jobs = await col('jobs');
      const [newest] = await jobs
        .find({}, { projection: { createdAt: 1 }, sort: { createdAt: -1 }, limit: 1 })
        .toArray();
      const lastRunAt = newest?.createdAt ?? null;
      return {
        status: lastRunAt ? 'running' : 'idle',
        lastRunAt: lastRunAt instanceof Date ? lastRunAt.toISOString() : lastRunAt,
      };
    })(),
    { status: 'unknown', lastRunAt: null },
  );
}

let cachedVersion = null;

/** Version from package.json, read once and memoised. */
export async function readVersion() {
  if (cachedVersion) return cachedVersion;
  try {
    const url = new URL('../../../package.json', import.meta.url);
    cachedVersion = JSON.parse(await readFile(url, 'utf8')).version ?? 'unknown';
  } catch {
    cachedVersion = 'unknown';
  }
  return cachedVersion;
}

/**
 * Overall status: healthy when nothing is broken, degraded when a dependency is
 * down. Unconfigured optional services (email, AI) are not failures.
 */
export function overallStatus(services) {
  const broken = ['disconnected', 'unreachable', 'error'];
  return Object.values(services).some((s) => broken.includes(s?.status)) ? 'degraded' : 'healthy';
}

/** Assemble the public health payload. Resolves even with every probe failing. */
export async function buildHealthReport() {
  const [database, scraper, version] = await Promise.all([
    checkDatabase(), checkScraper(), readVersion(),
  ]);
  const services = { database, email: checkEmail(), ai: checkAi(), scraper };

  return {
    status: overallStatus(services),
    timestamp: new Date().toISOString(),
    version,
    uptime: Math.floor(process.uptime()),
    services,
    environment: NODE_ENV,
  };
}
