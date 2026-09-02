// FILE: src/api/admin-alert-settings-api.ts
// Client for /api/admin/alerts. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching the other admin
// clients. Non-2xx throws AlertSettingsApiError.

import type { AlertSettings, AlertSettingsPatch, TestDigestResult } from '@/types/admin-alert-settings';

const BASE = '/api/admin/alerts';

export class AlertSettingsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'AlertSettingsApiError';
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AlertSettingsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as T;
}

export async function fetchAlertSettings(): Promise<AlertSettings> {
  return (await requestJson<{ settings: AlertSettings }>('')).settings;
}

export async function patchAlertSettings(patch: AlertSettingsPatch): Promise<AlertSettings> {
  const data = await requestJson<{ settings: AlertSettings }>('', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return data.settings;
}

/** Sends a REAL digest to the configured recipients, immediately. */
export function sendTestDigest(): Promise<TestDigestResult> {
  return requestJson<TestDigestResult>('/test-digest', { method: 'POST' });
}
