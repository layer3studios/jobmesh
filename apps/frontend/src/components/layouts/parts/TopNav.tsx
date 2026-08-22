'use client';
// FILE: src/components/layouts/parts/TopNav.tsx
import { useState } from 'react';
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
  isMobile: boolean;
  isCompact: boolean;
  navItems: NavItem[];
  currentUser: User | null;
  todayCount: number;
  streak: number;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSkillsEditor: () => void;
  onLogout: () => void;
}

export default function TopNav(p: Props) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menus on route change
  useState(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  });

  const active = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const renderNavLink = (item: NavItem) => (
    <Link
      key={item.to}
      href={item.to}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 12px', borderRadius: 8,
        textDecoration: 'none', fontSize: '0.875rem',
        fontWeight: active(item.to) ? 600 : 500,
        color: active(item.to) ? 'var(--ink)' : 'var(--ink-muted)',
        background: active(item.to) ? 'var(--paper-2)' : 'transparent',
        transition: 'all 160ms ease',
      }}
      onMouseEnter={e => { if (!active(item.to)) (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)'; }}
      onMouseLeave={e => { if (!active(item.to)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span style={{ color: active(item.to) ? 'var(--accent)' : 'var(--ink-faint)', display: 'flex' }}>{item.icon}</span>
      <span style={{ display: p.isCompact ? 'none' : 'inline' }}>{item.label}</span>
    </Link>
  );

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: Z.nav,
      background: 'var(--glass-bg)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: p.isMobile ? '10px 16px' : '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        minHeight: p.isMobile ? 56 : 60,
      }}>
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <BrandLogo size={p.isMobile ? 'sm' : 'md'} />
        </Link>

        {!p.isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 16 }}>
            {p.navItems.map(renderNavLink)}
          </nav>
        )}

        <div style={{ flex: 1 }} />

        {/* Quick stat — desktop only, logged in */}
        {!p.isMobile && p.currentUser && (
          <Link
            href="/progress"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
              background: 'var(--paper-2)', border: '1px solid var(--border)',
            }}
            title="View progress"
          >
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: p.todayCount > 0 ? 'var(--accent)' : 'var(--paper-3)',
              color: p.todayCount > 0 ? 'var(--text-on-accent)' : 'var(--ink-muted)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 700,
            }}>{p.todayCount}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>today</span>
            {p.streak > 0 && (
              <>
                <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 600 }}>{p.streak}d streak</span>
              </>
            )}
          </Link>
        )}

        <button
          onClick={p.onToggleTheme}
          aria-label={p.themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={utilityBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)'; }}
        >
          {p.themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
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
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '8px 16px', borderRadius: 10,
            fontSize: '0.875rem', fontWeight: 500,
            background: 'var(--ink)', color: 'var(--paper)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>Sign in</Link>
        )}

        {p.isMobile && p.currentUser && (
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Open menu"
            style={utilityBtn}
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
