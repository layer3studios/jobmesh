import type { AppliedJobEntry } from '../types';

export interface DayBucket {
  date: Date;
  count: number;
  dayName: string;
  isToday: boolean;
}

export function getStartOfDay(value: Date | string = new Date()) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTodayCount(appliedJobs: AppliedJobEntry[]) {
  const today = getStartOfDay();
  return appliedJobs.filter(entry => getStartOfDay(entry.appliedAt).getTime() === today.getTime()).length;
}

export function getDayBuckets(appliedJobs: AppliedJobEntry[], days = 7): DayBucket[] {
  const today = getStartOfDay();
  const buckets: DayBucket[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - index);
    buckets.push({
      date,
      count: 0,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: index === 0,
    });
  }
  for (const entry of appliedJobs) {
    const appliedDay = getStartOfDay(entry.appliedAt);
    const bucket = buckets.find(candidate => candidate.date.getTime() === appliedDay.getTime());
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function getStreak(appliedJobs: AppliedJobEntry[]) {
  const appliedDays = new Set(appliedJobs.map(entry => getStartOfDay(entry.appliedAt).getTime()));
  let streak = 0;
  const cursor = getStartOfDay();
  while (appliedDays.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getGoalMetDays(appliedJobs: AppliedJobEntry[], dailyGoal: number, days = 7) {
  return getDayBuckets(appliedJobs, days).filter(bucket => bucket.count >= dailyGoal).length;
}

export function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const daysFromMonday = (day + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysFromMonday);
  return start;
}

export function getThisWeekApplied(appliedJobs: AppliedJobEntry[]) {
  const monday = getWeekStart();
  return appliedJobs.filter(entry => new Date(entry.appliedAt).getTime() >= monday.getTime()).length;
}

export function formatAppliedRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'just now';
  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diffMs < day * 2) return 'yesterday';
  const days = Math.floor(diffMs / day);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
