// FILE: src/components/employer/jobs/ranked-filter-serialization.ts
// Moving the ranked filter state in and out of two places it has to survive: the
// URL (so a filtered view is shareable and survives a refresh) and a saved view's
// stored payload. Split out of ranked-filter-helpers.ts (section 2).
//
// The two encodings are deliberately DIFFERENT and both are kept: the URL uses
// short comma-separated keys because people read and share it, while a saved view
// stores the full field names because nobody ever sees them.

import type { ServerFilterState } from './ranked-filter-helpers';
import { createInitialServerFilterState, serverFiltersToQuery } from './ranked-filter-helpers';

const URL_PARAMS = { experience: 'exp', skills: 'skills', locations: 'loc', appliedWithin: 'applied', hasResume: 'hasResume', hasNotes: 'hasNotes' } as const;

/** Write the filter state onto the posting URL's search params (in place). */
export function writeServerFiltersToSearchParams(state: ServerFilterState, params: URLSearchParams): void {
  Object.values(URL_PARAMS).forEach((key) => params.delete(key));
  const query = serverFiltersToQuery(state);
  if (query.experience) params.set(URL_PARAMS.experience, query.experience);
  if (query.skills) params.set(URL_PARAMS.skills, query.skills);
  if (query.locations) params.set(URL_PARAMS.locations, query.locations);
  if (query.appliedWithin) params.set(URL_PARAMS.appliedWithin, query.appliedWithin);
  if (query.hasResume) params.set(URL_PARAMS.hasResume, '1');
  if (query.hasNotes) params.set(URL_PARAMS.hasNotes, '1');
}

const csvSet = (value: string | null): Set<string> =>
  new Set((value ?? '').split(',').map((item) => item.trim()).filter(Boolean));

/** Rebuild filter state from a pasted/bookmarked URL. */
export function readServerFiltersFromSearchParams(params: URLSearchParams): ServerFilterState {
  const applied = params.get(URL_PARAMS.appliedWithin);
  return {
    experience: csvSet(params.get(URL_PARAMS.experience)),
    skills: csvSet(params.get(URL_PARAMS.skills)),
    locations: csvSet(params.get(URL_PARAMS.locations)),
    appliedWithin: applied === '24h' || applied === '7d' || applied === '30d' ? applied : 'all',
    hasResume: params.get(URL_PARAMS.hasResume) === '1',
    hasNotes: params.get(URL_PARAMS.hasNotes) === '1',
  };
}

/** Saved-view payload — the JSON shape stored in employer_saved_views. */
export function serverFiltersToViewPayload(state: ServerFilterState): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (state.experience.size > 0) payload.experience = [...state.experience];
  if (state.skills.size > 0) payload.skills = [...state.skills];
  if (state.locations.size > 0) payload.locations = [...state.locations];
  if (state.appliedWithin !== 'all') payload.appliedWithin = state.appliedWithin;
  if (state.hasResume) payload.hasResume = true;
  if (state.hasNotes) payload.hasNotes = true;
  return payload;
}

/** Rebuild filter state from a saved view's stored payload. */
export function serverFiltersFromViewPayload(payload: Record<string, unknown> | null | undefined): ServerFilterState {
  const state = createInitialServerFilterState();
  if (!payload || typeof payload !== 'object') return state;
  const strSet = (value: unknown): Set<string> =>
    new Set(Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []);
  const applied = payload.appliedWithin;
  return {
    experience: strSet(payload.experience),
    skills: strSet(payload.skills),
    locations: strSet(payload.locations),
    appliedWithin: applied === '24h' || applied === '7d' || applied === '30d' ? applied : 'all',
    hasResume: payload.hasResume === true,
    hasNotes: payload.hasNotes === true,
  };
}
