// FILE: src/api/employer-tags-api.ts
// Typed client for the candidate tag library (/api/employer/tags) and the
// per-application tag list. Sends the employer auth cookie; throws
// EmployerApplicantsApiError so every tag surface reports errors like the rest of
// the applicant UI.
//
// The library is cached in-memory: the autocomplete reads it on every keystroke,
// and it changes only through the mutations below, which write through the cache.

import { apiUrl } from '../lib/api-base';
import { EmployerApplicantsApiError } from './employer-applicants-api';
import type { Applicant, CandidateTag } from '../types/employer-applicants';

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

let libraryCache: CandidateTag[] | null = null;

/** The company's tag library, alphabetical. Cached until a mutation changes it. */
export async function listCandidateTags({ fresh = false } = {}): Promise<CandidateTag[]> {
  if (!fresh && libraryCache) return libraryCache;
  const body = await request<{ tags: CandidateTag[] }>('/employer/tags');
  libraryCache = body.tags;
  return body.tags;
}

/** Create a tag, or get back the existing one. Duplicates are not an error. */
export async function createCandidateTag(name: string): Promise<CandidateTag> {
  const body = await request<{ tag: CandidateTag; created: boolean }>('/employer/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (libraryCache && !libraryCache.some((tag) => tag.id === body.tag.id)) {
    libraryCache = [...libraryCache, body.tag].sort((a, b) => a.name.localeCompare(b.name));
  }
  return body.tag;
}

/** Delete a tag from the library and from every candidate carrying it. */
export async function deleteCandidateTag(tagId: string): Promise<void> {
  await request<{ message: string }>(`/employer/tags/${encodeURIComponent(tagId)}`, {
    method: 'DELETE',
  });
  libraryCache = (libraryCache ?? []).filter((tag) => tag.id !== tagId);
}

/** Replace an application's tags. Send the full list you want, not a diff. */
export async function setApplicantTags(
  applicationId: string,
  tags: string[],
): Promise<Applicant['application']> {
  const body = await request<{ application: Applicant['application'] }>(
    `/employer/applicants/${encodeURIComponent(applicationId)}/tags`,
    { method: 'PUT', body: JSON.stringify({ tags }) },
  );
  return body.application;
}
