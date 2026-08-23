// FILE: tests/services/applicant-leetcode.test.js
// The two new ways a LeetCode record reaches an application: the optional field on
// the apply form, and the employer's manual lookup.
import './../_helpers/test-db.js';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { dropCollections, closeTestDb } from '../_helpers/test-db.js';
import { col } from '../../src/Db/connection.js';
import { normalizeLeetCodeUsername, validateApplicationForm } from '../../src/services/public/apply-validators.js';
import { attachLeetCodeSnapshot } from '../../src/services/public/apply-leetcode-snapshot.js';
import { clearApplicantLeetCode } from '../../src/services/employer/applicant-leetcode-service.js';

const reset = () => dropCollections('applications');
before(reset);
beforeEach(reset);
after(async () => { await closeTestDb(); });

const validForm = (over = {}) => ({
  firstName: 'Asha', lastName: 'Rao', email: 'asha@example.com',
  consent_dpdp: true, ...over,
});

// ── the optional apply-form field ───────────────────────────────────────────
test('a well-formed handle survives validation', () => {
  for (const name of ['neal_wu', 'a', 'User-Name_9', 'A'.repeat(20)]) {
    assert.equal(normalizeLeetCodeUsername(name), name);
  }
  assert.equal(normalizeLeetCodeUsername('  spaced  '), 'spaced');
});

test('a malformed handle becomes null and NEVER throws', () => {
  // This is the whole contract of the field: a typo must not cost an application.
  for (const bad of ['', '   ', 'A'.repeat(21), 'has space', 'quote"', 'x") { evil }', null, undefined, 42, {}]) {
    assert.equal(normalizeLeetCodeUsername(bad), null, `should drop ${JSON.stringify(bad)}`);
  }
});

test('the apply form accepts a submission whose handle is garbage', () => {
  const clean = validForm({ leetcodeUsername: 'not a real handle!!' });
  // No throw — the rest of the form is valid, so the application proceeds.
  assert.equal(validateApplicationForm(clean).leetcodeUsername, null);
});

test('the apply form carries a good handle through to the caller', () => {
  assert.equal(validateApplicationForm(validForm({ leetcodeUsername: 'neal_wu' })).leetcodeUsername, 'neal_wu');
});

test('an omitted handle is null, not undefined', () => {
  assert.equal(validateApplicationForm(validForm()).leetcodeUsername, null);
});

// ── the fire-and-forget snapshot ────────────────────────────────────────────
test('attachLeetCodeSnapshot writes the record onto the application', async () => {
  const applications = await col('applications');
  const { insertedId } = await applications.insertOne({
    companyId: new ObjectId(), leetcodeUsername: 'neal_wu', leetcodeData: null,
  });

  const data = await attachLeetCodeSnapshot(insertedId, 'neal_wu');
  // Live call: skip rather than fail when the network or LeetCode is unavailable,
  // so this suite stays runnable offline.
  if (data === null) return;

  const row = await applications.findOne({ _id: insertedId });
  assert.equal(row.leetcodeData.username, 'neal_wu');
  assert.equal(typeof row.leetcodeData.totalSolved, 'number');
});

test('an unknown handle leaves the application untouched rather than failing', async () => {
  const applications = await col('applications');
  const { insertedId } = await applications.insertOne({ companyId: new ObjectId(), leetcodeData: null });

  const result = await attachLeetCodeSnapshot(insertedId, 'zqx_no_such_9182');
  assert.equal(result, null);
  assert.equal((await applications.findOne({ _id: insertedId })).leetcodeData, null);
});

test('a missing application id or handle is a no-op, never a throw', async () => {
  assert.equal(await attachLeetCodeSnapshot(null, 'neal_wu'), null);
  assert.equal(await attachLeetCodeSnapshot(new ObjectId(), null), null);
  assert.equal(await attachLeetCodeSnapshot(new ObjectId(), ''), null);
});

// ── the employer's clear ────────────────────────────────────────────────────
test('clearing nulls both fields on that application only', async () => {
  const companyId = new ObjectId();
  const applications = await col('applications');
  const { insertedId } = await applications.insertOne({
    companyId, leetcodeUsername: 'neal_wu', leetcodeData: { username: 'neal_wu', totalSolved: 253 },
  });
  const other = await applications.insertOne({
    companyId, leetcodeUsername: 'someone', leetcodeData: { username: 'someone', totalSolved: 10 },
  });

  assert.deepEqual(await clearApplicantLeetCode(companyId, insertedId), { cleared: true });
  const cleared = await applications.findOne({ _id: insertedId });
  assert.equal(cleared.leetcodeData, null);
  assert.equal(cleared.leetcodeUsername, null, 'the handle goes too, so the box starts empty');
  // The other application on the same company is untouched.
  assert.equal((await applications.findOne({ _id: other.insertedId })).leetcodeData.totalSolved, 10);
});

test('clearing across tenants is refused, not silently ignored', async () => {
  const applications = await col('applications');
  const { insertedId } = await applications.insertOne({
    companyId: new ObjectId(), leetcodeData: { username: 'neal_wu' },
  });

  await assert.rejects(
    () => clearApplicantLeetCode(new ObjectId(), insertedId),
    (err) => err.status === 404 && err.code === 'APPLICATION_NOT_FOUND',
  );
  // And the row survives — a cross-tenant call must not be able to blank it.
  assert.ok((await applications.findOne({ _id: insertedId })).leetcodeData);
});
