'use client';
// FILE: src/context/employer/EmployerContext.tsx
// Client employer context, composed from useEmployerAuth (verbatim port of the Vite
// context). Server-seeded hybrid (D3/D_impl_1): the (employer) guard layout has
// already fetched /employer/auth/me for its server guard and passes that payload as
// `initialUser` + `initialCompany`, so the client provider seeds state and skips the
// mount refresh. login/logout/refresh talk to the backend directly via the hook.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useEmployerAuth } from '../../hooks/employer/useEmployerAuth';
import { useAnalyticsIdentity } from '../../hooks/useAnalyticsIdentity';
import type { EmployerCtx, EmployerUser, EmployerCompany } from './employer-context-types';

const Ctx = createContext<EmployerCtx>({
  employerUser: null,
  company: null,
  isLoading: true,
  isAuthenticating: false,
  loginError: null,
  viewerRole: null,
  viewerCanMoveApplicants: true,
  viewerCanArchiveApplicants: true,
  login: async () => {},
  logout: async () => {},
  clearLoginError: () => {},
  refreshEmployerSession: async () => {},
});

export function EmployerProvider(
  { children, initialUser, initialCompany }:
  { children: ReactNode; initialUser?: EmployerUser | null; initialCompany?: EmployerCompany | null },
) {
  const seed = initialUser !== undefined
    ? { employerUser: initialUser ?? null, company: initialCompany ?? null }
    : undefined;
  const {
    employerUser, company, isLoading, isAuthenticating, loginError,
    viewerRole, viewerCanMoveApplicants, viewerCanArchiveApplicants,
    login, logout, clearLoginError, refreshEmployerSession,
  } = useEmployerAuth(seed);

  // Analytics identity — consent-gated + no-op until PostHog inits (Chunk 1 §7). Only
  // non-sensitive, already-known fields; distinct_id is the stable employer user id.
  const analyticsIdentity = useMemo(
    () => (employerUser
      ? { distinctId: employerUser.id, properties: { role: 'employer', email: employerUser.email, name: employerUser.name, companyId: employerUser.companyId, isEmployer: true } }
      : null),
    [employerUser],
  );
  useAnalyticsIdentity(analyticsIdentity);

  return (
    <Ctx.Provider value={{
      employerUser, company, isLoading, isAuthenticating, loginError,
      viewerRole, viewerCanMoveApplicants, viewerCanArchiveApplicants,
      login, logout, clearLoginError, refreshEmployerSession,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useEmployer = () => useContext(Ctx);
