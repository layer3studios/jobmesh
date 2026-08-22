'use client';
// FILE: src/components/layouts/EmployerAppShell.tsx
// Client shell for the employer audience — verbatim adaptation of the Vite
// EmployerAppLayout. The (employer)/(app) server layout runs the auth guard and
// seeds EmployerProvider; this shell reads that session and renders the persistent
// EmployerTopNav. Desktop-first: no footer, no mobile bottom nav (D1).
import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { displayPictureFor } from '@/context/employer/employer-context-types';
import { useEmployer } from '../../context/employer/EmployerContext';
import { useTheme } from '../../context/theme/ThemeProvider';
import { useViewport } from '../../hooks/shared/useViewport';
import EmployerTopNav from './parts/EmployerTopNav';

const COMPACT_BREAKPOINT_WIDTH = 1024;

export default function EmployerAppShell({ children }: { children: ReactNode }) {
  // viewerRole is resolved centrally in EmployerContext (from the roster); the shell
  // just forwards it to gate the Settings nav link (Chunk 4).
  const { employerUser, company, viewerRole, logout } = useEmployer();
  // ThemeProvider is mounted globally in Providers.tsx (root layout), so the
  // employer tree reads the SAME context the seeker does — one toggle, one
  // localStorage key, one theme across both audiences.
  const { mode, toggle } = useTheme();
  const viewport = useViewport();
  const isCompact = viewport.w < COMPACT_BREAKPOINT_WIDTH;

  const pathname = usePathname();
  // Reset scroll on route change so a new page never paints mid-scroll (mirror seeker).
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  // Defensive: the server guard authenticates above, but the client provider can
  // mount a tick before it hydrates. Render nothing rather than a half-populated nav.
  if (!employerUser) return null;

  const currentUser = {
    name: employerUser.name,
    email: employerUser.email,
    // The user's upload wins over Google's photo, permanently once set — see
    // displayPictureFor. Google's URL rotates; theirs does not.
    picture: displayPictureFor(employerUser) ?? undefined,
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)',
    }}>
      <EmployerTopNav
        isCompact={isCompact}
        currentUser={currentUser}
        companyName={company?.name ?? null}
        role={viewerRole}
        themeMode={mode}
        onThemeToggle={toggle}
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
