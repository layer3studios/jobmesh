// FILE: src/utils/ist-datetime.ts
// Conversions between <input type="datetime-local"> wall-clock strings
// (interpreted as Asia/Kolkata, ALWAYS) and UTC ISO strings. A datetime-local
// value has no zone; passing it to new Date() would silently use the browser's
// own zone, so an employer abroad would schedule hours off. IST is fixed at
// UTC+05:30 with no DST, so the offset arithmetic below is exact.

const IST_OFFSET_MINUTES = 330; // +05:30, no DST
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

/** 'YYYY-MM-DDTHH:mm' (IST wall-clock) → UTC ISO string. Null when unparseable. */
export function istLocalToUtcIso(localValue: string): string | null {
  const match = LOCAL_PATTERN.exec(localValue);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const utcMilliseconds = Date.UTC(
    Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute),
  ) - IST_OFFSET_MINUTES * MILLISECONDS_PER_MINUTE;
  return new Date(utcMilliseconds).toISOString();
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** UTC ISO string → 'YYYY-MM-DDTHH:mm' IST wall-clock (datetime-local value). */
export function utcIsoToIstLocal(utcIso: string): string {
  const shifted = new Date(new Date(utcIso).getTime() + IST_OFFSET_MINUTES * MILLISECONDS_PER_MINUTE);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`
    + `T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}
