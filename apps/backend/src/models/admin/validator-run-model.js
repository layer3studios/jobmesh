// FILE: src/models/admin/validator-run-model.js
// One document per validator sweep, in `validator_runs`. Mirrors
// scrape-run-model.js deliberately — same TTL technique (a real Date on
// `startedAtExpiry`), same fire-and-forget contract — so the two run histories
// can be read and reasoned about the same way.
//
// FIRE-AND-FORGET: recordValidatorRun swallows its own errors. Losing a
// telemetry row is strictly better than failing the sweep it describes.
//
// Why keep a history at all: the sweep is the thing allowed to expire jobs in
// bulk, so "how many did it expire, on which platform, and did the circuit
// breaker fire" is the audit trail for every job that left the board. A sudden
// jump in `dead`, or a breaker trip, is the signal that an ATS changed its API
// rather than that a lot of jobs closed.

import { col } from '../../Db/connection.js';

const COLLECTION = 'validator_runs';
const RETENTION_DAYS = 90;
const MS_PER_DAY = 86_400_000;

const runsCol = () => col(COLLECTION);

/** Idempotent index setup. Called from server boot. */
export async function ensureValidatorRunIndexes() {
  const collection = await runsCol();
  await collection.createIndex({ startedAt: -1 }, { name: 'validator_runs_started' });
  await collection.createIndex(
    { startedAtExpiry: 1 },
    { expireAfterSeconds: 0, name: 'validator_runs_ttl' },
  );
}

/** Anything unparseable becomes `now` — a run row is never worth losing. */
function toDate(value, fallback = new Date()) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  return Number.isNaN(date.getTime()) ? fallback : date;
}

/** The moment this row becomes eligible for TTL removal. */
const expiryFor = (startedAt) => new Date(startedAt.getTime() + RETENTION_DAYS * MS_PER_DAY);

/**
 * Persist one validator sweep. Returns the inserted document, or null when the
 * write failed — callers are not expected to check.
 */
export async function recordValidatorRun({
  startedAt,
  finishedAt = new Date(),
  source = 'cron',
  dryRun = false,
  force = false,
  ok = false,
  summary = null,
} = {}) {
  try {
    const started = toDate(startedAt);
    const finished = toDate(finishedAt, started);
    const doc = {
      startedAt: started,
      finishedAt: finished,
      durationMs: Math.max(0, finished.getTime() - started.getTime()),
      source: String(source),
      dryRun: Boolean(dryRun),
      force: Boolean(force),
      ok: Boolean(ok),
      // Stored as the sweep reported it: checked/live/dead/unknown/expired,
      // the platforms whose breaker tripped, and the per-ATS tallies.
      summary: summary ?? null,
      startedAtExpiry: expiryFor(started),
    };
    const collection = await runsCol();
    await collection.insertOne(doc);
    return doc;
  } catch (err) {
    // Never propagate: this is telemetry, not the payload.
    console.warn(`[validator-runs] run write failed: ${err.message}`);
    return null;
  }
}

/** Raw run rows, newest first. Service-layer shaping lives elsewhere. */
export async function findValidatorRuns({ limit = 50 } = {}) {
  const collection = await runsCol();
  return collection.find({}, { projection: { startedAtExpiry: 0 } })
    .sort({ startedAt: -1 })
    .limit(limit)
    .toArray();
}

export default recordValidatorRun;
