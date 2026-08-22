import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { serverFetchMock } = vi.hoisted(() => ({ serverFetchMock: vi.fn() }));
vi.mock('@/lib/server-fetch', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/server-fetch')>();
  return { ...actual, serverFetch: serverFetchMock };
});
vi.mock('@/lib/server-api/employer', () => ({
  getEmployerMeServer: async () => ({ employerUser: { id: 'u1' }, company: { id: 'c1' } }),
}));
vi.mock('@/app/(employer)/employer/(app)/(onboarded)/settings/team/TeamSettingsClient', () => ({
  default: ({ members, invites, currentMember }: { members: unknown[]; invites: unknown[]; currentMember: unknown }) =>
    <div data-testid="client">{`members:${members.length} invites:${invites.length} me:${currentMember ? 'yes' : 'no'}`}</div>,
}));

import TeamSettingsPage from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/page';
import { ServerFetchError } from '@/lib/server-fetch';

describe('TeamSettingsPage', () => {
  beforeEach(() => serverFetchMock.mockReset());

  // Call order in the page's Promise.all is members-first, then invites.
  it('renders with empty members and invites without blowing up', async () => {
    serverFetchMock.mockResolvedValueOnce({ members: [] }).mockResolvedValueOnce({ invites: [] });
    render(await TeamSettingsPage());
    expect(screen.getByTestId('client').textContent).toBe('members:0 invites:0 me:no');
  });

  it('resolves the current member and tolerates a 403 on invites', async () => {
    serverFetchMock
      .mockResolvedValueOnce({ members: [{ employerUserId: 'u1' }] })
      .mockRejectedValueOnce(new ServerFetchError(403, 'FORBIDDEN', 'no'));
    render(await TeamSettingsPage());
    expect(screen.getByTestId('client').textContent).toBe('members:1 invites:0 me:yes');
  });
});
