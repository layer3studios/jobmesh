// FILE: tests/api/public-referral-routes.test.js
// The candidate-facing half of referrals: resolving a token to a banner name, and
// the attribution an application carries as a result.
import './../_helpers/test-db.js';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { dropCollections, closeTestDb } from '../_helpers/test-db.js';
import publicApplyRouter from '../../src/api/public/public-apply-routes.js';
import { errorHandler, notFound } from '../../src/middleware/error-handler-middleware.js';
import {
  ensureReferralLinkIndexes, findOrCreateReferralLink, findReferralLinkByToken,
  deactivateReferralLink,
} from '../../src/models/employer/referral-link-model.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/public', publicApplyRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

const reset = async () => {
  await dropCollections('referral_links');
  await ensureReferralLinkIndexes();
};

before(reset);
beforeEach(reset);
after(async () => { await closeTestDb(); });

const makeLink = (referrerName = 'Priya Shah') => findOrCreateReferralLink({
  companyId: new ObjectId(), postingId: new ObjectId(), employerUserId: new ObjectId(), referrerName,
});

test('GET /referrals/:token returns the referrer name and counts the click', async () => {
  const link = await makeLink();
  const response = await request(buildApp()).get(`/api/public/referrals/${link.token}`);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { referrerName: 'Priya Shah' });
  // The counter is fire-and-forget, so give the write a tick to land.
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal((await findReferralLinkByToken(link.token)).clickCount, 1);
});

test('the response is never cached — clicks must count once per visit', async () => {
  const link = await makeLink();
  const response = await request(buildApp()).get(`/api/public/referrals/${link.token}`);
  assert.match(response.headers['cache-control'] ?? '', /no-store/);
});

test('an unknown token answers 200 with a null name, never 404', async () => {
  // A 404 would let anyone probe which tokens exist, and the page has nothing to fix.
  const response = await request(buildApp()).get('/api/public/referrals/doesnotexist');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { referrerName: null });
});

test('a deactivated token answers with a null name and counts no click', async () => {
  const link = await makeLink();
  await deactivateReferralLink(link.companyId, link._id);

  const response = await request(buildApp()).get(`/api/public/referrals/${link.token}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.referrerName, null);
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal((await findReferralLinkByToken(link.token)).clickCount, 0);
});

test('the response exposes only the name — never the company, id or owner', async () => {
  const link = await makeLink();
  const response = await request(buildApp()).get(`/api/public/referrals/${link.token}`);
  assert.deepEqual(Object.keys(response.body), ['referrerName']);
});
