// FILE: src/lib/server-api/admin-team.ts
// Server-only roster read for the /admin/team SSR page. Mirrors getAdminMeServer:
// React.cache-wrapped serverFetch (cookie jar forwarded); 401/403 → null so the
// page can render its access-denied state (the (app) guard normally redirects
// first — this is belt-and-suspenders, same as the analytics page).
import { cache } from 'react';
import { serverFetch, ServerFetchError } from '../server-fetch';
import type { TeamAdmin } from '../../api/admin-team-api';

export const getAdminTeamServer = cache(async (): Promise<TeamAdmin[] | null> => {
  try {
    const body = await serverFetch<{ admins: TeamAdmin[] }>('/admin/team');
    return body.admins;
  } catch (error) {
    if (error instanceof ServerFetchError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
});
