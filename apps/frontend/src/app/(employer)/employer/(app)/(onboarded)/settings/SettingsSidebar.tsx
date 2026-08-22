'use client';
// FILE: settings/SettingsSidebar.tsx
// Shared settings navigation (all /employer/settings/* pages). Every item is a
// real page now — nothing is muted or inert. Below 768px the layout swaps this
// for horizontal tabs.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Building2, Users, Shield, Mail, Palette, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { COPY } from '@/theme/brand';

interface SettingsNavItem { label: string; href: string; icon: ReactNode; danger?: boolean }

const SETTINGS_ROOT = '/employer/settings';

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

const ITEM_STYLE = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
  padding: '7px 10px', borderRadius: 8, textDecoration: 'none',
} as const;

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
      aria-current={active ? 'page' : undefined}
      style={{
        ...ITEM_STYLE,
        ...(horizontal ? { flexShrink: 0 } : {}),
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--ink)' : item.danger ? 'var(--danger)' : 'var(--ink-2)',
        fontWeight: active ? 500 : 400,
      }}
    >
      <span style={{ color: active ? 'var(--accent)' : 'inherit', display: 'inline-flex' }}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

export default function SettingsSidebar({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname() ?? '';
  const isActive = (href: string) => isSettingsItemActive(href, pathname);

  if (horizontal) {
    return (
      <nav aria-label="Settings" style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {[...SETTINGS_NAV_ITEMS, DANGER_NAV_ITEM].map((item) => (
          <NavItem key={item.label} item={item} active={isActive(item.href)} horizontal />
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Settings" style={{ width: 200, flexShrink: 0, borderRight: '0.5px solid var(--border)', paddingRight: 12 }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-faint)' }}>
        Settings
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {SETTINGS_NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} active={isActive(item.href)} />
        ))}
      </div>
      <div style={{ borderTop: '0.5px solid var(--border)', margin: '12px 0' }} />
      <NavItem item={DANGER_NAV_ITEM} active={isActive(DANGER_NAV_ITEM.href)} />
    </nav>
  );
}
