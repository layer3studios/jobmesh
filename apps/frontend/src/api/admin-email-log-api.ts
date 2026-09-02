// FILE: src/api/admin-email-log-api.ts
// Client for GET /api/admin/email-log. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching the other admin
// clients. Non-2xx throws EmailLogApiError.

import type { EmailLogPayload } from '@/types/admin-email-log';

const BASE = '/api/admin/email-log';

export class EmailLogApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmailLogApiError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchEmailLog(
  filters: { to?: string; type?: string; limit?: number } = {},
): Promise<EmailLogPayload> {
  const params = new URLSearchParams({ limit: String(filters.limit ?? 100) });
  if (filters.to) params.set('to', filters.to);
  if (filters.type) params.set('type', filters.type);

  const response = await fetch(`${BASE}?${params.toString()}`, { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmailLogApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return { events: body.data?.events ?? [], configured: body.data?.configured ?? false };
}
