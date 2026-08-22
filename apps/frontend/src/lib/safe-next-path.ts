// FILE: src/lib/safe-next-path.ts
// Validates a post-login `?next=` redirect target (Chunk 5, D_impl_ui5_2). Only an
// internal employer path is honoured; anything else falls back to /employer. This
// blocks open-redirects (//evil.com, https://evil.com) and cross-audience hops
// (/seeker/...). Accepts either a raw path or a full `?...` search string.

const DEFAULT_EMPLOYER_PATH = '/employer';

/** Extract the `next` value whether given a raw path or a location.search string. */
function readNext(input: string): string | null {
  if (!input) return null;
  if (input.startsWith('/')) return input; // already a raw path
  const query = input.startsWith('?') ? input.slice(1) : input;
  const params = new URLSearchParams(query);
  return params.get('next');
}

/**
 * A safe next path starts with `/employer/`, contains no protocol, and no `//`
 * (which a browser would treat as a scheme-relative external URL). Everything else
 * resolves to `/employer`.
 */
export function resolveSafeNextPath(input: string | null | undefined): string {
  if (!input) return DEFAULT_EMPLOYER_PATH;
  const next = readNext(input);
  if (!next) return DEFAULT_EMPLOYER_PATH;
  if (!next.startsWith('/employer/')) return DEFAULT_EMPLOYER_PATH;
  if (next.includes('//')) return DEFAULT_EMPLOYER_PATH;
  if (next.includes('http')) return DEFAULT_EMPLOYER_PATH;
  if (next.includes('\\')) return DEFAULT_EMPLOYER_PATH;
  return next;
}
