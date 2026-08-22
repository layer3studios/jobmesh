'use client';
// FILE: src/context/seeker/useApplied.ts
import { useState, useMemo, useCallback } from 'react';
import type { AppliedJobEntry } from '../../types';
import type { AppUser } from './seeker-context-types';

export function useApplied(currentUser: AppUser | null) {
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobEntry[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);

  const appliedJobIds = useMemo(() => new Set(appliedJobs.map(e => e.jobId)), [appliedJobs]);

  const toggleApplied = useCallback(async (jobId: string) => {
    if (!currentUser) return;
    const encodedJobId = encodeURIComponent(jobId);
    const exists = appliedJobIds.has(jobId);
    const existingEntry = appliedJobs.find(e => e.jobId === jobId) ?? null;
    const optimistic = { jobId, appliedAt: new Date().toISOString() };
    if (!exists) setAppliedCount(prev => prev + 1);
    setAppliedJobs(prev => exists ? prev.filter(e => e.jobId !== jobId) : [...prev, optimistic]);
    try {
      const r = await fetch(`/api/seeker/me/applied/${encodedJobId}`, { method: exists ? 'DELETE' : 'POST', credentials: 'include' });
      if (!r.ok) throw new Error('Failed to toggle applied');
      const data = await r.json() as AppliedJobEntry[];
      setAppliedJobs(Array.isArray(data) ? data : []);
    } catch {
      if (!exists) setAppliedCount(prev => Math.max(0, prev - 1));
      setAppliedJobs(prev => exists ? (existingEntry ? [...prev, existingEntry] : prev) : prev.filter(e => e.jobId !== jobId));
    }
  }, [currentUser, appliedJobIds, appliedJobs]);

  const updateStage = useCallback(async (jobId: string, stage: string) => {
    if (!currentUser) return;
    const encodedJobId = encodeURIComponent(jobId);
    setAppliedJobs(prev => prev.map(entry =>
      entry.jobId === jobId ? { ...entry, stage, stageUpdatedAt: new Date().toISOString() } : entry
    ));
    try {
      const r = await fetch(`/api/seeker/me/applied/${encodedJobId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stage }),
      });
      if (!r.ok) throw new Error('Failed to update stage');
      const data = await r.json();
      setAppliedJobs(Array.isArray(data) ? data : []);
    } catch {
      try {
        const r = await fetch('/api/seeker/me/applied', { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          setAppliedJobs(Array.isArray(data) ? data : []);
        }
      } catch { /* silent */ }
    }
  }, [currentUser]);

  return {
    appliedJobs, setAppliedJobs,
    appliedCount, setAppliedCount,
    appliedJobIds,
    toggleApplied, updateStage,
  };
}
