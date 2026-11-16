// FILE: src/Db/jobs/crud.js
// Write-side operations for the jobs collection.

import { ObjectId } from 'mongodb';
import { notifyIndexNow } from '../../services/seo/indexnow-client.js';
import { col } from '../connection.js';
import { SITES_CONFIG } from '../../config.js';
import { createJobModel } from '../../models/shared/job-model.js';
import { cleanJobDescription } from '../../core/cleanJobDescription/index.js';
import { generateJobTags, getPlainTextForTagging } from '../../core/jobTags/index.js';

const JOBS = 'jobs';

/**
 * Expire the jobs the scraper no longer sees on a site.
 *
 * SOFT, and that is the whole point. This used to be a deleteMany, which made
 * every verdict final — and the verdict is only ever a guess: scraperEngine.js
 * skips any page whose fetch throws or returns null (a timeout, a 429, one
 * company's board 404ing) and still reports the site a success, so every job
 * behind that skipped fetch looks unseen. Hard-deleting them destroyed live
 * listings with no way back.
 *
 * Marking Status:'expired' instead means:
 *   • the job leaves the board immediately — every read filters Status:'active'
 *     (Db/jobs/jobs-query-builder.js, queries.js), so nothing else must change;
 *   • saveJobs() sets Status:'active', so a job seen again on the next crawl
 *     resurrects itself with no special case;
 *   • tasks/runValidator.js can ask the source ATS directly and resurrect
 *     anything expired by a bad crawl;
 *   • an application pointing at the job still resolves.
 *
 * @param {string} siteName
 * @param {Set<string>} seenJobIds
 * @returns {Promise<number>} jobs newly expired
 */
export async function expireUnseenJobs(siteName, seenJobIds) {
  const jobs = await col(JOBS);
  const seen = Array.from(seenJobIds);
  // An empty `seen` would match the whole site; the caller already refuses that
  // case, and this guard makes the function safe on its own terms too.
  if (seen.length === 0) return 0;

  const result = await jobs.updateMany(
    { sourceSite: siteName, JobID: { $nin: seen }, Status: 'active' },
    { $set: { Status: 'expired', expiredAt: new Date(), expiredReason: 'not seen in crawl' } },
  );
  if (result.modifiedCount > 0) {
    console.log(`[${siteName}] Expired ${result.modifiedCount} jobs no longer on the board.`);
  }
  return result.modifiedCount;
}

/**
 * Fallback for a scrape that failed partway through: expire that site's jobs
 * not refreshed in 7 days, rather than trusting a crawl we know was incomplete.
 *
 * Also soft, for a sharper reason than above — `updatedAt` tracks when WE last
 * wrote the document, not whether the posting is open, so a live job on a site
 * whose crawl keeps failing ages past this cutoff while still being live. As an
 * expiry that is recoverable (and that runValidator.js will undo on sight);
 * as a delete it was data loss on a timer.
 */
export async function expireStaleJobs(siteName) {
  const jobs = await col(JOBS);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const result = await jobs.updateMany(
    { sourceSite: siteName, updatedAt: { $lt: sevenDaysAgo }, Status: 'active' },
    { $set: { Status: 'expired', expiredAt: new Date(), expiredReason: 'stale — no refresh in 7 days' } },
  );
  if (result.modifiedCount > 0) {
    console.log(`[${siteName}] Expired ${result.modifiedCount} jobs not refreshed in 7 days.`);
  }
  return result.modifiedCount;
}

/**
 * Load the set of existing JobIDs for every configured site. Runs the per-site
 * queries in parallel rather than serially.
 */
export async function loadAllExistingIDs() {
  const jobs = await col(JOBS);
  const map = new Map();
  await Promise.all(SITES_CONFIG.map(async (cfg) => {
    if (!cfg?.siteName) return;
    const docs = await jobs.find(
      { sourceSite: cfg.siteName },
      { projection: { JobID: 1 } },
    ).toArray();
    const ids = new Set(docs.map(d => d.JobID));
    map.set(cfg.siteName, ids);
    console.log(`[${cfg.siteName}] ${ids.size} existing jobs.`);
  }));
  return map;
}

/**
 * Bulk-upsert jobs. Dedupes by JobID within the input batch.
 * Re-runs description cleaning + autoTags before saving.
 */
export async function saveJobs(rawJobs) {
  if (!Array.isArray(rawJobs) || rawJobs.length === 0) return 0;
  const jobs = await col(JOBS);

  const seen = new Set();
  const deduped = [];
  for (const j of rawJobs) {
    if (!j?.JobID || seen.has(j.JobID)) continue;
    seen.add(j.JobID);
    deduped.push(j);
  }
  if (deduped.length === 0) return 0;

  const ops = deduped.map(input => {
    const job = { ...input };

    if (job.Description) {
      // DescriptionCleaned is NOT stored. It is cleanJobDescription(Description)
      // and nothing more, so storing it meant a third copy of the same text:
      // measured on live data, the four description fields were 95% of a 19 KB
      // job document, and this one was 30% of it on its own. The single-job
      // endpoint cleans on read instead (api/seeker/seeker-jobs-routes.js) —
      // one document, once, where the formatted body is actually rendered.
      // Description stays because it is the only copy that cannot be recomputed.
      job.DescriptionPlain = getPlainTextForTagging(job);
      const tags = generateJobTags(job);
      job.autoTags = tags;
      job.isEntryLevel = tags.isEntryLevel;
    }

    // Strip timestamps from $setOnInsert payload
    const { createdAt, updatedAt, scrapedAt, ...rest } = job;
    void createdAt; void updatedAt; void scrapedAt;

    const now = new Date();
    return {
      updateOne: {
        filter: { JobID: job.JobID },
        update: {
          $setOnInsert: {
            ...rest,
            createdAt: now,
            updatedAt: now,
            scrapedAt: now,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await jobs.bulkWrite(ops, { ordered: false });
  // New job pages → Bing/ChatGPT search right away (no-op without INDEXNOW_KEY).
  const newIds = Object.values(result.upsertedIds ?? {});
  if (newIds.length) notifyIndexNow(newIds.map((id) => `/jobs/${id}`));
  return (result.upsertedCount || 0) + (result.modifiedCount || 0);
}

/** Delete a single job by ObjectId. Throws if id is not a valid ObjectId. */
export async function deleteJobById(id) {
  const jobs = await col(JOBS);
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  return jobs.deleteOne({ _id: oid });
}

/**
 * Admin-only: insert a manually curated job. Throws if required fields are
 * missing or if the ApplicationURL already exists.
 */
export async function addCuratedJob(data) {
  if (!data.JobTitle || !data.ApplicationURL || !data.Company) {
    throw new Error('Job Title, URL, and Company are required.');
  }
  const jobs = await col(JOBS);
  const exists = await jobs.findOne({ ApplicationURL: data.ApplicationURL });
  if (exists) throw new Error('This Application URL already exists in the database.');

  const jobToSave = createJobModel({
    JobID: `curated-${Date.now()}`,
    JobTitle: data.JobTitle,
    ApplicationURL: data.ApplicationURL,
    Company: data.Company,
    Location: data.Location,
    Department: data.Department,
    Description: data.Description || `Manually curated: ${data.JobTitle}`,
    PostedDate: data.PostedDate || new Date().toISOString(),
    ContractType: data.ContractType,
    ExperienceLevel: data.ExperienceLevel,
    isManual: true,
    Status: 'active',
  }, 'Curated');

  await saveJobs([jobToSave]);
  return jobToSave;
}
