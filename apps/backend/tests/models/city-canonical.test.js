// FILE: tests/models/city-canonical.test.js
// The City filter's two halves must agree. Every case below was a pill observed
// live on jobmesh.in before the fix — the counts in the comments are real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCity, cityMatchTerms, CITY_ALIASES } from '../../src/Db/jobs/city-canonical.js';

// ─── The contract ───────────────────────────────────────────────────────────

test('THE CONTRACT: every spelling that feeds a pill is matched by that pill', () => {
  // This is the bug the module exists to prevent. The facet merges Bangalore
  // into the Bengaluru pill, so the filter behind that pill MUST also match
  // "Bangalore" — otherwise it reads 1,567 and returns 856.
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    const terms = cityMatchTerms(canonical);
    for (const alias of aliases) {
      assert.ok(
        terms.includes(alias),
        `pill "${canonical}" counts "${alias}" but would not match it`,
      );
    }
    // And the reverse: anything that canonicalises to this city is matched by it.
    for (const alias of aliases) {
      assert.equal(
        canonicalCity(alias), canonical,
        `"${alias}" must land on the ${canonical} pill`,
      );
    }
  }
});

test('picking an alias as the filter value behaves like picking the canonical', () => {
  // The UI sends the pill label, but a saved link or a hand-typed ?loc= may
  // carry an alias. Both must return the same jobs.
  assert.deepEqual(cityMatchTerms('Bangalore'), cityMatchTerms('Bengaluru'));
  assert.deepEqual(cityMatchTerms('Gurgaon'), cityMatchTerms('Gurugram'));
});

// ─── The duplicates that were live ──────────────────────────────────────────

test('merges renamed cities that were two pills', () => {
  // Bengaluru(856) + Bangalore(711) were separate: filtering one hid the other.
  assert.equal(canonicalCity('Bangalore'), 'Bengaluru');
  assert.equal(canonicalCity('Bengaluru'), 'Bengaluru');
  // Gurugram(89) + Gurgaon(13).
  assert.equal(canonicalCity('Gurgaon'), 'Gurugram');
  // Vizag(12) is Visakhapatnam.
  assert.equal(canonicalCity('Vizag'), 'Visakhapatnam');
  assert.equal(canonicalCity('Calcutta'), 'Kolkata');
  assert.equal(canonicalCity('Trivandrum'), 'Thiruvananthapuram');
});

test('country names and CODES are not cities', () => {
  // "IND"(50) and "IN"(36) were both offered as cities to click.
  for (const raw of ['IND', 'IN', 'India', 'india', 'APAC', 'Global']) {
    assert.equal(canonicalCity(raw), null, `${raw} must not be a city`);
  }
});

test('a work mode is not a city, even welded to one', () => {
  // "Mumbai Remote"(13) and "Hybrid in Bangalore"(11) were their own pills.
  assert.equal(canonicalCity('Mumbai Remote'), 'Mumbai');
  assert.equal(canonicalCity('Hybrid in Bangalore'), 'Bengaluru');
  assert.equal(canonicalCity('Remote'), null);
  assert.equal(canonicalCity('In-Office'), null);
  assert.equal(canonicalCity('Work From Home'), null);
});

test('a campus or office park resolves to its city', () => {
  // "Manyata Embassy Business Park"(11) and "Nanakramguda"(19) were pills.
  assert.equal(canonicalCity('Manyata Embassy Business Park'), 'Bengaluru');
  assert.equal(canonicalCity('Nanakramguda'), 'Hyderabad');
  // Embedded in a longer segment, which is how employers actually write them.
  assert.equal(canonicalCity('Bengaluru-EPIP Industrial Area'), 'Bengaluru');
  assert.equal(canonicalCity('Hyderabad-Waverock'), 'Hyderabad');
  assert.equal(canonicalCity('Chennai ITEC'), 'Chennai');
  assert.equal(canonicalCity('New Delhi Country Program Office'), 'Delhi');
});

test('casing is normalised for display', () => {
  // "PUNE"(250) and "NOIDA"(131) were shouting on the filter bar.
  assert.equal(canonicalCity('PUNE'), 'Pune');
  assert.equal(canonicalCity('NOIDA'), 'Noida');
});

// ─── Unchanged good behaviour ───────────────────────────────────────────────

test('still takes the city out of a full location string', () => {
  assert.equal(canonicalCity('Bengaluru, Karnataka, India'), 'Bengaluru');
  assert.equal(canonicalCity('India - Hyderabad'), 'Hyderabad');
  assert.equal(canonicalCity('Pune, India'), 'Pune');
});

test('still rejects junk', () => {
  for (const raw of ['12345', 'https://example.com/jobs', '#4821', 'published', 'null', '']) {
    assert.equal(canonicalCity(raw), null, `${raw} must be rejected`);
  }
  for (const raw of [null, undefined, 42, {}, []]) {
    assert.equal(canonicalCity(raw), null);
  }
});

test('a city not in the table is still usable, and matches only itself', () => {
  // The table cannot list every town, so an unknown name must survive.
  assert.equal(canonicalCity('Erode'), 'Erode');
  assert.deepEqual(cityMatchTerms('Erode'), ['Erode']);
  assert.equal(canonicalCity('Sanand'), 'Sanand'); // 38 live jobs
});

test('match terms are compared case-insensitively by the caller', () => {
  // Terms come out of the table lower-cased; jobs-query-builder.js applies them
  // with $options:'i', so a lower-case term still matches "Bangalore" in a
  // Location string. This asserts the shape the query builder relies on.
  const terms = cityMatchTerms('Bengaluru');
  assert.ok(terms.includes('bangalore'));
  assert.ok(terms.every((t) => typeof t === 'string' && t.length > 0));
});

test('short aliases cannot fire inside an unrelated word', () => {
  // 'in', 'blr', 'hyd', 'ncr' are aliases; the embedded-match pass skips
  // anything under 4 characters so "Indore" never becomes Delhi via 'ncr'.
  assert.equal(canonicalCity('Indore'), 'Indore');
  assert.equal(canonicalCity('Vincent Nagar'), 'Vincent Nagar');
});
