// FILE: src/middleware/cors-middleware.js
// CORS policy for the subdomain architecture (NAMING-CONVENTIONS §17).
//
// Every audience is its own origin now (jobmesh.in, hire./admin./apply.jobmesh.in)
// and they all call api.jobmesh.in, so the single fixed origin this used to allow
// no longer covers the app. Any *.jobmesh.in host is allowed, plus localhost for
// dev and anything explicitly listed in CORS_ALLOWED_ORIGINS.
//
// credentials:true is mandatory — without it the browser drops the auth cookie on
// every cross-origin call. It also forbids a '*' wildcard, so the `cors` package
// echoes the caller's own origin back instead.

import cors from 'cors';
import { FRONTEND_URL, CORS_ALLOWED_ORIGINS } from '../env.js';

/**
 * Exact strings and patterns permitted to call the API with credentials.
 * The regexes are anchored at BOTH ends: an unanchored /jobmesh\.in$/ would
 * accept `https://jobmesh.in.attacker.com`, and a missing `$` would accept
 * `https://jobmesh.in.evil.com`.
 */
export const allowedOriginPatterns = [
  FRONTEND_URL,
  ...CORS_ALLOWED_ORIGINS,
  /^https?:\/\/([a-z0-9-]+\.)*jobmesh\.in$/i,
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
].filter(Boolean);

export function isOriginAllowed(origin) {
  return allowedOriginPatterns.some((allowed) => (
    allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
  ));
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin header: same-origin navigation, curl, or a health probe. Allow.
    if (!origin) return callback(null, true);
    return isOriginAllowed(origin)
      ? callback(null, true)
      : callback(new Error('CORS'), false);
  },
  credentials: true,
});
