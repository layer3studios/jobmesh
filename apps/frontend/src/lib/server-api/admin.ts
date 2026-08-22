// FILE: src/lib/server-api/admin.ts
// Server-only admin read for the (admin)/admin/(app) layout auth gate. Mirrors
// getSeekerMeServer: React.cache-wrapped serverFetch that forwards the cookie jar
// and returns null on 401 (no/expired admin session) so the layout can redirect.
import { cache } from 'react';
import { serverFetch, ServerFetchError } from '../server-fetch';
import type { AdminIdentity } from '../../context/admin/admin-context-types';

export const getAdminMeServer = cache(async (): Promise<AdminIdentity | null> => {
  try {
    const body = await serverFetch<{ admin: AdminIdentity }>('/admin/auth/me');
    return body.admin;
  } catch (error) {
    if (error instanceof ServerFetchError && (error.status === 401 || error.status === 504)) return null;
    throw error;
  }
});
