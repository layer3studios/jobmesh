// FILE: src/components/seeker/dashboard/filter-schema.ts
// The one place that knows how a job filter is named in the URL, what its
// default is, and how it reads in the applied-filters row.
//
// Why this file exists: the URL used to be written from five places
// (useDashboardFilters, DashboardFilterBar, DashboardFilterSheetFields,
// DashboardMobileFilters, dashboard/index). Each had to remember the param
// spelling and to drop `page`, and they disagreed — selecting "All roles" wrote
// `?role=all` instead of clearing it, and the "Posted" options were labelled
// "Last 3 days" on desktop and "3 days" on mobile. Now a component names a
// filter, never a param: `parse` reads the whole state out of the URL and
// `write` puts a patch back, dropping defaults and resetting paging.
//
// No React in here, so the filter UI can import the labels without the hook.

export type DateValue = 'all' | 'today' | '3d' | '7d' | '30d';

export interface FilterState {
  /** Company slug — set by the directory links and the company chip. */
  company: string;
  role: string;
  experience: string[];
  workplace: string[];
  date: DateValue;
  locations: string[];
  techStack: string[];
  /** Salary bounds in ₹ LPA. Strings because they back text inputs. */
  salaryMin: string;
  salaryMax: string;
  search: string;
  entryLevel: boolean;
  hideApplied: boolean;
  newOnly: boolean;
  sortByMatch: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  company: '',
  role: 'all',
  experience: [],
  workplace: [],
  date: 'all',
  locations: [],
  techStack: [],
  salaryMin: '',
  salaryMax: '',
  search: '',
  entryLevel: false,
  hideApplied: false,
  newOnly: false,
  sortByMatch: false,
};

/** Filter key → URL param. Short names because they are shared links. */
export const PARAM: Record<keyof FilterState, string> = {
  company: 'company',
  role: 'role',
  experience: 'exp',
  workplace: 'wp',
  date: 'date',
  locations: 'loc',
  techStack: 'tech',
  salaryMin: 'salMin',
  salaryMax: 'salMax',
  search: 'q',
  entryLevel: 'entry',
  hideApplied: 'hideApplied',
  newOnly: 'newOnly',
  sortByMatch: 'sort',
};

// ── Option labels ───────────────────────────────────────────────────────────
// Single source for every control AND for the applied-filter chips, so a chip
// can never show a raw value like "3d" or "on-site" again.

export interface Option { value: string; label: string; }

export const DATE_OPTIONS: Option[] = [
  { value: 'all', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last week' },
  { value: '30d', label: 'Last month' },
];

export const WORKPLACE_OPTIONS: Option[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
];

const labelOf = (options: Option[], value: string): string =>
  options.find(o => o.value === value)?.label ?? value;

// ── Read ────────────────────────────────────────────────────────────────────

/** Anything with URLSearchParams' read surface (incl. Next's readonly one). */
export interface ReadableParams {
  get(name: string): string | null;
}

const csv = (v: string | null): string[] =>
  v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];

/** Keep only values the UI offers, so a hand-edited URL cannot wedge the list. */
const known = (values: string[], options: Option[]): string[] =>
  values.filter(v => options.some(o => o.value === v));

const lpa = (v: string | null): string => {
  if (!v) return '';
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? String(n) : '';
};

export function parseFilters(sp: ReadableParams): FilterState {
  const date = (sp.get(PARAM.date) || 'all') as DateValue;
  return {
    company: sp.get(PARAM.company) || '',
    role: sp.get(PARAM.role) || 'all',
    experience: csv(sp.get(PARAM.experience)).filter(v => v !== 'all'),
    workplace: known(csv(sp.get(PARAM.workplace)), WORKPLACE_OPTIONS),
    date: DATE_OPTIONS.some(o => o.value === date) ? date : 'all',
    locations: csv(sp.get(PARAM.locations)),
    techStack: csv(sp.get(PARAM.techStack)),
    salaryMin: lpa(sp.get(PARAM.salaryMin)),
    salaryMax: lpa(sp.get(PARAM.salaryMax)),
    search: sp.get(PARAM.search) || '',
    entryLevel: sp.get(PARAM.entryLevel) === '1',
    hideApplied: sp.get(PARAM.hideApplied) === '1',
    newOnly: sp.get(PARAM.newOnly) === '1',
    sortByMatch: sp.get(PARAM.sortByMatch) === 'match',
  };
}

// ── Write ───────────────────────────────────────────────────────────────────

/**
 * Apply a patch to `sp` in place. A value equal to its default is deleted
 * rather than written, so "All roles" clears `?role` instead of parking
 * `?role=all` in a link someone shares.
 *
 * Any filter change resets paging — that used to be each caller's job to
 * remember, and three of them forgot.
 */
