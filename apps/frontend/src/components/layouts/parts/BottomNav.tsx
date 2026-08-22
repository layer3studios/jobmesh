'use client';
// FILE: src/components/layouts/parts/BottomNav.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from './types';
import { Z } from '@/theme/tokens';

interface Props { items: NavItem[]; }

export default function BottomNav({ items }: Props) {
  const pathname = usePathname();
  const active = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: Z.nav,
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'var(--glass-bg)',
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        maxWidth: 600, margin: '0 auto',
      }}>
        {items.map(item => {
          const isActive = active(item.to);
          return (
            <Link
              key={item.to}
              href={item.to}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '10px 4px 12px',
                textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--ink-muted)',
                fontSize: '0.62rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'color 160ms ease', minWidth: 0,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
              <span style={{
                fontSize: '0.65rem', letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', maxWidth: '100%',
              }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
