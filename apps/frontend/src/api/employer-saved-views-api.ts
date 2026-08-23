// FILE: src/api/employer-saved-views-api.ts
// Saved filter views for a posting's ranked table. Split out of
// employer-applicants-api.ts (naming conventions section 2).
//
// The in-module cache moved with the functions that own it: it is only ever read
// and invalidated by these four calls, so splitting them apart would have left a
// cache nobody could see being cleared.

import { request } from './employer-applicants-request';
import type { SavedView } from '../types/employer-applicants';

const savedViewsPath = (postingId: string) =>
  `/employer/jobs/${encodeURIComponent(postingId)}/saved-views`;

const savedViewsCache = new Map<string, SavedView[]>();

export async function listSavedViews(postingId: string, { fresh = false } = {}): Promise<SavedView[]> {
  if (!fresh && savedViewsCache.has(postingId)) return savedViewsCache.get(postingId)!;
  const body = await request<{ views: SavedView[] }>(savedViewsPath(postingId));
  savedViewsCache.set(postingId, body.views);
  return body.views;
}

/** Throws EmployerApplicantsApiError with status 409 when the 10-view cap is hit. */
export async function createSavedView(
  postingId: string,
  input: { name: string; filters: Record<string, unknown> },
): Promise<SavedView> {
  const body = await request<{ view: SavedView }>(savedViewsPath(postingId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
  savedViewsCache.set(postingId, [body.view, ...(savedViewsCache.get(postingId) ?? [])]);
  return body.view;
}

export async function updateSavedView(
  postingId: string,
  viewId: string,
  input: { name?: string; filters?: Record<string, unknown> },
): Promise<SavedView> {
  const body = await request<{ view: SavedView }>(
    `${savedViewsPath(postingId)}/${encodeURIComponent(viewId)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
  savedViewsCache.set(
    postingId,
    (savedViewsCache.get(postingId) ?? []).map((view) => (view.id === viewId ? body.view : view)),
  );
  return body.view;
}

export async function deleteSavedView(postingId: string, viewId: string): Promise<void> {
  await request<{ message: string }>(
    `${savedViewsPath(postingId)}/${encodeURIComponent(viewId)}`,
    { method: 'DELETE' },
  );
  savedViewsCache.set(
    postingId,
    (savedViewsCache.get(postingId) ?? []).filter((view) => view.id !== viewId),
  );
}
