// FILE: src/lib/server-api/flags.ts
// Server reads of the public feature flags (/api/public/flags).
//
// `employerSideEnabled` is the switch for the whole hire half of the product:
// the /hire landing page, the "Post a job" and "Hire talent" doors, the
// employer nav, and the employer app itself. It is off until an admin turns
// it on at /admin/flags — nothing is deleted, it is simply not reachable.
//
// It fails CLOSED here as well as in the model: if the API cannot be reached
// we render the seeker-only site rather than flash a half-launched surface.
import { publicServerFetch } from '../public-server-fetch';

export interface PublicFlags {
  employerSideEnabled: boolean;
  publicApplyEnabled: boolean;
}

const FLAGS_REVALIDATE = 30;

const CLOSED: PublicFlags = { employerSideEnabled: false, publicApplyEnabled: true };

export async function getPublicFlagsServer(): Promise<PublicFlags> {
  try {
    const body = await publicServerFetch<{ data?: Partial<PublicFlags> }>('/public/flags', FLAGS_REVALIDATE);
    return {
      employerSideEnabled: body.data?.employerSideEnabled === true,
      publicApplyEnabled: body.data?.publicApplyEnabled !== false,
    };
  } catch {
    return CLOSED;
  }
}

/** Is the hire half of the product open to visitors? */
export async function isEmployerSideEnabled(): Promise<boolean> {
  return (await getPublicFlagsServer()).employerSideEnabled;
}
