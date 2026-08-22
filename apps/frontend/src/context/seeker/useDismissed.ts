'use client';
// FILE: src/context/seeker/useDismissed.ts
import { useState, useCallback } from 'react';
import type { AppUser } from './seeker-context-types';

export function useDismissed(currentUser: AppUser | null) {
  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(new Set());

  const toggleDismissed = useCallback(async (jobId: string) => {
    if (!currentUser) return;
    const encoded = encodeURIComponent(jobId);
    const isDismissed = dismissedJobIds.has(jobId);
    setDismissedJobIds(prev => {
      const next = new Set(prev);
      if (isDismissed) next.delete(jobId); else next.add(jobId);
      return next;
    });
    try {
      const r = await fetch(`/api/seeker/me/dismissed/${encoded}`, {
        method: isDismissed ? 'DELETE' : 'POST',
        credentials: 'include',
      });
      if (r.ok) {
        const ids = await r.json() as string[];
        setDismissedJobIds(new Set(ids));
      }
    } catch { /* leave optimistic */ }
  }, [currentUser, dismissedJobIds]);

  return { dismissedJobIds, setDismissedJobIds, toggleDismissed };
}
