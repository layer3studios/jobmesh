'use client';
// FILE: settings/SettingsSidebar.tsx
// Shared settings navigation (all /employer/settings/* pages): a glass panel
// with the amber→indigo seam on its right edge, the same frame the seeker
// workspace sidebar uses. Every item is a real page — nothing is muted or
// inert. Below 768px the layout swaps this for a chip row.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Building2, Users, Shield, Mail, Palette, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { COPY } from '@/theme/brand';

interface SettingsNavItem { label: string; href: string; icon: ReactNode; danger?: boolean }

const SETTINGS_ROOT = '/employer/settings';
const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  // Personal sits FIRST and above Company: it is the only page here every role can
  // use, and Settings itself is otherwise owner-shaped.
  { label: COPY.employer.settings.personal, href: `${SETTINGS_ROOT}/personal`, icon: <User size={14} /> },
  { label: COPY.employer.settings.company, href: SETTINGS_ROOT, icon: <Building2 size={14} /> },
  { label: COPY.employer.settings.team, href: `${SETTINGS_ROOT}/team`, icon: <Users size={14} /> },
  { label: COPY.employer.settings.roles, href: `${SETTINGS_ROOT}/roles`, icon: <Shield size={14} /> },
  { label: COPY.employer.settings.email, href: `${SETTINGS_ROOT}/email`, icon: <Mail size={14} /> },
  { label: COPY.employer.settings.branding, href: `${SETTINGS_ROOT}/branding`, icon: <Palette size={14} /> },
  // Assignments used to sit here. It moved to /employer/assignments (top nav,
  // beside Jobs) because it describes postings, not company configuration — and
  // because Settings is owner-only, which left members unable to reach a library
  // they were allowed to write to.
];

export const DANGER_NAV_ITEM: SettingsNavItem = {
  label: COPY.employer.settings.dangerZone, href: `${SETTINGS_ROOT}/danger`, icon: <Trash2 size={14} />, danger: true,
};

/** Company owns the settings root, so it matches exactly; the rest by prefix. */
export function isSettingsItemActive(href: string, pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  if (href === SETTINGS_ROOT) return path === SETTINGS_ROOT;
  return path === href || path.startsWith(`${href}/`);
}

function NavItem({ item, active, horizontal }: { item: SettingsNavItem; active: boolean; horizontal?: boolean }) {
  return (
    <Link
      href={item.href}
      className="ws-link"
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 9,
        padding: horizontal ? '7px 12px' : '8px 10px', borderRadius: 8,
        fontSize: 14, fontWeight: 500, textDecoration: 'none',
        flexShrink: horizontal ? 0 : undefined,
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: horizontal ? '1px solid var(--border)' : '1px solid transparent',
        color: active ? 'var(--ink)' : item.danger ? 'var(--danger)' : 'var(--ink-muted)',
      }}
    >
      <span style={{ display: 'inline-flex', color: active ? 'var(--ink)' : 'inherit' }}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

export default function SettingsSidebar({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname() ?? '';
  const isActive = (href: string) => isSettingsItemActive(href, pathname);

  if (horizontal) {
    return (
      <nav aria-label="Settings" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, flexWrap: 'wrap' }}>
        {[...SETTINGS_NAV_ITEMS, DANGER_NAV_ITEM].map((item) => (
          <NavItem key={item.label} item={item} active={isActive(item.href)} horizontal />
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Settings" className="glass ws-side" style={{
      width: 'var(--sidebar-width)', flexShrink: 0, position: 'sticky', top: 88,
      borderRadius: 14, padding: 16,
    }}>
      <p style={{ margin: '4px 0 12px 10px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        Settings
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {SETTINGS_NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} active={isActive(item.href)} />
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />
      <NavItem item={DANGER_NAV_ITEM} active={isActive(DANGER_NAV_ITEM.href)} />
    </nav>
  );
}
