// FILE: tests/api/public-profile-routes.test.js
// The shareable public profile at /api/public/profile/:slug: what the settings
// let through, what they must not, private/unknown slugs, the signed resume
// stream and its revocation, and the honeypot on the contact form.
import './../_helpers/test-db.js';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { ObjectId } from 'mongodb';

import { dropCollections, closeTestDb } from '../_helpers/test-db.js';
import { col } from '../../src/Db/connection.js';
import { errorHandler } from '../../src/middleware/error-handler-middleware.js';
import publicProfileRouter from '../../src/api/public/public-profile-routes.js';
import { signProfileResumeToken } from '../../src/services/seeker/public-profile-signed-url.js';
import { storeSeekerResume, deleteSeekerResume } from '../../src/services/seeker/seeker-resume-storage.js';

const PDF_BYTES = Buffer.from('%PDF-1.4\n a resume '.repeat(20));
const writtenPaths = [];

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/public/profile', publicProfileRouter);
  app.use(errorHandler);
  return app;
}

async function seedSeeker({ slug, profilePublic = true, settings = {}, resume = false, email = 'ashish@example.com' }) {
  const _id = new ObjectId();
  const seekerResumeFile = resume ? storeSeekerResume(PDF_BYTES) : null;
  if (seekerResumeFile) writtenPaths.push(seekerResumeFile.storagePath);
  await (await col('users')).insertOne({
    _id,
    name: 'Ashish Ranjan',
    email,
    slug: `internal-${slug}`,
    profileSlug: slug,
    profilePublic,
    profileSettings: settings,
    seekerResumeFile,
    parsedProfile: {
      fullName: 'Ashish Ranjan',
      email: email ? 'parsed@example.com' : null,
      phone: '+91 90000 00000',
      summary: 'Builds things.',
      currentLocation: { city: 'Bengaluru', state: 'KA' },
      skills: [{ name: 'React' }, { name: 'Node.js' }],
      experience: [{ company: 'Acme', title: 'Engineer', responsibilities: ['Shipped'], technologies: ['Go'] }],
      education: [],
    },
  });
  return _id;
}

before(async () => { await reset(); });
beforeEach(async () => { await reset(); });
after(async () => {
  for (const storagePath of writtenPaths) deleteSeekerResume(storagePath);
  await closeTestDb();
});
async function reset() { await dropCollections('users'); }

test('a published profile returns name, skills and experience', async () => {
  await seedSeeker({ slug: 'ashish-ranjan' });
  const response = await request(buildApp()).get('/api/public/profile/ashish-ranjan');

  assert.equal(response.status, 200);
  assert.equal(response.headers['cache-control'], 'public, max-age=300');
  const { profile } = response.body;
  assert.equal(profile.name, 'Ashish Ranjan');
  assert.deepEqual(profile.skills, ['React', 'Node.js']);
  assert.equal(profile.experience.length, 1);
  assert.equal(profile.openToWork, true);
});

test('email and phone are OMITTED, not merely flagged, when hidden', async () => {
  await seedSeeker({ slug: 'private-contact' });
  const { body } = await request(buildApp()).get('/api/public/profile/private-contact');

  assert.equal(body.profile.contact.showEmail, false);
  assert.equal('email' in body.profile.contact, false);
  assert.equal('phone' in body.profile.contact, false);
  assert.equal(JSON.stringify(body.profile).includes('+91 90000 00000'), false);
});

test('showEmail true includes the address', async () => {
  await seedSeeker({ slug: 'open-contact', settings: { showEmail: true } });
  const { body } = await request(buildApp()).get('/api/public/profile/open-contact');
  assert.equal(body.profile.contact.email, 'parsed@example.com');
});

test('showSkills / showExperience false empty those sections', async () => {
  await seedSeeker({ slug: 'minimal', settings: { showSkills: false, showExperience: false } });
  const { body } = await request(buildApp()).get('/api/public/profile/minimal');
  assert.deepEqual(body.profile.skills, []);
  assert.deepEqual(body.profile.experience, []);
});

