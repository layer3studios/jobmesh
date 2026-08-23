// FILE: tests/services/leetcode-service.test.js
// Username validation (which is also the GraphQL-injection guard) and the shaping
// of a raw LeetCode GraphQL response. Both are pure — no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  shapeLeetCodeData, validateLeetCodeUsername,
} from '../../src/services/seeker/leetcode-service.js';

const throwsInvalid = (value) => assert.throws(
  () => validateLeetCodeUsername(value),
  (err) => err.status === 400 && err.code === 'INVALID_LEETCODE_USERNAME',
);

// ── username validation ──────────────────────────────────────────────────────
test('accepts the characters LeetCode itself allows', () => {
  for (const name of ['neal_wu', 'a', 'User-Name_9', 'A'.repeat(20)]) {
    assert.equal(validateLeetCodeUsername(name), name);
  }
  assert.equal(validateLeetCodeUsername('  spaced  '), 'spaced', 'trims');
});

test('rejects anything that could break out of the GraphQL string', () => {
  // Each of these would terminate the quoted argument or inject a new field.
  for (const attack of [
    'x") { username } evil(username: "y',
    'name"',
    'name\\',
    'a}b',
    'a b',
    'näme',
  ]) {
    throwsInvalid(attack);
  }
});

test('rejects empty, over-long and non-string usernames', () => {
  for (const bad of ['', '   ', 'A'.repeat(21), null, undefined, 42, {}]) {
    throwsInvalid(bad);
  }
});

// ── shaping ──────────────────────────────────────────────────────────────────
const rawUser = (over = {}) => ({
  matchedUser: {
    username: 'neal_wu',
    profile: { ranking: 1234, reputation: 10, starRating: 4 },
    submitStatsGlobal: {
      acSubmissionNum: [
        { difficulty: 'All', count: 347 },
        { difficulty: 'Easy', count: 120 },
        { difficulty: 'Medium', count: 180 },
        { difficulty: 'Hard', count: 47 },
      ],
    },
    tagProblemCounts: {
      advanced: [{ tagName: 'Dynamic Programming', problemsSolved: 40 }],
      intermediate: [{ tagName: 'Graph', problemsSolved: 60 }],
      fundamental: [{ tagName: 'Array', problemsSolved: 90 }, { tagName: 'Unused', problemsSolved: 0 }],
    },
    languageProblemCount: [
      { languageName: 'Python3', problemsSolved: 200 },
      { languageName: 'Rust', problemsSolved: 0 },
      { languageName: 'C++', problemsSolved: 147 },
    ],
    userCalendar: { submissionCalendar: '{"1700000000":3}' },
    badges: [{ name: 'Annual Badge', icon: '/icon.png' }],
    ...over,
  },
  userContestRanking: {
    attendedContestsCount: 12, rating: 1847.6, globalRanking: 45678, topPercentage: 8.25,
  },
  userContestRankingHistory: [
    { attended: true, rating: 1500.2, ranking: 900, contest: { title: 'Weekly 1', startTime: 1600000000 } },
    { attended: false, rating: 1500.2, ranking: 0, contest: { title: 'Weekly 2', startTime: 1600600000 } },
    { attended: true, rating: 1847.6, ranking: 400, contest: { title: 'Weekly 3', startTime: 1601200000 } },
  ],
});

test('problem counts are read by difficulty, not by array position', () => {
  const shaped = shapeLeetCodeData(rawUser());
  assert.equal(shaped.totalSolved, 347);
  assert.equal(shaped.easySolved, 120);
  assert.equal(shaped.mediumSolved, 180);
  assert.equal(shaped.hardSolved, 47);
});

test('contest numbers are rounded for display, percentage to one decimal', () => {
  const shaped = shapeLeetCodeData(rawUser());
  assert.equal(shaped.contestRating, 1848);
  assert.equal(shaped.contestsAttended, 12);
  assert.equal(shaped.contestGlobalRanking, 45678);
  assert.equal(shaped.contestTopPercentage, 8.3);
});

test('contest history keeps only attended contests, in order', () => {
  const shaped = shapeLeetCodeData(rawUser());
  assert.equal(shaped.contestHistory.length, 2, 'the skipped contest is dropped');
  assert.deepEqual(shaped.contestHistory.map((c) => c.contestTitle), ['Weekly 1', 'Weekly 3']);
  assert.equal(shaped.contestHistory[0].rating, 1500);
  assert.match(shaped.contestHistory[0].date, /^2020-/);
});

test('history is capped at the last 20 contests', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({
    attended: true, rating: 1500 + i, ranking: i,
    contest: { title: `Weekly ${i}`, startTime: 1600000000 + i * 604800 },
  }));
  const shaped = shapeLeetCodeData({ ...rawUser(), userContestRankingHistory: many });
  assert.equal(shaped.contestHistory.length, 20);
  assert.equal(shaped.contestHistory.at(-1).contestTitle, 'Weekly 29', 'keeps the most RECENT');
});

test('skills merge all three tiers, sort by volume, and drop zeroes', () => {
  const shaped = shapeLeetCodeData(rawUser());
  assert.deepEqual(shaped.topSkills, [
    { name: 'Array', count: 90 },
    { name: 'Graph', count: 60 },
    { name: 'Dynamic Programming', count: 40 },
  ]);
});

test('languages drop the unused ones and sort by volume', () => {
  const shaped = shapeLeetCodeData(rawUser());
  assert.deepEqual(shaped.languages, [
    { name: 'Python3', count: 200 },
    { name: 'C++', count: 147 },
  ]);
});

test('a brand-new account shapes to zeroes rather than throwing', () => {
  const shaped = shapeLeetCodeData({
    matchedUser: {
      username: 'newbie',
      profile: {},
      submitStatsGlobal: { acSubmissionNum: [] },
      tagProblemCounts: {},
      languageProblemCount: [],
      userCalendar: null,
      badges: null,
    },
    userContestRanking: null,
    userContestRankingHistory: null,
  });
  assert.equal(shaped.totalSolved, 0);
  assert.equal(shaped.ranking, null);
  assert.equal(shaped.contestRating, null, 'never contested → no rating, not 0');
  assert.equal(shaped.contestsAttended, 0);
  assert.equal(shaped.contestGlobalRanking, null);
  assert.deepEqual(shaped.contestHistory, []);
  assert.deepEqual(shaped.topSkills, []);
  assert.deepEqual(shaped.languages, []);
  assert.equal(shaped.submissionCalendar, '{}');
  assert.deepEqual(shaped.badges, []);
});

test('an unrated account reports no rating', () => {
  const shaped = shapeLeetCodeData({
    ...rawUser(),
    userContestRanking: { attendedContestsCount: 0, rating: 0, globalRanking: null, topPercentage: null },
  });
  assert.equal(shaped.contestRating, null);
  assert.equal(shaped.contestTopPercentage, null);
});

test('a top-0.0% competitor keeps their percentage instead of losing it to a falsy check', () => {
  // Real case: neal_wu sits in the top 0.04%, which rounds to 0.0. A `value ? x : null`
  // check would delete the best stat on the page from the strongest candidates.
  const shaped = shapeLeetCodeData({
    ...rawUser(),
    userContestRanking: {
      attendedContestsCount: 51, rating: 3686, globalRanking: 12, topPercentage: 0.04,
    },
  });
  assert.equal(shaped.contestTopPercentage, 0);
  assert.notEqual(shaped.contestTopPercentage, null);
});
