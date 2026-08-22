import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EmployerProvider, useEmployer } from '@/context/employer/EmployerContext';
import type { EmployerUser } from '@/context/employer/employer-context-types';

vi.mock('@react-oauth/google', () => ({ googleLogout: vi.fn() }));

const NOTIFICATIONS = {
  newApplication: true, stageChange: true, noteMention: true, interviewScheduled: true,
  interviewReminder: true, feedbackSubmitted: true, candidateHired: true, applicationDeadline: true,
};

const EMPLOYER: EmployerUser = {
  id: 'e1', email: 'hr@x.io', name: 'HR', picture: null, companyId: 'c1',
  avatarUrl: null, timezone: 'Asia/Kolkata', jobTitle: null,
  notificationPreferences: NOTIFICATIONS,
};

function Probe() {
  const { employerUser } = useEmployer();
  return <span data-testid="user">{employerUser?.email ?? 'none'}</span>;
}

function calledWith(fetchMock: ReturnType<typeof vi.fn>, needle: string): boolean {
  return fetchMock.mock.calls.some(([url]) => String(url).includes(needle));
}

describe('EmployerContext (server-seed hybrid)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('mounts with initialUser — seeds and does NOT fetch /employer/auth/me', async () => {
    render(<EmployerProvider initialUser={EMPLOYER} initialCompany={null}><Probe /></EmployerProvider>);
    expect(screen.getByTestId('user').textContent).toBe('hr@x.io');
    // No mount refresh when seeded.
    expect(calledWith(fetchMock, '/employer/auth/me')).toBe(false);
  });

  it('mounts without a seed — fetches /employer/auth/me on mount', async () => {
    render(<EmployerProvider><Probe /></EmployerProvider>);
    await waitFor(() => expect(calledWith(fetchMock, '/employer/auth/me')).toBe(true));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });
});
