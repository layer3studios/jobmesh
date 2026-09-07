'use client';
// FILE: src/components/layouts/parts/TopNav.tsx
// The app's header: wordmark, text links with an ink underline for the
// current page, the day's count, theme toggle, and the user menu or Sign in.
// The 3px amber→indigo thread beneath it (board.css) is the chrome's only
// colour. Hover states are CSS classes — no hover-as-state.
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu, X } from 'lucide-react';
import BrandLogo from '../../BrandLogo';
import UserMenu from './UserMenu';
import MobileDropdown from './MobileDropdown';
import { utilityBtn, type NavItem } from './types';
import { Z } from '@/theme/tokens';

interface User { name: string; email: string; picture?: string; }

interface Props {
  navItems: NavItem[];
  currentUser: User | null;
  todayCount: number;
  streak: number;
  themeMode: 'light' | 'dark';
  isMobile: boolean;
  isCompact: boolean;
  onToggleTheme: () => void;
  onOpenSkillsEditor: () => void;
  onLogout: () => void;
}

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function TopNav(p: Props) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const active = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const renderNavLink = (item: NavItem) => (
    <Link
      key={item.to}
      href={item.to}
      className="an-link"
      aria-current={active(item.to) ? 'page' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '8px 12px',
        textDecoration: 'none', fontSize: 14,
        fontWeight: 500,
        color: active(item.to) ? 'var(--ink)' : 'var(--ink-muted)',
      }}
    >
      {p.isCompact ? <span style={{ display: 'flex' }} title={item.label}>{item.icon}</span> : item.label}
    </Link>
  );

  return (
    <header className="an-nav" style={{
      position: 'sticky', top: 0, zIndex: Z.nav,
      background: 'var(--glass-bg)',
      backdropFilter: 'saturate(190%) blur(26px)',
      WebkitBackdropFilter: 'saturate(190%) blur(26px)',
      borderBottom: '1px solid var(--border)',
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <div style={{
        maxWidth: 1440, margin: '0 auto',
        padding: p.isMobile ? '8px 16px' : '10px var(--margin-page)',
        display: 'flex', alignItems: 'center', gap: 12,
        minHeight: p.isMobile ? 56 : 64,
      }}>
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <BrandLogo size={p.isMobile ? 'sm' : 'md'} />
        </Link>

        {!p.isMobile && (
          <nav aria-label="Primary" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 20 }}>
            {p.navItems.map(renderNavLink)}
          </nav>
        )}

        <div style={{ flex: 1 }} />

        {/* Quick stat — desktop only, logged in. A mono figure, not a badge. */}
        {!p.isMobile && p.currentUser && (
          <Link
            href="/pipeline"
            className="an-util"
            title="Your pipeline"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              height: 36, padding: '0 12px', borderRadius: 8, textDecoration: 'none',
              border: '1px solid var(--border)', color: 'var(--ink-muted)',
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            <span style={{ color: p.todayCount > 0 ? 'var(--ink)' : 'var(--ink-muted)', fontWeight: 600 }}>{p.todayCount}</span>
            <span>today</span>
            {p.streak > 0 && (
              <>
                <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
                <span style={{ color: 'var(--warning)' }}>{p.streak}d streak</span>
              </>
            )}
          </Link>
        )}

        <button
          className="an-util"
          onClick={p.onToggleTheme}
          aria-label={p.themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ ...utilityBtn, width: 36, height: 36, borderRadius: 8 }}
        >
          {p.themeMode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {p.currentUser ? (
          <UserMenu
            user={p.currentUser}
            open={userMenuOpen}
            onToggle={() => setUserMenuOpen(v => !v)}
            onClose={() => setUserMenuOpen(false)}
            onOpenSkillsEditor={p.onOpenSkillsEditor}
            onLogout={p.onLogout}
          />
        ) : (
          <>
            {!p.isMobile && (
              <Link href="/hire" className="an-link" style={{
                display: 'inline-flex', alignItems: 'center', padding: '8px 12px',
                fontSize: 14, fontWeight: 500, color: 'var(--ink-muted)', textDecoration: 'none', whiteSpace: 'nowrap',
              }}>Post a job</Link>
            )}
            <Link href="/login" className="an-solid" style={{
              display: 'inline-flex', alignItems: 'center',
              height: 36, padding: '0 16px', borderRadius: 8,
              fontSize: 14, fontWeight: 500,
              background: 'var(--ink)', color: 'var(--paper)',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>Sign in</Link>
          </>
        )}

        {p.isMobile && p.currentUser && (
          <button
            className="an-util"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            style={{ ...utilityBtn, width: 36, height: 36, borderRadius: 8 }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </div>

      {p.isMobile && mobileMenuOpen && p.currentUser && (
        <MobileDropdown
          user={p.currentUser}
          todayCount={p.todayCount}
          streak={p.streak}
          onClose={() => setMobileMenuOpen(false)}
          onOpenSkillsEditor={p.onOpenSkillsEditor}
          onLogout={p.onLogout}
        />
      )}
    </header>
  );
}
