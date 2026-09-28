// FILE: tests/services/indexnow-client.test.js
import '../_helpers/test-db.js'; // MUST be first: sets env before env.js loads
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexNowConfig, submitToIndexNow, toPublicUrls } from '../../src/services/seo/indexnow-client.js';

const ORIGIN = 'https://jobmesh.in';

test('no key, a bad key, or a non-https origin disables IndexNow', () => {
  assert.equal(indexNowConfig({}, ORIGIN), null);
  assert.equal(indexNowConfig({ INDEXNOW_KEY: 'short' }, ORIGIN), null);
  assert.equal(indexNowConfig({ INDEXNOW_KEY: 'abcdef1234567890' }, 'http://localhost:3001'), null);
  assert.deepEqual(indexNowConfig({ INDEXNOW_KEY: 'abcdef1234567890' }, ORIGIN), {
    key: 'abcdef1234567890', origin: ORIGIN, host: 'jobmesh.in', keyLocation: `${ORIGIN}/indexnow-key.txt`,
  });
});

test('paths become unique absolute URLs', () => {
  assert.deepEqual(toPublicUrls(['/jobs/1', 'jobs/1', '/blog', null], ORIGIN), [`${ORIGIN}/jobs/1`, `${ORIGIN}/blog`]);
});

test('submits one request with host, key and URL list', async () => {
  const calls = [];
  const config = indexNowConfig({ INDEXNOW_KEY: 'abcdef1234567890' }, ORIGIN);
  const result = await submitToIndexNow(['/jobs/1'], {
    config, fetchImpl: async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return { status: 202 }; },
  });
  assert.equal(result.submitted, 1);
  assert.equal(calls[0].url, 'https://api.indexnow.org/indexnow');
  assert.deepEqual(calls[0].body.urlList, [`${ORIGIN}/jobs/1`]);
});

test('a network failure resolves quietly instead of throwing', async () => {
  const config = indexNowConfig({ INDEXNOW_KEY: 'abcdef1234567890' }, ORIGIN);
  const result = await submitToIndexNow(['/jobs/1'], { config, fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal(result.submitted, 0);
});

test('without config nothing is sent', async () => {
  let called = false;
  const result = await submitToIndexNow(['/jobs/1'], { config: null, fetchImpl: async () => { called = true; } });
  assert.equal(called, false);
  assert.equal(result.skipped, true);
});
