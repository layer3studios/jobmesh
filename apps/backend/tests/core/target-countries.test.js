// FILE: tests/core/target-countries.test.js
// One registry decides which countries the scraper keeps. These tests pin the
// behaviour that was wrong before it existed: a substring test let "IN" match
// "Indianapolis", so US cities reached an India-only board.
import test from 'node:test';
import assert from 'node:assert/strict';
import { countryOf, isTargetLocation, COUNTRIES, ENABLED_COUNTRIES } from '../../src/core/target-countries.js';

const ALL = Object.keys(COUNTRIES);

test('recognises each country by its own name', () => {
  assert.equal(countryOf('Bengaluru, Karnataka, India', ALL), 'IN');
  assert.equal(countryOf('London, United Kingdom', ALL), 'GB');
  assert.equal(countryOf('Toronto, Canada', ALL), 'CA');
  assert.equal(countryOf('Sydney, Australia', ALL), 'AU');
  assert.equal(countryOf('Dublin, Ireland', ALL), 'IE');
  assert.equal(countryOf('Singapore', ALL), 'SG');
  assert.equal(countryOf('Auckland, New Zealand', ALL), 'NZ');
  assert.equal(countryOf('Dubai, UAE', ALL), 'AE');
  assert.equal(countryOf('Cape Town, South Africa', ALL), 'ZA');
});

test('recognises a city without the country named', () => {
  assert.equal(countryOf('Hyderabad', ALL), 'IN');
  assert.equal(countryOf('Manchester', ALL), 'GB');
  assert.equal(countryOf('Vancouver', ALL), 'CA');
  assert.equal(countryOf('Austin', ALL), 'US');
});

test('MATCHES WHOLE WORDS ONLY — the bug that put US cities on an India board', () => {
  // "Indianapolis IN" contains the substring "ind" and the token "IN". The old
  // test matched both and filed it under India; 12 such listings were live.
  assert.notEqual(countryOf('Indianapolis, IN', ALL), 'IN');
  // It resolves to US through the CITY name, never through the "IN" code:
  // that code is Indiana to one employer and India to another, and the string
  // cannot settle which. City names carry the match instead.
  assert.equal(countryOf('Indianapolis, IN', ALL), 'US');
  // And the same code next to an Indian city still reads as India.
  assert.equal(countryOf('Bengaluru, IN', ALL), 'IN');
  // Short codes must not fire inside longer words.
  assert.equal(countryOf('Indiana University', ['IN']), null);
  assert.equal(countryOf('Paducah', ['GB']), null, '"uk" must not match inside Paducah');
});

test('prefers the longest matching term', () => {
  // "new york city" must win over "new york", and "new zealand" must not be
  // confused with "new york".
  assert.equal(countryOf('New York City', ALL), 'US');
  assert.equal(countryOf('Wellington, New Zealand', ALL), 'NZ');
});

test('a remote or unspecified location is kept but belongs to no country', () => {
  for (const raw of ['Remote', 'Work from home', 'Anywhere', 'Worldwide']) {
    assert.equal(countryOf(raw, ALL), null, `${raw} names no country`);
    assert.equal(isTargetLocation(raw, ALL), true, `${raw} must still be kept`);
  }
  // This is the behaviour change: "Remote" used to sit in the Indian location
  // list, so a remote job in Berlin counted as Indian.
});

test('an unrelated location is rejected', () => {
  for (const raw of ['Berlin, Germany', 'Tokyo, Japan', 'São Paulo, Brazil', 'Paris, France']) {
    assert.equal(isTargetLocation(raw, ALL), false, `${raw} must be rejected`);
  }
});

test('only ENABLED countries match', () => {
  assert.equal(countryOf('London, United Kingdom', ['IN']), null);
  assert.equal(isTargetLocation('London, United Kingdom', ['IN']), false);
  assert.equal(countryOf('London, United Kingdom', ['IN', 'GB']), 'GB');
});

test('the enabled list defaults to India and is a subset of the registry', () => {
  for (const code of ENABLED_COUNTRIES) {
    assert.ok(Object.hasOwn(COUNTRIES, code), `${code} must be a known country`);
  }
});

test('junk input is rejected without throwing', () => {
  for (const raw of [null, undefined, '', '   ', 42, {}, []]) {
    assert.equal(isTargetLocation(raw, ALL), false);
    assert.equal(countryOf(raw, ALL), null);
  }
});
