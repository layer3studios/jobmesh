import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Control viewport per test.
const viewport = { w: 1280, h: 800 };
vi.mock('@/hooks/shared/useViewport', () => ({ useViewport: () => viewport }));
vi.mock('@/context/theme/ThemeProvider', () => ({ useTheme: () => ({ mode: 'light', toggle: vi.fn() }) }));
vi.mock('@/context/seeker/SeekerContext', () => ({
  useSeeker: () => ({
    currentUser: null, logout: vi.fn(), skillsEditorOpen: false,
    openSkillsEditor: vi.fn(), closeSkillsEditor: vi.fn(), todayCount: 0, streak: 0,
  }),
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
// Stub the heavy children so we can assert which nav renders per viewport.
vi.mock('@/components/layouts/parts/TopNav', () => ({ default: () => <div data-testid="topnav" /> }));
vi.mock('@/components/layouts/parts/BottomNav', () => ({ default: () => <div data-testid="bottomnav" /> }));
vi.mock('@/components/layouts/Footer', () => ({ default: () => <div data-testid="footer" /> }));
vi.mock('@/components/seeker/SkillsEditor', () => ({ default: () => <div data-testid="skills" /> }));

import SeekerAppShell from '@/components/layouts/SeekerAppShell';

describe('SeekerAppShell', () => {
  beforeEach(() => { viewport.w = 1280; viewport.h = 800; });

  it('renders TopNav + Footer on desktop (no BottomNav)', () => {
    viewport.w = 1280;
    render(<SeekerAppShell><p>child</p></SeekerAppShell>);
    expect(screen.getByTestId('topnav')).toBeTruthy();
    expect(screen.getByTestId('footer')).toBeTruthy();
    expect(screen.queryByTestId('bottomnav')).toBeNull();
    expect(screen.getByText('child')).toBeTruthy();
  });

  it('renders TopNav + BottomNav on mobile (no Footer)', () => {
    viewport.w = 500;
    render(<SeekerAppShell><p>child</p></SeekerAppShell>);
    expect(screen.getByTestId('topnav')).toBeTruthy();
    expect(screen.getByTestId('bottomnav')).toBeTruthy();
    expect(screen.queryByTestId('footer')).toBeNull();
  });
});
