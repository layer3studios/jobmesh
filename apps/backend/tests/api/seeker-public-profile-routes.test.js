// FILE: tests/api/seeker-public-profile-routes.test.js
// The seeker's own controls: auto-generating a slug on first publish, renaming
// it, the reserved/invalid/taken rejections, and partial settings patches.
import './../_helpers/test-db.js';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { ObjectId } from 'mongodb';

import { dropCollections, closeTestDb } from '../_helpers/test-db.js';
import { col } from '../../src/Db/connection.js';
import { errorHandler } from '../../src/middleware/error-handler-middleware.js';
import seekerPublicProfileRouter from '../../src/api/seeker/seeker-public-profile-routes.js';

const USER_ID = new ObjectId();

function buildApp(userId = USER_ID) {
  const app = express();
  app.use(express.json());
  app.use('/api/seeker/me', (req, _res, next) => { req.user = { userId: String(userId) }; next(); });
  app.use('/api/seeker/me', seekerPublicProfileRouter);
  app.use(errorHandler);
  return app;
}

async function seedUser(_id, fields = {}) {
  await (await col('users')).insertOne({
    _id, name: 'Ashish Ranjan', email: 'ashish@example.com', slug: `internal-${_id}`, ...fields,
  });
}

before(async () => { await reset(); });
beforeEach(async () => { await reset(); });
after(async () => { await closeTestDb(); });
async function reset() { await dropCollections('users'); }

test('turning the profile on derives a slug from the name', async () => {
  await seedUser(USER_ID);
  const response = await request(buildApp())
    .patch('/api/seeker/me/profile-settings').send({ profilePublic: true });

  assert.equal(response.status, 200);
  assert.equal(response.body.profileSlug, 'ashish-ranjan');
  assert.equal(response.body.profilePublic, true);
  assert.match(response.body.profileUrl, /\/u\/ashish-ranjan$/);
});

test('a name already taken gets a suffixed slug instead of a collision', async () => {
  await seedUser(new ObjectId(), { profileSlug: 'ashish-ranjan', profilePublic: true });
  await seedUser(USER_ID);
  const { body } = await request(buildApp())
    .patch('/api/seeker/me/profile-settings').send({ profilePublic: true });

  assert.notEqual(body.profileSlug, 'ashish-ranjan');
  assert.match(body.profileSlug, /^ashish-ranjan-\d{4}$/);
});

test('defaults keep email and phone hidden and everything else shown', async () => {
  await seedUser(USER_ID);
  const { body } = await request(buildApp()).get('/api/seeker/me/profile-settings');
  assert.equal(body.settings.showEmail, false);
  assert.equal(body.settings.showPhone, false);
  assert.equal(body.settings.showSkills, true);
  assert.equal(body.profilePublic, false);
  assert.equal(body.profileUrl, null);
});

test('a reserved slug is rejected with SLUG_RESERVED', async () => {
  await seedUser(USER_ID);
  const response = await request(buildApp())
    .patch('/api/seeker/me/profile-settings').send({ profileSlug: 'admin' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'SLUG_RESERVED');
});

test('malformed slugs are rejected with SLUG_INVALID', async () => {
  await seedUser(USER_ID);
  const app = buildApp();
  for (const slug of ['ab', '-lead', 'trail-', 'double--hyphen', 'has space', 'a'.repeat(31)]) {
    const response = await request(app).patch('/api/seeker/me/profile-settings').send({ profileSlug: slug });
    assert.equal(response.status, 400, `expected ${slug} to be rejected`);
    assert.equal(response.body.code, 'SLUG_INVALID');
  }
});

test('a slug typed with capitals is normalised rather than rejected', async () => {
  await seedUser(USER_ID);
  const { body } = await request(buildApp())
    .patch('/api/seeker/me/profile-settings').send({ profileSlug: 'Ashish-Ranjan' });
  assert.equal(body.profileSlug, 'ashish-ranjan');
});

test('a taken slug returns 409 with usable suggestions', async () => {
  await seedUser(new ObjectId(), { profileSlug: 'priya-sharma', profilePublic: true });
  await seedUser(USER_ID);
  const response = await request(buildApp())
    .patch('/api/seeker/me/profile-settings').send({ profileSlug: 'priya-sharma' });

  assert.equal(response.status, 409);
  assert.equal(response.body.code, 'SLUG_TAKEN');
  assert.ok(response.body.details.suggestions.length > 0);
  assert.match(response.body.details.suggestions[0], /^priya-sharma-\d{4}$/);
});

test('the availability check never writes', async () => {
  await seedUser(USER_ID);
  const app = buildApp();
  const free = await request(app).get('/api/seeker/me/profile-slug-available?slug=totally-free');
  assert.equal(free.body.available, true);

  const reserved = await request(app).get('/api/seeker/me/profile-slug-available?slug=jobs');
  assert.equal(reserved.body.available, false);
  assert.equal(reserved.body.code, 'SLUG_RESERVED');

  const user = await (await col('users')).findOne({ _id: USER_ID });
  assert.equal(user.profileSlug, undefined);
});

test('a partial settings patch leaves the other flags alone', async () => {
  await seedUser(USER_ID);
  const app = buildApp();
  await request(app).patch('/api/seeker/me/profile-settings')
    .send({ profileSettings: { showEmail: true, headline: '  Full Stack Engineer  ' } });
  const { body } = await request(app).patch('/api/seeker/me/profile-settings')
    .send({ profileSettings: { showGitHub: false } });

  assert.equal(body.settings.showEmail, true);
  assert.equal(body.settings.headline, 'Full Stack Engineer');
  assert.equal(body.settings.showGitHub, false);
  assert.equal(body.settings.showLeetCode, true);
});

test('an unknown setting key is a 400, not a silent drop', async () => {
  await seedUser(USER_ID);
  const response = await request(buildApp()).patch('/api/seeker/me/profile-settings')
    .send({ profileSettings: { showEmial: true } });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'UNKNOWN_SETTING');
});

test('renaming keeps the new slug and frees nothing else', async () => {
  await seedUser(USER_ID, { profileSlug: 'old-name', profilePublic: true });
  const { body } = await request(buildApp())
    .patch('/api/seeker/me/profile-settings').send({ profileSlug: 'new-name' });
  assert.equal(body.profileSlug, 'new-name');
});
