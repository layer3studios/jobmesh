// The City pills on /jobs come from these strings. Every case here was a pill
// a seeker could actually click: "published", "In-Office" and a second
// "India - Hyderabad" sitting next to the real "Hyderabad".
import test from 'node:test';
import assert from 'node:assert/strict';
import { __testing } from '../../src/Db/jobs/queries.js';

const { extractCity } = __testing;

test('takes the city out of a comma-separated location', () => {
  assert.equal(extractCity('Bengaluru, Karnataka, India'), 'Bengaluru');
  assert.equal(extractCity('Pune, India'), 'Pune');
  assert.equal(extractCity('Gurugram, Haryana, India'), 'Gurugram');
});

test('splits on a spaced dash, so a country prefix does not become a city', () => {
  assert.equal(extractCity('India - Hyderabad'), 'Hyderabad');
  assert.equal(extractCity('India – Bengaluru'), 'Bengaluru');
  assert.equal(extractCity('Remote - Chennai'), 'Chennai');
});

test('skips work modes and keeps looking for a real city', () => {
  assert.equal(extractCity('Remote, Mumbai'), 'Mumbai');
  assert.equal(extractCity('Hybrid | Noida'), 'Noida');
  assert.equal(extractCity('On-site/Kochi'), 'Kochi');
});

test('rejects a location that names no city at all', () => {
  for (const raw of ['Remote', 'India', 'Anywhere', 'Pan India', 'In-Office', 'work from home', 'N/A', '']) {
    assert.equal(extractCity(raw), null, `expected no city from ${JSON.stringify(raw)}`);
  }
});

test('rejects a field name a broken mapper wrote into Location', () => {
  for (const raw of ['published', 'active', 'null', 'undefined', 'location']) {
    assert.equal(extractCity(raw), null, `expected no city from ${JSON.stringify(raw)}`);
  }
});

test('rejects things that are not shaped like a place name', () => {
  assert.equal(extractCity('12345'), null);
  assert.equal(extractCity('https://example.com/jobs'), null);
  assert.equal(extractCity('#4821'), null);
});

test('keeps real names that carry punctuation', () => {
  assert.equal(extractCity("Bengaluru's Whitefield"), "Bengaluru's Whitefield");
  assert.equal(extractCity('Thiruvananthapuram'), 'Thiruvananthapuram');
  assert.equal(extractCity('Navi Mumbai, Maharashtra'), 'Navi Mumbai');
});

test('handles the values that are not strings at all', () => {
  for (const raw of [null, undefined, 42, {}, []]) {
    assert.equal(extractCity(raw), null);
  }
});
