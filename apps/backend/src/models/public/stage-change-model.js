// FILE: src/models/public/stage-change-model.js
// stage_changes collection — append-only audit of application stage moves
// (SPEC §5.2). movedByUserId is null for system moves (e.g. the initial move
// into the default stage on apply, R6).

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const stageChangesCol = () => col('stage_changes');

/** How long a stage move is retained. See the warning in ensureStageChangeIndexes. */
const STAGE_CHANGE_TTL_SECONDS = 365 * 24 * 60 * 60;

function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** Idempotent index setup. Called on boot. */
export async function ensureStageChangeIndexes() {
  const collection = await stageChangesCol();
  await collection.createIndex({ applicationId: 1, movedAt: -1 }, { name: 'stage_changes_application_movedAt' });

  // Retention. Append-only and never pruned, this grows for the lifetime of every
  // tenant; it also backs the candidate timeline, so rows leaving is user-visible.
  //
  // THIS NUMBER IS A POLICY, NOT A TUNING KNOB. companies.retentionDays is
  // configurable from 30 to 3650 days (company-validators), and this TTL is fixed
  // at 365 — so a customer who set a longer retention loses stage history before
  // their own policy says they should. Raise STAGE_CHANGE_TTL_SECONDS to the 3650
  // ceiling, or drive it per-tenant with a sweep task, before anyone relies on a
  // retention above a year.
  await collection.createIndex(
    { movedAt: 1 },
    { name: 'stage_changes_ttl', expireAfterSeconds: STAGE_CHANGE_TTL_SECONDS },
  );
}

/**
 * Record a stage move. fromStageId null = initial placement. Takes an optional
 * { session } so the apply transaction can enrol this write; every existing caller
 * passes nothing and is unaffected (col() binds no session, so an op without one
 * would silently commit outside the transaction).
 */
export async function createStageChange(data, { session } = {}) {
  const collection = await stageChangesCol();
  const doc = {
    applicationId: toOid(data.applicationId),
    fromStageId: toOid(data.fromStageId),
    toStageId: toOid(data.toStageId),
    movedByUserId: toOid(data.movedByUserId),
    movedAt: data.movedAt ?? new Date(),
    note: data.note ?? null,
  };
  const result = await collection.insertOne(doc, { session });
  return { ...doc, _id: result.insertedId };
}

/** List an application's stage moves, newest first. */
export async function listStageChangesForApplication(applicationId) {
  const oid = toOid(applicationId);
  if (!oid) return [];
  const collection = await stageChangesCol();
  return collection.find({ applicationId: oid }).sort({ movedAt: -1 }).toArray();
}
