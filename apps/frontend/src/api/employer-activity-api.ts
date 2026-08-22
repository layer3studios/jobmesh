// FILE: src/api/employer-activity-api.ts
// Typed client for the company-wide activity feed (/api/employer/activity).
// Paged backwards by timestamp: pass the previous page's nextBefore to continue.
// Distinct from employer-dashboard-api's activity call, which is the short
// candidate-event strip on the right rail and carries no actor.

import { apiUrl } from '../lib/api-base';

export type CompanyActivityType =
  | 'application_received' | 'stage_move' | 'archive' | 'note' | 'interview_scheduled';

export interface CompanyActivityItem {
  type: CompanyActivityType;
  applicationId: string | null;
  candidateName: string | null;
  postingTitle: string | null;
  /** Who did it. null for events nobody performed (an application arriving). */
  actorName: string | null;
  timestamp: string;
  details: {
    fromStage: string | null;
    toStage: string | null;
    note: string | null;
    interviewTime: string | null;
  };
}

export interface CompanyActivityPage {
  items: CompanyActivityItem[];
  /** Cursor for the next page, or null when the feed is exhausted. */
  nextBefore: string | null;
}

export class EmployerActivityApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'EmployerActivityApiError';
    this.status = status;
  }
}

export async function fetchCompanyActivity(
  { limit = 25, before = null }: { limit?: number; before?: string | null } = {},
): Promise<CompanyActivityPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set('before', before);
  const response = await fetch(apiUrl(`/employer/activity?${params.toString()}`), {
    credentials: 'include',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerActivityApiError(
      response.status,
      body?.error || `Could not load activity (${response.status})`,
    );
  }
  return body as CompanyActivityPage;
}
