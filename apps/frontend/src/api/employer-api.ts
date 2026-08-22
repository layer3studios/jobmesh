// FILE: src/api/employer-api.ts
// Thin client for the employer company endpoints (/api/employer/company). Sends
// the employer auth cookie, reads the { company } body, throws EmployerApiError
// (status + code) on any non-2xx. Employer pages call only this module.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type { EmployerCompany } from '../context/employer/employer-context-types';

export class EmployerApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerApiError';
    this.status = status;
    this.code = code;
  }
}

export interface CreateEmployerCompanyInput {
  name: string;
  website?: string;
  retentionDays?: number;
}

/** Per-stage custom rejection bodies. A null value resets that stage to the default. */
export interface RejectionEmailTemplates {
  application?: string | null;
  positionFilled?: string | null;
  postInterview?: string | null;
}

export interface UpdateEmployerCompanyPatch {
  name?: string;
  tagline?: string | null;
  about?: string | null;
  socialLinks?: { linkedin?: string; twitter?: string; github?: string } | null;
  rejectionEmailTemplates?: RejectionEmailTemplates | null;
  website?: string | null;
  retentionDays?: number;
  privacyPolicyUrl?: string | null;
  dpoEmail?: string | null;
  /** Clear-only. A logo is SET by uploadCompanyLogo; the backend rejects a string here. */
  logoUrl?: null;
  /** Days of inactivity before a candidate is auto-archived. null turns it off. */
  autoArchiveStaleDays?: number | null;
}

interface CompanyEnvelope {
  company: EmployerCompany;
}

async function request(path: string, init?: RequestInit): Promise<CompanyEnvelope> {
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
  return body as CompanyEnvelope;
}

export async function createEmployerCompany(
  input: CreateEmployerCompanyInput,
): Promise<EmployerCompany> {
  const body = await request('/employer/company', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.company;
}

export async function updateEmployerCompany(
  patch: UpdateEmployerCompanyPatch,
): Promise<EmployerCompany> {
  const body = await request('/employer/company', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return body.company;
}

export async function fetchEmployerCompany(): Promise<EmployerCompany> {
  const body = await request('/employer/company');
  return body.company;
}

/**
 * Read the company's custom rejection bodies.
 *
 * These are NOT on the company object: toPublicCompany models the careers-facing
 * shape, and what a company writes when rejecting someone is internal. Hence a
 * dedicated Owner+ endpoint.
 */
export async function fetchRejectionTemplates(): Promise<RejectionEmailTemplates> {
  const response = await fetch(apiUrl('/employer/company/rejection-templates'), {
    credentials: 'include',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerApiError(
      response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`,
    );
  }
  return (body?.rejectionEmailTemplates ?? {}) as RejectionEmailTemplates;
}

/**
 * Upload a company logo as multipart/form-data.
 *
 * Does not go through request(): that helper sets a JSON Content-Type whenever a
 * body is present, and setting it by hand on a FormData body strips the multipart
 * boundary the browser generates, which makes the server reject every upload.
 */
export async function uploadCompanyLogo(file: File): Promise<EmployerCompany> {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await fetch(apiUrl('/employer/company/logo'), {
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
  return (body as CompanyEnvelope).company;
}
