// FILE: src/components/apply/apply-form-helpers.ts
// Pure helpers for the apply form: client-side validation mirroring the backend
// rules (apply-validators.js) and server-error-code → field mapping. Kept
// separate so ApplyFormClient stays small and the rules are unit-testable.

import type { ApplyFormData } from '@/types/public-apply';

/**
 * `assignmentLinks` is not an ApplyFormData field — the assignment inputs live in
 * their own state — but server errors have to be able to point AT the links block,
 * so it gets a key here alongside the form-level `_form`.
 */
export type ApplyErrors = Partial<Record<keyof ApplyFormData | '_form' | 'assignmentLinks', string>>;

const URL_RE = /(https?:\/\/|www\.|\.[a-z]{2,}\/)/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BYTES = 5 * 1024 * 1024;

function nameError(value: string, label: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 255) return `${label} is required.`;
  if (URL_RE.test(trimmed)) return `${label} looks invalid.`;
  return undefined;
}

export function resumeError(file: File | null): string | undefined {
  if (!file) return 'Please attach your resume (PDF).';
  if (file.type !== 'application/pdf') return 'Resume must be a PDF file.';
  if (file.size > MAX_BYTES) return 'Resume must be 5MB or smaller.';
  return undefined;
}

/** Validate a single field on blur. Returns the message or undefined. */
export function fieldError(field: keyof ApplyFormData, data: ApplyFormData): string | undefined {
  switch (field) {
    case 'firstName': return nameError(data.firstName, 'First name');
    case 'lastName': return nameError(data.lastName, 'Last name');
    case 'email': return EMAIL_RE.test(data.email.trim()) ? undefined : 'Enter a valid email address.';
    case 'phone': return data.phone.length > 32 ? 'Phone number is too long.' : undefined;
    case 'resume': return resumeError(data.resume);
    default: return undefined;
  }
}

/** Full validation on submit. Returns an errors object ({} when valid). */
export function validateApplyForm(data: ApplyFormData): ApplyErrors {
  const errors: ApplyErrors = {};
  for (const field of ['firstName', 'lastName', 'email', 'phone', 'resume'] as const) {
    const msg = fieldError(field, data);
    if (msg) errors[field] = msg;
  }
  if (!data.consent_dpdp) errors.consent_dpdp = 'You must accept the privacy notice to apply.';
  return errors;
}

type ErrorField = keyof ApplyFormData | 'assignmentLinks';

const CODE_TO_FIELD: Record<string, ErrorField> = {
  INVALID_FIRST_NAME: 'firstName', INVALID_LAST_NAME: 'lastName', INVALID_EMAIL: 'email',
  INVALID_PHONE: 'phone', CONSENT_REQUIRED: 'consent_dpdp',
  NO_FILE: 'resume', INVALID_FILE_TYPE: 'resume', FILE_TOO_LARGE: 'resume',
  // Assignment submission (7b). TOO_MANY_LINKS and INVALID_LINK belong to the links
  // block too — the candidate cannot act on a form-level message about a URL.
  ASSIGNMENT_SUBMISSION_REQUIRED: 'assignmentLinks',
  INVALID_LINK: 'assignmentLinks', TOO_MANY_LINKS: 'assignmentLinks',
};

/**
 * Map a backend error code to the field it belongs to.
 *
 * MISSING_ASSIGNMENT_ID is handled separately: it means WE failed to put
 * assignmentId in the payload, so there is no field for the candidate to fix and no
 * honest message that blames them. They get a generic retry line; the console gets
 * the real cause so it surfaces in development.
 *
 * STAGED_FILES_EXPIRED, ASSIGNMENT_CHANGED and POSTING_CLOSED_DURING_APPLY are
 * deliberately NOT mapped here — each needs its own persistent UI (a file-row flip,
 * a refresh prompt, a copy-my-work escape hatch), which ApplyFormClient owns.
 */
export function mapServerError(code: string | null, message: string): ApplyErrors {
  if (code === 'MISSING_ASSIGNMENT_ID') {
    console.error('[apply] MISSING_ASSIGNMENT_ID — assignmentId was absent from the submitted FormData. This is a bug in our payload, not user input.');
    return { _form: 'Something went wrong on our side. Please try submitting again.' };
  }
  const field = code ? CODE_TO_FIELD[code] : undefined;
  if (field) return { [field]: message };
  return { _form: message || 'Could not submit your application. Please try again.' };
}
