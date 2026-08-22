// FILE: src/components/employer/jobs/interview-calendar-helpers.ts
// Pure month-grid math for the mini calendar — no library, Monday-first.
// Dates are IST calendar days ('YYYY-MM-DD'); times map onto cells via the
// same IST grouping rule as everywhere else (never UTC days).

import type { InterviewTime } from '../../../types/employer-interviews';
import { utcIsoToIstLocal } from '../../../utils/ist-datetime';

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface CalendarCellData {
  dateIso: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  availableCount: number;
  bookedCount: number;
}

export const todayIstDate = (): string => utcIsoToIstLocal(new Date().toISOString()).slice(0, 10);

const pad = (value: number): string => String(value).padStart(2, '0');
const toIso = (year: number, month: number, day: number): string => `${year}-${pad(month)}-${pad(day)}`;

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** month is 1-12. delta ±1 steps across year boundaries. */
export function stepMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const stepped = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: stepped.getUTCFullYear(), month: stepped.getUTCMonth() + 1 };
}

/**
 * The full cell array for one month view: leading trailing-days from the
 * previous month (Monday-first), every day of the month, then next-month
 * padding to complete the final week. Cancelled/past-status times never
 * produce dots — only available and booked count.
 */
export function buildMonthGrid(
  year: number, month: number, times: InterviewTime[], todayIso: string = todayIstDate(),
): CalendarCellData[] {
  const counts = new Map<string, { available: number; booked: number }>();
  for (const time of times) {
    if (time.status !== 'available' && time.status !== 'booked') continue;
    const dateIso = utcIsoToIstLocal(time.startAtUtc).slice(0, 10);
    const entry = counts.get(dateIso) ?? { available: 0, booked: 0 };
    entry[time.status] += 1;
    counts.set(dateIso, entry);
  }

  const cells: CalendarCellData[] = [];
  const push = (cellYear: number, cellMonth: number, day: number, isCurrentMonth: boolean): void => {
    const dateIso = toIso(cellYear, cellMonth, day);
    const entry = counts.get(dateIso);
    cells.push({
      dateIso, dayOfMonth: day, isCurrentMonth,
      isToday: dateIso === todayIso, isPast: dateIso < todayIso,
      availableCount: entry?.available ?? 0, bookedCount: entry?.booked ?? 0,
    });
  };

  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday
  const leadingCount = (firstWeekday + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const previous = stepMonth(year, month, -1);
  const previousDays = new Date(Date.UTC(previous.year, previous.month, 0)).getUTCDate();
  for (let i = leadingCount - 1; i >= 0; i -= 1) push(previous.year, previous.month, previousDays - i, false);
  for (let day = 1; day <= daysInMonth; day += 1) push(year, month, day, true);
  const next = stepMonth(year, month, 1);
  for (let day = 1; cells.length % 7 !== 0; day += 1) push(next.year, next.month, day, false);
  return cells;
}

/** Today, or the earliest date (≥ today) that has an available time. */
export function defaultSelectedDate(times: InterviewTime[], todayIso: string = todayIstDate()): string {
  const upcoming = times
    .filter((time) => time.status === 'available')
    .map((time) => utcIsoToIstLocal(time.startAtUtc).slice(0, 10))
    .filter((dateIso) => dateIso >= todayIso)
    .sort();
  return upcoming[0] ?? todayIso;
}