test('no internal identifiers reach the client', async () => {
  const userId = await seedSeeker({ slug: 'no-ids' });
  const { text } = await request(buildApp()).get('/api/public/profile/no-ids');
  assert.equal(text.includes(String(userId)), false);
  assert.equal(text.includes('_id'), false);
});

test('a private profile is indistinguishable from an unknown one', async () => {
  await seedSeeker({ slug: 'hidden', profilePublic: false });
  const app = buildApp();
  const priv = await request(app).get('/api/public/profile/hidden');
  const missing = await request(app).get('/api/public/profile/never-existed');
  assert.equal(priv.status, 404);
  assert.equal(missing.status, 404);
  assert.equal(priv.body.code, missing.body.code);
});

test('viewing increments the view count', async () => {
  const userId = await seedSeeker({ slug: 'counted' });
  await request(buildApp()).get('/api/public/profile/counted');
  const user = await (await col('users')).findOne({ _id: userId });
  assert.equal(user.profileViewCount, 1);
});

test('a signed link streams the PDF inline', async () => {
  await seedSeeker({ slug: 'with-resume', resume: true });
  const { token, expires } = signProfileResumeToken('with-resume');
  const response = await request(buildApp())
    .get(`/api/public/profile/with-resume/resume?token=${token}&expires=${expires}`);

  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'application/pdf');
  assert.match(response.headers['content-disposition'], /^inline;/);
});

test('a forged or expired token is rejected', async () => {
  await seedSeeker({ slug: 'guarded', resume: true });
  const app = buildApp();
  const { expires } = signProfileResumeToken('guarded');

  const forged = await request(app).get(`/api/public/profile/guarded/resume?token=nope&expires=${expires}`);
  assert.equal(forged.status, 401);

  const stale = signProfileResumeToken('guarded', -1000);
  const expired = await request(app)
    .get(`/api/public/profile/guarded/resume?token=${stale.token}&expires=${stale.expires}`);
  assert.equal(expired.status, 401);
});

test('a token signed for one slug does not open another', async () => {
  await seedSeeker({ slug: 'mine', resume: true });
  await seedSeeker({ slug: 'yours', resume: true });
  const { token, expires } = signProfileResumeToken('mine');
  const response = await request(buildApp())
    .get(`/api/public/profile/yours/resume?token=${token}&expires=${expires}`);
  assert.equal(response.status, 401);
});

test('showResume false revokes a still-valid token', async () => {
  await seedSeeker({ slug: 'revoked', resume: true, settings: { showResume: false } });
  const { token, expires } = signProfileResumeToken('revoked');
  const response = await request(buildApp())
    .get(`/api/public/profile/revoked/resume?token=${token}&expires=${expires}`);
  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'RESUME_HIDDEN');
});

test('the contact form validates, and the honeypot is accepted silently', async () => {
  // No address on file, so the service short-circuits before any outbound send —
  // the contract under test is the RESPONSE, which must not vary with delivery.
  await seedSeeker({ slug: 'reachable', email: null });
  const app = buildApp();

  const bad = await request(app).post('/api/public/profile/reachable/contact')
    .send({ senderName: '', senderEmail: 'nope', message: '' });
  assert.equal(bad.status, 400);

  const bot = await request(app).post('/api/public/profile/reachable/contact')
    .send({ senderName: 'Bot', senderEmail: 'b@example.com', message: 'hi', website: 'spam' });
  assert.equal(bot.status, 200);
  assert.equal(bot.body.sent, true);

  const human = await request(app).post('/api/public/profile/reachable/contact')
    .send({ senderName: 'Priya', senderEmail: 'priya@example.com', message: 'Are you open to a chat?' });
  assert.equal(human.status, 200);
  // Never echoes the recipient's address back to the sender.
  assert.equal(JSON.stringify(human.body).includes('example.com'), false);
});
