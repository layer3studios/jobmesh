// FILE: src/api/employer-applicants-request.ts
// The shared fetch wrapper for every employer applicant endpoint: cookie
// credentials, JSON body handling, and the typed error. Split out of
// employer-applicants-api.ts (section 2) so the operation files that came out of
// it can share one transport rather than each re-declaring it.

import { apiUrl } from '../lib/api-base';

export class EmployerApplicantsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerApplicantsApiError';
    this.status = status;
    this.code = code;
  }
}

export const ROLE_FORBIDDEN_MESSAGE = "You don't have permission to do that.";

function isRolePermissionError(status: number, code: string | null): boolean {
  if (status !== 403) return false;
  return Boolean(code && (code.startsWith('ROLE_') || code.includes('FORBIDDEN')));
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = body?.code ?? null;
    const message = isRolePermissionError(response.status, code)
      ? ROLE_FORBIDDEN_MESSAGE
      : body?.error || `Request failed (${response.status})`;
    throw new EmployerApplicantsApiError(response.status, code, message);
  }
  return body as T;
}

/** `/employer/applicants/:id` — the base path every per-candidate call hangs off. */
export const applicantPath = (applicationId: string) => `/employer/applicants/${encodeURIComponent(applicationId)}`;
