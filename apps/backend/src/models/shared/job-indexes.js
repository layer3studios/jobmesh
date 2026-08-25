// FILE: src/models/shared/job-indexes.js
// Index setup for the shared `jobs` collection (scraped ATS rows AND native
// employer postings live here). Split out of job-model.js, which is the document
// factory: this file changes when a QUERY changes, that one when the SHAPE does.
//
// Every symbol here is re-exported from job-model.js, so existing imports of
// ensureJobIndexes / JOB_ID_UNIQUE_INDEX_* keep resolving unchanged.

import { col } from '../../Db/connection.js';

/**
 * Create an index, self-healing if an index with the same name already exists
 * with different options (e.g. leftover TTL from the old Mongoose schema).
 */
export async function safeCreateIndex(coll, keys, options = {}) {
  try {
    await coll.createIndex(keys, options);
  } catch (err) {
    if (err?.code === 85 || err?.codeName === 'IndexOptionsConflict') {
      // Find the conflicting index by key shape and drop it, then recreate.
      const indexes = await coll.indexes();
      const keyJson = JSON.stringify(keys);
      const conflict = indexes.find(i => JSON.stringify(i.key) === keyJson);
      if (conflict) {
        console.warn(`[indexes] dropping conflicting index ${conflict.name} on ${coll.collectionName}`);
        await coll.dropIndex(conflict.name);
        await coll.createIndex(keys, options);
        return;
      }
    }
    throw err;
  }
}

/**
 * Uniqueness on JobID applies to scraped jobs ONLY. The `jobs` collection is
 * shared with native postings, which carry no JobID — and MongoDB indexes a
 * missing field as null, so a plain unique index would permit exactly one
 * native posting collection-wide. The filter keys off `sourceSite` (required on
 * every scraped job, absent on every native posting) because
 * partialFilterExpression forbids $ne and $exists:false.
 */
/** The collection's single permitted text index (see ensureJobIndexes). */
export const JOBS_TEXT_INDEX_NAME = 'jobs_text_search';

export const JOB_ID_UNIQUE_INDEX_NAME = 'jobs_JobID_unique_scraped';
export const JOB_ID_UNIQUE_INDEX_OPTIONS = {
  unique: true,
  partialFilterExpression: { sourceSite: { $exists: true } },
  name: JOB_ID_UNIQUE_INDEX_NAME,
};

/** Idempotent index setup. Called from server boot. */
export async function ensureJobIndexes() {
  const jobs = await col('jobs');
  await safeCreateIndex(jobs, { JobID: 1 }, JOB_ID_UNIQUE_INDEX_OPTIONS);
  await safeCreateIndex(jobs, { Status: 1, PostedDate: -1 });
  await safeCreateIndex(jobs, { Status: 1, Company: 1 });
  await safeCreateIndex(jobs, { Status: 1, 'autoTags.roleCategory': 1 });
  await safeCreateIndex(jobs, { Status: 1, 'autoTags.experienceBand': 1 });
  await safeCreateIndex(jobs, { Status: 1, 'autoTags.techStack': 1 });
  await safeCreateIndex(jobs, { Status: 1, WorkplaceType: 1 });
  await safeCreateIndex(jobs, { Status: 1, SalaryMin: 1, SalaryMax: 1 });
  // scrapedAt and ATSPlatform carried indexes that nothing filtered on — scrapedAt
  // only ever appears as a SECONDARY sort key (unusable without a matching leading
  // key) and ATSPlatform is written but never queried.
  await safeCreateIndex(jobs, { sourceSite: 1, JobID: 1 });

  // Free-text search. The seeker feed matched five fields with an unanchored,
  // case-insensitive $regex, which no index can serve — every search was a full
  // scan of the largest collection we have.
  //
  // THE FIELD LIST IS NOT A CHOICE, IT IS THE OLD BEHAVIOUR. All five are exactly
  // what jobs-query-builder used to regex over; indexing only the obvious three
  // would have quietly stopped "React" from matching a job tagged React.
  //
  // Weights order the relevance score: a hit in the title outranks the company,
  // which outranks a tech tag, a department, and finally the location.
  //
  // Only ONE text index is permitted per collection, so this is the whole search
  // surface — adding a field later means dropping and rebuilding this index.
  await safeCreateIndex(
    jobs,
    {
      JobTitle: 'text',
      Company: 'text',
      'autoTags.techStack': 'text',
      Department: 'text',
      Location: 'text',
    },
    {
      name: JOBS_TEXT_INDEX_NAME,
      weights: {
        JobTitle: 10, Company: 5, 'autoTags.techStack': 4, Department: 3, Location: 2,
      },
    },
  );
}
