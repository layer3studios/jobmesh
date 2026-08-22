// FILE: src/lib/server-api/employer.ts
// Server-only employer session read for the (employer) guard layout (D4/AUTH-PLAN
// §3). Returns the employer + company, or null on 401 so the layout can redirect
// to /employer/login. The one fetch here also seeds the client EmployerProvider.
import { cache } from 'react';
import { serverFetch, ServerFetchError } from '../server-fetch';
import type { EmployerUser, EmployerCompany } from '../../context/employer/employer-context-types';

export interface EmployerSession {
  employerUser: EmployerUser;
  company: EmployerCompany | null;
}

/** Returns the employer session (or null when unauthenticated). React.cache-wrapped
 *  so the nested (app) + (onboarded) guard layouts dedupe to ONE /employer/auth/me
 *  hit per request instead of two (NAV-PERF-AUDIT §2, Fix 5). */
export const getEmployerMeServer = cache(async (): Promise<EmployerSession | null> => {
  try {
    return await serverFetch<EmployerSession>('/employer/auth/me');
  } catch (error) {
    if (error instanceof ServerFetchError && (error.status === 401 || error.status === 504)) return null;
    throw error;
  }
});
