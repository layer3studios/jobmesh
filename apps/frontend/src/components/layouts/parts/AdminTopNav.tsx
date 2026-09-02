'use client';
// FILE: src/components/layouts/parts/AdminTopNav.tsx
// Admin top-nav bar (STEP-N2). Mirrors EmployerTopNav's visual language
// token-for-token but carries admin-specific chrome: a subtle "Admin" mode
// badge next to the brand (the surface's only visual differentiation, D5/R2)
// and a single Employer Access link. No seeker items (no skills editor, no
// today count, no streak), no company name, no theme toggle. The avatar
// dropdown is keyboard- and pointer-accessible (V8): aria-haspopup,
// aria-expanded, role="menu"/menuitem, Escape + click-outside + route-change
// close — inlined here rather than reusing the seeker-tied UserMenu (C7).

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Sparkles } from 'lucide-react';
import BrandLogo from '../../BrandLogo';
import { utilityBtn, menuItem } from './types';
import { ADMIN_ROUTES } from './routes';
import { Z } from '@/theme/tokens';

interface AdminNavUser {
  name: string;
  email: string;
  picture?: string;
}

interface Props {
  // Drives the compact brand mark (wordmark collapses on narrow widths). The
  // Admin badge itself always shows — that's the mode cue (D2).
  isCompact: boolean;
  currentUser: AdminNavUser | null;
  onLogout: () => void;
}

export default function AdminTopNav({ isCompact, currentUser, onLogout }: Props) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on route change so the dropdown never lingers across navigations.
  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  // startsWith so future admin subpages (e.g. /admin/employer-access/:id) keep
  // the parent link highlighted.
  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  const renderNavLink = (path: string, label: string, icon?: React.ReactNode) => (
    <Link
      href={path}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '7px 12px', borderRadius: 8,
        textDecoration: 'none', fontSize: '0.875rem',
        fontWeight: isActive(path) ? 600 : 500,
        color: isActive(path) ? 'var(--ink)' : 'var(--ink-muted)',
        background: isActive(path) ? 'var(--paper-2)' : 'transparent',
        transition: 'all 160ms ease',
      }}
      onMouseEnter={e => { if (!isActive(path)) (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)'; }}
      onMouseLeave={e => { if (!isActive(path)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {icon}{label}
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
      {/* Width matches the admin content container (max-w-[1536px]) so nav and page align. */}
      <div className="mx-auto w-full max-w-[1536px]" style={{
        padding: '12px clamp(16px, 3vw, 32px)',
        display: 'flex', alignItems: 'center', gap: 16, minHeight: 60,
      }}>
        <Link href={ADMIN_ROUTES.HOME} aria-label="Go to admin home" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <BrandLogo size="md" compact={isCompact} />
        </Link>
        {/* Mode badge — shown even when compact (D2): the point is the cue. */}
        <span style={{
          flexShrink: 0,
          padding: '2px 8px', borderRadius: 999,
          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.02em',
          background: 'var(--paper-2)', color: 'var(--ink-2)',
          border: '1px solid var(--border)', whiteSpace: 'nowrap',
        }}>
          Admin
        </span>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 16 }}>
          {renderNavLink(ADMIN_ROUTES.EMPLOYER_ACCESS, 'Employer Access')}
          {renderNavLink(ADMIN_ROUTES.ANALYTICS, 'Analytics')}
          {renderNavLink(ADMIN_ROUTES.AI_USAGE, 'AI Usage', <Sparkles size={14} />)}
          {renderNavLink('/admin/scraper-health', 'Scraper')}
          {renderNavLink('/admin/queues', 'Queues')}
          {renderNavLink('/admin/companies', 'Companies')}
          {renderNavLink('/admin/jobs-browser', 'Jobs')}
          {renderNavLink('/admin/flags', 'Flags')}
          {renderNavLink('/admin/audit-log', 'Audit')}
          {renderNavLink('/admin/email-log', 'Email')}
          {renderNavLink('/admin/alerts', 'Alerts')}
          {renderNavLink('/admin/seo', 'SEO')}
          {renderNavLink(ADMIN_ROUTES.DPDP, 'DPDP')}
          {/* Literal path: ADMIN_ROUTES lives in routes.ts, outside this chunk's allowlist. */}
          {renderNavLink('/admin/team', 'Team')}
        </nav>

        <div style={{ flex: 1 }} />

        {currentUser && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMenuOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Account menu"
              title={currentUser.name}
              style={{ ...utilityBtn, position: 'relative', width: 36, height: 36, borderRadius: 10, background: 'var(--paper-2)', padding: 0, overflow: 'hidden' }}
            >
              {/* Initial sits underneath; a missing or broken picture reveals it
                  instead of an empty square. */}
              <span aria-hidden style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                {(currentUser.name.trim()[0] ?? '?').toUpperCase()}
              </span>
              {currentUser.picture && (
                // eslint-disable-next-line @next/next/no-img-element -- 36px avatar with onError fallback; next/image adds no value here
                <img
                  src={currentUser.picture}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="anim-scale"
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 220,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6, zIndex: Z.dropdown,
                }}
              >
                <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</div>
                </div>
                <button role="menuitem" onClick={() => { setIsMenuOpen(false); onLogout(); }} style={menuItem}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
