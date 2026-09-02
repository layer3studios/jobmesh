// FILE: src/api/admin-audit-log-api.ts
// Client for GET /api/admin/audit-log. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching the other admin
// clients. Non-2xx throws AuditLogApiError.

import type { AuditLogPayload } from '@/types/admin-audit-log';

const BASE = '/api/admin/audit-log';

export class AuditLogApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'AuditLogApiError';
    this.status = status;
    this.code = code;
  }
}

/** An empty `event` means every event type. */
export async function fetchAuditLog(event?: string, limit = 100): Promise<AuditLogPayload> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (event) params.set('event', event);
  const response = await fetch(`${BASE}?${params.toString()}`, { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AuditLogApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return { entries: body.data?.entries ?? [], events: body.data?.events ?? [] };
}
