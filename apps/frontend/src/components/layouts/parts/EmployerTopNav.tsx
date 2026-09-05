'use client';
// FILE: src/components/layouts/parts/EmployerTopNav.tsx
// Employer top-nav bar. The same chrome as the seeker TopNav — wordmark, text
// links with an ink underline for the current section, theme toggle, avatar
// menu, and the 3px amber→indigo thread beneath (board.css) — with a mono
// "HIRE · Company" label in place of the seeker's quick stat. Hover states are
// CSS classes, never React state.

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

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

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
      className="an-link"
      aria-current={isActive(path) ? 'page' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '8px 12px',
        textDecoration: 'none', fontSize: 14, fontWeight: 500,
        color: isActive(path) ? 'var(--ink)' : 'var(--ink-muted)',
      }}
    >
      {label}
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
        maxWidth: 1440, margin: '0 auto', padding: '10px var(--margin-page)',
        display: 'flex', alignItems: 'center', gap: 12, minHeight: 64,
      }}>
        <Link href={EMPLOYER_ROUTES.DASHBOARD} aria-label="Go to dashboard" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <BrandLogo size="md" compact={isCompact} />
        </Link>
        {/* The audience and the company, as one mono label. On compact widths
            the company name goes and the audience stays — it is the cue. */}
        <span style={{
          fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 240, paddingLeft: 12, borderLeft: '1px solid var(--border)',
        }}>
          {COPY.employer.nav.hireSuffix}
          {!isCompact && companyName && <span style={{ color: 'var(--ink)' }}> · {companyName}</span>}
        </span>

        <nav aria-label="Primary" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 12 }}>
          {renderNavLink(EMPLOYER_ROUTES.DASHBOARD, COPY.employer.nav.dashboard)}
          {renderNavLink(EMPLOYER_ROUTES.JOBS, COPY.employer.nav.jobs)}
          {/* UNGATED, and independently of Settings. Reading the assignment library
              is not sensitive: an interviewer reviewing a submission needs to see
              the task that was set. Create/edit stays member+ and archive stays
              owner+, both enforced in-page and by the API — this link changes who
              can REACH the library, not what they can do once there. */}
          {renderNavLink(EMPLOYER_ROUTES.ASSIGNMENTS, COPY.employer.nav.assignments)}
          {/* Points at the settings INDEX rather than straight at the team page.
              The Owner+ gate is deliberately UNCHANGED — asserted by
              tests/components/layouts/EmployerTopNav.test.tsx. */}
          {role && canEditCompanySettings(role) && renderNavLink(EMPLOYER_ROUTES.SETTINGS, COPY.employer.nav.settings)}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Same control, same icons, same aria copy as the seeker TopNav: one
            person may use both audiences, and the toggle should not move or
            change shape when they switch. */}
        {onThemeToggle && (
          <button
            className="an-util"
            onClick={onThemeToggle}
            aria-label={themeMode === 'dark' ? COPY.nav.switchToLight : COPY.nav.switchToDark}
            style={{ ...utilityBtn, width: 36, height: 36, borderRadius: 8 }}
          >
            {themeMode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
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
              style={{ ...utilityBtn, position: 'relative', width: 36, height: 36, borderRadius: 8, background: 'var(--paper-2)', padding: 0, overflow: 'hidden' }}
            >
              {/* Initial sits underneath; a missing or broken picture reveals it
                  instead of an empty square. */}
              <span aria-hidden style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
                {(currentUser.name.trim()[0] ?? '?').toUpperCase()}
              </span>
              {currentUser.picture && (
                // eslint-disable-next-line @next/next/no-img-element -- 36px avatar with onError fallback
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
                className="glass glass--strong"
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 220,
                  borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6, zIndex: Z.dropdown,
                }}
              >
                <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</div>
                </div>
                <button role="menuitem" className="jb-option" onClick={() => { setIsMenuOpen(false); onLogout(); }} style={menuItem}>
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
