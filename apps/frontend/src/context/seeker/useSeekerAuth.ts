'use client';
// FILE: src/context/seeker/useSeekerAuth.ts
// Manages the logged-in user (cookie session). Server-seeded hybrid (D3/D_impl_1):
// when the (seeker) layout passes `initialUser` (fetched server-side), we seed
// state and SKIP the client `/seeker/auth/me` round-trip — no auth-loading flash.
// When omitted, we fetch on mount exactly as the original Vite app did.
import { useState, useEffect, useCallback } from 'react';
import type { AppUser } from './seeker-context-types';
import { trackEvent } from '../../lib/analytics-events';
import { isFirstSeen } from '../../lib/first-seen';
import { getFromRoute } from '../../lib/from-route';

export function useSeekerAuth(initialUser?: AppUser | null) {
  const isSeeded = initialUser !== undefined;
  const [currentUser, setCurrentUser] = useState<AppUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!isSeeded);

  useEffect(() => {
    if (isSeeded) return;
    fetch('/api/seeker/auth/me', { credentials: 'include' })
      .then(async r => {
        if (r.ok) { const user = await r.json(); setCurrentUser(user); }
        else setCurrentUser(null);
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, [isSeeded]);

  const login = useCallback(async (credential: string) => {
    const r = await fetch('/api/seeker/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });
    if (!r.ok) throw new Error('Google login failed');
    const { user } = await r.json();
    setCurrentUser(user);
    // No isNewUser flag in the payload (D1) — infer signup vs login from first-seen.
    const isSignup = isFirstSeen('seeker', user?.slug ?? '');
    trackEvent(isSignup ? 'seeker_signup_completed' : 'seeker_login_completed', { method: 'google' });
  }, []);

  const rawLogout = useCallback(async () => {
    trackEvent('seeker_logged_out', { fromRoute: getFromRoute() });
    await fetch('/api/seeker/auth/logout', { method: 'POST', credentials: 'include' });
    setCurrentUser(null);
  }, []);

  return { currentUser, setCurrentUser, isLoading, login, rawLogout };
}
