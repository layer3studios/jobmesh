'use client';
// FILE: src/context/seeker/useSkillsAndGoal.ts
import { useState, useCallback } from 'react';
import type { AppUser } from './seeker-context-types';

export function useSkillsAndGoal(currentUser: AppUser | null) {
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(5);

  const saveSkills = useCallback(async (skills: string[]) => {
    if (!currentUser) return;
    try {
      const r = await fetch('/api/seeker/me/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ skills }),
      });
      if (r.ok) {
        const data = await r.json() as string[];
        setUserSkills(Array.isArray(data) ? data : skills);
      }
    } catch { /* silent */ }
  }, [currentUser]);

  const saveDailyGoal = useCallback(async (goal: number) => {
    if (!currentUser) return;
    const nextGoal = Math.max(1, Math.min(50, goal || 5));
    setDailyGoal(nextGoal);
    try {
      const r = await fetch('/api/seeker/me/goal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ goal: nextGoal }),
      });
      if (r.ok) {
        const data = await r.json() as { dailyGoal?: number };
        if (typeof data.dailyGoal === 'number') setDailyGoal(data.dailyGoal);
      }
    } catch { /* leave optimistic */ }
  }, [currentUser]);

  return { userSkills, setUserSkills, dailyGoal, setDailyGoal, saveSkills, saveDailyGoal };
}
