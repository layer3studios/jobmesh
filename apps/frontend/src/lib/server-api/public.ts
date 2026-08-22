// FILE: src/lib/server-api/public.ts
// Server-only variants of public-api reads, used by the (apply) + (seeker) company
// pages for SSR + JSON-LD. Public endpoints need no cookie, so they go through
// publicServerFetch (ISR/data-cache eligible, NAV-PERF-AUDIT §5). Both are called by
// generateMetadata AND the page body, so both are React.cache-wrapped to dedupe the
// pair into one upstream request (§3).
import { cache } from 'react';
import { publicServerFetch } from '../public-server-fetch';
import type {
  PublicCompany, PublicJob, PublicJobSummary, PublicAssignment,
} from '../../types/public-apply';

const APPLY_REVALIDATE = 3600;

export const getPublicCompanyServer = cache((
  companySlug: string,
): Promise<{ company: PublicCompany; jobs: PublicJobSummary[] }> => {
  return publicServerFetch(`/public/companies/${encodeURIComponent(companySlug)}`, APPLY_REVALIDATE);
});

export const getPublicJobServer = cache((
  companySlug: string,
  jobSlug: string,
): Promise<{ company: PublicCompany; job: PublicJob; assignment: PublicAssignment | null }> => {
  return publicServerFetch(`/public/jobs/${encodeURIComponent(companySlug)}/${encodeURIComponent(jobSlug)}`, APPLY_REVALIDATE);
});
