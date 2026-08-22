import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApplied } from '@/context/seeker/useApplied';
import type { AppUser } from '@/context/seeker/seeker-context-types';

const USER: AppUser = { name: 'Ada', email: 'ada@x.io', picture: '', slug: 'ada' };

describe('useApplied', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  afterEach(() => vi.unstubAllGlobals());

  it('applies optimistically then reconciles with the server list', async () => {
    fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [{ jobId: 'j1', appliedAt: '2026-01-01T00:00:00Z' }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useApplied(USER));
    await act(async () => { await result.current.toggleApplied('j1'); });

    expect(result.current.appliedJobIds.has('j1')).toBe(true);
    expect(result.current.appliedCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/seeker/me/applied/j1'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('rolls back the optimistic apply when the server returns 4xx', async () => {
    fetchMock = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useApplied(USER));
    await act(async () => { await result.current.toggleApplied('j1'); });

    await waitFor(() => expect(result.current.appliedJobIds.has('j1')).toBe(false));
    expect(result.current.appliedCount).toBe(0);
  });
});
