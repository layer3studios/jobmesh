// FILE: tests/api/admin-blog-routes.test.js
// Blog admin + public routes with injected fakes (no database), and the input
// validator. Proves: super_admin-only writes, drafts never public, audit on write.
import '../_helpers/test-db.js'; // MUST be first: sets env before env.js loads
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import { errorHandler } from '../../src/middleware/error-handler-middleware.js';
import { createBlogAdminRouter } from '../../src/api/admin/blog-routes.js';
import { createPublicBlogRouter } from '../../src/api/public/public-blog-routes.js';
import { validateBlogPostInput, slugifyTitle } from '../../src/models/content/blog-post-model.js';
import { AUDIT_EVENTS } from '../../src/models/dpdp/dpdp-constants.js';

const VALID = { title: 'Remote jobs in India', description: 'A guide.', body: '## Hello\n\nText.' };

function fakeDeps() {
  const audits = [];
  const created = [];
  return {
    audits,
    created,
    deps: {
      listAllPosts: async () => [],
      findPostById: async () => null,
      createPost: async (value) => {
        created.push(value);
        return { ok: true, post: { _id: { toString: () => 'p1' }, ...value, status: value.status ?? 'draft' } };
      },
      updatePost: async () => ({ ok: false, reason: 'not_found' }),
      deletePost: async () => ({ ok: false, reason: 'not_found' }),
      appendAudit: async (entry) => { audits.push(entry); },
    },
  };
}

function adminApp(role, deps) {
  const app = express();
  app.use(express.json());
  // Stands in for requireAdmin, which needs a database row.
  app.use((req, _res, next) => { req.adminUser = { adminUserId: 'a1', email: 'x@jobmesh.in', role }; next(); });
  app.use('/api/admin/blog', createBlogAdminRouter(deps));
  app.use(errorHandler);
  return app;
}

test('a plain admin can list posts but cannot create one', async () => {
  const { deps, created } = fakeDeps();
  const app = adminApp('admin', deps);
  assert.equal((await request(app).get('/api/admin/blog')).status, 200);
  const res = await request(app).post('/api/admin/blog').send(VALID);
  assert.equal(res.status, 403);
  assert.equal(created.length, 0);
});

test('a super_admin creates a post, slug derived from the title, and it is audited', async () => {
  const { deps, created, audits } = fakeDeps();
  const res = await request(adminApp('super_admin', deps)).post('/api/admin/blog').send({ ...VALID, status: 'published' });
  assert.equal(res.status, 201);
  assert.equal(created[0].slug, 'remote-jobs-in-india');
  assert.equal(res.body.data.post.status, 'published');
  assert.equal(audits[0].event, AUDIT_EVENTS.BLOG_POST_CREATED);
});

test('invalid input is rejected with field errors', async () => {
  const { deps } = fakeDeps();
  const res = await request(adminApp('super_admin', deps)).post('/api/admin/blog').send({ title: '', slug: 'Bad Slug!' });
  assert.equal(res.status, 400);
  assert.ok(res.body.details.title);
  assert.ok(res.body.details.slug);
});

test('the public API 404s a slug the model does not return as published', async () => {
  const app = express();
  app.use('/api/public/blog', createPublicBlogRouter({
    listPublishedPosts: async () => [],
    findPublishedPostBySlug: async () => null,
  }));
  app.use(errorHandler);
  assert.equal((await request(app).get('/api/public/blog/a-draft')).status, 404);
  assert.deepEqual((await request(app).get('/api/public/blog')).body, { data: { posts: [] } });
});

test('validator: partial updates only check present fields; tags are normalised', () => {
  assert.deepEqual(validateBlogPostInput({ status: 'published' }, { partial: true }), { ok: true, value: { status: 'published' } });
  const parsed = validateBlogPostInput({ ...VALID, tags: [' Remote ', 'remote', 'India'] });
  assert.deepEqual(parsed.value.tags, ['remote', 'india']);
  assert.equal(validateBlogPostInput({ ...VALID, status: 'live' }).ok, false);
  assert.equal(slugifyTitle('  Café jobs — 2026! '), 'cafe-jobs-2026');
});
