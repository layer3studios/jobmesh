// FILE: src/services/public/screening-answer-validators.js
// Validates a candidate's screening answers against the posting's questions and
// snapshots them onto the application.
//
// THE SNAPSHOT IS THE POINT. Each answer stores the question TEXT as it stood when
// the candidate answered it. An employer editing the wording, reordering, or
// deleting a question later must never change what an existing applicant appears
// to have been asked — the answer would otherwise silently re-attach to different
// words, which is the one thing that would make this data untrustworthy.

import { HttpError } from '../../middleware/error-handler-middleware.js';
import { optionsFor } from '../employer/screening-question-validators.js';

export const MAXIMUM_ANSWER_LENGTH = 500;

const invalid = (message) => new HttpError(400, message, 'INVALID_SCREENING_ANSWERS');

/**
 * Pull the answers out of the submitted form.
 *
 * multipart cannot carry nested objects, so the apply form sends one flat field
 * per question: `screening_<questionId>`. That keeps the transport identical to
 * every other field on this form — no JSON blob to parse, no shape to trust.
 */
export function readSubmittedAnswers(form = {}) {
  const answers = new Map();
  for (const [key, value] of Object.entries(form)) {
    if (!key.startsWith('screening_')) continue;
    const questionId = key.slice('screening_'.length);
    if (questionId) answers.set(questionId, Array.isArray(value) ? value[0] : value);
  }
  return answers;
}

/** One answer, validated against its question and flagged if it matches the knockout. */
function validateAnswer(question, rawAnswer) {
  const answer = String(rawAnswer ?? '').trim();

  if (answer === '') {
    if (question.isRequired !== false) {
      throw invalid(`Please answer: ${question.questionText}`);
    }
    return null; // optional and skipped — nothing to record
  }

  if (answer.length > MAXIMUM_ANSWER_LENGTH) {
    throw invalid(`An answer must be ${MAXIMUM_ANSWER_LENGTH} characters or fewer.`);
  }

  // A choice question only accepts its own options. Anything else is either a
  // stale form or a hand-crafted request; both are the same error to the candidate.
  const options = optionsFor(question);
  if (options.length > 0 && !options.includes(answer)) {
    throw invalid(`Choose one of the given options for: ${question.questionText}`);
  }

  return {
    questionId: question.id,
    // Snapshot — see the file header.
    questionText: question.questionText,
    answer,
    // Exact match only. A knockout marks the ONE answer the employer said to flag;
    // every other answer they might dislike is left for a human to read, which is
    // why this flags for review rather than rejecting.
    isKnockout: question.knockoutAnswer != null && answer === question.knockoutAnswer,
  };
}

/**
 * Validate every answer for a posting. Returns the array to store on the
 * application — [] when the posting asks nothing, which is the common case.
 *
 * Unknown submitted keys are ignored rather than rejected: a candidate with a
 * stale tab answering a question that has since been deleted should still be able
 * to apply, and there is nothing they could do about it either way.
 */
export function validateScreeningAnswers(questions, form = {}) {
  const list = Array.isArray(questions) ? questions : [];
  if (list.length === 0) return [];

  const submitted = readSubmittedAnswers(form);
  const answers = [];
  for (const question of [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    const validated = validateAnswer(question, submitted.get(question.id));
    if (validated) answers.push(validated);
  }
  return answers;
}

/** True when any answer tripped a flag. Drives the review banner and the row icon. */
export function hasKnockoutAnswers(answers) {
  return Array.isArray(answers) && answers.some((answer) => answer.isKnockout === true);
}
