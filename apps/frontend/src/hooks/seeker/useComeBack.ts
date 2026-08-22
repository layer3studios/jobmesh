'use client';
// FILE: src/hooks/seeker/useComeBack.ts
// Ported from the Vite Dashboard/useComeBack.ts (co-located there); promoted to a
// shared seeker hook so both the /jobs dashboard and the standalone /jobs/[jobId]
// detail page can wire the comeBackMap.
import { useState, useEffect, useCallback } from 'react';

interface CurrentUser { slug: string; }

/** Manages the comeBackMap (jobId → note) and its server sync. */
export function useComeBack(currentUser: CurrentUser | null) {
  const [comeBackMap, setComeBackMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentUser) { setComeBackMap({}); return; }
    let cancelled = false;
    fetch('/api/seeker/me/comeback', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((arr: Array<{ jobId: string; note?: string }>) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (item?.jobId) map[item.jobId] = item.note || '';
          }
        }
        setComeBackMap(map);
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [currentUser?.slug]);

  const toggle = useCallback((jobId: string, note?: string) => {
    if (!currentUser) return;
    const newNote = note || '';
    setComeBackMap(prev => ({ ...prev, [jobId]: newNote }));
    fetch(`/api/seeker/me/comeback/${encodeURIComponent(jobId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote }),
    }).catch(() => { });
  }, [currentUser]);

  const remove = useCallback((jobId: string) => {
    if (!currentUser) return;
    setComeBackMap(prev => { const n = { ...prev }; delete n[jobId]; return n; });
    fetch(`/api/seeker/me/comeback/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => { });
  }, [currentUser]);

  return { comeBackMap, toggle, remove };
}
