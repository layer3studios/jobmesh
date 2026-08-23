// FILE: tests/services/screening-questions.test.js
// Posting-side question validation and candidate-side answer validation. Pure
// functions — no database, no fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateScreeningQuestions, toPublicScreeningQuestion, optionsFor,
  MAXIMUM_SCREENING_QUESTIONS, MAXIMUM_QUESTION_TEXT_LENGTH,
} from '../../src/services/employer/screening-question-validators.js';
import {
  validateScreeningAnswers, hasKnockoutAnswers, readSubmittedAnswers,
  MAXIMUM_ANSWER_LENGTH,
} from '../../src/services/public/screening-answer-validators.js';

const textQuestion = (over = {}) => ({
  questionText: 'Why this role?', questionType: 'text', ...over,
});
const selectQuestion = (over = {}) => ({
  questionText: 'Do you have a work permit?', questionType: 'single_select',
  options: ['Yes', 'No', 'Applying'], ...over,
});
const yesNoQuestion = (over = {}) => ({
  questionText: 'Can you start within 30 days?', questionType: 'yes_no', ...over,
});

const throwsInvalid = (fn) => assert.throws(fn, (err) => err.code === 'INVALID_SCREENING_QUESTIONS');

// ── question validation ──────────────────────────────────────────────────────
test('null / undefined / [] all normalize to no questions', () => {
  for (const value of [null, undefined, []]) {
    assert.deepEqual(validateScreeningQuestions(value), []);
  }
});

test('order is reassigned from array position, ignoring what the client sent', () => {
  const questions = validateScreeningQuestions([
    textQuestion({ order: 99 }), selectQuestion({ order: 1 }), yesNoQuestion({ order: 50 }),
  ]);
  assert.deepEqual(questions.map((q) => q.order), [1, 2, 3]);
});

test('a missing id is minted, and a supplied one is preserved', () => {
  const [minted, kept] = validateScreeningQuestions([
    textQuestion(), selectQuestion({ id: 'stable-id' }),
  ]);
  assert.match(minted.id, /^[0-9a-f-]{36}$/);
  assert.equal(kept.id, 'stable-id');
});

test('at most five questions', () => {
  const five = Array.from({ length: MAXIMUM_SCREENING_QUESTIONS }, () => textQuestion());
  assert.equal(validateScreeningQuestions(five).length, MAXIMUM_SCREENING_QUESTIONS);
  throwsInvalid(() => validateScreeningQuestions([...five, textQuestion()]));
});

test('question text is required and length-capped', () => {
  throwsInvalid(() => validateScreeningQuestions([textQuestion({ questionText: '   ' })]));
  throwsInvalid(() => validateScreeningQuestions([
    textQuestion({ questionText: 'x'.repeat(MAXIMUM_QUESTION_TEXT_LENGTH + 1) }),
  ]));
});

test('single_select needs 2–6 distinct, non-empty options', () => {
  throwsInvalid(() => validateScreeningQuestions([selectQuestion({ options: ['Only one'] })]));
  throwsInvalid(() => validateScreeningQuestions([selectQuestion({ options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] })]));
  throwsInvalid(() => validateScreeningQuestions([selectQuestion({ options: ['Yes', '  '] })]));
  // Duplicates are rejected rather than merged — a repeat means a typo.
  throwsInvalid(() => validateScreeningQuestions([selectQuestion({ options: ['Yes', 'yes'] })]));
});

test('only single_select may carry options; yes_no derives its own', () => {
  throwsInvalid(() => validateScreeningQuestions([textQuestion({ options: ['a', 'b'] })]));
  throwsInvalid(() => validateScreeningQuestions([yesNoQuestion({ options: ['a', 'b'] })]));
  const [yesNo] = validateScreeningQuestions([yesNoQuestion()]);
  assert.deepEqual(yesNo.options, [], 'derived, never stored');
  assert.deepEqual(optionsFor(yesNo), ['Yes', 'No']);
});

test('a knockout answer must be one of the question’s own options', () => {
  const [ok] = validateScreeningQuestions([selectQuestion({ knockoutAnswer: 'No' })]);
  assert.equal(ok.knockoutAnswer, 'No');
  const [yesNo] = validateScreeningQuestions([yesNoQuestion({ knockoutAnswer: 'No' })]);
  assert.equal(yesNo.knockoutAnswer, 'No');

  throwsInvalid(() => validateScreeningQuestions([selectQuestion({ knockoutAnswer: 'Maybe' })]));
  // Free text cannot be flagged — an exact string match would flag almost nobody.
  throwsInvalid(() => validateScreeningQuestions([textQuestion({ knockoutAnswer: 'no' })]));
});

