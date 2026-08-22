import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '@/components/ui';
import InviteAcceptClient from '@/app/(employer)/employer/invites/[token]/InviteAcceptClient';
import type { InvitePreview } from '@/types/employer-team';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }) }));

const logout = vi.fn();
let mockEmployer: { employerUser: unknown; isLoading: boolean; logout: () => void };
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => mockEmployer }));

const PREVIEW: InvitePreview = {
  companyName: 'Acme', companyId: 'c1', role: 'member',
  canMoveApplicants: false, canArchiveApplicants: false,
  expiresAt: new Date(Date.now() + 5 * 864e5).toISOString(), status: 'pending', invitedByName: 'Grace',
};

function stubFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
    ok: status >= 200 && status < 300, status, json: async () => body,
  } as unknown as Response)));
}

function renderClient() {
  return render(<ToastProvider><InviteAcceptClient token="tok" preview={PREVIEW} /></ToastProvider>);
}

describe('InviteAcceptClient', () => {
  beforeEach(() => { replace.mockClear(); logout.mockClear(); vi.unstubAllGlobals(); });

  it('shows the company, role and inviter', () => {
    mockEmployer = { employerUser: null, isLoading: false, logout };
    renderClient();
    expect(screen.getByText('Join Acme')).toBeTruthy();
    expect(screen.getByText('Member')).toBeTruthy();
    expect(screen.getByText('Invited by Grace')).toBeTruthy();
  });

  it('logged out: shows a Sign in link handing off to login with a safe ?next=', () => {
    mockEmployer = { employerUser: null, isLoading: false, logout };
    renderClient();
    const link = screen.getByText('Sign in with Google to accept').closest('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(`/employer/login?next=${encodeURIComponent('/employer/invites/tok')}`);
  });

  it('logged in: shows the Accept button', () => {
    mockEmployer = { employerUser: { id: 'u1' }, isLoading: false, logout };
    renderClient();
    expect(screen.getByText('Accept and join Acme')).toBeTruthy();
  });

  it('accept → 201 → redirects to /employer', async () => {
    mockEmployer = { employerUser: { id: 'u1' }, isLoading: false, logout };
    stubFetch(201, { member: { id: 'm1' }, redirectUrl: '/employer' });
    renderClient();
    fireEvent.click(screen.getByText('Accept and join Acme'));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/employer'));
  });

  it('accept → 403 INVITE_EMAIL_MISMATCH → inline error + Sign out', async () => {
    mockEmployer = { employerUser: { id: 'u1' }, isLoading: false, logout };
    stubFetch(403, { code: 'INVITE_EMAIL_MISMATCH', error: 'wrong' });
    renderClient();
    fireEvent.click(screen.getByText('Accept and join Acme'));
    await waitFor(() => expect(screen.getByText(/different email/i)).toBeTruthy());
    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  it('accept → 409 ALREADY_MEMBER → redirects to /employer', async () => {
    mockEmployer = { employerUser: { id: 'u1' }, isLoading: false, logout };
    stubFetch(409, { code: 'ALREADY_MEMBER', member: { id: 'm1' }, redirectUrl: '/employer' });
    renderClient();
    fireEvent.click(screen.getByText('Accept and join Acme'));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/employer'));
  });
});
