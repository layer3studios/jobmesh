// FILE: src/api/seeker-api.ts
// Typed client for the seeker resume + profile endpoints. Sends the seeker auth
// cookie (credentials:'include'), reads the typed envelope, throws SeekerApiError
// (status + code) on non-2xx. Resume/profile UI calls only this module.
// Cookie handling (client): credentials:'include' → the browser attaches tj_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type {
  ParsedProfile, ResumeParseJob, ResumeUploadResult,
  ResumeReview, MatchCount, SalaryBenchmark,
} from '../types/seeker-profile';

// Raw backend envelope for /upload + /text: either a queued job or the dedup
// fast-path ({ profile, isUnchanged: true, jobId: null }). normalized below (D1).
type RawUploadResponse = {
  jobId?: string | null;
  status?: string;
  profile?: ParsedProfile;
  isUnchanged?: boolean;
};

function normalizeUpload(body: RawUploadResponse): ResumeUploadResult {
  if (body.isUnchanged && body.profile) return { kind: 'unchanged', profile: body.profile };
  return { kind: 'queued', jobId: String(body.jobId) };
}

export class SeekerApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'SeekerApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new SeekerApiError(response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`);
  }
  return body as T;
}

/** Upload a resume PDF as multipart/form-data (field name 'resume', R2). */
export async function uploadResume(file: File): Promise<ResumeUploadResult> {
  const form = new FormData();
  form.append('resume', file);
  // No Content-Type header — the browser sets the multipart boundary.
  const body = await request<RawUploadResponse>('/seeker/resume/upload', { method: 'POST', body: form });
  return normalizeUpload(body);
}

/** Parse a pasted resume-text fallback. */
export async function uploadResumeText(text: string): Promise<ResumeUploadResult> {
  const body = await request<RawUploadResponse>('/seeker/resume/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return normalizeUpload(body);
}

/** Poll one parse job's status. Unwraps the { job } envelope (D2). The optional
 * signal lets the polling hook abort an in-flight request on unmount (R1/R2). */
export async function fetchResumeJob(jobId: string, signal?: AbortSignal): Promise<ResumeParseJob> {
  const body = await request<{ job: ResumeParseJob }>(`/seeker/resume/jobs/${jobId}`, { signal });
  return body.job;
}

/** The caller's parsed profile, or null when not parsed yet. */
export async function fetchProfile(): Promise<ParsedProfile | null> {
  const body = await request<{ profile: ParsedProfile | null }>('/seeker/profile');
  return body.profile ?? null;
}

/** Patch whitelisted profile fields; returns the updated profile. */
export async function patchProfile(patch: Partial<ParsedProfile>): Promise<ParsedProfile> {
  const body = await request<{ profile: ParsedProfile }>('/seeker/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return body.profile;
}

/** The caller's cached resume review, or null when none has run yet (D2). */
export async function fetchResumeReview(signal?: AbortSignal): Promise<ResumeReview | null> {
  const body = await request<{ review: ResumeReview | null }>('/seeker/resume/review', { signal });
  return body.review ?? null;
}

/** Run a fresh review and return it. Propagates SeekerApiError (.code) on failure. */
export async function runResumeReview(signal?: AbortSignal): Promise<ResumeReview> {
  const body = await request<{ review: ResumeReview }>('/seeker/resume/review', { method: 'POST', signal });
  return body.review;
}

/** Live count of postings matching the caller's profile (direct shape). */
export async function fetchMatchCount(signal?: AbortSignal): Promise<MatchCount> {
  return request<MatchCount>('/seeker/market/match-count', { signal });
}

/** Salary benchmark band for the caller's seniority slice (direct shape). */
export async function fetchSalaryBenchmark(signal?: AbortSignal): Promise<SalaryBenchmark> {
  return request<SalaryBenchmark>('/seeker/market/salary-benchmark', { signal });
}
