// FILE: src/tasks/runValidator.js
// ─── Validator ─────────────────────────────────────────────────────────────
//
// Re-checks every active job against its source ATS and EXPIRES the ones that
// are provably gone. See core/jobLiveness.js for how "gone" is decided per
// platform, and why absence from our own scrape is not good enough.
//
// This exists because the scraper's cleanup was both too eager and too blunt:
// Db/jobs/crud.js deleteExpiredJobs() hard-deleted every job missing from the
// latest crawl, and scraperEngine.js quietly skips any page whose fetch throws
// or returns null while still reporting the site a success. One rate-limited
// company board therefore deleted all of that company's live jobs, permanently.
//
// Two deliberate differences from that old behaviour:
//
//   SOFT EXPIRY. A dead job is marked Status:'expired' with expiredAt and
//   expiredReason, never deleted. An application that points at it still
//   resolves, a wrong verdict is one flag flip away from undone, and the
//   scraper's "already seen" set is built from every document regardless of
//   Status, so an expired job is not silently re-imported either.
//
//   CIRCUIT BREAKER. If more than DEAD_RATIO_BREAKER of one platform's decided
//   jobs come back dead in a single run, that platform expires NOTHING. At that
//   scale the likely cause is our URL parsing breaking or the ATS changing its
//   API — not half a platform closing overnight. `force` overrides it for a
//   one-off cleanup once the verdicts have been spot-checked by hand.
import { col } from '../Db/connection.js';
import { checkJobLiveness, Liveness } from '../core/jobLiveness.js';
import { mapWithConcurrency } from '../utils.js';
import { notifyIndexNow } from '../services/seo/indexnow-client.js';
import { recordValidatorRun } from '../models/admin/validator-run-model.js';

const JOBS = 'jobs';
const CONCURRENCY = 8;
const DEAD_RATIO_BREAKER = 0.6;
const BREAKER_MIN_SAMPLE = 20;

let isValidating = false;

// Live progress for the admin panel. Module state, so it only describes runs in
// THIS process; a CLI run shows up through the validator_runs history instead.
const progress = { startedAt: null, source: null, checked: 0, total: 0 };

/** Snapshot for GET /api/admin/validator. */
export function getValidatorStatus() {
  return { running: isValidating, ...progress };
}

/**
 * Validates every active job and expires the dead ones.
 *
 * @param {object} [options]
 * @param {boolean} [options.dryRun] check and report, write nothing
 * @param {number}  [options.limit] cap the number of jobs checked (a spot check)
 * @param {boolean} [options.force] skip the circuit breaker
 * @param {'cron'|'manual'|'cli'} [options.source] recorded in validator_runs
 * @returns {Promise<object|null>} the summary, or null if a run was already going
 */
export async function runValidator({ dryRun = false, limit = 0, force = false, source = 'cron' } = {}) {
  if (isValidating) {
    console.log('[Validator] already running — skipping this trigger.');
    return null;
  }
  isValidating = true;
  const startedAt = Date.now();
  Object.assign(progress, { startedAt: new Date(startedAt), source, checked: 0, total: 0 });
  console.log(`[Validator] starting${dryRun ? ' (dry run)' : ''}...`);

  let summary = null;
  let ok = false;
  try {
    summary = await validateActiveJobs({ dryRun, limit, force });
    // Second pass: undo the crawl's guesses. This is what makes the scraper's
    // absence-based expiry safe to keep.
    summary.resurrected = await resurrectWronglyExpired({ dryRun, limit });
    ok = true;

    console.log(
      `[Validator] done in ${Math.round((Date.now() - startedAt) / 1000)}s: `
      + `${summary.checked} checked, ${summary.live} live, ${summary.dead} dead, `
      + `${summary.unknown} unknown, ${summary.expired} expired, `
      + `${summary.resurrected} resurrected`
      + (summary.tripped.length ? `, breaker tripped for ${summary.tripped.join(', ')}` : ''),
    );
    return summary;
  } catch (error) {
    console.error('[Validator] run failed:', error);
    return null;
  } finally {
    // A limited run is a spot check, not a sweep — keep it out of the history
    // that health checks read, or it will look like coverage collapsed.
    if (!limit) {
      await recordValidatorRun({
        startedAt: new Date(startedAt),
        finishedAt: new Date(),
        source,
        dryRun,
        force,
        ok,
        summary: ok ? summary : null,
      }).catch((err) => console.warn('[Validator] could not record run:', err.message));
    }
    isValidating = false;
  }
}

