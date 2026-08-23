// FILE: tests/services/github-integration.test.js
// The GitHub integration's pure parts: username validation (which differs from
// LeetCode's in ways worth pinning down), the shape function, and the employer's
// clear. Nothing here touches the network — shapeGitHubData is fed a recorded
// response, which is the whole reason it is a separate module.
import './../_helpers/test-db.js';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { dropCollections, closeTestDb } from '../_helpers/test-db.js';
import { col } from '../../src/Db/connection.js';
import { validateGitHubUsername } from '../../src/services/seeker/github-service.js';
import { shapeGitHubData } from '../../src/services/seeker/github-shape.js';
import { normalizeGitHubUsername } from '../../src/services/public/apply-validators.js';
import { clearApplicantGitHub } from '../../src/services/employer/applicant-github-service.js';
import { attachGitHubSnapshot } from '../../src/services/public/apply-github-snapshot.js';

const reset = () => dropCollections('applications');
before(reset);
beforeEach(reset);
after(async () => { await closeTestDb(); });

// ── username rules ──────────────────────────────────────────────────────────
test('valid GitHub handles pass, with case preserved', () => {
  for (const name of ['torvalds', 'Ashish050488', 'a', 'a-b', 'A'.repeat(39)]) {
    assert.equal(validateGitHubUsername(name), name);
  }
  assert.equal(validateGitHubUsername('  torvalds  '), 'torvalds');
});

test('GitHub rejects what LeetCode allows, and the validator knows the difference', () => {
  // Underscores are legal on LeetCode and illegal on GitHub. This is the single
  // rule most likely to be "fixed" into a shared regex later; it must not be.
  assert.throws(() => validateGitHubUsername('neal_wu'), (e) => e.status === 400);
  // 40 characters: one past GitHub's limit, well past LeetCode's.
  assert.throws(() => validateGitHubUsername('A'.repeat(40)), (e) => e.status === 400);
});

test('malformed handles are refused, including hyphen edge cases', () => {
  for (const bad of ['-lead', 'trail-', 'do--uble', '', '   ', 'has space', 'quo"te',
    'x") { evil }', null, undefined, 42, {}]) {
    assert.throws(
      () => validateGitHubUsername(bad),
      (e) => e.status === 400 && e.code === 'INVALID_GITHUB_USERNAME',
      `should reject ${JSON.stringify(bad)}`,
    );
  }
});

test('the apply form drops a bad handle instead of failing the application', () => {
  // The whole contract of the optional field: a typo must not cost an application.
  for (const bad of ['neal_wu', '-lead', 'has space', 'x") { evil }', '', null, 42]) {
    assert.equal(normalizeGitHubUsername(bad), null, `should drop ${JSON.stringify(bad)}`);
  }
  assert.equal(normalizeGitHubUsername(' torvalds '), 'torvalds');
});

// ── shaping ─────────────────────────────────────────────────────────────────
const rawUser = () => ({
  login: 'octocat',
  name: 'The Octocat',
  bio: null,
  company: null,
  location: 'SF',
  followers: { totalCount: 12 },
  following: { totalCount: 3 },
  repositories: {
    totalCount: 240,
    nodes: [
      {
        name: 'hot', description: 'A thing', stargazerCount: 300, forkCount: 40,
        primaryLanguage: { name: 'Go', color: '#00ADD8' },
        updatedAt: '2026-08-01T00:00:00Z', url: 'https://github.com/octocat/hot',
      },
      {
        name: 'mid', description: null, stargazerCount: 5, forkCount: 1,
        primaryLanguage: { name: 'Go', color: '#00ADD8' },
        updatedAt: '2026-07-01T00:00:00Z', url: 'https://github.com/octocat/mid',
      },
      {
        name: 'cold', description: null, stargazerCount: 0, forkCount: 0,
        primaryLanguage: null,
        updatedAt: '2026-06-01T00:00:00Z', url: 'https://github.com/octocat/cold',
      },
    ],
  },
  contributionsCollection: {
    totalCommitContributions: 900,
    totalPullRequestContributions: 40,
    totalIssueContributions: 12,
    totalPullRequestReviewContributions: 30,
    restrictedContributionsCount: 220,
    contributionCalendar: {
      totalContributions: 1000,
      weeks: [{ contributionDays: [
        { contributionCount: 4, date: '2026-08-20' },
        { contributionCount: 0, date: '2026-08-21' },
      ] }],
    },
  },
  pinnedItems: { nodes: [] },
});

