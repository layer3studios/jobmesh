// FILE: src/scripts/backfill-shuffle-key.js
// Gives every existing job the shuffleKey the feed now sorts by.
//
//   usage:  node src/scripts/backfill-shuffle-key.js [--dry-run]
//
// New jobs get one at insert (Db/jobs/crud.js). Jobs written before that
// change have none, and a missing key sorts FIRST in an ascending sort — so
// without this backfill every pre-existing job would clump at the top of the
// feed in arbitrary order, which is the opposite of what the shuffle is for.
//
// Must run AFTER the code that creates the index, and the index matters: the
// feed sorts on { shuffleKey: 1, _id: 1 } on every request, and without it
// Mongo would sort the whole filtered set in memory on a shared-tier cluster.
//
// Safe to re-run: it only touches documents that have no key yet, so running
// it twice does not reshuffle a board people are already paging through.

import { col, closeDb } from '../Db/connection.js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH = 1000;

async function main() {
  const jobs = await col('jobs');
  const filter = { shuffleKey: { $exists: false } };

  const missing = await jobs.countDocuments(filter);
  const total = await jobs.countDocuments({});
  console.log(`[shuffle] ${missing} of ${total} jobs have no shuffleKey.`);

  if (missing === 0) {
    console.log('[shuffle] nothing to do.');
    return;
  }
  if (DRY_RUN) {
    console.log('[shuffle] --dry-run: no writes made.');
    return;
  }

  // One random value per document, so a bulkWrite rather than updateMany:
  // updateMany would need $rand in an aggregation pipeline, and this stays
  // readable and restartable.
  let done = 0;
  for (;;) {
    const batch = await jobs.find(filter, { projection: { _id: 1 }, limit: BATCH }).toArray();
    if (batch.length === 0) break;
    const res = await jobs.bulkWrite(
      batch.map((doc) => ({
        updateOne: { filter: { _id: doc._id }, update: { $set: { shuffleKey: Math.random() } } },
      })),
      { ordered: false },
    );
    done += res.modifiedCount || 0;
    console.log(`[shuffle] ${done}/${missing}`);
    if (!res.modifiedCount) break; // nothing matched — avoid spinning
  }

  console.log(`[shuffle] done: ${done} jobs keyed.`);
}

main()
  .catch((err) => {
    console.error('[shuffle] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb().catch(() => {});
  });
