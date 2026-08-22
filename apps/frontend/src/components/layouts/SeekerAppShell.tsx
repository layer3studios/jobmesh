'use client';
// FILE: src/components/layouts/SeekerAppShell.tsx
// Client shell for the seeker audience — verbatim adaptation of the Vite
// AppLayoutModern. The (seeker) server layout seeds SeekerProvider and wraps its
// children in this shell, which renders TopNav + BottomNav (mobile) + Footer
// (desktop) + the SkillsEditor overlay. Nav prop wiring stays identical to the Vite
// version (D_gap_1): TopNav is a stateless presentational component fed from
// SeekerContext + ThemeProvider + useViewport here.
import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Briefcase, Building2, Home as HomeIcon, BarChart3, FileText, User } from 'lucide-react';
import { useTheme } from '../../context/theme/ThemeProvider';
import { useSeeker } from '../../context/seeker/SeekerContext';
import SkillsEditor from '../seeker/SkillsEditor';
import Footer from './Footer';
import TopNav from './parts/TopNav';
import BottomNav from './parts/BottomNav';
import { useViewport } from '../../hooks/shared/useViewport';
import type { NavItem } from './parts/types';

export default function SeekerAppShell({ children }: { children: ReactNode }) {
  const { mode, toggle } = useTheme();
  const {
    currentUser, logout, skillsEditorOpen, openSkillsEditor, closeSkillsEditor,
    todayCount, streak,
  } = useSeeker();

  const vp = useViewport();
  const isMobile = vp.w < 768;
  const isCompact = vp.w < 1024;

  const pathname = usePathname();
  // Reset scroll on route change so a new page never paints mid-scroll over the old one.
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const navItems: NavItem[] = currentUser ? [
    { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
    { to: '/today', label: 'Today', icon: <HomeIcon size={18} /> },
    { to: '/directory', label: 'Companies', icon: <Building2 size={18} /> },
    { to: '/progress', label: 'Progress', icon: <BarChart3 size={18} /> },
    { to: '/resume', label: 'Resume', icon: <FileText size={18} /> },
    { to: '/profile', label: 'Profile', icon: <User size={18} /> },
  ] : [
    { to: '/', label: 'Home', icon: <HomeIcon size={18} /> },
    { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
    { to: '/directory', label: 'Companies', icon: <Building2 size={18} /> },
  ];

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--paper)',
    }}>
      <TopNav
        isMobile={isMobile}
        isCompact={isCompact}
        navItems={navItems}
        currentUser={currentUser}
        todayCount={todayCount}
        streak={streak}
        themeMode={mode}
        onToggleTheme={toggle}
        onOpenSkillsEditor={openSkillsEditor}
        onLogout={logout}
      />

      <main
        className={isMobile ? 'has-bottom-nav' : ''}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* key by path forces a clean unmount/remount per route — prevents the
            previous page's nodes from lingering/overlapping during navigation. */}
        <div key={pathname} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>

      {!isMobile && <Footer />}
      {isMobile && <BottomNav items={navItems} />}

      {skillsEditorOpen && <SkillsEditor onClose={closeSkillsEditor} />}
    </div>
  );
}
