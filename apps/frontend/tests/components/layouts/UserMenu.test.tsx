import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from '@/components/layouts/parts/UserMenu';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...rest}>{children}</a>,
}));

const user = { name: 'Ada', email: 'ada@x.io', picture: 'https://x/p.jpg' };

describe('UserMenu', () => {
  it('renders the menu items when open', () => {
    render(<UserMenu user={user} open onToggle={() => {}} onClose={() => {}} onOpenSkillsEditor={() => {}} onLogout={() => {}} />);
    expect(screen.getByText('My skills')).toBeTruthy();
    expect(screen.getByText('My progress')).toBeTruthy();
    expect(screen.getByText('Sign out')).toBeTruthy();
    const progress = screen.getByText('My progress').closest('a') as HTMLAnchorElement;
    expect(progress.getAttribute('href')).toBe('/progress');
  });

  it('fires onLogout (and onClose) when Sign out is clicked', () => {
    const onLogout = vi.fn();
    const onClose = vi.fn();
    render(<UserMenu user={user} open onToggle={() => {}} onClose={onClose} onOpenSkillsEditor={() => {}} onLogout={onLogout} />);
    fireEvent.click(screen.getByText('Sign out'));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render items when closed', () => {
    render(<UserMenu user={user} open={false} onToggle={() => {}} onClose={() => {}} onOpenSkillsEditor={() => {}} onLogout={() => {}} />);
    expect(screen.queryByText('Sign out')).toBeNull();
  });
});
