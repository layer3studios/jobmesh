// FILE: src/services/employer/screening-question-validators.js
// Validation for a posting's screening questions (employer side). Each rule throws
// HttpError(400, msg, CODE); the whole array is normalized and returned on success.
//
// A "knockout" answer FLAGS a candidate, it never rejects one. The word appears in
// the data model only — every employer-facing string says "flag", because an
// automatic rejection is not what this does and naming it that way would invite
// employers to trust it as one.

import { randomUUID } from 'node:crypto';
import { HttpError } from '../../middleware/error-handler-middleware.js';

export const MAXIMUM_SCREENING_QUESTIONS = 5;
export const MAXIMUM_QUESTION_TEXT_LENGTH = 300;
export const MAXIMUM_OPTION_LENGTH = 100;
export const MINIMUM_SELECT_OPTIONS = 2;
export const MAXIMUM_SELECT_OPTIONS = 6;

export const QUESTION_TYPES = Object.freeze(['text', 'single_select', 'yes_no']);

/** The implicit options of a yes_no question. Never stored, always derived. */
export const YES_NO_OPTIONS = Object.freeze(['Yes', 'No']);

const invalid = (message) => new HttpError(400, message, 'INVALID_SCREENING_QUESTIONS');

/** The options a candidate may choose from, whatever the question type. */
export function optionsFor(question) {
  if (question.questionType === 'yes_no') return [...YES_NO_OPTIONS];
  return Array.isArray(question.options) ? question.options : [];
}

function validateQuestionText(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed === '') throw invalid('Every screening question needs text.');
  if (trimmed.length > MAXIMUM_QUESTION_TEXT_LENGTH) {
    throw invalid(`A screening question must be ${MAXIMUM_QUESTION_TEXT_LENGTH} characters or fewer.`);
  }
  return trimmed;
}

/**
 * Options for a single_select. Duplicates are rejected rather than de-duplicated:
 * two identical choices means the employer mistyped one of them, and silently
 * merging them would change the question they think they asked.
 */
function validateOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) throw invalid('Multiple-choice questions need a list of options.');
  const options = rawOptions.map((option) => (typeof option === 'string' ? option.trim() : ''));
  if (options.some((option) => option === '')) throw invalid('Every option needs text.');
  if (options.some((option) => option.length > MAXIMUM_OPTION_LENGTH)) {
    throw invalid(`An option must be ${MAXIMUM_OPTION_LENGTH} characters or fewer.`);
  }
  if (options.length < MINIMUM_SELECT_OPTIONS || options.length > MAXIMUM_SELECT_OPTIONS) {
    throw invalid(`A multiple-choice question needs ${MINIMUM_SELECT_OPTIONS}–${MAXIMUM_SELECT_OPTIONS} options.`);
  }
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
    throw invalid('Options must be different from one another.');
  }
  return options;
}

/**
 * The answer that flags a candidate, or null.
 *
 * Only choice-based questions can carry one: matching free text exactly would flag
 * almost nobody and would mislead the employer into thinking it screens anything.
 * The value must be one of the question's own options, so a renamed option can
 * never leave a knockout pointing at a choice that no longer exists.
 */
function validateKnockoutAnswer(value, question, options) {
  if (value == null || value === '') return null;
  if (question.questionType === 'text') {
    throw invalid('A short-text question cannot flag an answer.');
  }
  const answer = String(value).trim();
  if (!options.includes(answer)) {
    throw invalid('The flagged answer must be one of the question’s options.');
  }
  return answer;
}

/** Validate + normalize ONE question. `order` is assigned by the caller. */
function validateQuestion(raw, order) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw invalid('Each screening question must be an object.');
  }
  if (!QUESTION_TYPES.includes(raw.questionType)) {
    throw invalid(`A screening question type must be one of: ${QUESTION_TYPES.join(', ')}.`);
  }

  const questionText = validateQuestionText(raw.questionText);
  // yes_no derives its options and text carries none — storing either would let the
  // two drift apart from what the candidate is actually shown.
  const options = raw.questionType === 'single_select' ? validateOptions(raw.options) : [];
  if (raw.questionType !== 'single_select' && Array.isArray(raw.options) && raw.options.length > 0) {
    throw invalid('Only multiple-choice questions can have options.');
  }

  const knockoutAnswer = validateKnockoutAnswer(
    raw.knockoutAnswer, { questionType: raw.questionType }, optionsFor({ questionType: raw.questionType, options }),
  );

  return {
    // Ids are stable across edits so an answer keeps pointing at its question.
    // Minted here when absent: the client should not be the source of identity.
    id: typeof raw.id === 'string' && raw.id.trim() !== '' ? raw.id.trim() : randomUUID(),
    questionText,
    questionType: raw.questionType,
    isRequired: raw.isRequired !== false,
    options,
    knockoutAnswer,
    order,
  };
}

/**
 * Validate a posting's whole screening-question list.
 *
 * null/undefined/[] all mean "no screening questions" and normalize to [], so the
 * apply page has exactly one falsy case to render around.
 *
 * `order` is REASSIGNED from array position rather than trusted: the editor sends
 * the full list in display order, and honouring a client-supplied order would let
 * a stale index scramble the sequence the candidate sees.
 */
export function validateScreeningQuestions(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw invalid('screeningQuestions must be a list.');
  if (value.length > MAXIMUM_SCREENING_QUESTIONS) {
    throw invalid(`A posting can have at most ${MAXIMUM_SCREENING_QUESTIONS} screening questions.`);
  }

  const questions = value.map((raw, index) => validateQuestion(raw, index + 1));
  if (new Set(questions.map((question) => question.id)).size !== questions.length) {
    throw invalid('Screening questions must have distinct ids.');
  }
  return questions;
}

/**
 * The candidate's view of a question. The knockout answer is REMOVED, not blanked:
 * telling someone which answer is "wrong" turns a screening question into a quiz
 * with a visible answer key, and every candidate would give the same reply.
 */
export function toPublicScreeningQuestion(question) {
  return {
    id: question.id,
    questionText: question.questionText,
    questionType: question.questionType,
    isRequired: question.isRequired !== false,
    options: optionsFor(question),
    order: question.order,
  };
}
