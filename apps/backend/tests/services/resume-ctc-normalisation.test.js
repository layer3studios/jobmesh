// FILE: tests/services/resume-ctc-normalisation.test.js
// The parser prompt asks for CTC in LPA, and the model mostly complies — but
// the same prompt returned 38 for "38 LPA" in one run and 4500000 for "45 LPA"
// in another, on the same model. Storing both shapes in one field makes every
// salary comparison downstream silently wrong, so the unit is decided in code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { __testing } from '../../src/services/seeker/resume-parser-service.js';

const { ctc } = __testing;

test('a plain LPA figure is kept as-is', () => {
  assert.deepEqual(ctc({ amount: 38 }), { amount: 38, currency: 'INR' });
  assert.deepEqual(ctc({ amount: 4.5 }), { amount: 4.5, currency: 'INR' });
  assert.deepEqual(ctc({ amount: 120 }), { amount: 120, currency: 'INR' });
});

test('a rupee figure is converted to LPA', () => {
  // The exact case observed in production: "45 LPA" came back as 4500000.
  assert.deepEqual(ctc({ amount: 4500000 }), { amount: 45, currency: 'INR' });
  assert.deepEqual(ctc({ amount: 1250000 }), { amount: 12.5, currency: 'INR' });
});

test('the boundary is unambiguous in both directions', () => {
  // Five orders of magnitude separate the two scales, so nothing real sits
  // near the cutoff: 999 LPA is absurd but still read as LPA, and 1000 rupees
  // a year is absurd but still read as rupees. Neither occurs in a resume.
  assert.equal(ctc({ amount: 999 }).amount, 999);
  assert.equal(ctc({ amount: 1000 }).amount, 0.01);
});

test('a missing or unusable amount stays null', () => {
  assert.equal(ctc(null), null);
  assert.equal(ctc(undefined), null);
  assert.equal(ctc({}), null);
  assert.equal(ctc({ amount: null }), null);
  assert.equal(ctc({ amount: 'forty five' }), null);
  assert.equal(ctc('45 LPA'), null);
});

test('currency is always INR, whatever the model said', () => {
  assert.equal(ctc({ amount: 30, currency: 'USD' }).currency, 'INR');
});
