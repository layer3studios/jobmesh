// FILE: src/services/public/apply-validators.js
// Field validation for the public apply form (SPEC §6.7). Each rule throws an
// HttpError(400, msg, CODE) with a stable field-level code. Name fields reject URL
// substrings (a common spam signal). Kept separate so apply-service stays small.

import { HttpError } from '../../middleware/error-handler-middleware.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /(https?:\/\/|www\.|\.[a-z]{2,}\/)/i;
/** LeetCode's own username rule: alphanumerics, underscores and hyphens, ≤ 20. */
const LEETCODE_USERNAME_RE = /^[A-Za-z0-9_-]{1,20}$/;
/**
 * GitHub's own rule: 1–39 of [A-Za-z0-9-], no leading or trailing hyphen and no
 * two in a row. NOT the same as LeetCode's — GitHub allows no underscores and
 * three times the length, so the two cannot share one pattern.
 */
const GITHUB_USERNAME_RE = /^[A-Za-z0-9](?:-?[A-Za-z0-9]){0,38}$/;

/**
 * The optional LeetCode handle. Returns null for absent OR malformed input —
 * NEVER throws.
 *
 * This is the one field on the form that cannot cost someone their application.
 * It is a bonus the candidate offers, the data behind it is public, and rejecting
 * a submission over a typo in it would trade a real job application for a nicety.
 * A bad value is simply dropped.
 */
export function normalizeLeetCodeUsername(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return LEETCODE_USERNAME_RE.test(trimmed) ? trimmed : null;
}

/**
 * The optional GitHub handle. Same contract as the LeetCode one above: returns
 * null for absent OR malformed input, and NEVER throws.
 */
export function normalizeGitHubUsername(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return GITHUB_USERNAME_RE.test(trimmed) ? trimmed : null;
}

function requireName(value, field, code) {
  const trimmed = String(value ?? '').trim();
  if (trimmed.length < 1 || trimmed.length > 255) {
    throw new HttpError(400, `${field} is required (1–255 characters).`, code);
  }
  if (URL_RE.test(trimmed)) throw new HttpError(400, `${field} looks invalid.`, code);
  return trimmed;
}

/** Validate + normalize the text fields. Returns a clean object. Throws on error. */
export function validateApplicationForm(form = {}) {
  const firstName = requireName(form.firstName, 'First name', 'INVALID_FIRST_NAME');
  const lastName = requireName(form.lastName, 'Last name', 'INVALID_LAST_NAME');

  const email = String(form.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 320) {
    throw new HttpError(400, 'A valid email is required.', 'INVALID_EMAIL');
  }

  const phoneRaw = String(form.phone ?? '').trim();
  if (phoneRaw.length > 32) throw new HttpError(400, 'Phone number is too long.', 'INVALID_PHONE');
  const phone = phoneRaw || null;

  let yearsExperience = null;
  if (form.yearsExperience !== undefined && form.yearsExperience !== null && `${form.yearsExperience}`.trim() !== '') {
    const years = Number(form.yearsExperience);
    if (!Number.isInteger(years) || years < 0 || years > 60) {
      throw new HttpError(400, 'Years of experience must be a whole number between 0 and 60.', 'INVALID_YEARS_EXPERIENCE');
    }
    yearsExperience = years;
  }

  const coverNoteRaw = String(form.coverNote ?? '').trim();
  if (coverNoteRaw.length > 5000) throw new HttpError(400, 'Cover note is too long.', 'INVALID_COVER_NOTE');
  const coverNote = coverNoteRaw || null;

  const dpdp = form.consent_dpdp === true || form.consent_dpdp === 'true';
  if (!dpdp) throw new HttpError(400, 'You must accept the privacy notice to apply.', 'CONSENT_REQUIRED');
  const futureOpportunities = form.consent_futureOpportunities === true || form.consent_futureOpportunities === 'true';

  return {
    firstName, lastName, email, phone, yearsExperience, coverNote, futureOpportunities,
    leetcodeUsername: normalizeLeetCodeUsername(form.leetcodeUsername),
    githubUsername: normalizeGitHubUsername(form.githubUsername),
  };
}

/** True when the honeypot field is filled — a bot signal (R4). */
export function isHoneypotFilled(form = {}) {
  return typeof form.website_url === 'string' && form.website_url.trim() !== '';
}
