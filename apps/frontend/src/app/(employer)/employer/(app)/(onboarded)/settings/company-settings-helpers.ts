// FILE: settings/company-settings-helpers.ts
// Pure helpers for Company settings. Mirrors the backend rules in
// company-validators.js so the form rejects what the API would reject, and keeps
// CompanySettingsClient free of validation logic.

import type { SocialLinkValues } from './parts/CompanyProfileFields';

export type { SocialLinkValues };

/**
 * Validate one social URL. Empty is valid — a blank field means "no link".
 *
 * Mirrors validateOptionalUrl on the backend: parseable, and http/https only. The
 * protocol check is the one that matters here; a `javascript:` URL would otherwise
 * be rendered as an anchor on a public careers page.
 */
export function socialUrlError(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'Enter a full URL, including https://';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'URL must start with http:// or https://';
  }
  return null;
}

/**
 * Build the socialLinks value for a PATCH. Blank fields are dropped, and an
 * all-blank map becomes null — matching the backend, which collapses an empty map
 * so the careers page has one falsy case rather than an object with no keys.
 */
export function buildSocialLinksPatch(
  social: SocialLinkValues,
): { linkedin?: string; twitter?: string; github?: string } | null {
  const links: { linkedin?: string; twitter?: string; github?: string } = {};
  for (const key of ['linkedin', 'twitter', 'github'] as const) {
    const trimmed = social[key].trim();
    if (trimmed !== '') links[key] = trimmed;
  }
  return Object.keys(links).length === 0 ? null : links;
}

/** True when any social field currently holds an invalid URL. */
export function hasSocialErrors(social: SocialLinkValues): boolean {
  return (['linkedin', 'twitter', 'github'] as const).some((key) => socialUrlError(social[key]) !== null);
}

/** Compare two social maps for equality, treating null and {} as the same. */
export function socialLinksEqual(
  a: { linkedin?: string; twitter?: string; github?: string } | null,
  b: { linkedin?: string; twitter?: string; github?: string } | null,
): boolean {
  const left = a ?? {};
  const right = b ?? {};
  return (['linkedin', 'twitter', 'github'] as const)
    .every((key) => (left[key] ?? '') === (right[key] ?? ''));
}
