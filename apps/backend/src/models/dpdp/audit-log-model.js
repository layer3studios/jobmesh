// FILE: src/models/dpdp/audit-log-model.js
// audit_log collection — immutable, append-only (C7). This module deliberately
// exports NO update or delete function; appendAuditLog is the only writer. That
// omission is the enforcement mechanism for immutability.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const auditCol = () => col('audit_log');

/** How long an audit entry is retained. See the note in ensureAuditLogIndexes. */
const AUDIT_LOG_TTL_SECONDS = 2 * 365 * 24 * 60 * 60;

function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** Idempotent index setup. Called on boot. */
export async function ensureAuditLogIndexes() {
  const collection = await auditCol();
  await collection.createIndex({ actorId: 1, createdAt: -1 }, { name: 'audit_actor' });
  await collection.createIndex({ event: 1, createdAt: -1 }, { name: 'audit_event' });
  // No targetId index: targetId is written on every entry but no code path has ever
  // queried it. Add one back the day a "history for this record" view exists.

  // Retention: entries expire two years after they are written.
  //
  // READ THIS TOGETHER WITH THE HEADER. This module exports no update and no
  // delete precisely so that nothing in the application can rewrite history, and
  // that is unchanged — a TTL is a retention policy, not a mutation, and it can
  // only remove a whole entry once it is older than the window. The two ideas are
  // compatible: entries are immutable FOR AS LONG AS THEY ARE KEPT.
  //
  // But it does mean deletion now happens without an application code path, so
  // the window is the compliance decision. Two years is the assumption here; if
  // DPDP evidence for this deployment must outlive that, raise
  // AUDIT_LOG_TTL_SECONDS or drop this index, because once an entry expires there
  // is no second copy to recover it from.
  await collection.createIndex(
    { createdAt: 1 },
    { name: 'audit_log_ttl', expireAfterSeconds: AUDIT_LOG_TTL_SECONDS },
  );
}

/** The ONLY exported writer. Insert-only; no updatedAt (records never change). */
export async function appendAuditLog(entry) {
  const collection = await auditCol();
  const doc = {
    event: entry.event,
    actorType: entry.actorType,
    actorId: toOid(entry.actorId),
    targetType: entry.targetType ?? null,
    targetId: toOid(entry.targetId),
    purpose: entry.purpose ?? null,
    metadata: entry.metadata ?? {},
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
    createdAt: new Date(),
  };
  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/** Most-recent audit entries for an actor. */
export async function listAuditForActor(actorId, { limit = 50 } = {}) {
  const oid = toOid(actorId);
  if (!oid) return [];
  const collection = await auditCol();
  return collection.find({ actorId: oid }).sort({ createdAt: -1 }).limit(limit).toArray();
}

/** Most-recent audit entries of a given event type. */
export async function listAuditByEvent(event, { limit = 50 } = {}) {
  const collection = await auditCol();
  return collection.find({ event }).sort({ createdAt: -1 }).limit(limit).toArray();
}
