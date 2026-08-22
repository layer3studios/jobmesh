// FILE: src/api/employer-dashboard-api.ts
// Typed client for /api/employer/dashboard. Sends the employer auth cookie,
// reads the { data } body, throws EmployerDashboardApiError (status + code) on
// any non-2xx. Mirrors employer-jobs-api exactly.

import { apiUrl } from '../lib/api-base';
import type { DashboardSummary, DashboardActivityEvent } from '../types/employer-dashboard';

export class EmployerDashboardApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerDashboardApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerDashboardApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const body = await request<{ data: DashboardSummary }>('/employer/dashboard/summary');
  return body.data;
}

export async function fetchDashboardActivity(limit = 20): Promise<DashboardActivityEvent[]> {
  const body = await request<{ data: DashboardActivityEvent[] }>(
    `/employer/dashboard/activity?limit=${encodeURIComponent(limit)}`,
  );
  return body.data;
}
