// FILE: assignments/parts/assignment-form-helpers.ts
// Pure client-side validation for the assignment form.
//
// EVERY RULE HERE MIRRORS src/services/employer/assignment-validators.js in the
// backend repo. That file is the authority — it re-validates on an authenticated
// endpoint and nothing here is a security control. These exist so the employer sees
// a length problem before spending a round trip on it, and so the error codes match
// what the server would have sent (buildCreateInput / buildPatch).
//
// Order matters and matches the backend's clean(): strip control characters, THEN
// trim, THEN measure. Invisible padding must never buy a short field its way past a
// minimum.

import { ALLOWED_FILE_TYPES } from '@/types/employer-assignments';
import type { AssignmentCreateInput } from '@/types/employer-assignments';

export const TITLE_MIN = 2;
export const TITLE_MAX = 120;
export const PUBLIC_SUMMARY_MIN = 10;
export const PUBLIC_SUMMARY_MAX = 300;
export const DESCRIPTION_MIN = 50;
export const DESCRIPTION_MAX = 20000;
export const INSTRUCTIONS_MAX = 5000;
export const ESTIMATED_HOURS_MIN = 1;
export const ESTIMATED_HOURS_MAX = 8;

/**
 * Above this many hours we caution but never block. Drop-off climbs sharply past a
 * few hours of unpaid work, and a candidate applying to several roles at once is
 * choosing between them on exactly this number.
 */
export const ESTIMATED_HOURS_CAUTION_ABOVE = 3;

// Control chars except tab (\t = \x09) and newline (\n = \x0A). Mirrors the backend.
const CONTROL_CHARACTERS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Strip control characters, then trim. Exported so the submit path normalizes identically. */
export function clean(value: string): string {
  return String(value ?? '').replace(CONTROL_CHARACTERS, '').trim();
}

export type AssignmentField =
  | 'title' | 'publicSummary' | 'descriptionMarkdown'
  | 'submissionInstructionsMarkdown' | 'estimatedHours' | 'allowedFileTypes';

export interface FieldError {
  /** The backend's stable error code, so a server 400 maps onto the same field. */
  code: string;
  message: string;
}

export type AssignmentErrors = Partial<Record<AssignmentField, FieldError>>;

export interface AssignmentValidation {
  errors: AssignmentErrors;
  /** Non-blocking advisories, keyed by field. Never prevents a submit. */
  warnings: Partial<Record<AssignmentField, string>>;
  valid: boolean;
}

/** The backend 400 code for each field, so mapServerFieldError can reverse it. */
const CODE_TO_FIELD: Record<string, AssignmentField> = {
  INVALID_TITLE: 'title',
  INVALID_PUBLIC_SUMMARY: 'publicSummary',
  INVALID_DESCRIPTION: 'descriptionMarkdown',
  INVALID_INSTRUCTIONS: 'submissionInstructionsMarkdown',
  INVALID_ESTIMATED_HOURS: 'estimatedHours',
  INVALID_FILE_TYPES: 'allowedFileTypes',
};

/** Map a backend 400 code onto the field it belongs to, or null when unknown. */
export function fieldForServerCode(code: string | null): AssignmentField | null {
  if (!code) return null;
  return CODE_TO_FIELD[code] ?? null;
}

/**
 * The description deliberately does NOT reject '<script'. It is markdown rendered by
 * react-markdown with raw HTML disabled, so a script tag comes out as inert text,
 * and a frontend take-home legitimately contains one inside a fenced code block.
 * Rejecting it would break a real use case to prevent nothing. The backend makes the
 * same call and says so at length — do not "harden" either side.
 */
export function validateAssignmentForm(input: AssignmentCreateInput): AssignmentValidation {
  const errors: AssignmentErrors = {};
  const warnings: AssignmentValidation['warnings'] = {};

  const title = clean(input.title);
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    errors.title = { code: 'INVALID_TITLE', message: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters.` };
  }

  const publicSummary = clean(input.publicSummary);
  if (publicSummary.length < PUBLIC_SUMMARY_MIN || publicSummary.length > PUBLIC_SUMMARY_MAX) {
    errors.publicSummary = {
      code: 'INVALID_PUBLIC_SUMMARY',
      message: `Public summary must be ${PUBLIC_SUMMARY_MIN}-${PUBLIC_SUMMARY_MAX} characters.`,
    };
  }

  const description = clean(input.descriptionMarkdown);
  if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) {
    errors.descriptionMarkdown = {
      code: 'INVALID_DESCRIPTION',
      message: `Description must be ${DESCRIPTION_MIN}-${DESCRIPTION_MAX} characters.`,
    };
  }

  // Optional — absent is valid, only the ceiling is enforced.
  const instructions = clean(input.submissionInstructionsMarkdown ?? '');
  if (instructions.length > INSTRUCTIONS_MAX) {
    errors.submissionInstructionsMarkdown = {
      code: 'INVALID_INSTRUCTIONS',
      message: `Submission instructions must be ${INSTRUCTIONS_MAX} characters or fewer.`,
    };
  }

  // Integer only — 2.5 and '2' are both refused, matching the backend's no-coercion rule.
  const hours = input.estimatedHours;
  if (!Number.isInteger(hours) || hours < ESTIMATED_HOURS_MIN || hours > ESTIMATED_HOURS_MAX) {
    errors.estimatedHours = {
      code: 'INVALID_ESTIMATED_HOURS',
      message: `Estimated hours must be a whole number between ${ESTIMATED_HOURS_MIN} and ${ESTIMATED_HOURS_MAX}.`,
    };
  } else if (hours > ESTIMATED_HOURS_CAUTION_ABOVE) {
    warnings.estimatedHours =
      'Longer tasks see sharply higher drop-off. Most candidates are applying to several roles.';
  }

  const fileTypes = input.allowedFileTypes ?? [];
  if (!Array.isArray(fileTypes) || fileTypes.some((type) => !ALLOWED_FILE_TYPES.includes(type as never))) {
    errors.allowedFileTypes = {
      code: 'INVALID_FILE_TYPES',
      message: `Allowed file types must be a subset of ${ALLOWED_FILE_TYPES.join(', ')}.`,
    };
  }

  return { errors, warnings, valid: Object.keys(errors).length === 0 };
}

/** Normalize a form state into the exact body the backend expects. */
export function toAssignmentPayload(input: AssignmentCreateInput): AssignmentCreateInput {
  return {
    title: clean(input.title),
    publicSummary: clean(input.publicSummary),
    descriptionMarkdown: clean(input.descriptionMarkdown),
    submissionInstructionsMarkdown: clean(input.submissionInstructionsMarkdown ?? ''),
    estimatedHours: input.estimatedHours,
    allowedFileTypes: [...(input.allowedFileTypes ?? [])],
  };
}
