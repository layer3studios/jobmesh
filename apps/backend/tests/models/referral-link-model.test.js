// FILE: tests/models/referral-link-model.test.js
import './../_helpers/test-db.js';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { dropCollections, closeTestDb } from '../_helpers/test-db.js';
import {
  ensureReferralLinkIndexes, generateReferralToken, findOrCreateReferralLink,
  findReferralLinkByToken, incrementReferralClickCount, incrementReferralApplicationCount,
  listReferralLinksForPosting, deactivateReferralLink, toPublicReferralLink,
} from '../../src/models/employer/referral-link-model.js';
import { resolveReferralAttribution } from '../../src/services/public/referral-attribution-service.js';

const reset = async () => {
  await dropCollections('referral_links');
  await ensureReferralLinkIndexes();
};

before(reset);
beforeEach(reset);
after(async () => { await closeTestDb(); });

const ids = () => ({
  companyId: new ObjectId(), postingId: new ObjectId(), employerUserId: new ObjectId(),
});

test('generateReferralToken produces 12 URL-safe characters', () => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const token = generateReferralToken();
    assert.equal(token.length, 12);
    assert.match(token, /^[A-Za-z0-9_-]{12}$/, `not URL-safe: ${token}`);
  }
  assert.notEqual(generateReferralToken(), generateReferralToken());
});

test('findOrCreateReferralLink returns the SAME link on a second call, stats intact', async () => {
  const { companyId, postingId, employerUserId } = ids();
  const first = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya Shah' });
  await incrementReferralClickCount(first.token);
  await incrementReferralApplicationCount(first._id);

  const second = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya Shah' });
  assert.equal(second._id.toString(), first._id.toString());
  assert.equal(second.token, first.token, 'reshare must not mint a new token');
  // Re-sharing must never reset the numbers.
  assert.equal(second.clickCount, 1);
  assert.equal(second.applicationCount, 1);
});

test('a rename refreshes referrerName without disturbing the token or counters', async () => {
  const { companyId, postingId, employerUserId } = ids();
  const first = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya Shah' });
  const renamed = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya S' });
  assert.equal(renamed.token, first.token);
  assert.equal(renamed.referrerName, 'Priya S');
});

test('each teammate gets their own link for the same posting', async () => {
  const { companyId, postingId } = ids();
  const a = await findOrCreateReferralLink({ companyId, postingId, employerUserId: new ObjectId(), referrerName: 'A' });
  const b = await findOrCreateReferralLink({ companyId, postingId, employerUserId: new ObjectId(), referrerName: 'B' });
  assert.notEqual(a.token, b.token);
  assert.equal((await listReferralLinksForPosting(companyId, postingId)).length, 2);
});

test('listReferralLinksForPosting is company-scoped and ordered by applications', async () => {
  const { companyId, postingId } = ids();
  await findOrCreateReferralLink({ companyId, postingId, employerUserId: new ObjectId(), referrerName: 'Quiet' });
  const busy = await findOrCreateReferralLink({ companyId, postingId, employerUserId: new ObjectId(), referrerName: 'Busy' });
  await incrementReferralApplicationCount(busy._id);

  const rows = await listReferralLinksForPosting(companyId, postingId);
  assert.equal(rows[0].referrerName, 'Busy');
  // Another tenant sees nothing of ours.
  assert.deepEqual(await listReferralLinksForPosting(new ObjectId(), postingId), []);
});

test('deactivateReferralLink is company-scoped and keeps the row readable', async () => {
  const { companyId, postingId, employerUserId } = ids();
  const link = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya' });

  assert.equal(await deactivateReferralLink(new ObjectId(), link._id), null, 'cross-tenant must not deactivate');
  const off = await deactivateReferralLink(companyId, link._id);
  assert.equal(off.isActive, false);
  // Deactivated, not deleted: an application already attributed to it still resolves.
  assert.ok(await findReferralLinkByToken(link.token));
});

test('incrementReferralClickCount ignores a deactivated link', async () => {
  const { companyId, postingId, employerUserId } = ids();
  const link = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya' });
  await deactivateReferralLink(companyId, link._id);
  await incrementReferralClickCount(link.token);
  assert.equal((await findReferralLinkByToken(link.token)).clickCount, 0);
});

test('toPublicReferralLink exposes no companyId', () => {
  const projected = toPublicReferralLink({
    _id: new ObjectId(), companyId: new ObjectId(), postingId: new ObjectId(),
    employerUserId: new ObjectId(), token: 'abc', referrerName: 'A',
    clickCount: 2, applicationCount: 1, isActive: true, createdAt: new Date(),
  });
  assert.equal('companyId' in projected, false);
  assert.equal(projected.clickCount, 2);
});

// ── attribution ──────────────────────────────────────────────────────────────
test('resolveReferralAttribution attributes a live token to its referrer', async () => {
  const { companyId, postingId, employerUserId } = ids();
  const link = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya Shah' });

  const result = await resolveReferralAttribution(link.token, companyId, 'LinkedIn');
  assert.equal(result.source, 'referral');
  assert.equal(result.sourceDetail, 'Priya Shah');
  assert.equal(result.referralLinkId.toString(), link._id.toString());
});

test('resolveReferralAttribution falls back silently for every bad token', async () => {
  const { companyId, postingId, employerUserId } = ids();
  const link = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya' });
  await deactivateReferralLink(companyId, link._id);

  const cases = [
    ['deactivated', link.token],
    ['unknown', 'nope-nope-no'],
    ['empty', ''],
    ['absent', undefined],
    ['non-string', 42],
  ];
  for (const [label, token] of cases) {
    const result = await resolveReferralAttribution(token, companyId, 'LinkedIn');
    assert.equal(result.source, 'apply_page', `${label} must not attribute`);
    assert.equal(result.referralLinkId, null, `${label} must carry no link id`);
    // The utm answer still survives as the source detail.
    assert.equal(result.sourceDetail, 'LinkedIn', `${label} must keep utm_source`);
  }
});

test('a token from ANOTHER company never attributes (cross-tenant leak guard)', async () => {
  const { companyId, postingId, employerUserId } = ids();
  const link = await findOrCreateReferralLink({ companyId, postingId, employerUserId, referrerName: 'Priya Shah' });

  const result = await resolveReferralAttribution(link.token, new ObjectId(), null);
  assert.equal(result.source, 'apply_page');
  assert.equal(result.referralLinkId, null);
  assert.equal(result.sourceDetail, null, 'the other tenant must not learn the referrer name');
});
