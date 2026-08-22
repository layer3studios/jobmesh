'use client';
// FILE: src/components/seeker/dashboard/useJobFacets.ts
// Fetches the filter facets (top tech tags + posting cities) once per session.
// Module-level cache so remounts and route transitions don't refetch.

import { useState, useEffect } from 'react';

export interface JobFacets {
  techStack: { tag: string; count: number }[];
  cities: { city: string; count: number }[];
}

const EMPTY_FACETS: JobFacets = { techStack: [], cities: [] };

let cached: JobFacets | null = null;
let inFlight: Promise<JobFacets> | null = null;

function loadFacets(): Promise<JobFacets> {
  if (cached) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = fetch('/api/seeker/jobs/facets', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : EMPTY_FACETS))
      .then((d: JobFacets) => {
        cached = {
          techStack: Array.isArray(d?.techStack) ? d.techStack : [],
          cities: Array.isArray(d?.cities) ? d.cities : [],
        };
        return cached;
      })
      .catch(() => EMPTY_FACETS)
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

export function useJobFacets(): JobFacets {
  const [facets, setFacets] = useState<JobFacets>(cached ?? EMPTY_FACETS);

  useEffect(() => {
    let cancelled = false;
    loadFacets().then(f => { if (!cancelled) setFacets(f); });
    return () => { cancelled = true; };
  }, []);

  return facets;
}