/**
 * Reasons a job may have been expired by a GUESS rather than by an answer.
 * Only these are eligible for resurrection: a job the validator itself expired
 * carries the source's own reason ("greenhouse 404", "ashby not on board"), and
 * re-opening those would just undo a correct verdict.
 */
const GUESSED_REASONS = ['not seen in crawl', 'stale — no refresh in 7 days'];

/** How far back to look. Older than this, a re-post is likelier than a mistake. */
const RESURRECT_WINDOW_DAYS = 14;

/**
 * Asks the source about recently expired jobs and re-opens the ones still live.
 *
 * The scraper expires jobs it did not see, and it mis-sees routinely — a
 * timeout or a 429 on one company's board makes every job behind it look gone
 * (scraperEngine.js skips the page and still calls the site a success). That
 * was unrecoverable while the cleanup was a delete. Now it is a flag, and this
 * is the pass that flips it back, so a flaky crawl costs a job a few hours on
 * the board instead of its existence.
 *
 * Only LIVE resurrects. UNKNOWN leaves the job expired — the same asymmetry as
 * the main sweep, pointed the other way: we re-open only on an explicit yes.
 */
async function resurrectWronglyExpired({ dryRun, limit }) {
  const jobs = await col(JOBS);
  const since = new Date(Date.now() - RESURRECT_WINDOW_DAYS * 86_400_000);
  const filter = {
    Status: 'expired',
    expiredReason: { $in: GUESSED_REASONS },
    expiredAt: { $gte: since },
  };

  let cursor = jobs.find(filter, {
    projection: { _id: 1, JobID: 1, ApplicationURL: 1, JobTitle: 1, Company: 1 },
  });
  if (limit) cursor = cursor.limit(limit);
  const candidates = await cursor.toArray();
  if (candidates.length === 0) return 0;

  console.log(`[Validator] re-checking ${candidates.length} recently expired jobs...`);
  const boardCache = new Map();
  const outcomes = await mapWithConcurrency(candidates, CONCURRENCY, async (job) => ({
    job,
    ...(await checkJobLiveness(job, { boardCache })),
  }));

  const alive = outcomes.filter((o) => o.verdict === Liveness.LIVE);
  for (const o of alive) {
    console.log(`[Validator] resurrecting (${o.reason}): "${o.job.JobTitle}" at ${o.job.Company}`);
  }
  if (dryRun || alive.length === 0) return alive.length;

  const now = new Date();
  const res = await jobs.bulkWrite(
    alive.map((o) => ({
      updateOne: {
        filter: { _id: o.job._id, ...filter },
        update: {
          $set: { Status: 'active', livenessCheckedAt: now, resurrectedAt: now },
          $unset: { expiredAt: '', expiredReason: '' },
        },
      },
    })),
    { ordered: false },
  );
  const resurrected = res.modifiedCount || 0;
  // Back on the board → ask the engines to re-crawl, since the page went from
  // noindex-without-markup back to a live JobPosting.
  if (resurrected > 0) notifyIndexNow(alive.map((o) => `/jobs/${o.job.JobID}`));
  return resurrected;
}