export function writeFilters(sp: URLSearchParams, patch: Partial<FilterState>): void {
  for (const [key, value] of Object.entries(patch) as [keyof FilterState, FilterState[keyof FilterState]][]) {
    const param = PARAM[key];
    const fallback = DEFAULT_FILTERS[key];

    if (Array.isArray(value)) {
      if (value.length) sp.set(param, value.join(','));
      else sp.delete(param);
      continue;
    }
    if (typeof value === 'boolean') {
      // `sort` is a named mode rather than a flag; the rest are '1'.
      if (value) sp.set(param, key === 'sortByMatch' ? 'match' : '1');
      else sp.delete(param);
      continue;
    }
    if (value === fallback || value === '') sp.delete(param);
    else sp.set(param, String(value));
  }
  sp.delete('page');
}

// ── Applied-filter chips ────────────────────────────────────────────────────
// Baymard's applied-filters guidance: show the selected options themselves
// rather than a bare count, carry the filter type when a value alone is
// ambiguous, keep the type styling secondary to the value, and be consistent
// about it — so every chip here gets a group.
// https://baymard.com/blog/how-to-design-applied-filters

export interface FilterChip {
  /** Stable React key. */
  key: string;
  /** Filter type, e.g. "Experience". Rendered secondary to the value. */
  group: string;
  /** The human label for the selected value. */
  label: string;
  /** The patch that removes this one value. */
  patch: Partial<FilterState>;
}

const without = (list: string[], value: string): string[] => list.filter(v => v !== value);

export function filterChips(filters: FilterState, roleOptions: Option[]): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.company) {
    chips.push({ key: 'company', group: 'Company', label: filters.company, patch: { company: '' } });
  }
  if (filters.role !== DEFAULT_FILTERS.role) {
    chips.push({ key: 'role', group: 'Role', label: labelOf(roleOptions, filters.role), patch: { role: DEFAULT_FILTERS.role } });
  }
  for (const band of filters.experience) {
    chips.push({ key: `exp:${band}`, group: 'Experience', label: band, patch: { experience: without(filters.experience, band) } });
  }
  for (const mode of filters.workplace) {
    chips.push({ key: `wp:${mode}`, group: 'Work mode', label: labelOf(WORKPLACE_OPTIONS, mode), patch: { workplace: without(filters.workplace, mode) } });
  }
  if (filters.date !== DEFAULT_FILTERS.date) {
    chips.push({ key: 'date', group: 'Posted', label: labelOf(DATE_OPTIONS, filters.date), patch: { date: DEFAULT_FILTERS.date } });
  }
  for (const city of filters.locations) {
    chips.push({ key: `loc:${city}`, group: 'City', label: city, patch: { locations: without(filters.locations, city) } });
  }
  for (const tag of filters.techStack) {
    chips.push({ key: `tech:${tag}`, group: 'Tech', label: tag, patch: { techStack: without(filters.techStack, tag) } });
  }
  if (filters.salaryMin || filters.salaryMax) {
    chips.push({
      key: 'salary',
      group: 'Salary',
      label: filters.salaryMin && filters.salaryMax
        ? `₹${filters.salaryMin}–${filters.salaryMax} LPA`
        : filters.salaryMin ? `₹${filters.salaryMin}+ LPA` : `Up to ₹${filters.salaryMax} LPA`,
      patch: { salaryMin: '', salaryMax: '' },
    });
  }
  if (filters.entryLevel) {
    chips.push({ key: 'entry', group: 'Show', label: 'Fresher-friendly', patch: { entryLevel: false } });
  }
  if (filters.newOnly) {
    chips.push({ key: 'newOnly', group: 'Show', label: 'New this week', patch: { newOnly: false } });
  }
  if (filters.hideApplied) {
    chips.push({ key: 'hideApplied', group: 'Show', label: 'Hiding applied', patch: { hideApplied: false } });
  }
  return chips;
}

/** Everything the "More" sheet owns, for its badge count. */
export function moreFilterCount(filters: FilterState): number {
  return (filters.date !== DEFAULT_FILTERS.date ? 1 : 0)
    + filters.locations.length
    + filters.techStack.length
    + (filters.salaryMin || filters.salaryMax ? 1 : 0)
    + (filters.newOnly ? 1 : 0)
    + (filters.hideApplied ? 1 : 0)
    + (filters.entryLevel ? 1 : 0);
}

/** A patch that clears every filter. Search and the open job are left alone. */
export function clearedFilters(): Partial<FilterState> {
  const { search, ...rest } = DEFAULT_FILTERS;
  void search;
  return rest;
}
