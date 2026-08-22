'use client';
// FILE: src/components/layouts/AdminAppShell.tsx
// Client shell for the admin audience. Admin is its own audience (jm_admin_token) —
// identity + logout come from the admin context via useAdmin(), never the seeker
// stack. The (admin)/admin/(app) guard layout runs the auth check and seeds
// AdminProvider so this shell reads the admin from context. Desktop-first shell.
import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAdmin } from '../../context/admin/AdminContext';
import { useViewport } from '../../hooks/shared/useViewport';
import AdminTopNav from './parts/AdminTopNav';

const COMPACT_BREAKPOINT_WIDTH = 1024;

export default function AdminAppShell({ children }: { children: ReactNode }) {
  const { admin, logout, isLoading } = useAdmin();
  const viewport = useViewport();
  const isCompact = viewport.w < COMPACT_BREAKPOINT_WIDTH;

  const pathname = usePathname();
  // Reset scroll on route change so a new page never paints mid-scroll (mirror seeker).
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  // Defensive: the server guard authorises above, but the client provider can mount
  // a tick before it hydrates. Render nothing rather than a half-populated nav.
  if (isLoading || !admin) return null;

  // AdminIdentity carries no name/picture (backend does not return them, D1). Derive a
  // display name from the email local-part; AdminTopNav renders an initial fallback.
  const navUser = {
    name: admin.email.split('@')[0],
    email: admin.email,
    picture: undefined,
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)',
    }}>
      <AdminTopNav
        isCompact={isCompact}
        currentUser={navUser}
        onLogout={logout}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* key by path forces a clean unmount/remount per route (mirror seeker). */}
        <div key={pathname} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
