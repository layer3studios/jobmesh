// FILE: tests/services/availability-helpers.test.js
// Weekly availability: validation, storage, and slot suggestion (including the
// timezone/DST behaviour and the existing-interview filter).
import './../_helpers/test-db.js';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { dropCollections, closeTestDb } from '../_helpers/test-db.js';
import { col } from '../../src/Db/connection.js';
import {
  ensureInterviewerAvailabilityIndexes, replaceAvailabilityForUser, listAvailabilityForUser,
  minutesFromTimeString, timeStringFromMinutes, toPublicAvailability,
} from '../../src/models/employer/interviewer-availability-model.js';
import { validateWeeklyAvailability } from '../../src/services/employer/availability-validators.js';
import { suggestSlotsFromAvailability } from '../../src/services/interview/availability-helpers.js';

const IST = 'Asia/Kolkata';
const reset = async () => {
  await dropCollections('interviewer_availability', 'interviews');
  await ensureInterviewerAvailabilityIndexes();
};

before(reset);
beforeEach(reset);
after(async () => { await closeTestDb(); });

const throwsInvalid = (fn) => assert.throws(fn, (err) => err.code === 'INVALID_AVAILABILITY');
const weekday = (dayOfWeek, startTime = '10:00', endTime = '17:00') => ({ dayOfWeek, startTime, endTime });