test('an unknown question type is rejected', () => {
  throwsInvalid(() => validateScreeningQuestions([textQuestion({ questionType: 'ranking' })]));
});

test('toPublicScreeningQuestion never leaks the knockout answer', () => {
  const [question] = validateScreeningQuestions([selectQuestion({ knockoutAnswer: 'No' })]);
  const publicShape = toPublicScreeningQuestion(question);
  assert.equal('knockoutAnswer' in publicShape, false);
  assert.deepEqual(publicShape.options, ['Yes', 'No', 'Applying']);
});

// ── answer validation ────────────────────────────────────────────────────────
test('readSubmittedAnswers picks up only screening_ fields', () => {
  const answers = readSubmittedAnswers({ screening_abc: 'Yes', email: 'x@y.z', screening_: 'skip' });
  assert.deepEqual([...answers.entries()], [['abc', 'Yes']]);
});

test('a posting with no questions records nothing', () => {
  assert.deepEqual(validateScreeningAnswers([], { screening_x: 'Yes' }), []);
  assert.deepEqual(validateScreeningAnswers(null, {}), []);
});

test('answers snapshot the question text and flag the knockout', () => {
  const questions = validateScreeningQuestions([
    selectQuestion({ id: 'q1', knockoutAnswer: 'No' }), textQuestion({ id: 'q2' }),
  ]);
  const answers = validateScreeningAnswers(questions, { screening_q1: 'No', screening_q2: 'Because.' });

  assert.equal(answers.length, 2);
  assert.equal(answers[0].questionText, 'Do you have a work permit?', 'text is snapshotted');
  assert.equal(answers[0].isKnockout, true);
  assert.equal(answers[1].isKnockout, false);
  assert.equal(hasKnockoutAnswers(answers), true);
});

test('only the exact knockout answer flags — other "wrong" answers do not', () => {
  const questions = validateScreeningQuestions([selectQuestion({ id: 'q1', knockoutAnswer: 'No' })]);
  const answers = validateScreeningAnswers(questions, { screening_q1: 'Applying' });
  assert.equal(answers[0].isKnockout, false);
  assert.equal(hasKnockoutAnswers(answers), false);
});

test('a required question must be answered; an optional one may be skipped', () => {
  const required = validateScreeningQuestions([textQuestion({ id: 'q1' })]);
  assert.throws(
    () => validateScreeningAnswers(required, {}),
    (err) => err.status === 400 && err.code === 'INVALID_SCREENING_ANSWERS',
  );

  const optional = validateScreeningQuestions([textQuestion({ id: 'q1', isRequired: false })]);
  assert.deepEqual(validateScreeningAnswers(optional, {}), []);
});

test('a choice answer must be one of the offered options', () => {
  const questions = validateScreeningQuestions([selectQuestion({ id: 'q1' })]);
  assert.throws(
    () => validateScreeningAnswers(questions, { screening_q1: 'Something else' }),
    (err) => err.code === 'INVALID_SCREENING_ANSWERS',
  );
  const yesNo = validateScreeningQuestions([yesNoQuestion({ id: 'q1' })]);
  assert.throws(
    () => validateScreeningAnswers(yesNo, { screening_q1: 'Maybe' }),
    (err) => err.code === 'INVALID_SCREENING_ANSWERS',
  );
});

test('a text answer is length-capped', () => {
  const questions = validateScreeningQuestions([textQuestion({ id: 'q1' })]);
  assert.throws(
    () => validateScreeningAnswers(questions, { screening_q1: 'x'.repeat(MAXIMUM_ANSWER_LENGTH + 1) }),
    (err) => err.code === 'INVALID_SCREENING_ANSWERS',
  );
});

test('a stale answer for a deleted question is ignored, not rejected', () => {
  // The candidate cannot fix a question the employer removed mid-session.
  const questions = validateScreeningQuestions([textQuestion({ id: 'q1' })]);
  const answers = validateScreeningAnswers(questions, { screening_q1: 'Here', screening_gone: 'Stale' });
  assert.equal(answers.length, 1);
  assert.equal(answers[0].questionId, 'q1');
});

test('answers are recorded in question order regardless of submission order', () => {
  const questions = validateScreeningQuestions([
    textQuestion({ id: 'first' }), textQuestion({ id: 'second' }),
  ]);
  const answers = validateScreeningAnswers(questions, { screening_second: 'B', screening_first: 'A' });
  assert.deepEqual(answers.map((answer) => answer.questionId), ['first', 'second']);
});
