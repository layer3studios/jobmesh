// FILE: src/components/employer/jobs/posting-form-helpers.ts
// Pure helpers for PostingForm: client-side validation mirroring the backend
// rules (posting-validators.js), payload assembly, and server-error → field
// mapping. Kept separate so the form component stays small and the rules are
// unit-testable in isolation.

import type { PostingCreateInput, WorkplaceType, EmploymentType } from '@/types/employer-jobs';

export interface PostingFormValues {
  title: string;
  description: string;
  location: string;
  workplaceType: WorkplaceType | '';
  employmentType: EmploymentType | '';
  salaryMinStr: string;
  salaryMaxStr: string;
  /** yyyy-mm-dd from the date input, or '' when no deadline is set. */
  applicationDeadline: string;
  autoCloseOnDeadline: boolean;
}

export interface PostingFormErrors {
  title?: string;
  description?: string;
  location?: string;
  workplaceType?: string;
  employmentType?: string;
  salary?: string;
  applicationDeadline?: string;
  _form?: string;
  /**
   * The posting saved but the assignment attach failed. Kept distinct from _form
   * because the two mean opposite things: _form means nothing was saved, this means
   * the posting EXISTS and only the attachment is missing (8b).
   */
  _assignment?: string;
}

const SCRIPT_PATTERN = /<script/i;
const MAXIMUM_SALARY = 1_000_000_000;
const SALARY_RANGE_MESSAGE = 'Salary must be a whole number between 0 and 1,000,000,000.';

interface SalaryResult { error?: string; salaryMin: number | null; salaryMax: number | null }

/** Parse + range-check both salary inputs. Empty string → null (omitted later). */
export function validateSalaryStrings(salaryMinStr: string, salaryMaxStr: string): SalaryResult {
  const parseOne = (raw: string): { value: number | null; invalid?: boolean } => {
    const trimmed = raw.trim();
    if (trimmed === '') return { value: null };
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAXIMUM_SALARY) return { value: null, invalid: true };
    return { value: parsed };
  };
  const min = parseOne(salaryMinStr);
  const max = parseOne(salaryMaxStr);
  if (min.invalid || max.invalid) return { error: SALARY_RANGE_MESSAGE, salaryMin: null, salaryMax: null };
  if (min.value != null && max.value != null && min.value > max.value) {
    return { error: 'Minimum salary must be less than or equal to maximum.', salaryMin: min.value, salaryMax: max.value };
  }
  return { salaryMin: min.value, salaryMax: max.value };
}

/**
 * Deadline handling is date-only and IST-anchored.
 *
 * The employer picks a DAY, not an instant, and this product is India-only. A bare
 * "2026-08-20" would be parsed as UTC midnight, which is 05:30 IST — so a deadline
 * would expire mid-morning on the chosen day. Anchoring to the END of that day in
 * IST (+05:30) means "close on the 20th" means the 20th is still open.
 */
const IST_END_OF_DAY_SUFFIX = 'T23:59:59+05:30';

/** yyyy-mm-dd → the ISO instant the deadline actually expires at. */
export function deadlineToIso(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (trimmed === '') return null;
  const parsed = new Date(`${trimmed}${IST_END_OF_DAY_SUFFIX}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** An ISO instant back to the yyyy-mm-dd the picker should show, in IST. */
export function isoToDeadlineInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  // en-CA formats as yyyy-mm-dd, which is exactly what <input type="date"> wants.
  return parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** Tomorrow in IST — the `min` for the picker, so today is already too late. */
export function minimumDeadlineDate(now: Date = new Date()): string {
  const tomorrow = new Date(now.getTime() + 86_400_000);
  return tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** The picker's `min` is advisory — a typed date still has to be checked. */
export function deadlineError(dateStr: string): string | undefined {
  const trimmed = dateStr.trim();
  if (trimmed === '') return undefined;
  const iso = deadlineToIso(trimmed);
  if (!iso) return 'Enter a valid date.';
  if (new Date(iso).getTime() <= Date.now()) return 'The deadline must be in the future.';
  return undefined;
}

/** Full client-side validation; returns an errors object ({} when valid). */
export function validatePostingFormValues(values: PostingFormValues): PostingFormErrors {
  const errors: PostingFormErrors = {};
  const title = values.title.trim();
  if (title.length < 2 || title.length > 200 || SCRIPT_PATTERN.test(title)) {
    errors.title = 'Enter a job title (2–200 characters, no scripts).';
  }
  const description = values.description.trim();
  if (description.length < 50 || description.length > 50000 || SCRIPT_PATTERN.test(description)) {
    errors.description = 'Description must be 50–50,000 characters of plain text.';
  }
  const location = values.location.trim();
  if (location.length < 1 || location.length > 200) errors.location = 'Enter a location.';
  if (values.workplaceType === '') errors.workplaceType = 'Select a workplace type.';
  if (values.employmentType === '') errors.employmentType = 'Select an employment type.';
  const salary = validateSalaryStrings(values.salaryMinStr, values.salaryMaxStr);
  if (salary.error) errors.salary = salary.error;
  const deadline = deadlineError(values.applicationDeadline);
  if (deadline) errors.applicationDeadline = deadline;
  return errors;
}

/** Build the typed payload; omits salary keys entirely when empty (R4). */
export function buildPostingInput(values: PostingFormValues): PostingCreateInput {
  const { salaryMin, salaryMax } = validateSalaryStrings(values.salaryMinStr, values.salaryMaxStr);
  const input: PostingCreateInput = {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    workplaceType: values.workplaceType as WorkplaceType,
    employmentType: values.employmentType as EmploymentType,
  };
  if (salaryMin != null) input.salaryMin = salaryMin;
  if (salaryMax != null) input.salaryMax = salaryMax;
  // Always sent, both keys together: clearing the date has to reach the server as
  // an explicit null, and the backend turns auto-close off whenever the date is
  // absent so the flag can never be armed with nothing to fire on.
  const deadlineIso = deadlineToIso(values.applicationDeadline);
  input.applicationDeadline = deadlineIso;
  input.autoCloseOnDeadline = deadlineIso != null && values.autoCloseOnDeadline;
  return input;
}

/** Map a backend error code to the field it belongs to (R3). */
export function mapServerErrorToFields(code: string | null, message: string): PostingFormErrors {
  switch (code) {
    case 'INVALID_TITLE': return { title: message };
    case 'INVALID_DESCRIPTION': return { description: message };
    case 'INVALID_LOCATION': return { location: message };
    case 'INVALID_WORKPLACE_TYPE': return { workplaceType: message };
    case 'INVALID_EMPLOYMENT_TYPE': return { employmentType: message };
    case 'INVALID_SALARY': return { salary: message };
    case 'INVALID_DEADLINE': return { applicationDeadline: message };
    case 'INVALID_AUTO_CLOSE': return { applicationDeadline: message };
    default: return { _form: message || 'Could not save posting. Please try again.' };
  }
}