test('shaping produces the numbers the panel reads', () => {
  const shaped = shapeGitHubData(rawUser());
  assert.equal(shaped.username, 'octocat');
  assert.equal(shaped.publicRepoCount, 240, 'the account total, not the fetched page');
  assert.equal(shaped.totalStars, 305);
  assert.equal(shaped.totalForks, 41);
  assert.equal(shaped.totalContributions, 1000);
  assert.equal(shaped.privateContributions, 220);
  // Only starred repos become cards, so an unstarred tail never fills the grid.
  assert.deepEqual(shaped.topRepos.map((r) => r.name), ['hot', 'mid']);
  // No pins set → null, which is the flag the grid reads to fall back to stars.
  assert.equal(shaped.pinnedRepos, null);
});

test('languages aggregate by repo count and carry GitHub own colour', () => {
  const shaped = shapeGitHubData(rawUser());
  assert.deepEqual(shaped.languages, [{ name: 'Go', repoCount: 2, color: '#00ADD8' }]);
});

test('the calendar is an ISO-keyed JSON string with zero-days dropped', () => {
  const calendar = JSON.parse(shapeGitHubData(rawUser()).contributionCalendar);
  assert.deepEqual(calendar, { '2026-08-20': 4 }, 'zero-count days are not stored');
});

test('a sparse response shapes without throwing', () => {
  // A brand-new account: no repos, no contributions, every optional field null.
  const shaped = shapeGitHubData({ login: 'newbie', repositories: { totalCount: 0, nodes: [] } });
  assert.equal(shaped.publicRepoCount, 0);
  assert.equal(shaped.totalStars, 0);
  assert.equal(shaped.totalContributions, 0);
  assert.deepEqual(shaped.languages, []);
  assert.deepEqual(shaped.topRepos, []);
  assert.equal(shaped.contributionCalendar, '{}');
});

// ── apply-time snapshot and the employer's clear ────────────────────────────
test('a missing application id or handle is a no-op, never a throw', async () => {
  assert.equal(await attachGitHubSnapshot(null, 'torvalds'), null);
  assert.equal(await attachGitHubSnapshot(new ObjectId(), null), null);
  assert.equal(await attachGitHubSnapshot(new ObjectId(), ''), null);
});

test('clearing nulls both fields on that application only', async () => {
  const companyId = new ObjectId();
  const applications = await col('applications');
  const { insertedId } = await applications.insertOne({
    companyId, githubUsername: 'torvalds', githubData: { username: 'torvalds', totalStars: 9 },
  });
  const other = await applications.insertOne({
    companyId, githubUsername: 'someone', githubData: { username: 'someone', totalStars: 1 },
  });

  assert.deepEqual(await clearApplicantGitHub(companyId, insertedId), { cleared: true });
  const cleared = await applications.findOne({ _id: insertedId });
  assert.equal(cleared.githubData, null);
  assert.equal(cleared.githubUsername, null, 'the handle goes too, so the box starts empty');
  assert.equal((await applications.findOne({ _id: other.insertedId })).githubData.totalStars, 1);
});

test('clearing across tenants is refused, not silently ignored', async () => {
  const applications = await col('applications');
  const { insertedId } = await applications.insertOne({
    companyId: new ObjectId(), githubData: { username: 'torvalds' },
  });

  await assert.rejects(
    () => clearApplicantGitHub(new ObjectId(), insertedId),
    (err) => err.status === 404 && err.code === 'APPLICATION_NOT_FOUND',
  );
  // And the row survives — a cross-tenant call must not be able to blank it.
  assert.ok((await applications.findOne({ _id: insertedId })).githubData);
});
