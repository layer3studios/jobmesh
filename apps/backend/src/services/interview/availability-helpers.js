// FILE: src/services/interview/availability-helpers.js
// Turns a teammate's recurring weekly availability into concrete candidate slots
// for a date range, minus anything that collides with an interview they are
// already on.
//
// SUGGESTS ONLY. Nothing here writes an interview_time. The employer reviews the
// list and confirms which slots to publish, because a recurring window is a
// statement of intent and a bookable slot is a promise to a candidate — turning
// the first into the second automatically would publish hours nobody re-read.
//
// Every calculation runs in the interviewer's own zone via luxon. Building slots
// in UTC and converting afterwards is the classic DST bug: on a transition day the
// window would land an hour early or late, exactly when someone is least likely to
// notice.

import { DateTime } from 'luxon';
import { col } from '../../Db/connection.js';
import { ObjectId } from 'mongodb';
import {
  listAvailabilityForUser, minutesFromTimeString,
} from '../../models/employer/interviewer-availability-model.js';
import { DEFAULT_TIMEZONE } from '../../models/employer/employer-user-profile-model.js';
import { INTERVIEW_STATUSES } from '../../models/interview/interview-constants.js';

/** A range wider than this is a mistake, and would generate thousands of slots. */
export const MAXIMUM_SUGGESTION_DAYS = 60;

const MILLISECONDS_PER_MINUTE = 60 * 1000;

/**
 * Interviews this person is already committed to inside the window.
 *
 * Reads `interviews`, not a bookings table: this codebase has no interview_bookings
 * collection — a scheduled interview IS the booking, and it carries the interviewer
 * list on interviewerEmployerUserIds. PROPOSED interviews count too: the candidate
 * has been offered those times and may accept at any moment, so offering them again
 * elsewhere would be double-booking with extra steps.
 */
async function loadBusyIntervals(companyId, employerUserId, rangeStart, rangeEnd) {
  const interviews = await col('interviews');
  const rows = await interviews.find({
    companyId: new ObjectId(String(companyId)),
    interviewerEmployerUserIds: new ObjectId(String(employerUserId)),
    status: { $in: [INTERVIEW_STATUSES.SCHEDULED, INTERVIEW_STATUSES.PROPOSED] },
  }).toArray();

  const busy = [];
  for (const row of rows) {
    // A scheduled interview has one confirmed startAtUtc; a proposed one has none
    // yet, so every slot it offered has to be treated as taken.
    const starts = row.startAtUtc
      ? [row.startAtUtc]
      : (row.proposedSlots ?? []).map((slot) => slot.startAtUtc).filter(Boolean);
    for (const start of starts) {
      const startMs = new Date(start).getTime();
      if (Number.isNaN(startMs)) continue;
      const endMs = startMs + (row.durationMinutes ?? 30) * MILLISECONDS_PER_MINUTE;
      if (endMs <= rangeStart.getTime() || startMs >= rangeEnd.getTime()) continue;
      busy.push({ startMs, endMs });
    }
  }
  return busy;
}

/** Half-open overlap: a slot ending exactly when another starts is not a clash. */
const overlaps = (slotStartMs, slotEndMs, busy) =>
  busy.some((interval) => slotStartMs < interval.endMs && slotEndMs > interval.startMs);

/**
 * Concrete slots from a teammate's weekly availability.
 *
 * @returns {{ slots: string[], skippedCount: number, timezone: string }}
 *   `slots` are ISO UTC instants; `skippedCount` is how many fell away to existing
 *   commitments, so the UI can say "3 slots skipped" instead of silently showing
 *   fewer than the person's hours imply.
 */
export async function suggestSlotsFromAvailability(
  companyId, employerUserId, dateRangeStart, dateRangeEnd, durationMinutes,
) {
  const rows = (await listAvailabilityForUser(companyId, employerUserId))
    .filter((row) => row.isActive !== false);
  const timezone = rows[0]?.timezone || DEFAULT_TIMEZONE;
  if (rows.length === 0) return { slots: [], skippedCount: 0, timezone };

  const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : 30;
  const rangeStart = new Date(dateRangeStart);
  const rangeEnd = new Date(dateRangeEnd);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime()) || rangeEnd <= rangeStart) {
    return { slots: [], skippedCount: 0, timezone };
  }

  const windowByDay = new Map(rows.map((row) => [row.dayOfWeek, row]));
  const busy = await loadBusyIntervals(companyId, employerUserId, rangeStart, rangeEnd);
  const nowMs = Date.now();

  const slots = [];
  let skippedCount = 0;

  // Walk calendar DAYS in the interviewer's zone, not 24-hour ticks: a DST day is
  // 23 or 25 hours long, and stepping by milliseconds would drift the window.
  let cursor = DateTime.fromJSDate(rangeStart, { zone: timezone }).startOf('day');
  const lastDay = DateTime.fromJSDate(rangeEnd, { zone: timezone }).startOf('day');
  for (let dayIndex = 0; dayIndex <= MAXIMUM_SUGGESTION_DAYS && cursor <= lastDay; dayIndex += 1) {
    // luxon: Monday=1 … Sunday=7. Ours: Sunday=0 … Saturday=6.
    const window = windowByDay.get(cursor.weekday % 7);
    if (!window) { cursor = cursor.plus({ days: 1 }); continue; }

    const startMinutes = minutesFromTimeString(window.startTime);
    const endMinutes = minutesFromTimeString(window.endTime);
    if (startMinutes == null || endMinutes == null) { cursor = cursor.plus({ days: 1 }); continue; }

    for (let offset = startMinutes; offset + duration <= endMinutes; offset += duration) {
      const slotStart = cursor.plus({ minutes: offset });
      const startMs = slotStart.toMillis();
      const endMs = startMs + duration * MILLISECONDS_PER_MINUTE;
      // Outside the asked-for range, or already in the past — neither is a clash,
      // so neither is reported as "skipped".
      if (startMs < Math.max(rangeStart.getTime(), nowMs) || endMs > rangeEnd.getTime()) continue;
      if (overlaps(startMs, endMs, busy)) { skippedCount += 1; continue; }
      slots.push(slotStart.toUTC().toISO());
    }
    cursor = cursor.plus({ days: 1 });
  }

  return { slots, skippedCount, timezone };
}
