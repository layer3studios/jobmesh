'use client';
// FILE: src/context/admin/AdminContext.tsx
// Client admin auth context. Server-seeded hybrid (mirrors EmployerContext): the
// (admin)/admin/(app) guard layout has already fetched /admin/auth/me and passes it
// as `initialAdmin`, so the provider seeds state and skips the mount refresh. When
// not seeded (initialAdmin omitted) it hydrates via fetchAdminMe on mount. Fully
// independent of seeker/employer identity — reads only the admin session.
//
// No PostHog identify/reset here: the employer context does not wire PostHog either,
// and this chunk mirrors that pattern exactly (item 11).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminMe, logoutAdmin } from '../../api/admin-api';
import type { AdminContextValue, AdminIdentity } from './admin-context-types';

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider(
  { initialAdmin, children }: { initialAdmin?: AdminIdentity | null; children: ReactNode },
) {
  const router = useRouter();
  const isSeeded = initialAdmin !== undefined;
  const [admin, setAdmin] = useState<AdminIdentity | null>(initialAdmin ?? null);
  const [isLoading, setIsLoading] = useState(!isSeeded);

  const refresh = useCallback(async () => {
    try {
      setAdmin(await fetchAdminMe()); // null on 401
    } catch (error) {
      // Transient/other error — keep the previous state (mirror EmployerContext).
      console.error('[admin] session refresh failed', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Best-effort: clear local state + route to login even if the POST fails, and
    // never reject (callers fire this un-awaited from the nav menu).
    try {
      await logoutAdmin();
    } catch {
      /* best-effort logout — ignore */
    }
    setAdmin(null);
    router.push('/admin/login');
  }, [router]);

  // Hydrate on mount only when the layout did not server-seed us.
  useEffect(() => {
    if (!isSeeded) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminContext.Provider value={{ admin, isLoading, logout, refresh }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider');
  return ctx;
}
