// FILE: src/tasks/drop-unused-indexes.js
// Drops the indexes the performance audit found to be redundant or unread. Run
// directly, once per environment:
//
//   node src/tasks/drop-unused-indexes.js
//
// The model files no longer CREATE these, so a fresh database never grows them.
// This exists only for databases that already have them: removing a createIndex
// call does not remove the index that a previous boot built.
//
// MATCHED BY KEY SHAPE, NOT BY NAME. Some of these were created with an explicit
// name and some were left to MongoDB's auto-naming ({ ATSPlatform: 1 } became
// "ATSPlatform_1", not "jobs_ATSPlatform"), so hard-coding names would silently
// no-op on exactly the indexes most likely to still be there. The key pattern is
// what actually identifies an index.
//
// IDEMPOTENT AND NON-DESTRUCTIVE TO DATA. An index that is already gone is
// reported as 'absent' and skipped. Nothing here touches a document, and every
// index dropped is rebuildable from this file's own key list.

import { col, closeDb } from '../Db/connection.js';

/**
 * Every index to remove, with WHY — a reader a year from now needs to know
 * whether re-adding one is a mistake or a fix.
 */
export const INDEXES_TO_DROP = [
  // --- Strict prefixes of an existing compound index: no read they can serve
  //     that the longer index does not already serve, at full write cost.
  { collection: 'applications', key: { companyId: 1, jobId: 1 },
    supersededBy: 'applications_companyId_jobId_appliedAt' },
  { collection: 'interviewer_availability', key: { companyId: 1, employerUserId: 1 },
    supersededBy: 'interviewer_availability_companyId_employerUserId_dayOfWeek' },
  { collection: 'referral_links', key: { companyId: 1, postingId: 1 },
    supersededBy: 'referral_links_companyId_postingId_employerUserId' },
  { collection: 'employer_access', key: { kind: 1 },
    supersededBy: 'employer_access_kind_email' },

  // --- No query reads these fields at all.
  // NOTE THE SINGULAR. The collection is `audit_log`; an earlier version of this
  // list said `audit_logs`, which matches nothing and reported a clean "absent"
  // while leaving the index in place.
  { collection: 'audit_log', key: { targetId: 1, createdAt: -1 },
    supersededBy: 'nothing — targetId is written, never queried' },
  { collection: 'jobs', key: { ATSPlatform: 1 },
    supersededBy: 'nothing — never filtered on' },
  { collection: 'jobs', key: { scrapedAt: 1 },
    supersededBy: 'nothing — only ever a secondary sort key' },
  { collection: 'recommendation_cache', key: { companyId: 1 },
    supersededBy: 'recommendation_cache_posting_seeker / _posting_rank' },
  { collection: 'assignment_reviews', key: { companyId: 1 },
    supersededBy: 'assignment_reviews_assignmentSubmissionId' },
];

const sameKey = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Drop every index in INDEXES_TO_DROP. Returns one result row per entry so a
 * caller or a test can assert on the outcome instead of parsing logs.
 */
export async function dropUnusedIndexes({ dryRun = false } = {}) {
  const results = [];
  for (const entry of INDEXES_TO_DROP) {
    const label = `${entry.collection} ${JSON.stringify(entry.key)}`;
    try {
      const collection = await col(entry.collection);
      // A collection that does not exist yet lists nothing rather than throwing.
      const existing = await collection.indexes().catch(() => []);
      const match = existing.find((index) => sameKey(index.key, entry.key));

      if (!match) {
        results.push({ ...entry, status: 'absent' });
        console.log(`  · absent   ${label}`);
        continue;
      }
      // Never drop the _id index, whatever a future edit to the list says.
      if (match.name === '_id_') {
        results.push({ ...entry, status: 'refused', name: match.name });
        console.warn(`  ! refused  ${label} — will not drop _id`);
        continue;
      }
      if (dryRun) {
        results.push({ ...entry, status: 'would-drop', name: match.name });
        console.log(`  · would drop ${match.name} on ${entry.collection}`);
        continue;
      }
      await collection.dropIndex(match.name);
      results.push({ ...entry, status: 'dropped', name: match.name });
      console.log(`  ✓ dropped  ${match.name} on ${entry.collection}`);
    } catch (error) {
      // One unhappy collection must not stop the other eight.
      results.push({ ...entry, status: 'error', error: error.message });
      console.warn(`  ✗ failed   ${label}: ${error.message}`);
    }
  }
  return results;
}

/**
 * Only when executed directly, never on import — matches the other tasks so a test
 * can pull dropUnusedIndexes in without the process exiting underneath it.
 * `--dry-run` reports what would go without changing anything.
 */
const isDirectRun = process.argv[1] && process.argv[1].endsWith('drop-unused-indexes.js');
if (isDirectRun) {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`[drop-unused-indexes] ${dryRun ? 'DRY RUN — nothing will change' : 'dropping'}…`);
  dropUnusedIndexes({ dryRun })
    .then(async (results) => {
      const tally = {};
      for (const row of results) tally[row.status] = (tally[row.status] ?? 0) + 1;
      console.log('[drop-unused-indexes]', JSON.stringify(tally));
      await closeDb();
      process.exit(results.some((row) => row.status === 'error') ? 1 : 0);
    })
    .catch(async (err) => {
      console.error(`[drop-unused-indexes] failed: ${err.message}`);
      await closeDb().catch(() => {});
      process.exit(1);
    });
}
