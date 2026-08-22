// FILE: src/api/employer-applicant-actions-api.ts
// Timeline + bulk stage-move clients, split out of employer-applicants-api
// (file-size rule). Same request/error semantics — the shared request helper
// is re-used via the sibling module's exports.

import { apiUrl } from '../lib/api-base';
import { EmployerApplicantsApiError } from './employer-applicants-api';
import type { TimelineEvent } from '../types/employer-timeline';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerApplicantsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

/** Merged candidate history (applied / scored / moves / interviews / notes). */
export async function fetchTimeline(applicationId: string): Promise<TimelineEvent[]> {
  const body = await request<{ data: TimelineEvent[] }>(
    `/employer/applicants/${encodeURIComponent(applicationId)}/timeline`,
  );
  return body.data;
}

export interface BulkMoveResult {
  moved: number;
  failed: number;
  failures: Array<{ applicationId: string; reason: string }>;
}

/** Move up to 50 applications to one stage. Partial success is first-class. */
export async function bulkMoveStage(
  applicationIds: string[],
  targetStageId: string,
): Promise<BulkMoveResult> {
  const body = await request<{ data: BulkMoveResult }>('/employer/applicants/bulk-move', {
    method: 'POST',
    body: JSON.stringify({ applicationIds, targetStageId }),
  });
  return body.data;
}
