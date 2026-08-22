import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDismissed } from '@/context/seeker/useDismissed';
import type { AppUser } from '@/context/seeker/seeker-context-types';

const USER: AppUser = { name: 'Ada', email: 'ada@x.io', picture: '', slug: 'ada' };

describe('useDismissed', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('dismisses optimistically then reconciles with the server ids', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ['j1'] }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDismissed(USER));
    await act(async () => { await result.current.toggleDismissed('j1'); });

    expect(result.current.dismissedJobIds.has('j1')).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/seeker/me/dismissed/j1'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('leaves the optimistic dismiss in place when the request fails', async () => {
    // The hook applies optimistically and only overwrites from the server on ok.
    const fetchMock = vi.fn(async () => { throw new Error('network'); });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDismissed(USER));
    await act(async () => { await result.current.toggleDismissed('j1'); });

    await waitFor(() => expect(result.current.dismissedJobIds.has('j1')).toBe(true));
  });
});
