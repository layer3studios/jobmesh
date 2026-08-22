'use client';
// FILE: src/components/layouts/parts/EmployerTopNav.tsx
// Employer top-nav bar (STEP-N1). Mirrors the seeker TopNav token-for-token but
// carries no seeker-specific items. Left: brand + company. Middle: nav links.
// Right: theme toggle + avatar dropdown (aria-haspopup/expanded, role=menu,
// Escape + click-outside + route-change close).

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LogOut, Sun, Moon } from 'lucide-react';
import BrandLogo from '../../BrandLogo';
import { utilityBtn, menuItem } from './types';
import { EMPLOYER_ROUTES } from './routes';
import { canEditCompanySettings } from '../../../lib/team-permissions';
import { parseNavOrigin, originCrumb } from '../../../lib/nav-origin';
import type { Role } from '../../../types/employer-team';
import { COPY } from '../../../theme/brand';
import { Z } from '@/theme/tokens';

interface EmployerNavUser {
  name: string;
  email: string;
  picture?: string;
}

interface Props {
  isCompact: boolean;
  currentUser: EmployerNavUser | null;
  companyName: string | null;
  /** The viewer's company role. Gates the Settings link (Founder/Owner only). */
  role?: Role | null;
  /** Theme for the toggle's icon/label. The toggle hides when no handler is given,
   *  so callers without ThemeProvider still render. */
  themeMode?: 'light' | 'dark';
  onThemeToggle?: () => void;
  onLogout: () => void;
}

export default function EmployerTopNav({
  isCompact, currentUser, companyName, role, themeMode = 'light', onThemeToggle, onLogout,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  // A sub-page opened from another section (?from=) keeps that section lit: the
  // user is doing something FROM the Dashboard, not switching to Jobs.
  const origin = parseNavOrigin(searchParams?.get('from'));
  const originPath = origin ? originCrumb(origin).href : null;

  const isActive = (path: string) => {
    if (originPath) return path === originPath;
    if (path === EMPLOYER_ROUTES.DASHBOARD) return pathname === EMPLOYER_ROUTES.DASHBOARD;
    return pathname === path || pathname.startsWith(path + '/');
  };

  const renderNavLink = (path: string, label: string) => (
    <Link
      href={path}
      style={{
        display: 'inline-flex', alignItems: 'center',
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
      {label}
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
        maxWidth: 1280, margin: '0 auto', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16, minHeight: 60,
      }}>
        <Link href={EMPLOYER_ROUTES.DASHBOARD} aria-label="Go to dashboard" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <BrandLogo size="md" />
        </Link>
        {!isCompact && companyName && (
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
            {COPY.employer.nav.hireSuffix} · {companyName}
          </span>
        )}

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 16 }}>
          {renderNavLink(EMPLOYER_ROUTES.DASHBOARD, COPY.employer.nav.dashboard)}
          {renderNavLink(EMPLOYER_ROUTES.JOBS, COPY.employer.nav.jobs)}
          {/* UNGATED, and independently of Settings. Reading the assignment library
              is not sensitive: an interviewer reviewing a submission needs to see
              the task that was set. Create/edit stays member+ and archive stays
              owner+, both enforced in-page and by the API — this link changes who
              can REACH the library, not what they can do once there.

              This closes a real gap. A member could already create an assignment
              through the API and the posting form but had no way to open the
              library, because it used to live behind the owner-only Settings link. */}
          {renderNavLink(EMPLOYER_ROUTES.ASSIGNMENTS, COPY.employer.nav.assignments)}
          {/* Points at the settings INDEX rather than straight at the team page,
              because settings has more than one subpage.
              The Owner+ gate is deliberately UNCHANGED. It is asserted by
              tests/components/layouts/EmployerTopNav.test.tsx, and widening it is a
              product decision about global navigation, not a side effect of moving
              a page. Assignments above has its own gate — which is to say, none. */}
          {role && canEditCompanySettings(role) && renderNavLink(EMPLOYER_ROUTES.SETTINGS, COPY.employer.nav.settings)}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Same control, same icons, same aria copy as the seeker TopNav: one
            person may use both audiences, and the toggle should not move or
            change shape when they switch. */}
        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            aria-label={themeMode === 'dark' ? COPY.nav.switchToLight : COPY.nav.switchToDark}
            style={utilityBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)'; }}
          >
            {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        {currentUser && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMenuOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Account menu"
              title={currentUser.name}
              style={{ ...utilityBtn, width: 36, height: 36, borderRadius: 10, background: 'var(--paper-2)', padding: 0, overflow: 'hidden' }}
            >
              <img
                src={currentUser.picture}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
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
