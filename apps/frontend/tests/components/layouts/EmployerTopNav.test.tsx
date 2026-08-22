import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import EmployerTopNav from '@/components/layouts/parts/EmployerTopNav';
import type { Role } from '@/types/employer-team';

// useSearchParams: the nav reads ?from= to keep the origin section highlighted.
vi.mock('next/navigation', () => ({
  usePathname: () => '/employer',
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...rest}>{children}</a>,
}));

const user = { name: 'Ada', email: 'ada@x.io', picture: 'https://x/p.jpg' };

function renderNav(role: Role | null | undefined) {
  render(<EmployerTopNav isCompact={false} currentUser={user} companyName="Acme" role={role} onLogout={vi.fn()} />);
}

describe('EmployerTopNav Settings link', () => {
  it('is visible for Founder and Owner', () => {
    renderNav('founder');
    expect(screen.getByText('Settings')).toBeTruthy();
    renderNav('owner');
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
  });

  it('is hidden for Member and Interviewer', () => {
    renderNav('member');
    expect(screen.queryByText('Settings')).toBeNull();
    renderNav('interviewer');
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('is hidden when no role is known', () => {
    renderNav(null);
    expect(screen.queryByText('Settings')).toBeNull();
  });
});

// The Assignments gate is INDEPENDENT of the Settings gate above, which is why
// none of those assertions changed. Reading the assignment library is not
// sensitive — an interviewer reviewing a submission needs to see the task that
// was set — so every role gets the link. Create/edit (member+) and archive
// (owner+) are enforced in-page and by the API, not by hiding this nav item.
describe('EmployerTopNav Assignments link', () => {
  const ALL_ROLES: Role[] = ['founder', 'owner', 'member', 'interviewer'];

  for (const role of ALL_ROLES) {
    it(`is visible for ${role}`, () => {
      renderNav(role);
      const link = screen.getByRole('link', { name: 'Assignments' });
      expect(link.getAttribute('href')).toBe('/employer/assignments');
    });
  }

  it('is visible for every role including the two that cannot see Settings', () => {
    for (const role of ALL_ROLES) {
      cleanup();
      renderNav(role);
      expect(screen.getByText('Assignments')).toBeTruthy();
    }
    // …and the Settings gate is untouched by that: member still cannot see it.
    cleanup();
    renderNav('member');
    expect(screen.getByText('Assignments')).toBeTruthy();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('sits between Jobs and Settings in the nav', () => {
    renderNav('founder');
    const labels = screen.getAllByRole('link')
      .map((el) => el.textContent?.trim())
      .filter((text) => ['Dashboard', 'Jobs', 'Assignments', 'Settings'].includes(text ?? ''));
    expect(labels).toEqual(['Dashboard', 'Jobs', 'Assignments', 'Settings']);
  });

  it('no longer points at the old settings path', () => {
    renderNav('owner');
    expect(screen.getByRole('link', { name: 'Assignments' }).getAttribute('href'))
      .not.toBe('/employer/settings/assignments');
  });
});
