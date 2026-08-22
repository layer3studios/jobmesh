// FILE: tests/pages/employer/settings/team/settings-sidebar.test.tsx
// SettingsSidebar: every item is a real link now, and the active item follows
// the current route (Company owns the settings root, so it matches exactly).
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SettingsSidebar, { isSettingsItemActive } from '@/app/(employer)/employer/(app)/(onboarded)/settings/SettingsSidebar';

let pathname = '/employer/settings/team';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

// Assignments is deliberately absent: it moved to /employer/assignments in the
// top nav, because it describes postings rather than company configuration.
const EXPECTED_HREFS: Array<[string, string]> = [
  ['Company', '/employer/settings'],
  ['Team', '/employer/settings/team'],
  ['Roles', '/employer/settings/roles'],
  ['Email', '/employer/settings/email'],
  ['Branding', '/employer/settings/branding'],
  ['Danger zone', '/employer/settings/danger'],
];

describe('SettingsSidebar', () => {
  it('renders all six items as clickable links with the right hrefs', () => {
    render(<SettingsSidebar />);
    for (const [label, href] of EXPECTED_HREFS) {
      expect(screen.getByRole('link', { name: label }).getAttribute('href')).toBe(href);
    }
    expect(screen.getAllByRole('link')).toHaveLength(6);
  });

  it('no longer lists Assignments', () => {
    render(<SettingsSidebar />);
    expect(screen.queryByRole('link', { name: 'Assignments' })).toBeNull();
  });

  it('highlights the item matching the current route', () => {
    pathname = '/employer/settings/roles';
    render(<SettingsSidebar />);
    expect(screen.getByRole('link', { name: 'Roles' }).getAttribute('aria-current')).toBe('page');
    for (const label of ['Company', 'Team', 'Email', 'Branding', 'Danger zone']) {
      expect(screen.getByRole('link', { name: label }).getAttribute('aria-current')).toBeNull();
    }
    cleanup();
    pathname = '/employer/settings/team';
  });

  it('marks Company active only on the settings root, not on every sub-page', () => {
    expect(isSettingsItemActive('/employer/settings', '/employer/settings')).toBe(true);
    expect(isSettingsItemActive('/employer/settings', '/employer/settings/team')).toBe(false);
    expect(isSettingsItemActive('/employer/settings/team', '/employer/settings/team')).toBe(true);
    // A trailing slash must not break the match.
    expect(isSettingsItemActive('/employer/settings', '/employer/settings/')).toBe(true);
  });

  it('renders the horizontal variant with the same six links', () => {
    render(<SettingsSidebar horizontal />);
    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(screen.getByRole('link', { name: 'Danger zone' })).toBeTruthy();
  });
});
