// FILE: tests/pages/employer/assignments-route-move.test.tsx
// The assignment library moved from /employer/settings/assignments to
// /employer/assignments. The old path must keep resolving — it is in bookmarks
// and in every link shipped by the old settings sidebar — so it stays as a
// redirect stub rather than being deleted into a 404.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const permanentRedirectMock = vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); });
vi.mock('next/navigation', () => ({
  permanentRedirect: (url: string) => permanentRedirectMock(url),
}));

import AssignmentsSettingsRedirect from '@/app/(employer)/employer/(app)/(onboarded)/settings/assignments/page';
import { EMPLOYER_ROUTES } from '@/components/layouts/parts/routes';

const APP_ROOT = resolve(process.cwd(), 'src/app/(employer)/employer/(app)/(onboarded)');

beforeEach(() => { permanentRedirectMock.mockClear(); });

describe('the old settings path still resolves', () => {
  it('redirects rather than 404ing', () => {
    // The stub throws the way Next's real permanentRedirect does, so "it did not
    // return normally" is itself part of the contract being asserted.
    expect(() => AssignmentsSettingsRedirect()).toThrow(/NEXT_REDIRECT/);
    expect(permanentRedirectMock).toHaveBeenCalledWith('/employer/assignments');
  });

  it('sends the viewer to the canonical route constant, not a hand-typed string', () => {
    try { AssignmentsSettingsRedirect(); } catch { /* expected */ }
    expect(permanentRedirectMock).toHaveBeenCalledWith(EMPLOYER_ROUTES.ASSIGNMENTS);
  });

  it('uses a permanent (308) redirect — the move is not temporary', () => {
    const source = readFileSync(resolve(APP_ROOT, 'settings/assignments/page.tsx'), 'utf8');
    expect(source).toMatch(/permanentRedirect/);
  });
});

describe('the page moved rather than being copied', () => {
  it('lives at /employer/assignments', () => {
    expect(existsSync(resolve(APP_ROOT, 'assignments/page.tsx'))).toBe(true);
    expect(existsSync(resolve(APP_ROOT, 'assignments/AssignmentsClient.tsx'))).toBe(true);
    expect(existsSync(resolve(APP_ROOT, 'assignments/parts'))).toBe(true);
    expect(existsSync(resolve(APP_ROOT, 'assignments/loading.tsx'))).toBe(true);
  });

  it('leaves no second copy behind in settings — only the redirect stub', () => {
    expect(existsSync(resolve(APP_ROOT, 'settings/assignments/AssignmentsClient.tsx'))).toBe(false);
    expect(existsSync(resolve(APP_ROOT, 'settings/assignments/parts'))).toBe(false);
  });

  it('exposes ASSIGNMENTS on EMPLOYER_ROUTES and drops SETTINGS_ASSIGNMENTS', () => {
    expect(EMPLOYER_ROUTES.ASSIGNMENTS).toBe('/employer/assignments');
    expect('SETTINGS_ASSIGNMENTS' in EMPLOYER_ROUTES).toBe(false);
  });
});
