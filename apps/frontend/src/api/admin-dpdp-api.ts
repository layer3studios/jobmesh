// FILE: src/api/admin-dpdp-api.ts
// Client for the admin DPDP ops queue (/api/admin/dpdp/*). Same shape as
// admin-api.ts: credentials:'include' so the browser attaches the admin cookie,
// throws AdminApiError (status + code) on any non-2xx.

import { apiUrl } from '../lib/api-base';
import { AdminApiError } from './admin-api';

/** One open rights request, as toPublicRightsRequest projects it. */
export interface RightsRequest {
  id: string;
  requestType: 'access' | 'correction' | 'erasure' | 'grievance';
  contactEmail: string;
  description: string;
  status: string;
  submittedAt: string;
  dueBy: string;
  fulfilledAt: string | null;
}

/** What one fulfilment actually did — shown back so "Processed" is not a bare claim. */
export interface FulfilmentResult {
  rightsRequestId: string;
  alreadyFulfilled: boolean;
  contactAnonymized: boolean;
  companiesProcessed?: number;
  applicationsProcessed?: number;
  filesDeleted?: number;
  notesRedacted?: number;
}

export interface BulkFulfilmentResult {
  total: number;
  successCount: number;
  succeeded: FulfilmentResult[];
  failed: Array<{ id: string; message: string }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`);
  }
  return body as T;
}

export async function listOpenRightsRequests(type?: RightsRequest['requestType']): Promise<RightsRequest[]> {
  const body = await request<{ requests: RightsRequest[] }>(
    `/admin/dpdp/rights-requests${type ? `?type=${encodeURIComponent(type)}` : ''}`,
  );
  return body.requests;
}

export async function fulfilRightsRequest(id: string): Promise<FulfilmentResult> {
  const body = await request<{ result: FulfilmentResult }>(
    `/admin/dpdp/rights-requests/${encodeURIComponent(id)}/fulfil`, { method: 'POST' },
  );
  return body.result;
}

/** Drains the open erasure queue. Per-request failures come back in `failed`. */
export async function fulfilAllErasureRequests(): Promise<BulkFulfilmentResult> {
  return request<BulkFulfilmentResult>('/admin/dpdp/rights-requests/fulfil-all', { method: 'POST' });
}
