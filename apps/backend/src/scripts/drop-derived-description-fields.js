// FILE: src/scripts/drop-derived-description-fields.js
// One-off backfill: remove the two stored description copies that are not
// information.
//
//   usage:  node src/scripts/drop-derived-description-fields.js [--dry-run]
//
// WHY. Measured on live data (9,054 active jobs), a job document averaged
// 19.05 KB and 95% of it was the SAME description held four times over:
//
//   Description         6.76 KB  35%   raw ATS HTML — the only unrecoverable copy
//   DescriptionCleaned  5.67 KB  30%   = cleanJobDescription(Description)
//   DescriptionPlain    4.46 KB  23%   plain text, shipped with the feed for
//                                      client-side skill matching
//   DescriptionLists    1.35 KB   7%   written by the Lever mapper; read by nothing
//
// DescriptionCleaned is now derived on read in the single-job endpoint, and
// DescriptionLists is gone from the mappers and the model. This drops both from
// the documents already written, which is where the 37% actually gets reclaimed:
// Mongo does not shrink a document until it is rewritten.
//
// Jobs are 95% of the whole database, so this is also what makes the move to
// more countries fit: ~12 KB/job instead of ~19 means 20,000 jobs is about
// 88 MB of the 512 MB free tier rather than 140 MB.
//
// Safe to re-run. Nothing here touches Description or DescriptionPlain.

import { col, closeDb } from '../Db/connection.js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH = 2000;

async function main() {
  const jobs = await col('jobs');

  const filter = {
    $or: [
      { DescriptionCleaned: { $exists: true } },
      { DescriptionLists: { $exists: true } },
    ],
  };

  const affected = await jobs.countDocuments(filter);
  const total = await jobs.countDocuments({});
  console.log(`[drop-derived] ${affected} of ${total} job documents carry a derived field.`);

  if (affected === 0) {
    console.log('[drop-derived] nothing to do.');
    return;
  }

  // Report the reclaimable bytes before changing anything, so a dry run is
  // genuinely informative rather than just a count.
  const sample = await jobs.find(filter, {
    projection: { DescriptionCleaned: 1, DescriptionLists: 1 },
    limit: 400,
  }).toArray();
  let bytes = 0;
  for (const doc of sample) {
    bytes += Buffer.byteLength(doc.DescriptionCleaned ?? '', 'utf8');
    bytes += Buffer.byteLength(JSON.stringify(doc.DescriptionLists ?? ''), 'utf8');
  }
  const perDocKB = bytes / sample.length / 1024;
  console.log(`[drop-derived] ~${perDocKB.toFixed(2)} KB per document, ~${((perDocKB * affected) / 1024).toFixed(1)} MB total.`);

  if (DRY_RUN) {
    console.log('[drop-derived] --dry-run: no writes made.');
    return;
  }

  // Batched rather than one updateMany: on a shared-tier cluster a single
  // multi-megabyte rewrite of every job is the kind of operation that gets
  // throttled halfway through, and a batched loop is restartable.
  let done = 0;
  for (;;) {
    const ids = (await jobs.find(filter, { projection: { _id: 1 }, limit: BATCH }).toArray()).map((d) => d._id);
    if (ids.length === 0) break;
    const res = await jobs.updateMany(
      { _id: { $in: ids } },
      { $unset: { DescriptionCleaned: '', DescriptionLists: '' } },
    );
    done += res.modifiedCount;
    console.log(`[drop-derived] ${done}/${affected}`);
    if (res.modifiedCount === 0) break; // nothing matched — avoid spinning
  }

  console.log(`[drop-derived] done: ${done} documents rewritten.`);
  console.log('[drop-derived] NOTE: storageSize is reclaimed lazily by WiredTiger.');
  console.log('[drop-derived] Run compact, or resync, only if you need the space returned immediately.');
}

main()
  .catch((err) => {
    console.error('[drop-derived] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb().catch(() => {});
  });
