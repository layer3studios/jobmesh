// FILE: src/api/admin-ai-usage-api.ts
// Client for GET /api/admin/ai-usage. Forwards the admin cookie
// (credentials: 'include') to a RELATIVE /api path, matching
// admin-analytics-api. Non-2xx throws AdminAiUsageApiError.

import type { AiUsageRange, AiUsageReport } from '@/types/admin-ai-usage';

const BASE = '/api/admin/ai-usage';

export class AdminAiUsageApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'AdminAiUsageApiError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchAiUsage(range: AiUsageRange): Promise<AiUsageReport> {
  const response = await fetch(`${BASE}?range=${encodeURIComponent(range)}`, {
    credentials: 'include',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminAiUsageApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as AiUsageReport;
}
