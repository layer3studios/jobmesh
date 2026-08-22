import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const capture = vi.fn();
vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));

import { useSeekerAuth } from '@/context/seeker/useSeekerAuth';

const USER = { name: 'Ada', email: 'ada@x.io', picture: '', slug: 'ada-unique' };

describe('Funnel 3 — seeker auth events', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('/auth/google')) return { ok: true, json: async () => ({ user: USER }) } as Response;
      return { ok: true, json: async () => ({}) } as Response; // logout + mount /me
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('fires signup on first login, login on subsequent, and logged_out on logout', async () => {
    // initialUser undefined → hook fetches /me on mount (mocked ok-empty).
    const { result } = renderHook(() => useSeekerAuth(null));

    await act(async () => { await result.current.login('cred'); });
    expect(capture).toHaveBeenCalledWith('seeker_signup_completed', { method: 'google' });

    capture.mockClear();
    await act(async () => { await result.current.login('cred'); });
    expect(capture).toHaveBeenCalledWith('seeker_login_completed', { method: 'google' });

    capture.mockClear();
    await act(async () => { await result.current.rawLogout(); });
    expect(capture).toHaveBeenCalledWith('seeker_logged_out', expect.objectContaining({ fromRoute: expect.any(String) }));
  });
});
