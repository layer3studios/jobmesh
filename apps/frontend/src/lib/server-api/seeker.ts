// FILE: src/lib/server-api/seeker.ts
// Server-only seeker reads for SSR (Home, /jobs, job detail, directory) + the
// (seeker)/(admin) layout auth checks. Pure data-fetching functions the pages
// delegate to (D10).
//
// PUBLIC reads (jobs, directory, job detail) go through publicServerFetch (no
// cookie → ISR/data-cache eligible, NAV-PERF-AUDIT §2/§5). Only getSeekerMeServer
// carries the cookie. Helpers called by BOTH generateMetadata and the page body are
// wrapped in React.cache so the pair dedupes to one request (§3).
import { cache } from 'react';
import { serverFetch, ServerFetchError } from '../server-fetch';
import { publicServerFetch } from '../public-server-fetch';
import type { AppUser } from '../../context/seeker/seeker-context-types';
import type { IJob, ICompany } from '../../types';

export interface SeekerMe extends AppUser {
  isAdmin?: boolean;
}

const JOBS_REVALIDATE = 300;
const JOB_REVALIDATE = 3600;
const DIRECTORY_REVALIDATE = 3600;
const COMPANY_JOBS_REVALIDATE = 3600;

/** Returns the signed-in seeker (or null when the cookie is absent/invalid). Cached
 *  so the (seeker)/(admin) layouts + page redirect checks dedupe within a request. */
export const getSeekerMeServer = cache(async (): Promise<SeekerMe | null> => {
  try {
    return await serverFetch<SeekerMe>('/seeker/me');
  } catch (error) {
    if (error instanceof ServerFetchError && (error.status === 401 || error.status === 504)) return null;
    throw error;
  }
});

/** Latest scraped job listings for Home / the jobs feed (public). */
export async function getSeekerJobsServer(limit?: number): Promise<IJob[]> {
  const query = limit ? `?limit=${limit}` : '';
  const body = await publicServerFetch<{ jobs?: IJob[] } | IJob[]>(`/seeker/jobs${query}`, JOBS_REVALIDATE);
  if (Array.isArray(body)) return body;
  return body.jobs ?? [];
}

/** How many active roles landed in the last 24h (public). Powers the homepage
 *  ticker + live badge. Asks for limit=1 and reads `totalJobs` off the paginated
 *  envelope, so the count is exact without pulling the rows. Returns 0 on any
 *  backend hiccup — the copy has an evergreen fallback for the zero case. */
export async function getSeekerTodayCountServer(): Promise<number> {
  try {
    const body = await publicServerFetch<{ totalJobs?: number }>(
      '/seeker/jobs?date=today&limit=1', JOBS_REVALIDATE,
    );
    return typeof body?.totalJobs === 'number' ? body.totalJobs : 0;
  } catch {
    return 0;
  }
}

/** The company directory (aggregated hiring companies, public). Cached: the company
 *  page calls it in both generateMetadata and the body (via findCompany). */
export const getSeekerDirectoryServer = cache(async (): Promise<ICompany[]> => {
  const body = await publicServerFetch<{ companies?: ICompany[] } | ICompany[]>('/seeker/jobs/directory', DIRECTORY_REVALIDATE);
  if (Array.isArray(body)) return body;
  return body.companies ?? [];
});

/** Active listings for one company (SSR company page, public). Backend supports ?company=. */
export async function getSeekerJobsByCompanyServer(company: string, limit = 50): Promise<IJob[]> {
  const query = `?company=${encodeURIComponent(company)}&limit=${limit}`;
  const body = await publicServerFetch<{ jobs?: IJob[] } | IJob[]>(`/seeker/jobs${query}`, COMPANY_JOBS_REVALIDATE);
  if (Array.isArray(body)) return body;
  return body.jobs ?? [];
}

/** A single scraped job by id (public — for the SSR job-detail page + JobPosting
 *  JSON-LD). Cached: generateMetadata + the page body both request the same id. */
export const getSeekerJobServer = cache(async (jobId: string): Promise<IJob | null> => {
  try {
    const body = await publicServerFetch<{ job?: IJob } | IJob>(`/seeker/jobs/${encodeURIComponent(jobId)}`, JOB_REVALIDATE);
    if (body && typeof body === 'object' && 'job' in body) return body.job ?? null;
    return (body as IJob) ?? null;
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) return null;
    throw error;
  }
});
