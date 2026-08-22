// FILE: src/utils/format-interview-time.ts
// Human-readable IST rendering for interview times. Assembled manually from
// UTC+05:30 arithmetic (IST has no DST) so output is deterministic across
// browser locales and ICU builds. No raw ISO string ever reaches the UI.

const IST_OFFSET_MINUTES = 330;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function istParts(utcIso: string) {
  const shifted = new Date(new Date(utcIso).getTime() + IST_OFFSET_MINUTES * MILLISECONDS_PER_MINUTE);
  const hour24 = shifted.getUTCHours();
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const meridiem = hour24 < 12 ? 'AM' : 'PM';
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');
  return {
    weekday: WEEKDAYS[shifted.getUTCDay()],
    day: shifted.getUTCDate(),
    month: MONTHS[shifted.getUTCMonth()],
    year: shifted.getUTCFullYear(),
    time: `${hour12}:${minutes} ${meridiem}`,
  };
}

/** e.g. "Monday, 10 August 2026, 3:00 PM IST" — for confirmed times. */
export function formatInterviewTime(utcIso: string): string {
  const { weekday, day, month, year, time } = istParts(utcIso);
  return `${weekday}, ${day} ${month} ${year}, ${time} IST`;
}

/** e.g. "10 August 2026" — date only, IST calendar day. For expiry copy, where
 *  a time-of-day reads as threatening precision. */
export function formatInterviewDateOnly(utcIso: string): string {
  const { day, month, year } = istParts(utcIso);
  return `${day} ${month} ${year}`;
}

/** e.g. "3:00 PM" — clock only, for rows already grouped under a date. */
export function formatInterviewClockTime(utcIso: string): string {
  return istParts(utcIso).time;
}

/** e.g. "Sat, 2 August 2026" — day-group heading (IST calendar day). */
export function formatInterviewDayHeading(utcIso: string): string {
  const { weekday, day, month, year } = istParts(utcIso);
  return `${weekday.slice(0, 3)}, ${day} ${month} ${year}`;
}

/** e.g. "Mon 10 Aug, 3:00 PM IST" — for compact rows. */
export function formatInterviewTimeShort(utcIso: string): string {
  const { weekday, day, month, time } = istParts(utcIso);
  return `${weekday.slice(0, 3)} ${day} ${month.slice(0, 3)}, ${time} IST`;
}
