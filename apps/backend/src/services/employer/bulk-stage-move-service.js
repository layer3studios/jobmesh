// FILE: src/services/employer/bulk-stage-move-service.js
// Move up to 50 applications to one target stage. NO transaction on purpose —
// standalone MongoDB has none, and per-item independence is the contract: a
// failure on item 3 never rolls back items 1 and 2.
//
// BATCHED, NOT LOOPED. This called moveApplicantToStage per item, which is four
// queries each — 200 round trips for a 50-item move. It now runs three: one read
// for the batch, one insertMany of the audit rows, one bulkWrite of the moves.
//
// The guards moveApplicantToStage owned are reproduced here deliberately and in
// the same order — company ownership (a cross-tenant id reads as not-found), the
// archived freeze, and the already-in-stage no-op — because they are the contract
// this endpoint is judged on, not an implementation detail of the single path.
// applicant-move-service remains the single-move entry point; the two must be kept
// in step, and bulk-stage-move-service.test.js asserts the shared behaviour.

import { ObjectId } from 'mongodb';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { col } from '../../Db/connection.js';
import { getStageForCompany } from '../../models/employer/stage-model.js';

const BULK_MOVE_MAX_SIZE = 50;

export const BULK_MOVE_ERROR_CODES = {
  BULK_EMPTY: 'BULK_EMPTY',
  BULK_LIMIT_EXCEEDED: 'BULK_LIMIT_EXCEEDED',
  STAGE_NOT_FOUND: 'STAGE_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

const toOid = (id) => {
  if (id instanceof ObjectId) return id;
  return typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : null;
};

/** The batch's applications, company-scoped. Malformed ids are dropped, not thrown. */
async function loadApplications(companyId, ids) {
  const oids = ids.map(toOid).filter(Boolean);
  if (oids.length === 0) return [];
  const collection = await col('applications');
  return collection.find({ _id: { $in: oids }, companyId: toOid(companyId) }).toArray();
}

async function insertStageChanges(docs) {
  await (await col('stage_changes')).insertMany(docs, { ordered: false });
}

async function applyStageUpdates(operations) {
  await (await col('applications')).bulkWrite(operations, { ordered: false });
}

/** Returns { moved, failed, failures: [{ applicationId, reason }] }. */
export async function bulkMoveStage(companyId, { applicationIds, targetStageId, actorUserId } = {}) {
  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    throw new HttpError(400, 'applicationIds is required and must be non-empty', BULK_MOVE_ERROR_CODES.BULK_EMPTY);
  }
  if (applicationIds.length > BULK_MOVE_MAX_SIZE) {
    throw new HttpError(400, 'Too many applications in one request', BULK_MOVE_ERROR_CODES.BULK_LIMIT_EXCEEDED);
  }
  // Validate the target once — it's the same for every item, and a cross-tenant
  // stageId must fail the whole request, never be silently applied.
  const stage = await getStageForCompany(companyId, targetStageId);
  if (!stage) throw new HttpError(400, 'Stage not found', BULK_MOVE_ERROR_CODES.STAGE_NOT_FOUND);

  const uniqueIds = [...new Set(applicationIds.map(String))];
  const failures = [];

  // ONE read for the whole batch, companyId-scoped in the FILTER — the tenant
  // boundary is enforced by the query, exactly as the per-item path enforced it,
  // and re-asserted per document below. An id belonging to another company simply
  // is not in the result, so it fails as not-found and never reveals it exists.
  const applications = await loadApplications(companyId, uniqueIds);
  const byId = new Map(applications.map((doc) => [doc._id.toString(), doc]));

  const now = new Date();
  const stageChanges = [];
  const updates = [];
  let moved = 0;

  for (const id of uniqueIds) {
    const application = byId.get(id);
    if (!application) {
      failures.push({ applicationId: id, reason: 'APPLICATION_NOT_FOUND' });
      continue;
    }
    // Defence in depth: the query already scoped on companyId (C6).
    if (application.companyId?.toString() !== String(companyId)) {
      failures.push({ applicationId: id, reason: 'APPLICATION_NOT_FOUND' });
      continue;
    }
    if (application.archived) {
      failures.push({ applicationId: id, reason: 'CANNOT_MOVE_ARCHIVED' });
      continue;
    }
    // Already there: counted as moved and writes nothing, matching the single-move
    // path, which returns success with a null stageChange.
    if (application.stageId?.toString() === stage._id.toString()) {
      moved += 1;
      continue;
    }
    stageChanges.push({
      applicationId: application._id,
      fromStageId: application.stageId ?? null,
      toStageId: stage._id,
      movedByUserId: actorUserId ?? null,
      note: null,
      movedAt: now,
    });
    updates.push({
      updateOne: {
        filter: { _id: application._id, companyId: application.companyId },
        update: { $set: { stageId: stage._id, lastStageMovedAt: now, updatedAt: now } },
      },
    });
    moved += 1;
  }

  if (stageChanges.length > 0) {
    // Audit rows FIRST, then the moves — the same order as the single-move path, so
    // an interrupted bulk leaves an audit row with no move rather than a move that
    // nothing recorded. ordered:false keeps one bad row from stopping the rest.
    await insertStageChanges(stageChanges);
    await applyStageUpdates(updates);
  }

  return { moved, failed: failures.length, failures };
}
