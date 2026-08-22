'use client';
// FILE: src/context/seeker/SeekerContext.tsx
// Orchestrator — composes domain hooks (auth, applied, dismissed, skills) into one
// context. Verbatim port of the Vite SeekerContext, adapted for the Next server-seed
// hybrid (D3/D_impl_1): the (seeker) layout reads the cookie server-side and passes
// `initialUser`. When seeded, useSeekerAuth skips its client `/seeker/auth/me` fetch
// (no auth-loading flash); the user-data load (applied/visit) still runs client-side.
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { AppliedJobEntry } from '../../types';
import { getStreak, getTodayCount } from '../../utils/progress';
import { useSeekerAuth } from './useSeekerAuth';
import { useApplied } from './useApplied';
import { useDismissed } from './useDismissed';
import { useSkillsAndGoal } from './useSkillsAndGoal';
import { useAnalyticsIdentity } from '../../hooks/useAnalyticsIdentity';
import type { UserCtx, AppUser } from './seeker-context-types';

// Re-export for back-compat
export type { AppUser };

const Ctx = createContext<UserCtx>({
  currentUser: null, isLoading: true, isUserDataLoading: false,
  userSkills: [], appliedJobs: [], appliedCount: 0,
  appliedJobIds: new Set(), dismissedJobIds: new Set(),
  previousVisitAt: null, todayCount: 0, streak: 0, dailyGoal: 5,
  skillsEditorOpen: false,
  openSkillsEditor: () => { }, closeSkillsEditor: () => { },
  saveSkills: async () => { }, saveDailyGoal: async () => { },
  toggleApplied: async () => { }, toggleDismissed: async () => { },
  updateStage: async () => { },
  logout: () => { }, login: async () => { },
});

export function SeekerProvider(
  { children, initialUser }: { children: ReactNode; initialUser?: AppUser | null },
) {
  const { currentUser, setCurrentUser, isLoading, login, rawLogout } = useSeekerAuth(initialUser);
  const { userSkills, setUserSkills, dailyGoal, setDailyGoal, saveSkills, saveDailyGoal } = useSkillsAndGoal(currentUser);
  const { appliedJobs, setAppliedJobs, appliedCount, setAppliedCount, appliedJobIds, toggleApplied, updateStage } = useApplied(currentUser);
  const { dismissedJobIds, setDismissedJobIds, toggleDismissed } = useDismissed(currentUser);

  const [isUserDataLoading, setIsUserDataLoading] = useState(false);
  const [previousVisitAt, setPreviousVisitAt] = useState<string | null>(null);
  const [skillsEditorOpen, setSkillsEditorOpen] = useState(false);

  // Initial load of user data after auth resolves
  useEffect(() => {
    if (!currentUser) {
      setUserSkills([]); setAppliedJobs([]); setAppliedCount(0);
      setPreviousVisitAt(null); setDailyGoal(5);
      setDismissedJobIds(new Set()); setIsUserDataLoading(false);
      return;
    }
    let cancelled = false;
    setIsUserDataLoading(true);

    Promise.all([
      fetch('/api/seeker/me', { credentials: 'include' }).then(r => {
        if (r.status === 401) throw new Error('Unauthorized');
        return r.ok ? r.json() : null;
      }),
      fetch('/api/seeker/me/applied', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
      fetch('/api/seeker/me/visit', { method: 'PATCH', credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ])
      .then(([userData, appliedData, visitData]: [{ skills?: string[]; dailyGoal?: number; appliedCount?: number; dismissedJobIds?: string[] } | null, AppliedJobEntry[], { previousVisitAt: string | null } | null]) => {
        if (cancelled) return;
        setUserSkills(Array.isArray(userData?.skills) ? userData.skills : []);
        setDailyGoal(userData?.dailyGoal ?? 5);
        if (Array.isArray(userData?.dismissedJobIds)) setDismissedJobIds(new Set(userData.dismissedJobIds as string[]));
        const nextApplied = Array.isArray(appliedData) ? appliedData : [];
        setAppliedJobs(nextApplied);
        setAppliedCount(userData?.appliedCount ?? nextApplied.length);
        setPreviousVisitAt(visitData?.previousVisitAt ?? null);
      })
      .catch(err => { if (err.message === 'Unauthorized') setCurrentUser(null); })
      .finally(() => { if (!cancelled) setIsUserDataLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.email]);

  const todayCount = useMemo(() => getTodayCount(appliedJobs), [appliedJobs]);
  const streak = useMemo(() => getStreak(appliedJobs), [appliedJobs]);

  // Analytics identity — consent-gated + no-op until PostHog inits (Chunk 1 §7). Only
  // non-sensitive, already-known fields; distinct_id is the stable public slug.
  const analyticsIdentity = useMemo(
    () => (currentUser
      ? { distinctId: currentUser.slug, properties: { role: 'seeker', email: currentUser.email, name: currentUser.name, isSeeker: true } }
      : null),
    [currentUser],
  );
  useAnalyticsIdentity(analyticsIdentity);

  const logout = useCallback(async () => {
    await rawLogout();
    setUserSkills([]); setAppliedJobs([]); setAppliedCount(0);
    setPreviousVisitAt(null); setDailyGoal(5);
    setDismissedJobIds(new Set());
  }, [rawLogout]);

  const openSkillsEditor = useCallback(() => setSkillsEditorOpen(true), []);
  const closeSkillsEditor = useCallback(() => setSkillsEditorOpen(false), []);

  return (
    <Ctx.Provider value={{
      currentUser, isLoading, isUserDataLoading, userSkills, appliedJobs, appliedCount,
      appliedJobIds, dismissedJobIds, previousVisitAt, todayCount, streak, dailyGoal,
      skillsEditorOpen, openSkillsEditor, closeSkillsEditor, saveSkills, saveDailyGoal,
      toggleApplied, toggleDismissed, updateStage, logout, login,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSeeker = () => useContext(Ctx);
