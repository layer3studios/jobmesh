// FILE: src/api/public-api.ts
// Typed client for the public apply endpoints (/api/public). These are
// unauthenticated — no cookies are sent. Throws PublicApiError (status + code)
// on non-2xx. Apply pages call only this module — never fetch() directly.
// Cookie handling: NONE (public). Server-side reads use src/lib/server-api/public.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type { PublicCompany, PublicJob, PublicJobSummary } from '../types/public-apply';

export class PublicApiError extends Error {
  status: number;
  code: string | null;
  /**
   * The parsed response body. Some error codes carry structured detail the UI must
   * act on rather than just print — STAGED_FILES_EXPIRED returns `expiredFiles`,
   * naming the uploads that aged out so the form can flag exactly those rows
   * instead of making the candidate redo all of them. Optional and untyped by
   * design: callers narrow the shape for the codes they handle.
   */
  body: Record<string, unknown>;

  constructor(status: number, code: string | null, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.name = 'PublicApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** The `expiredFiles` detail carried by a STAGED_FILES_EXPIRED error. */
export interface ExpiredStagedFile {
  fileId: string;
  originalName: string | null;
}

/** Read `expiredFiles` off an error body, tolerating a backend that omits it. */
export function expiredFilesFrom(error: PublicApiError): ExpiredStagedFile[] {
  const raw = error.body?.expiredFiles;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is { fileId: unknown; originalName?: unknown } => !!entry && typeof entry === 'object')
    .map((entry) => ({
      fileId: String(entry.fileId ?? ''),
      originalName: typeof entry.originalName === 'string' ? entry.originalName : null,
    }))
    .filter((entry) => entry.fileId !== '');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PublicApiError(
      response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`, body ?? {},
    );
  }
  return body as T;
}

export async function fetchPublicCompany(
  companySlug: string,
): Promise<{ company: PublicCompany; jobs: PublicJobSummary[] }> {
  return request(`/public/companies/${encodeURIComponent(companySlug)}`);
}

export async function fetchPublicJob(
  companySlug: string, jobSlug: string,
): Promise<{ company: PublicCompany; job: PublicJob }> {
  return request(`/public/jobs/${encodeURIComponent(companySlug)}/${encodeURIComponent(jobSlug)}`);
}

export async function submitApplication(
  companySlug: string, jobSlug: string, formData: FormData,
): Promise<{ applicationId: string }> {
  // multipart/form-data — the browser sets the boundary; no credentials (public).
  return request(
    `/public/jobs/${encodeURIComponent(companySlug)}/${encodeURIComponent(jobSlug)}/apply`,
    { method: 'POST', body: formData },
  );
}
