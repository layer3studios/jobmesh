// FILE: src/models/employer/interviewer-availability-model.js
// interviewer_availability collection — a teammate's recurring weekly interview
// windows ("Mon–Fri 10:00–17:00 IST"). One row per (company, user, weekday).
//
// THIS DOES NOT REPLACE interview_times. Those are explicit, per-posting, bookable
// datetimes and remain the only thing a candidate can book. Availability is a
// statement of intent that the employer turns INTO those times, via
// suggestSlotsFromAvailability. Keeping the two separate is what lets someone edit
// their weekly hours without silently retracting slots already sent to candidates.
//
// Times are stored as local "HH:mm" plus an IANA zone, never as UTC instants. A
// recurring window is a wall-clock fact — "I interview at 10am" stays 10am across a
// DST change — and storing a UTC offset would quietly shift it twice a year.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';

const availabilityCol = () => col('interviewer_availability');

/** 0 = Sunday, matching JavaScript's Date.getDay() and luxon's weekday % 7. */
export const DAYS_IN_WEEK = 7;

/** Accept a string or ObjectId; return an ObjectId or null. */
function toOid(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  return null;
}

/** Idempotent index setup. Called on boot. */
export async function ensureInterviewerAvailabilityIndexes() {
  const collection = await availabilityCol();
  await collection.createIndex(
    { companyId: 1, employerUserId: 1, dayOfWeek: 1 },
    { unique: true, name: 'interviewer_availability_companyId_employerUserId_dayOfWeek' },
  );
  // { companyId, employerUserId } is not created: it is a strict prefix of the
  // unique index above and served no read of its own.
}

/** "09:30" → 570. Returns null for anything that is not a real HH:mm. */
export function minutesFromTimeString(value) {
  if (typeof value !== 'string') return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 570 → "09:30". The inverse of minutesFromTimeString. */
export function timeStringFromMinutes(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Every row for one teammate, ordered Sunday → Saturday. Company-scoped (§6.5). */
export async function listAvailabilityForUser(companyId, employerUserId) {
  const companyOid = toOid(companyId);
  const userOid = toOid(employerUserId);
  if (!companyOid || !userOid) return [];
  const collection = await availabilityCol();
  return collection
    .find({ companyId: companyOid, employerUserId: userOid })
    .sort({ dayOfWeek: 1 })
    .toArray();
}

/**
 * Replace a teammate's ENTIRE weekly schedule.
 *
 * Delete-then-insert rather than a per-day upsert: the editor always sends the full
 * week, so a day absent from the payload means "I am not available then". An upsert
 * would leave that day's old row behind, and someone clearing Saturday would find
 * it still there. Both writes are scoped to (company, user), so one teammate's save
 * can never touch another's.
 *
 * `entries` must already be validated — this is the storage layer.
 */
export async function replaceAvailabilityForUser(companyId, employerUserId, entries) {
  const companyOid = toOid(companyId);
  const userOid = toOid(employerUserId);
  if (!companyOid || !userOid) throw new Error('replaceAvailabilityForUser: invalid ids');

  const collection = await availabilityCol();
  const scope = { companyId: companyOid, employerUserId: userOid };
  await collection.deleteMany(scope);

  if (entries.length === 0) return [];
  const now = new Date();
  const docs = entries.map((entry) => ({
    ...scope,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    timezone: entry.timezone,
    isActive: entry.isActive !== false,
    createdAt: now,
    updatedAt: now,
  }));
  await collection.insertMany(docs);
  return docs;
}

/** Client-safe projection — no ids, since a row is only ever read by its owner. */
export function toPublicAvailability(doc) {
  return {
    dayOfWeek: doc.dayOfWeek,
    startTime: doc.startTime,
    endTime: doc.endTime,
    timezone: doc.timezone,
    isActive: doc.isActive !== false,
  };
}