/** The sweep itself. Separated so runValidator owns only lifecycle concerns. */
async function validateActiveJobs({ dryRun, limit, force }) {
  const jobs = await col(JOBS);
  // Status is absent on documents written before soft expiry existed, so
  // "active" must include "no Status field at all" or the first sweep would
  // check nothing.
  const filter = { $or: [{ Status: 'active' }, { Status: { $exists: false } }] };
  let cursor = jobs.find(filter, {
    projection: { _id: 1, JobID: 1, ApplicationURL: 1, JobTitle: 1, Company: 1, sourceSite: 1 },
  });
  if (limit) cursor = cursor.limit(limit);
  const activeJobs = await cursor.toArray();

  console.log(`[Validator] checking ${activeJobs.length} active jobs...`);
  progress.checked = 0;
  progress.total = activeJobs.length;

  // ONE board cache for the whole sweep: Ashby, Personio and Recruitee are
  // answered per board, so this collapses thousands of job checks into one
  // request per company.
  const boardCache = new Map();
  const outcomes = await mapWithConcurrency(activeJobs, CONCURRENCY, async (job) => {
    const outcome = { job, ...(await checkJobLiveness(job, { boardCache })) };
    progress.checked += 1;
    if (progress.checked % 500 === 0) {
      console.log(`[Validator] ${progress.checked}/${progress.total}`);
    }
    return outcome;
  });

  // Per-platform tallies feed both the log and the breaker.
  const byAts = new Map();
  for (const outcome of outcomes) {
    if (!byAts.has(outcome.ats)) byAts.set(outcome.ats, { live: 0, dead: 0, unknown: 0 });
    byAts.get(outcome.ats)[outcome.verdict] += 1;
  }

  const tripped = [];
  const perAts = {};
  for (const [ats, tally] of byAts) {
    const decided = tally.live + tally.dead;
    const deadRatio = decided ? tally.dead / decided : 0;
    perAts[ats] = { ...tally, deadRatio: Number(deadRatio.toFixed(3)) };
    console.log(`[Validator] ${ats}: ${tally.live} live, ${tally.dead} dead, ${tally.unknown} unknown`);

    if (decided >= BREAKER_MIN_SAMPLE && deadRatio > DEAD_RATIO_BREAKER) {
      const pct = (deadRatio * 100).toFixed(0);
      if (force) {
        console.warn(`[Validator] ${ats}: ${pct}% dead — breaker OVERRIDDEN (force)`);
      } else {
        console.warn(`[Validator] ${ats}: ${pct}% dead — breaker tripped, expiring none`);
        tripped.push(ats);
      }
    }
  }

  const dead = outcomes.filter((o) => o.verdict === Liveness.DEAD && !tripped.includes(o.ats));
  const live = outcomes.filter((o) => o.verdict === Liveness.LIVE);
  const now = new Date();

  for (const o of dead) {
    console.log(`[Validator] dead (${o.reason}): "${o.job.JobTitle}" at ${o.job.Company} — ${o.job.ApplicationURL}`);
  }

  let expired = 0;
  if (!dryRun && dead.length > 0) {
    const res = await jobs.bulkWrite(
      dead.map((o) => ({
        updateOne: {
          // Re-assert the active filter so a job an admin changed mid-sweep is
          // not clobbered by a verdict formed before that change.
          filter: { _id: o.job._id, ...filter },
          update: {
            $set: {
              Status: 'expired',
              expiredAt: now,
              expiredReason: o.reason,
              livenessCheckedAt: now,
            },
          },
        },
      })),
      { ordered: false },
    );
    expired = res.modifiedCount || 0;

    // Tell IndexNow the pages changed. An expired job page serves noindex and
    // drops its JobPosting markup, so this is what gets it out of Bing (and
    // therefore ChatGPT search) instead of lingering as a dead listing —
    // exactly the "expired postings" case Google warns carries a manual action.
    if (expired > 0) {
      notifyIndexNow(dead.map((o) => `/jobs/${o.job.JobID}`));
    }
  }

  // Record the check even when the answer was "still live", so coverage is
  // visible and a never-checked job is distinguishable from a healthy one.
  if (!dryRun && live.length > 0) {
    await jobs.updateMany(
      { _id: { $in: live.map((o) => o.job._id) } },
      { $set: { livenessCheckedAt: now } },
    );
  }

  const count = (verdict) => outcomes.filter((o) => o.verdict === verdict).length;
  return {
    checked: outcomes.length,
    live: count(Liveness.LIVE),
    dead: count(Liveness.DEAD),
    unknown: count(Liveness.UNKNOWN),
    expired,
    tripped,
    perAts,
  };
}

export default runValidator;
