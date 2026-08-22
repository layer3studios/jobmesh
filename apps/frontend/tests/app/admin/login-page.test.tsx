import { describe, it, expect } from 'vitest';
import { isSafeAdminNextPath } from '@/context/admin/admin-context-types';

// Unit test for the ?next= safety helper (D3). Mirrors tests/lib/safe-next-path.test.ts.
// The helper lives in admin-context-types (not the login page) because Next.js forbids
// non-reserved exports from a page file. Route-level component tests are not a pattern
// in this codebase (no tests/app/*), so this scopes to the pure helper the spec mandated.
describe('isSafeAdminNextPath', () => {
  it('accepts internal /admin paths', () => {
    expect(isSafeAdminNextPath('/admin')).toBe(true);
    expect(isSafeAdminNextPath('/admin/analytics')).toBe(true);
    expect(isSafeAdminNextPath('/admin/employer-access')).toBe(true);
  });

  it('rejects non-admin, external, and traversal paths', () => {
    expect(isSafeAdminNextPath('/')).toBe(false);
    expect(isSafeAdminNextPath('/jobs')).toBe(false);
    expect(isSafeAdminNextPath('https://evil.com')).toBe(false);
    expect(isSafeAdminNextPath('/admin//x')).toBe(false);
    expect(isSafeAdminNextPath('/admin/../evil')).toBe(false);
    expect(isSafeAdminNextPath('//evil.com')).toBe(false);
    expect(isSafeAdminNextPath('')).toBe(false);
  });

  it('rejects /adminX (must be /admin exactly or /admin/…)', () => {
    expect(isSafeAdminNextPath('/administrator')).toBe(false);
    expect(isSafeAdminNextPath('/adminlogin')).toBe(false);
  });
});
