// Central API base. C10: every API call routes through NEXT_PUBLIC_API_BASE_URL,
// which defaults to '/api' (same-origin via nginx in prod, dev-rewritten in
// next.config.ts). Never hardcode an absolute API origin here.
// Client api modules pass the path AFTER '/api' (e.g. '/seeker/profile'); the
// resulting request URL is byte-identical to the current Vite app's URLs.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
