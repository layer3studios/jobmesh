import { describe, it, expect } from 'vitest';
import { resolveSafeNextPath } from '@/lib/safe-next-path';

describe('resolveSafeNextPath', () => {
  it('honours an internal /employer/ path', () => {
    expect(resolveSafeNextPath('/employer/invites/abc')).toBe('/employer/invites/abc');
    expect(resolveSafeNextPath('?next=/employer/invites/abc')).toBe('/employer/invites/abc');
    expect(resolveSafeNextPath('?next=%2Femployer%2Finvites%2Fabc')).toBe('/employer/invites/abc');
  });

  it('rejects a scheme-relative //evil.com', () => {
    expect(resolveSafeNextPath('?next=//evil.com')).toBe('/employer');
    expect(resolveSafeNextPath('//evil.com')).toBe('/employer');
  });

  it('rejects a non-employer internal path', () => {
    expect(resolveSafeNextPath('?next=/seeker/profile')).toBe('/employer');
    expect(resolveSafeNextPath('/seeker/profile')).toBe('/employer');
  });

  it('rejects an absolute external URL', () => {
    expect(resolveSafeNextPath('?next=https://evil.com')).toBe('/employer');
    expect(resolveSafeNextPath('?next=http://evil.com/employer/x')).toBe('/employer');
  });

  it('falls back to /employer when next is absent or empty', () => {
    expect(resolveSafeNextPath('')).toBe('/employer');
    expect(resolveSafeNextPath(undefined)).toBe('/employer');
    expect(resolveSafeNextPath('?foo=bar')).toBe('/employer');
  });
});
