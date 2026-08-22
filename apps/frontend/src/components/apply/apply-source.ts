// FILE: src/components/apply/apply-source.ts
// "How did you hear about us?" options and the ?source= query mapping.
//
// The value travels as `utm_source` in the submitted FormData because
// apply-service.js already reads that key into application.sourceDetail. Adding a
// new field name would have meant a backend change for data the backend can
// already store.

export const SOURCE_OPTIONS = [
  'LinkedIn',
  'Naukri',
  'Referral',
  'Twitter',
  'Company website',
  'Job board',
  'Other',
] as const;

/**
 * Map a ?source= query value to one of the options above.
 *
 * `careers` is what the company's own careers page appends to every job link, and
 * it means the candidate came from the company website — so the dropdown is
 * answered for them and hidden. Returns null for anything unrecognised, which
 * leaves the dropdown visible and unanswered rather than guessing.
 */
export function sourceFromQuery(raw: string | null): string | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  const byQueryValue: Record<string, string> = {
    careers: 'Company website',
    website: 'Company website',
    linkedin: 'LinkedIn',
    naukri: 'Naukri',
    referral: 'Referral',
    twitter: 'Twitter',
    x: 'Twitter',
    jobboard: 'Job board',
    'job-board': 'Job board',
    jobmesh: 'Job board',
  };
  return byQueryValue[normalized] ?? null;
}
