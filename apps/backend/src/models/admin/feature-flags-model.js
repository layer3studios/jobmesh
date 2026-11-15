// FILE: src/models/admin/feature-flags-model.js
// feature_flags collection — a single config doc (_id: 'config'), mirroring
// employer-access-model's singleton pattern.
//
// FAIL-OPEN, and this is the whole design: a missing doc, a missing field or a
// database that will not answer all resolve to ENABLED. employer-access is
// default-DENY because it guards who may sign up; this guards whether the
// product runs at all, and an admin panel outage must never take the product
// down with it. Turning something off is always a deliberate, recorded act.

import { col } from '../../Db/connection.js';
import { appendAudit } from '../../services/dpdp/audit-log-service.js';
import { AUDIT_EVENTS } from '../dpdp/dpdp-constants.js';

const CONFIG_ID = 'config';

const flagsCol = () => col('feature_flags');

/** The known flags and their fail-open defaults. Unknown names are rejected. */
export const FEATURE_FLAGS = Object.freeze({
  scraperCronEnabled: true,
  jdExtractionEnabled: true,
  aiScoringEnabled: true,
  publicApplyEnabled: true,
  // The one flag that fails CLOSED, deliberately. The others guard machinery
  // that is already live, so a database hiccup must not switch it off. This
  // one guards a side of the product that has not launched: the hire surface
  // is written and working, and stays hidden until someone turns it on here.
  // Failing open would mean an admin-panel outage launches it by accident.
  employerSideEnabled: false,
});

/** Flags that stay off when nobody has said otherwise. */
const FAIL_CLOSED = Object.freeze(new Set(['employerSideEnabled']));

export const FEATURE_FLAG_NAMES = Object.freeze(Object.keys(FEATURE_FLAGS));

export const isKnownFlag = (name) => Object.hasOwn(FEATURE_FLAGS, name);

/** Every flag with its default, for a missing doc or a failed read. */
export const defaultFlags = () => ({ ...FEATURE_FLAGS });

/**
 * Read every flag. Only an explicit `false` disables anything: a field that is
 * absent, null or malformed reads as its default.
 */
export async function getFeatureFlags() {
  const collection = await flagsCol();
  const doc = await collection.findOne({ _id: CONFIG_ID });
  const flags = defaultFlags();
  if (!doc) return { flags, updatedAt: null, updatedByAdminUserId: null };
  for (const name of FEATURE_FLAG_NAMES) {
    // Fail-open flags: only an explicit false turns them off.
    // Fail-closed flags: only an explicit true turns them on.
    if (FAIL_CLOSED.has(name)) flags[name] = doc[name] === true;
    else if (doc[name] === false) flags[name] = false;
  }
  return {
    flags,
    updatedAt: doc.updatedAt ?? null,
    updatedByAdminUserId: doc.updatedByAdminUserId ? doc.updatedByAdminUserId.toString() : null,
  };
}

/**
 * Read ONE flag for a runtime gate. Never throws: a database error logs a
 * warning and reports enabled, so a flag lookup can never be the thing that
 * breaks the feature it guards.
 */
export async function isFeatureEnabled(name) {
  if (!isKnownFlag(name)) return true;
  const failClosed = FAIL_CLOSED.has(name);
  try {
    const collection = await flagsCol();
    const doc = await collection.findOne({ _id: CONFIG_ID }, { projection: { [name]: 1 } });
    return failClosed ? doc?.[name] === true : doc?.[name] !== false;
  } catch (err) {
    const fallback = !failClosed;
    console.warn(`[feature-flags] read failed for ${name}, failing ${fallback ? 'open' : 'closed'}: ${err.message}`);
    return fallback;
  }
}

/**
 * Set one flag and record who did it. Returns the full post-write flag set.
 * The audit entry is awaited: an unrecorded change to what the platform runs
 * is worse than a slow request.
 */
export async function setFeatureFlag(name, value, adminUserId) {
  if (!isKnownFlag(name)) return { ok: false, reason: 'unknown_flag' };
  if (typeof value !== 'boolean') return { ok: false, reason: 'invalid_value' };

  const before = await getFeatureFlags();
  const oldValue = before.flags[name];

  const collection = await flagsCol();
  const now = new Date();
  await collection.updateOne(
    { _id: CONFIG_ID },
    { $set: { [name]: value, updatedAt: now, updatedByAdminUserId: adminUserId ?? null } },
    { upsert: true },
  );

  await appendAudit({
    event: AUDIT_EVENTS.FEATURE_FLAG_CHANGED,
    actorType: 'admin', actorId: adminUserId ?? null,
    targetType: 'feature_flag', targetId: null,
    metadata: { flag: name, oldValue, newValue: value },
  });

  const after = await getFeatureFlags();
  return { ok: true, ...after };
}

export default getFeatureFlags;
