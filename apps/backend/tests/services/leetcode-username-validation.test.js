// FILE: tests/services/leetcode-username-validation.test.js
// Regression: connecting "Ashish050488" returned 400 INVALID_LEETCODE_USERNAME.
//
// The regex was never at fault — it has always allowed uppercase. The frontend's
// seeker request helper omitted Content-Type, so express.json() left req.body
// empty, and the route validated `undefined`. The 400 named the username because
// that is the field it was checking, which is why this looked like a regex bug.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { validateLeetCodeUsername } from '../../src/services/seeker/leetcode-service.js';

test('uppercase, digits, underscores and hyphens all validate', () => {
  for (const name of ['Ashish050488', 'ashish050488', 'Neal_Wu', 'A-b_9', 'A'.repeat(20)]) {
    assert.equal(validateLeetCodeUsername(name), name);
  }
});

test('case is preserved — LeetCode handles are not lowercased in transit', () => {
  assert.equal(validateLeetCodeUsername('  Ashish050488  '), 'Ashish050488');
});

test('a missing body is what produced the 400, not the pattern', () => {
  assert.throws(
    () => validateLeetCodeUsername(undefined),
    (err) => err.status === 400 && err.code === 'INVALID_LEETCODE_USERNAME',
  );
});

test('express.json() drops a JSON body sent without Content-Type', async () => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.put('/echo', (req, res) => res.json({ username: req.body?.username ?? null }));
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const url = `http://127.0.0.1:${server.address().port}/echo`;
  const body = JSON.stringify({ username: 'Ashish050488' });

  const withoutHeader = await fetch(url, { method: 'PUT', body });
  assert.equal((await withoutHeader.json()).username, null, 'reproduces the bug');

  const withHeader = await fetch(url, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body,
  });
  assert.equal((await withHeader.json()).username, 'Ashish050488', 'the fix');

  await new Promise((r) => server.close(r));
});
