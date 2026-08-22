// Canonical site origin for absolute URLs in metadata / JSON-LD / sitemap.
// Sourced ONLY from env (NEXT_PUBLIC_SITE_URL); the canonical default lives in
// .env.example, never hardcoded here (C10). Empty when unset → callers guard.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

/** Join a path onto the canonical origin. `path` should start with '/'. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
