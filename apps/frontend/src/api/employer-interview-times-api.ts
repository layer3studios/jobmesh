// FILE: src/api/employer-interview-times-api.ts
// Typed client for posting interview defaults + the availability pool
// (chunk 8 backend). Mirrors employer-jobs-api: credentials:'include', non-2xx
// throws EmployerInterviewTimesApiError with the backend's status + code —
// callers branch on NO_INTERVIEW_DEFAULTS / POOL_EMPTY / INTERVIEW_ALREADY_ACTIVE.

import { apiUrl } from '../lib/api-base';
import type {
  Interview, InterviewDefaults, InterviewTime, InterviewTimeCount,
} from '../types/employer-interviews';
import type { Posting } from '../types/employer-jobs';

export class EmployerInterviewTimesApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerInterviewTimesApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerInterviewTimesApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

const timesPath = (postingId: string) => `/employer/jobs/${encodeURIComponent(postingId)}/interview-times`;

// The employer times endpoints return raw documents keyed by _id; normalize to
// the id-keyed InterviewTime shape the UI consumes.
type RawInterviewTime = Omit<InterviewTime, 'id'> & { _id: string };
function toInterviewTime(raw: RawInterviewTime): InterviewTime {
  const { _id, ...rest } = raw;
  return { id: _id, ...rest };
}

export async function updateInterviewDefaults(
  postingId: string,
  defaults: Omit<InterviewDefaults, 'timezoneId'> & { timezoneId?: string },
): Promise<Posting> {
  const body = await request<{ data: Posting }>(
    `/employer/jobs/${encodeURIComponent(postingId)}/interview-defaults`,
    { method: 'PUT', body: JSON.stringify(defaults) },
  );
  return body.data;
}

/** Each entry may carry its own meetingUrl (snapshot at creation, Greenhouse
 *  style). Until the backend reads it, it's ignored and the posting default
 *  applies — the body shape is forward-compatible either way. */
export async function addInterviewTimes(
  postingId: string,
  times: { startAtUtc: string; meetingUrl?: string | null }[],
): Promise<{ insertedCount: number }> {
  const body = await request<{ data: { insertedCount: number } }>(
    timesPath(postingId),
    { method: 'POST', body: JSON.stringify({ times }) },
  );
  return body.data;
}

/** Throws with status 409 (TIME_ALREADY_BOOKED) when the time is booked. */
export async function removeInterviewTime(postingId: string, timeId: string): Promise<InterviewTime> {
  const body = await request<{ data: RawInterviewTime }>(
    `${timesPath(postingId)}/${encodeURIComponent(timeId)}`,
    { method: 'DELETE' },
  );
  return toInterviewTime(body.data);
}

export async function listInterviewTimes(
  postingId: string,
  { status, includePast = false }: { status?: string; includePast?: boolean } = {},
): Promise<InterviewTime[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (includePast) params.set('includePast', 'true');
  const query = params.toString();
  const body = await request<{ data: RawInterviewTime[] }>(`${timesPath(postingId)}${query ? `?${query}` : ''}`);
  return body.data.map(toInterviewTime);
}

export async function getInterviewTimeCount(postingId: string): Promise<InterviewTimeCount> {
  const body = await request<{ data: InterviewTimeCount }>(`${timesPath(postingId)}/count`);
  return body.data;
}

export async function sendPoolSchedulingLink(applicationId: string): Promise<Interview> {
  const body = await request<{ data: Interview }>(
    `/employer/applicants/${encodeURIComponent(applicationId)}/send-scheduling-link`,
    { method: 'POST' },
  );
  return body.data;
}
