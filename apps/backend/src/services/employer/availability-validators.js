// FILE: src/services/employer/availability-validators.js
// Validation for a teammate's weekly interview availability. Each rule throws
// HttpError(400, msg, CODE); the whole week is normalized and returned on success.

import { HttpError } from '../../middleware/error-handler-middleware.js';
import {
  DAYS_IN_WEEK, minutesFromTimeString,
} from '../../models/employer/interviewer-availability-model.js';

/** A window shorter than this cannot hold even the shortest interview. */
export const MINIMUM_WINDOW_MINUTES = 15;

const invalid = (message) => new HttpError(400, message, 'INVALID_AVAILABILITY');

/**
 * Validate one day's window.
 *
 * end > start is checked in MINUTES, not by string comparison: "09:00" < "10:00"
 * happens to sort correctly as text, but that is a coincidence of zero-padding and
 * would silently accept a malformed value the moment either side stopped being
 * exactly HH:mm.
 */
function validateEntry(raw, timezone) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw invalid('Each availability entry must be an object.');
  }

  const dayOfWeek = Number(raw.dayOfWeek);
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > DAYS_IN_WEEK - 1) {
    throw invalid('dayOfWeek must be a whole number from 0 (Sunday) to 6 (Saturday).');
  }

  const startMinutes = minutesFromTimeString(raw.startTime);
  const endMinutes = minutesFromTimeString(raw.endTime);
  if (startMinutes == null || endMinutes == null) {
    throw invalid('Times must be in 24-hour HH:mm format, for example 09:30.');
  }
  // Two distinct mistakes, two distinct messages. An inverted range told "must be
  // at least 15 minutes long" is technically true and completely unhelpful — the
  // person swapped two fields, and the message should say so.
  if (endMinutes <= startMinutes) {
    throw invalid('The end time must be later than the start time.');
  }
  if (endMinutes - startMinutes < MINIMUM_WINDOW_MINUTES) {
    throw invalid(`An availability window must be at least ${MINIMUM_WINDOW_MINUTES} minutes long.`);
  }

  return {
    dayOfWeek,
    startTime: raw.startTime.trim(),
    endTime: raw.endTime.trim(),
    // Taken from the user's profile, never from the request: the whole point of a
    // profile timezone is that one person's hours are expressed in one zone, and
    // letting the client vary it per day would make "10:00" ambiguous.
    timezone,
    isActive: raw.isActive !== false,
  };
}

/**
 * Validate a whole week. Returns entries sorted Sunday → Saturday.
 *
 * An empty array is valid and means "I have no interview hours set" — that is how
 * the editor's "Clear all" reaches the server, and it must be distinguishable from
 * a malformed payload rather than rejected as one.
 */
export function validateWeeklyAvailability(value, timezone) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw invalid('availability must be a list.');
  if (value.length > DAYS_IN_WEEK) {
    throw invalid('A week has seven days — send at most one entry per day.');
  }

  const entries = value.map((raw) => validateEntry(raw, timezone));
  const days = new Set(entries.map((entry) => entry.dayOfWeek));
  if (days.size !== entries.length) {
    // Two windows on one day would need a merge rule nobody has agreed on, and
    // silently keeping the last would lose hours the person thought they set.
    throw invalid('Only one availability window per day is supported.');
  }
  return entries.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}
