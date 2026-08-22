// FILE: src/api/employer-me-api.ts
// Client for the signed-in employer's own settings (/api/employer/me/*). Separate
// from employer-api.ts, which is about the COMPANY — these endpoints touch exactly
// one row, the caller's, and carry no role gate.
//
// Every call returns the whole updated user, so a caller can hand the result
// straight to context rather than patching local state and hoping it matches.

import { apiUrl } from '../lib/api-base';
import { EmployerApiError } from './employer-api';
import type { EmployerUser } from '../context/employer/employer-context-types';

interface UserEnvelope { employerUser: EmployerUser }

async function request(path: string, init?: RequestInit): Promise<EmployerUser> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return (body as UserEnvelope).employerUser;
}

export function fetchMe(): Promise<EmployerUser> {
  return request('/employer/me');
}

/** Timezone and/or job title. Unknown keys are refused by the server. */
export function updatePersonalSettings(
  patch: { timezone?: string; jobTitle?: string | null },
): Promise<EmployerUser> {
  return request('/employer/me', { method: 'PATCH', body: JSON.stringify(patch) });
}

/** A PARTIAL preferences object — send only what changed; the server merges. */
export function updateNotificationPreferences(
  patch: Partial<Record<string, boolean>>,
): Promise<EmployerUser> {
  return request('/employer/me/notifications', { method: 'PATCH', body: JSON.stringify(patch) });
}

/**
 * Upload a profile photo.
 *
 * Does not go through request(): that helper sets a JSON Content-Type whenever a
 * body is present, and setting it by hand on a FormData body strips the multipart
 * boundary the browser generates, which makes the server reject every upload.
 */
export async function uploadAvatar(file: File): Promise<EmployerUser> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(apiUrl('/employer/me/avatar'), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Upload failed (${response.status})`,
    );
  }
  return (body as UserEnvelope).employerUser;
}

/** Clear the uploaded photo. The Google picture, if any, becomes visible again. */
export function removeAvatar(): Promise<EmployerUser> {
  return request('/employer/me/avatar', { method: 'DELETE' });
}
