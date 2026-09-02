// FILE: src/api/admin-mission-control-api.ts
// Client for GET /api/admin/overview. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching the other admin
// clients. Non-2xx throws MissionControlApiError.

import type { MissionControlPayload } from '@/types/admin-mission-control';

const BASE = '/api/admin/overview';

export class MissionControlApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'MissionControlApiError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchMissionControl(): Promise<MissionControlPayload> {
  const response = await fetch(BASE, { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new MissionControlApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as MissionControlPayload;
}
