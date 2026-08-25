// FILE: src/models/public/application-indexes.js
// Index setup for the applications collection. Split out of application-model.js
// (naming conventions section 2) once the tenant-wide feed indexes landed: this
// file changes when a QUERY SHAPE changes, while the model beside it changes when
// the document shape does.

import { applicationsCol } from './application-collection.js';

/** Idempotent index setup. Called on boot. */
export async function ensureApplicationIndexes() {
  const collection = await applicationsCol();
  // NOTE: { companyId, jobId } is deliberately absent — it is a strict prefix of
  // applications_companyId_jobId_appliedAt below, so it served no read and only
  // cost writes. tasks/drop-unused-indexes.js removes it from live databases.
  await collection.createIndex({ contactId: 1 }, { name: 'applications_contactId' });
  await collection.createIndex({ stageId: 1 }, { name: 'applications_stageId' });
  await collection.createIndex({ companyId: 1, jobId: 1, appliedAt: -1 }, { name: 'applications_companyId_jobId_appliedAt' });

  // The company-wide feeds. Both sort across EVERY application in the tenant with
  // no jobId to pin, so the compound above cannot help them: its second key is
  // jobId, and an index cannot skip a key and still deliver sorted order. Without
  // these the feed did a blocking in-memory sort of the whole company.
  await collection.createIndex(
    { companyId: 1, appliedAt: -1 },
    { name: 'applications_companyId_appliedAt' },
  );
  await collection.createIndex(
    { companyId: 1, lastStageMovedAt: -1 },
    { name: 'applications_companyId_lastStageMovedAt' },
  );

  // "Needs attention": equality on companyId + archived, then lastStageMovedAt
  // carrying BOTH the range predicate and the sort (ESR — equality, sort, range;
  // here the sort and the range are the same key, which is the ideal case).
  //
  // stageId is deliberately NOT in this index. The stale query filters it with
  // $nin, which cannot seek, and putting a non-seekable key ahead of
  // lastStageMovedAt would forfeit the index-ordered sort to save nothing.
  await collection.createIndex(
    { companyId: 1, archived: 1, lastStageMovedAt: 1 },
    { name: 'applications_companyId_archived_lastStageMovedAt' },
  );

  // One person's other applications at this company (applicant detail, duplicate
  // detection, the cross-applicant count on the ranked list).
  await collection.createIndex(
    { companyId: 1, contactId: 1, appliedAt: -1 },
    { name: 'applications_companyId_contactId_appliedAt' },
  );
  // Reverse lookup from a submission back to its application. Partial on the $type
  // so the explicit nulls most applications carry are never indexed (never sparse:
  // sparse skips MISSING fields, not explicit nulls).
  await collection.createIndex(
    { assignmentSubmissionId: 1 },
    {
      partialFilterExpression: { assignmentSubmissionId: { $type: 'objectId' } },
      name: 'applications_assignmentSubmissionId',
    },
  );
}
