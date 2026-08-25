// FILE: src/models/seeker/seeker-user-shared-helpers.js
// Internal helpers shared across user/* modules. Not re-exported from the barrel.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

/**
 * Hard cap on every per-user list that grows by one entry per interaction:
 * appliedJobs, comeBackTo, dismissedJobs.
 *
 * These live INSIDE the user document, so they are not merely large — they are
 * large in a document that every authenticated request loads. Uncapped, a heavy
 * user walks the 16MB document ceiling and slows down every read they make along
 * the way. `$slice: -SEEKER_LIST_MAX` keeps the newest entries and drops the tail
 * on write.
 *
 * WHAT THE CAP COSTS. `appliedJobs` is what marks a job as already-applied in the
 * feed, so past entry 500 the oldest applications stop being flagged. `appliedCount`
 * is a separate $inc counter and stays a true lifetime total — it is deliberately
 * NOT the array length, and removeAppliedJob can no longer decrement it for an
 * entry that has already aged out.
 */
export const SEEKER_LIST_MAX = 500;

/** Returns true if id is a non-empty string and valid ObjectId. */
export function isValidId(id) {
  return typeof id === 'string' && id.length > 0 && ObjectId.isValid(id);
}

/**
 * Convert an id to ObjectId. Returns null if invalid. Accepts an ObjectId
 * unchanged: callers that already hold a document's _id (rather than the hex
 * string an HTTP layer produced) would otherwise get a silent null and a write
 * that matches nothing.
 */
export function toOid(id) {
  if (id instanceof ObjectId) return id;
  return isValidId(id) ? new ObjectId(id) : null;
}

/** Get the users collection. */
export const usersCol = () => col('users');

/**
 * Normalise the legacy appliedJobs array.
 * Old format stored bare strings; new format stores rich entries.
 */
export function normaliseApplied(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(entry => {
    if (typeof entry === 'string') {
      return {
        jobId: entry,
        appliedAt: new Date(0),
        jobTitle: null, company: null, applicationURL: null,
        location: null, department: null,
        stage: 'applied', stageUpdatedAt: new Date(0),
      };
    }
    return {
      jobId: entry.jobId,
      appliedAt: entry.appliedAt || new Date(0),
      jobTitle: entry.jobTitle || null,
      company: entry.company || null,
      applicationURL: entry.applicationURL || null,
      location: entry.location || null,
      department: entry.department || null,
      stage: entry.stage || 'applied',
      stageUpdatedAt: entry.stageUpdatedAt || entry.appliedAt || new Date(0),
    };
  });
}

export const VALID_STAGES = [
  'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'ghosted',
];
