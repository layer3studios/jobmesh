import { describe, it, expect } from 'vitest';
import { roleLabel, roleBadgeVariant } from '@/lib/role-labels';

describe('roleLabel', () => {
  it('labels each role', () => {
    expect(roleLabel('founder')).toBe('Founder');
    expect(roleLabel('owner')).toBe('Owner');
    expect(roleLabel('member')).toBe('Member');
    expect(roleLabel('interviewer')).toBe('Interviewer');
  });

  it('treats an isFounder flag as Founder regardless of role', () => {
    expect(roleLabel('owner', true)).toBe('Founder');
  });
});

describe('roleBadgeVariant', () => {
  it('returns a stable variant per role', () => {
    expect(roleBadgeVariant('founder')).toBe('brand');
    expect(roleBadgeVariant('owner')).toBe('info');
    expect(roleBadgeVariant('member')).toBe('neutral');
    expect(roleBadgeVariant('interviewer')).toBe('warning');
  });
});
