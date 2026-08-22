// FILE: tests/components/employer/jobs/score-badge-helpers.test.ts
// The shared score→colour mapping (boundary-exact) + initials + compact age.
import { describe, it, expect } from 'vitest';
import { getScoreBadgeStyle, getInitials, formatCompactDuration } from '@/components/employer/jobs/score-badge-helpers';

describe('getScoreBadgeStyle', () => {
  it('maps each range with exact boundaries', () => {
    expect(getScoreBadgeStyle(80).label).toBe('strong');
    expect(getScoreBadgeStyle(79).label).toBe('good'); // 79 is good, not strong
    expect(getScoreBadgeStyle(60).label).toBe('good');
    expect(getScoreBadgeStyle(59).label).toBe('partial');
    expect(getScoreBadgeStyle(40).label).toBe('partial');
    expect(getScoreBadgeStyle(39).label).toBe('weak');
    expect(getScoreBadgeStyle(20).label).toBe('weak');
    expect(getScoreBadgeStyle(19).label).toBe('poor'); // 19 is poor, not weak
    expect(getScoreBadgeStyle(null).label).toBe('—');
  });

  it('carries the paired colours', () => {
    expect(getScoreBadgeStyle(90)).toEqual({ background: 'var(--success-soft)', color: 'var(--success)', label: 'strong' });
    // Tokenized alongside the other tiers: the raw hex had no dark-mode variant,
    // so the 'weak' badge rendered as a light block on a dark page.
    expect(getScoreBadgeStyle(25)).toEqual({ background: 'var(--status-danger-bg)', color: 'var(--cat-orange)', label: 'weak' });
    expect(getScoreBadgeStyle(null).background).toBe('var(--surface-raised)');
  });
});

describe('getInitials', () => {
  it('handles two-word, single-word, and empty names', () => {
    expect(getInitials('Ashish Ranjan')).toBe('AR');
    expect(getInitials('Priya')).toBe('PR');
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials('Anita K Sharma')).toBe('AS'); // first + last word
  });
});

describe('formatCompactDuration', () => {
  const now = new Date('2030-08-10T12:00:00Z').getTime();
  it('renders compact ages without "ago"', () => {
    expect(formatCompactDuration('2030-08-10T11:45:00Z', now)).toBe('15m');
    expect(formatCompactDuration('2030-08-09T21:00:00Z', now)).toBe('15h');
    expect(formatCompactDuration('2030-07-17T12:00:00Z', now)).toBe('24d');
    expect(formatCompactDuration('garbage', now)).toBe('—');
  });
});
