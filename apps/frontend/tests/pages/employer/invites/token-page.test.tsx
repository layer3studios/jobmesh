import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServerFetchError } from '@/lib/server-fetch';

const { publicServerFetchMock } = vi.hoisted(() => ({ publicServerFetchMock: vi.fn() }));
vi.mock('@/lib/public-server-fetch', () => ({ publicServerFetch: publicServerFetchMock }));
// Keep the provider + interactive client out of the way — the page's own branching is
// what we're testing here.
vi.mock('@/context/employer/EmployerContext', () => ({ EmployerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/app/(employer)/employer/invites/[token]/InviteAcceptClient', () => ({
  default: ({ preview }: { preview: { companyName: string } }) => <div data-testid="accept">{preview.companyName}</div>,
}));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

import InviteAcceptPage from '@/app/(employer)/employer/invites/[token]/page';

const newParams = () => Promise.resolve({ token: 'tok' });

describe('InviteAcceptPage states', () => {
  const params = newParams();

  it('renders the accept client with the company name on 200', async () => {
    publicServerFetchMock.mockImplementation(async () => ({ companyName: 'Acme', role: 'member', status: 'pending' }));
    render(await InviteAcceptPage({ params }));
    expect(screen.getByTestId('accept').textContent).toBe('Acme');
  });

  it('renders "Invite not found" on 404', async () => {
    publicServerFetchMock.mockImplementation(async () => { throw new ServerFetchError(404, 'INVITE_NOT_FOUND', 'no'); });
    render(await InviteAcceptPage({ params }));
    expect(screen.getByText('Invite not found')).toBeTruthy();
  });

  it('renders the expired state on 410 INVITE_EXPIRED', async () => {
    publicServerFetchMock.mockImplementation(async () => { throw new ServerFetchError(410, 'INVITE_EXPIRED', 'gone'); });
    render(await InviteAcceptPage({ params }));
    expect(screen.getByText('This invite has expired')).toBeTruthy();
  });

  it('renders the revoked state on 410 INVITE_REVOKED', async () => {
    publicServerFetchMock.mockImplementation(async () => { throw new ServerFetchError(410, 'INVITE_REVOKED', 'gone'); });
    render(await InviteAcceptPage({ params }));
    expect(screen.getByText('This invite has been revoked')).toBeTruthy();
  });

  it('renders the accepted state with a Go to dashboard link on 410 INVITE_ALREADY_ACCEPTED', async () => {
    publicServerFetchMock.mockImplementation(async () => { throw new ServerFetchError(410, 'INVITE_ALREADY_ACCEPTED', 'gone'); });
    render(await InviteAcceptPage({ params }));
    expect(screen.getByText('This invite was already accepted')).toBeTruthy();
    const link = screen.getByText('Go to dashboard').closest('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/employer');
  });
});
