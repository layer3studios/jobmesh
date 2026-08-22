// FILE: src/utils/slugify-company.ts
// Client-side mirror of the server's company slug rules (company-slug-helpers.js).
// Used only for the live "apply URL" preview on the onboarding form — the server
// remains authoritative and may append "-2" etc. on a slug collision (R5).

const SLUG_MAX_LENGTH = 60;
const COMBINING_MARKS = /[̀-ͯ]/g;
const PREVIEW_FALLBACK = 'your-company';

/**
 * Turn an arbitrary company name into a URL-safe slug, matching the server:
 * NFKD-strip diacritics → lowercase → non-alphanumeric runs to hyphen → collapse
 * and trim hyphens → cap at 60 chars. Falls back to 'your-company' when empty.
 */
export function slugifyCompanyName(name: string): string {
  const base = String(name ?? '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')   // strip combining diacritic marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')    // any run of non-alphanumerics → hyphen
    .replace(/-+/g, '-')            // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '');       // trim leading/trailing hyphens
  const capped = base.slice(0, SLUG_MAX_LENGTH).replace(/-+$/g, '');
  return capped || PREVIEW_FALLBACK;
}
