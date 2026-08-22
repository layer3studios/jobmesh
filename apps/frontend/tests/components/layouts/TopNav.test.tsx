import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopNav from '@/components/layouts/parts/TopNav';

vi.mock('next/navigation', () => ({ usePathname: () => '/jobs' }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...rest}>{children}</a>,
}));

const user = { name: 'Ada Lovelace', email: 'ada@x.io', picture: 'https://x/p.jpg' };

function renderTopNav(overrides: Record<string, unknown> = {}) {
  const onToggleTheme = vi.fn();
  const onLogout = vi.fn();
  const onOpenSkillsEditor = vi.fn();
  render(
    <TopNav
      isMobile={false}
      isCompact={false}
      navItems={[{ to: '/jobs', label: 'Jobs', icon: null }]}
      currentUser={user}
      todayCount={2}
      streak={3}
      themeMode="light"
      onToggleTheme={onToggleTheme}
      onOpenSkillsEditor={onOpenSkillsEditor}
      onLogout={onLogout}
      {...overrides}
    />,
  );
  return { onToggleTheme, onLogout, onOpenSkillsEditor };
}

describe('TopNav', () => {
  it('fires onToggleTheme when the theme button is clicked', () => {
    const { onToggleTheme } = renderTopNav();
    fireEvent.click(screen.getByLabelText('Switch to dark mode'));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('opens the user menu and fires onLogout on Sign out', () => {
    const { onLogout } = renderTopNav();
    // Menu is closed initially.
    expect(screen.queryByText('Sign out')).toBeNull();
    fireEvent.click(screen.getByTitle('Ada Lovelace'));
    expect(screen.getByText('Sign out')).toBeTruthy();
    fireEvent.click(screen.getByText('Sign out'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('shows a Sign in link when there is no current user', () => {
    renderTopNav({ currentUser: null });
    expect(screen.getByText('Sign in')).toBeTruthy();
  });
});