// ── time helpers ─────────────────────────────────────────────────────────────
test('HH:mm parses to minutes and back, rejecting anything malformed', () => {
  assert.equal(minutesFromTimeString('09:30'), 570);
  assert.equal(minutesFromTimeString('00:00'), 0);
  assert.equal(minutesFromTimeString('23:59'), 1439);
  assert.equal(timeStringFromMinutes(570), '09:30');
  assert.equal(timeStringFromMinutes(0), '00:00');
  for (const bad of ['9:30', '24:00', '10:60', '', 'ten', null, 930]) {
    assert.equal(minutesFromTimeString(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
});

// ── validation ───────────────────────────────────────────────────────────────
test('an empty week is valid — that is how "Clear all" reaches the server', () => {
  assert.deepEqual(validateWeeklyAvailability([], IST), []);
  assert.deepEqual(validateWeeklyAvailability(null, IST), []);
});

test('entries are sorted Sunday → Saturday and stamped with the profile timezone', () => {
  const week = validateWeeklyAvailability([weekday(5), weekday(1), weekday(0)], IST);
  assert.deepEqual(week.map((entry) => entry.dayOfWeek), [0, 1, 5]);
  assert.ok(week.every((entry) => entry.timezone === IST));
});

test('the timezone comes from the profile, never from the request body', () => {
  const week = validateWeeklyAvailability([{ ...weekday(1), timezone: 'America/New_York' }], IST);
  assert.equal(week[0].timezone, IST);
});

test('end must be later than start by a real margin', () => {
  throwsInvalid(() => validateWeeklyAvailability([weekday(1, '17:00', '10:00')], IST));
  throwsInvalid(() => validateWeeklyAvailability([weekday(1, '10:00', '10:00')], IST));
  throwsInvalid(() => validateWeeklyAvailability([weekday(1, '10:00', '10:10')], IST));
  assert.equal(validateWeeklyAvailability([weekday(1, '10:00', '10:15')], IST).length, 1);
});

test('dayOfWeek must be 0–6, and each day may appear only once', () => {
  throwsInvalid(() => validateWeeklyAvailability([weekday(7)], IST));
  throwsInvalid(() => validateWeeklyAvailability([weekday(-1)], IST));
  throwsInvalid(() => validateWeeklyAvailability([weekday(1.5)], IST));
  throwsInvalid(() => validateWeeklyAvailability([weekday(1), weekday(1, '18:00', '19:00')], IST));
});

test('weekend availability is allowed — some companies interview on Saturdays', () => {
  const week = validateWeeklyAvailability([weekday(0), weekday(6)], IST);
  assert.deepEqual(week.map((entry) => entry.dayOfWeek), [0, 6]);
});

// ── storage ──────────────────────────────────────────────────────────────────
test('replace swaps the WHOLE week — a day left out is cleared, not kept', async () => {
  const companyId = new ObjectId();
  const userId = new ObjectId();
  await replaceAvailabilityForUser(companyId, userId, validateWeeklyAvailability(
    [weekday(1), weekday(2), weekday(6)], IST,
  ));
  assert.equal((await listAvailabilityForUser(companyId, userId)).length, 3);

  await replaceAvailabilityForUser(companyId, userId, validateWeeklyAvailability([weekday(1)], IST));
  const rows = await listAvailabilityForUser(companyId, userId);
  assert.deepEqual(rows.map((row) => row.dayOfWeek), [1], 'Tue and Sat must be gone');
});

test('availability is per teammate and per tenant', async () => {
  const companyId = new ObjectId();
  const alice = new ObjectId();
  const bob = new ObjectId();
  await replaceAvailabilityForUser(companyId, alice, validateWeeklyAvailability([weekday(1)], IST));
  await replaceAvailabilityForUser(companyId, bob, validateWeeklyAvailability([weekday(2), weekday(3)], IST));

  assert.equal((await listAvailabilityForUser(companyId, alice)).length, 1, 'saving Bob must not touch Alice');
  assert.equal((await listAvailabilityForUser(companyId, bob)).length, 2);
  assert.deepEqual(await listAvailabilityForUser(new ObjectId(), alice), [], 'cross-tenant reads nothing');
});

test('toPublicAvailability exposes no ids', () => {
  const projected = toPublicAvailability({
    companyId: new ObjectId(), employerUserId: new ObjectId(),
    dayOfWeek: 1, startTime: '10:00', endTime: '17:00', timezone: IST, isActive: true,
  });
  assert.deepEqual(Object.keys(projected).sort(), ['dayOfWeek', 'endTime', 'isActive', 'startTime', 'timezone']);
});

// ── suggestion ───────────────────────────────────────────────────────────────
/** A Monday well in the future, so "already past" never interferes. */
const MONDAY = '2027-03-01T00:00:00.000Z';
const rangeFrom = (isoDay, days) => ({
  from: isoDay,
  to: new Date(new Date(isoDay).getTime() + days * 86400000).toISOString(),
});

test('no availability set yields no slots rather than an error', async () => {
  const { slots, skippedCount } = await suggestSlotsFromAvailability(
    new ObjectId(), new ObjectId(), MONDAY, rangeFrom(MONDAY, 7).to, 60,
  );
  assert.deepEqual(slots, []);
  assert.equal(skippedCount, 0);
});

test('a 10:00–13:00 Monday window yields three 60-minute slots, in IST', async () => {
  const companyId = new ObjectId();
  const userId = new ObjectId();
  // 2027-03-01 is a Monday → dayOfWeek 1.
  await replaceAvailabilityForUser(companyId, userId, validateWeeklyAvailability(
    [weekday(1, '10:00', '13:00')], IST,
  ));
  const { from, to } = rangeFrom(MONDAY, 1);
  const { slots, timezone } = await suggestSlotsFromAvailability(companyId, userId, from, to, 60);

  assert.equal(timezone, IST);
  assert.equal(slots.length, 3);
  // IST is UTC+5:30, so a 10:00 local start is 04:30Z.
  assert.equal(slots[0], '2027-03-01T04:30:00.000Z');
  assert.equal(slots[1], '2027-03-01T05:30:00.000Z');
  assert.equal(slots[2], '2027-03-01T06:30:00.000Z');
});

test('a partial trailing slot is never offered', async () => {
  const companyId = new ObjectId();
  const userId = new ObjectId();
  // 2.5 hours of window cannot hold three 60-minute interviews.
  await replaceAvailabilityForUser(companyId, userId, validateWeeklyAvailability(
    [weekday(1, '10:00', '12:30')], IST,
  ));
  const { from, to } = rangeFrom(MONDAY, 1);
  const { slots } = await suggestSlotsFromAvailability(companyId, userId, from, to, 60);
  assert.equal(slots.length, 2, 'the leftover 30 minutes must not become a slot');
});

test('only days with a window produce slots', async () => {
  const companyId = new ObjectId();
  const userId = new ObjectId();
  await replaceAvailabilityForUser(companyId, userId, validateWeeklyAvailability(
    [weekday(1, '10:00', '11:00'), weekday(3, '10:00', '11:00')], IST,
  ));
  const { from, to } = rangeFrom(MONDAY, 7);
  const { slots } = await suggestSlotsFromAvailability(companyId, userId, from, to, 60);
  // Mon + Wed inside a 7-day window from Monday.
  assert.equal(slots.length, 2);
});

test('slots clashing with an existing interview are skipped and counted', async () => {
  const companyId = new ObjectId();
  const userId = new ObjectId();
  await replaceAvailabilityForUser(companyId, userId, validateWeeklyAvailability(
    [weekday(1, '10:00', '13:00')], IST,
  ));
  // Booked 11:00–12:00 IST = 05:30–06:30Z, which is exactly the middle slot.
  await (await col('interviews')).insertOne({
    companyId, interviewerEmployerUserIds: [userId], status: 'scheduled',
    startAtUtc: new Date('2027-03-01T05:30:00.000Z'), durationMinutes: 60,
  });

  const { from, to } = rangeFrom(MONDAY, 1);
  const { slots, skippedCount } = await suggestSlotsFromAvailability(companyId, userId, from, to, 60);
  assert.equal(skippedCount, 1);
  assert.deepEqual(slots, ['2027-03-01T04:30:00.000Z', '2027-03-01T06:30:00.000Z']);
});

test('a PROPOSED interview also blocks — the candidate may still accept it', async () => {
  const companyId = new ObjectId();
  const userId = new ObjectId();
  await replaceAvailabilityForUser(companyId, userId, validateWeeklyAvailability(
    [weekday(1, '10:00', '13:00')], IST,
  ));
  await (await col('interviews')).insertOne({
    companyId, interviewerEmployerUserIds: [userId], status: 'proposed',
    startAtUtc: null, durationMinutes: 60,
    proposedSlots: [{ startAtUtc: new Date('2027-03-01T04:30:00.000Z'), durationMinutes: 60 }],
  });
  const { from, to } = rangeFrom(MONDAY, 1);
  const { slots, skippedCount } = await suggestSlotsFromAvailability(companyId, userId, from, to, 60);
  assert.equal(skippedCount, 1);
  assert.equal(slots.includes('2027-03-01T04:30:00.000Z'), false);
});

test('a CANCELLED interview does not block, and another person’s does not either', async () => {
  const companyId = new ObjectId();
  const userId = new ObjectId();
  await replaceAvailabilityForUser(companyId, userId, validateWeeklyAvailability(
    [weekday(1, '10:00', '11:00')], IST,
  ));
  const interviews = await col('interviews');
  await interviews.insertOne({
    companyId, interviewerEmployerUserIds: [userId], status: 'cancelled',
    startAtUtc: new Date('2027-03-01T04:30:00.000Z'), durationMinutes: 60,
  });
  await interviews.insertOne({
    companyId, interviewerEmployerUserIds: [new ObjectId()], status: 'scheduled',
    startAtUtc: new Date('2027-03-01T04:30:00.000Z'), durationMinutes: 60,
  });

  const { from, to } = rangeFrom(MONDAY, 1);
  const { slots, skippedCount } = await suggestSlotsFromAvailability(companyId, userId, from, to, 60);
  assert.equal(skippedCount, 0);
  assert.equal(slots.length, 1);
});

test('a wall-clock window survives a DST transition in a zone that has one', async () => {
  const companyId = new ObjectId();
  const userId = new ObjectId();
  const NEW_YORK = 'America/New_York';
  await replaceAvailabilityForUser(companyId, userId, [
    { dayOfWeek: 1, startTime: '10:00', endTime: '11:00', timezone: NEW_YORK, isActive: true },
  ]);
  // US DST begins 2027-03-14, between the Mondays of Mar 8 and Mar 15.
  const { slots } = await suggestSlotsFromAvailability(
    companyId, userId, '2027-03-08T00:00:00.000Z', '2027-03-16T00:00:00.000Z', 60,
  );
  assert.equal(slots.length, 2);
  // 10:00 local both times — but a different UTC offset either side of the change.
  assert.equal(slots[0], '2027-03-08T15:00:00.000Z', 'EST: UTC-5');
  assert.equal(slots[1], '2027-03-15T14:00:00.000Z', 'EDT: UTC-4 — same 10:00 local');
});
