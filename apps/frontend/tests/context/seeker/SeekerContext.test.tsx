import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SeekerProvider, useSeeker } from '@/context/seeker/SeekerContext';
import type { AppUser } from '@/context/seeker/seeker-context-types';

const USER: AppUser = { name: 'Ada', email: 'ada@x.io', picture: '', slug: 'ada' };

function Probe() {
  const { currentUser, isLoading } = useSeeker();
  return (
    <div>
      <span data-testid="name">{currentUser?.name ?? 'none'}</span>
      <span data-testid="loading">{String(isLoading)}</span>
    </div>
  );
}

function calledWith(fetchMock: ReturnType<typeof vi.fn>, needle: string): boolean {
  return fetchMock.mock.calls.some(([url]) => String(url).includes(needle));
}

describe('SeekerContext (server-seed hybrid)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Everything the data-load effect touches resolves to empty; the assertion is
    // specifically about the AUTH endpoint, not the applied/visit round-trips.
    fetchMock = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('mounts with initialUser — seeds state and does NOT fetch the auth endpoint', async () => {
    render(<SeekerProvider initialUser={USER}><Probe /></SeekerProvider>);
    expect(screen.getByTestId('name').textContent).toBe('Ada');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    // Give any effects a tick to run, then assert auth/me was never hit.
    await waitFor(() => expect(calledWith(fetchMock, '/seeker/me')).toBe(true));
    expect(calledWith(fetchMock, '/seeker/auth/me')).toBe(false);
  });

  it('mounts without initialUser — fetches the auth endpoint on mount', async () => {
    render(<SeekerProvider><Probe /></SeekerProvider>);
    await waitFor(() => expect(calledWith(fetchMock, '/seeker/auth/me')).toBe(true));
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('name').textContent).toBe('none');
  });
});
