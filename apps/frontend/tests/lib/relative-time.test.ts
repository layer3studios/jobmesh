import { describe, it, expect } from 'vitest';
import { formatRelativeExpiry, isExpired } from '@/lib/relative-time';

const NOW = new Date('2026-07-20T12:00:00.000Z');
const plus = (ms: number) => new Date(NOW.getTime() + ms).toISOString();
const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

describe('formatRelativeExpiry', () => {
  it('formats multi-day expiry', () => {
    expect(formatRelativeExpiry(plus(5 * DAY + HOUR), NOW)).toBe('in 5 days');
  });
  it('formats hour expiry', () => {
    expect(formatRelativeExpiry(plus(2 * HOUR + 60000), NOW)).toBe('in 2 hours');
  });
  it('formats same-day (< 1 hour) expiry', () => {
    expect(formatRelativeExpiry(plus(30 * 60 * 1000), NOW)).toBe('expires today');
  });
  it('formats a lapsed invite as expired', () => {
    expect(formatRelativeExpiry(plus(-HOUR), NOW)).toBe('expired');
  });
});

describe('isExpired', () => {
  it('is true in the past and false in the future', () => {
    expect(isExpired(plus(-1), NOW)).toBe(true);
    expect(isExpired(plus(HOUR), NOW)).toBe(false);
  });
});
