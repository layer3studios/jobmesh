// FILE: src/components/employer/jobs/ranked-filter-helpers.ts
// Pure client-side filtering for the Ranked tab (T1.5). No React, no I/O, no clock —
// same input always yields the same output, so the whole thing is unit-testable in
// isolation. Every rule is AND-combined; an empty set on an axis means "all".
//
// 'unscored' is a UI-only pseudo-tier (R4): scoring is async and can fail terminally,
// and an employer chasing a stuck posting needs one chip meaning "the score is not
// usable" without caring whether that is a queue error or a null row.

import type { Applicant, ScoreTier } from '@/types/employer-applicants';

export type { ScoreTier };
export type ScoreFilterValue = ScoreTier | 'unscored';

/** Every tier chip, in descending quality order, plus the pseudo-tier. */
export const SCORE_FILTER_VALUES: readonly ScoreFilterValue[] = [
  'strong', 'good', 'partial', 'weak', 'poor', 'unscored',
];

export interface RankedFilterState {
  /** Raw user input; trimmed + lowercased inside the filter, never by the caller. */
  searchText: string;
  /** Empty = all stages. */
  stageIds: ReadonlySet<string>;
  /** Empty = all scores. */
  scoreValues: ReadonlySet<ScoreFilterValue>;
  includeArchived: boolean;
}

/** A fresh initial state. A factory, not a constant — the Sets must not be shared. */
export function createInitialRankedFilterState(): RankedFilterState {
  return { searchText: '', stageIds: new Set(), scoreValues: new Set(), includeArchived: false };
}

/** True when the employer has narrowed the list in any way (drives "Clear filters"). */
export function isRankedFilterActive(state: RankedFilterState): boolean {
  return state.searchText.trim() !== ''
    || state.stageIds.size > 0
    || state.scoreValues.size > 0
    || state.includeArchived;
}

/** Immutable add/remove of one value — the toggle primitive behind every chip (R1). */
export function toggleSetValue<T>(source: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(source);
  if (next.has(value)) next.delete(value); else next.add(value);
  return next;
}

/**
 * Which score chip an applicant belongs to. A missing score, a terminal
 * processingError, or a null numeric score all collapse to 'unscored' (C8/R4).
 */
export function deriveScoreBucket(applicant: Applicant): ScoreFilterValue {
  const { score } = applicant;
  if (!score || score.processingError || score.score == null) return 'unscored';
  return score.tier;
}

/** Case-insensitive substring match over the contact's name and email (R5). */
function matchesSearch(applicant: Applicant, needle: string): boolean {
  const { contact } = applicant;
  if (!contact) return false; // no contact → nothing to match against
  const haystack = `${contact.fullName ?? ''} ${contact.email ?? ''}`.toLowerCase();
  return haystack.includes(needle);
}

// ─── Server-side advanced filters (Chunk 1) ─────────────────────────
// These axes filter in Mongo, not in memory: the state below is serialized to
// query params for the applicant list endpoint and to the posting URL.

export type AppliedWithin = '24h' | '7d' | '30d' | 'all';

export const EXPERIENCE_BUCKET_OPTIONS = [
  { value: 'fresher', label: 'Fresher' },
  { value: 'junior', label: 'Junior (1-3y)' },
  { value: 'mid', label: 'Mid (3-6y)' },
  { value: 'senior', label: 'Senior (6-10y)' },
  { value: 'staff', label: 'Staff (10y+)' },
] as const;

export const APPLIED_WITHIN_OPTIONS: { value: AppliedWithin; label: string }[] = [
  { value: 'all', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export interface ServerFilterState {
  /** Empty = all experience levels. OR within the category. */
  experience: ReadonlySet<string>;
  /** AND within the category — "must have React AND Node". */
  skills: ReadonlySet<string>;
  /** Empty = all cities. OR within the category. */
  locations: ReadonlySet<string>;
  appliedWithin: AppliedWithin;
  hasResume: boolean;
  hasNotes: boolean;
}

/** A fresh initial state. A factory — the Sets must not be shared. */
export function createInitialServerFilterState(): ServerFilterState {
  return {
    experience: new Set(), skills: new Set(), locations: new Set(),
    appliedWithin: 'all', hasResume: false, hasNotes: false,
  };
}

export function isServerFilterActive(state: ServerFilterState): boolean {
  return countActiveServerFilters(state) > 0;
}

/** Active category count — drives the badge on the mobile filter toggle. */
export function countActiveServerFilters(state: ServerFilterState): number {
  let count = 0;
  if (state.experience.size > 0) count += 1;
  if (state.skills.size > 0) count += 1;
  if (state.locations.size > 0) count += 1;
  if (state.appliedWithin !== 'all') count += 1;
  if (state.hasResume) count += 1;
  if (state.hasNotes) count += 1;
  return count;
}

/** Query params for the applicant list endpoint. Empty axes are omitted. */
export function serverFiltersToQuery(state: ServerFilterState): Record<string, string> {
  const query: Record<string, string> = {};
  if (state.experience.size > 0) query.experience = [...state.experience].join(',');
  if (state.skills.size > 0) query.skills = [...state.skills].join(',');
  if (state.locations.size > 0) query.locations = [...state.locations].join(',');
  if (state.appliedWithin !== 'all') query.appliedWithin = state.appliedWithin;
  if (state.hasResume) query.hasResume = 'true';
  if (state.hasNotes) query.hasNotes = 'true';
  return query;
}

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

/**
 * Apply every active filter axis to the fetched list. Returns a new array; the input
 * is never mutated. Rule order does not affect the result — all rules are AND-ed.
 */
export function filterRankedApplicants(
  applicants: Applicant[],
  state: RankedFilterState,
): Applicant[] {
  const needle = state.searchText.trim().toLowerCase();

  return applicants.filter((applicant) => {
    if (!state.includeArchived && applicant.application.archived != null) return false;
    if (state.stageIds.size > 0 && !state.stageIds.has(applicant.application.stageId)) return false;
    if (state.scoreValues.size > 0 && !state.scoreValues.has(deriveScoreBucket(applicant))) return false;
    if (needle !== '' && !matchesSearch(applicant, needle)) return false;
    return true;
  });
}
