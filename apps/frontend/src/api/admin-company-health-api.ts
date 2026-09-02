// FILE: src/api/admin-company-health-api.ts
// Client for GET /api/admin/companies-health. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching the other admin
// clients. Non-2xx throws CompanyHealthApiError.

import type { CompanyHealthRow } from '@/types/admin-company-health';

const BASE = '/api/admin/companies-health';

export class CompanyHealthApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'CompanyHealthApiError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchCompanyHealth(): Promise<CompanyHealthRow[]> {
  const response = await fetch(BASE, { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new CompanyHealthApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return (body.data?.companies ?? []) as CompanyHealthRow[];
}
