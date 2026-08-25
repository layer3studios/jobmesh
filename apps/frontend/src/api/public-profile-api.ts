// FILE: src/api/public-profile-api.ts
// Two audiences, one feature, so one module: the UNAUTHENTICATED contact form on
// /u/{slug}, and the seeker's own settings under /api/seeker/me.
//
// The contact call deliberately does NOT send credentials — a signed-in visitor
// messaging someone else's profile must not carry their session to a public
// endpoint. The settings calls do, because they act on the caller's own record.

import { apiUrl } from '../lib/api-base';
import type {
  PublicProfileSettingsState, ProfileVisibilitySettings, SlugAvailability,
} from '../types/public-profile';

export class PublicProfileApiError extends Error {
  status: number;
  code: string | null;
  /** Structured extras from the backend — e.g. { suggestions } on SLUG_TAKEN. */
  details: { suggestions?: string[] } | null;

  constructor(status: number, code: string | null, message: string, details: unknown = null) {
    super(message);
    this.name = 'PublicProfileApiError';
    this.status = status;
    this.code = code;
    this.details = (details as { suggestions?: string[] }) ?? null;
  }
}

async function request<T>(path: string, init?: RequestInit, withCredentials = true): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...(withCredentials ? { credentials: 'include' as const } : {}),
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PublicProfileApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
      body?.details ?? null,
    );
  }
  return body as T;
}

// ─── Public (no session) ──────────────────────────────────────────────

export interface ContactSubmission {
  senderName: string;
  senderEmail: string;
  message: string;
  /** Honeypot. Always sent; a filled value is silently discarded server-side. */
  website?: string;
}

export function sendProfileContact(slug: string, submission: ContactSubmission): Promise<{ sent: boolean }> {
  return request(
    `/public/profile/${encodeURIComponent(slug)}/contact`,
    { method: 'POST', body: JSON.stringify(submission) },
    false,
  );
}

// ─── The seeker's own settings ────────────────────────────────────────

export function fetchProfileSettings(): Promise<PublicProfileSettingsState> {
  return request('/seeker/me/profile-settings');
}

export interface ProfileSettingsPatch {
  profilePublic?: boolean;
  profileSlug?: string;
  profileSettings?: Partial<ProfileVisibilitySettings>;
}

export function patchProfileSettings(patch: ProfileSettingsPatch): Promise<PublicProfileSettingsState> {
  return request('/seeker/me/profile-settings', { method: 'PATCH', body: JSON.stringify(patch) });
}

export function checkSlugAvailability(slug: string, signal?: AbortSignal): Promise<SlugAvailability> {
  return request(`/seeker/me/profile-slug-available?slug=${encodeURIComponent(slug)}`, { signal });
}
