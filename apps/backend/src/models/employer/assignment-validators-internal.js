// FILE: src/models/employer/assignment-validators-internal.js
// Input normalisers the assignment model applies before a write: the allowed file
// type list and the estimated-hours bound. Split out of assignment-model.js
// (section 2).
//
// Distinct from services/employer/assignment-validators.js, which validates the
// REQUEST. These guard the DOCUMENT, and run even for a caller that bypassed the
// route -- which is why they live beside the model rather than with the route.

import { ALLOWED_FILE_TYPES, MIN_ESTIMATED_HOURS, MAX_ESTIMATED_HOURS } from './assignment-constants.js';

/**
 * Normalize allowedFileTypes: a non-array becomes [] (link-only), duplicates are
 * dropped, and an unknown type throws rather than being silently discarded — a
 * typo'd type must not quietly become a stricter upload rule than the author meant.
 */
function normalizeAllowedFileTypes(value) {
  if (!Array.isArray(value)) return [];
  const seen = [];
  for (const entry of value) {
    if (!ALLOWED_FILE_TYPES.includes(entry)) {
      throw new Error(`assignment: invalid allowedFileTypes entry "${entry}"`);
    }
    if (!seen.includes(entry)) seen.push(entry);
  }
  return seen;
}

/** Integer within [1,8] or throw. Rejects 2.5 and '2' — no coercion. */
function requireEstimatedHours(value) {
  if (!Number.isInteger(value) || value < MIN_ESTIMATED_HOURS || value > MAX_ESTIMATED_HOURS) {
    throw new Error(
      `assignment: estimatedHours must be an integer between ${MIN_ESTIMATED_HOURS} and ${MAX_ESTIMATED_HOURS}`,
    );
  }
  return value;
}

export { normalizeAllowedFileTypes, requireEstimatedHours };
