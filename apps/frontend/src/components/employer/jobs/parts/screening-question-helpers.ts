// FILE: src/components/employer/jobs/parts/screening-question-helpers.ts
// Pure helpers for the screening-question editor: creating, mutating and
// validating the list client-side. Mirrors screening-question-validators.js on the
// backend — the server is the real gate, these keep the editor from offering a
// shape it would reject.

import {
  MAXIMUM_SELECT_OPTIONS, MINIMUM_SELECT_OPTIONS, MAXIMUM_QUESTION_TEXT_LENGTH,
  type ScreeningQuestion, type ScreeningQuestionType,
} from '@/types/employer-jobs';

/** The two implicit choices of a yes/no question. Never stored on the question. */
export const YES_NO_OPTIONS = ['Yes', 'No'] as const;

/** What a candidate can pick, whatever the type. Empty for free text. */
export function optionsFor(question: ScreeningQuestion): string[] {
  if (question.questionType === 'yes_no') return [...YES_NO_OPTIONS];
  return question.questionType === 'single_select' ? question.options : [];
}

/** Only choice questions can flag an answer — matching free text exactly is useless. */
export function canFlagAnswer(question: ScreeningQuestion): boolean {
  return question.questionType !== 'text';
}

/**
 * A new blank question. The id is a client-side placeholder: the backend keeps a
 * supplied id, so this one survives the save and answers stay attached to it.
 */
export function createQuestion(order: number): ScreeningQuestion {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `q-${Date.now()}-${order}`),
    questionText: '',
    questionType: 'text',
    isRequired: true,
    options: [],
    knockoutAnswer: null,
    order,
  };
}

/**
 * Change a question's type, resetting the fields that no longer apply.
 *
 * The knockout is CLEARED on every type change: it names one of the old type's
 * options, and carrying it across would leave a flag pointing at a choice the
 * question no longer offers.
 */
export function changeQuestionType(
  question: ScreeningQuestion, questionType: ScreeningQuestionType,
): ScreeningQuestion {
  const options = questionType === 'single_select'
    // Seed the minimum so the editor opens with something to fill in rather than
    // an empty list the employer has to discover they must populate.
    ? (question.options.length >= MINIMUM_SELECT_OPTIONS ? question.options : ['', ''])
    : [];
  return { ...question, questionType, options, knockoutAnswer: null };
}

/** Replace one option, dropping a knockout that pointed at the old wording. */
export function setOption(question: ScreeningQuestion, index: number, value: string): ScreeningQuestion {
  const previous = question.options[index];
  const options = question.options.map((option, i) => (i === index ? value : option));
  const knockoutAnswer = question.knockoutAnswer === previous ? null : question.knockoutAnswer;
  return { ...question, options, knockoutAnswer };
}

export function addOption(question: ScreeningQuestion): ScreeningQuestion {
  if (question.options.length >= MAXIMUM_SELECT_OPTIONS) return question;
  return { ...question, options: [...question.options, ''] };
}

export function removeOption(question: ScreeningQuestion, index: number): ScreeningQuestion {
  if (question.options.length <= MINIMUM_SELECT_OPTIONS) return question;
  const removed = question.options[index];
  return {
    ...question,
    options: question.options.filter((_, i) => i !== index),
    knockoutAnswer: question.knockoutAnswer === removed ? null : question.knockoutAnswer,
  };
}

/** Move a question one slot and renumber the whole list from its new positions. */
export function moveQuestion(
  questions: ScreeningQuestion[], index: number, direction: -1 | 1,
): ScreeningQuestion[] {
  const target = index + direction;
  if (target < 0 || target >= questions.length) return questions;
  const next = [...questions];
  [next[index], next[target]] = [next[target], next[index]];
  return renumber(next);
}

/** Order always mirrors array position — the backend recomputes it the same way. */
export function renumber(questions: ScreeningQuestion[]): ScreeningQuestion[] {
  return questions.map((question, index) => ({ ...question, order: index + 1 }));
}

/**
 * The first problem with a question, or undefined. One message at a time: a form
 * row this small cannot show three errors without becoming unreadable.
 */
export function questionError(question: ScreeningQuestion): string | undefined {
  if (question.questionText.trim() === '') return 'Add the question text.';
  if (question.questionText.trim().length > MAXIMUM_QUESTION_TEXT_LENGTH) {
    return `Keep it to ${MAXIMUM_QUESTION_TEXT_LENGTH} characters.`;
  }
  if (question.questionType !== 'single_select') return undefined;

  const options = question.options.map((option) => option.trim());
  if (options.some((option) => option === '')) return 'Fill in every choice.';
  if (options.length < MINIMUM_SELECT_OPTIONS) return `Add at least ${MINIMUM_SELECT_OPTIONS} choices.`;
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
    return 'Choices must be different.';
  }
  return undefined;
}

/** True when every question is submittable. */
export function areQuestionsValid(questions: ScreeningQuestion[]): boolean {
  return questions.every((question) => questionError(question) === undefined);
}

/** Trim before sending, so trailing spaces never become part of a stored option. */
export function normalizeForSave(questions: ScreeningQuestion[]): ScreeningQuestion[] {
  return renumber(questions).map((question) => ({
    ...question,
    questionText: question.questionText.trim(),
    options: question.questionType === 'single_select'
      ? question.options.map((option) => option.trim())
      : [],
  }));
}
