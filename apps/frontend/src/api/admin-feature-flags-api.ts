// FILE: src/api/admin-feature-flags-api.ts
// Client for /api/admin/feature-flags. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching the other admin
// clients. Non-2xx throws FeatureFlagsApiError.

import type { FeatureFlagName, FeatureFlagsPayload } from '@/types/admin-feature-flags';

const BASE = '/api/admin/feature-flags';

export class FeatureFlagsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'FeatureFlagsApiError';
    this.status = status;
    this.code = code;
  }
}

async function requestJson(init?: RequestInit): Promise<FeatureFlagsPayload> {
  const response = await fetch(BASE, { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new FeatureFlagsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as FeatureFlagsPayload;
}

export function fetchFeatureFlags(): Promise<FeatureFlagsPayload> {
  return requestJson();
}

/** Sets one flag; the response carries the full post-write state. */
export function setFeatureFlag(name: FeatureFlagName, value: boolean): Promise<FeatureFlagsPayload> {
  return requestJson({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, value }),
  });
}
