// FILE: src/env.js
// Central env loader. Fails loudly when critical secrets are missing.

import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.warn(`[env] Missing required env var: ${name}`);
  }
  return value || '';
}

export const MONGO_URI = required('MONGO_URI');
export const GOOGLE_CLIENT_ID = required('GOOGLE_CLIENT_ID');
export const JWT_SECRET = required('JWT_SECRET');

// Employer auth — fully separate identity stack from the seeker JWT_SECRET.
// A leaked/forged seeker token must never authenticate against employer routes.
export const EMPLOYER_JWT_SECRET = required('EMPLOYER_JWT_SECRET');
export const EMPLOYER_COOKIE_NAME = 'jm_employer_token';
export const EMPLOYER_JWT_EXPIRY = '7d'; // matches seeker for consistency

// Secret for signing resume-download URLs (HMAC-SHA256). Production MUST set this
// explicitly; the EMPLOYER_JWT_SECRET fallback is a dev convenience only (both are
// server-side secrets), and the last literal keeps tests/boot working with neither.
export const RESUME_URL_SECRET = process.env.RESUME_URL_SECRET
  || process.env.EMPLOYER_JWT_SECRET
  || 'dev-resume-secret';

// Secret for signing assignment file tokens — staging fileIds AND employer download
// URLs (HMAC-SHA256). Deliberately SEPARATE from RESUME_URL_SECRET: rotating one
// must not invalidate the other, and a leak of either must not grant the other's
// files. Production MUST set this explicitly; the EMPLOYER_JWT_SECRET fallback is a
// dev convenience only, and the last literal keeps tests/boot working with neither.
export const ASSIGNMENT_URL_SECRET = process.env.ASSIGNMENT_URL_SECRET
  || process.env.EMPLOYER_JWT_SECRET
  || 'dev-assignment-secret';

// Secret for signing PUBLIC PROFILE resume links (HMAC-SHA256). Separate from
// RESUME_URL_SECRET on purpose: those tokens cover one application and live 15
// minutes; these cover one published profile slug and live 24 hours, and rotating
// one audience's links must never invalidate the other's. Production MUST set this
// explicitly; the fallbacks are a dev convenience only.
export const PUBLIC_PROFILE_URL_SECRET = process.env.PUBLIC_PROFILE_URL_SECRET
  || process.env.JWT_SECRET
  || 'dev-public-profile-secret';

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const PORT = parseInt(process.env.PORT, 10) || 3000;

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Subdomain routing (NAMING-CONVENTIONS §17) ───────────────────
// Cookie scope. '.jobmesh.in' (leading dot) makes one session valid across every
// *.jobmesh.in host, so a seeker stays signed in walking from jobmesh.in to
// apply.jobmesh.in. MUST stay unset in local dev — a domain attribute on
// localhost is rejected by some browsers and would silently break login.
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';

// Public origin of the apply/careers audience (apply.jobmesh.in in production).
// The backend needs it to build shareable referral URLs — those are pasted into
// emails and DMs, so they must be absolute and must point at the APPLY host, not
// at whichever host happened to serve the employer's request. Falls back to the
// same-origin /apply path under FRONTEND_URL, which is how a single-host deploy
// serves careers pages.
export const APPLY_URL = process.env.APPLY_URL || `${FRONTEND_URL}/apply`;

// Public origin of the SEEKER audience (jobmesh.in in production) — where a
// shareable profile lives at /u/{slug}. The backend needs it to hand the candidate
// an absolute link to copy, and to put one in the "someone messaged you" email.
export const PUBLIC_PROFILE_BASE_URL = (process.env.PUBLIC_PROFILE_BASE_URL || FRONTEND_URL)
  .replace(/\/$/, '');

// Extra browser origins allowed to call the API with credentials, comma-separated.
// Every *.jobmesh.in host is already allowed by pattern in server.js; this exists
// for one-off origins (a staging host, a preview deploy) without a code change.
export const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Admin identity is MongoDB-backed (admin_users collection) + jm_admin_token
// cookie — no longer env-based. ADMIN_JWT_TTL_HOURS sets the admin session length
// (short, mature-SaaS style; defaults 8h). INITIAL_ADMIN_EMAILS is bootstrap-only:
// read once by src/scripts/seed-initial-admins.js, then deleted from prod .env.
export const ADMIN_JWT_TTL_HOURS = Number(process.env.ADMIN_JWT_TTL_HOURS) || 8;
export const INITIAL_ADMIN_EMAILS = (process.env.INITIAL_ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

// Whether to run the scraper once at startup. Default off in development.
export const RUN_SCRAPER_ON_START = process.env.RUN_SCRAPER_ON_START === 'true';

// Master switch for the daily scrape cron. Defaults true (backward compat) — anything
// other than the literal 'false' keeps the existing behavior. Set SYNC_ENABLED=false to
// stop the 6 AM scrape from firing (e.g. to protect Gemma/Gemini quota during a demo).
export const SYNC_ENABLED = process.env.SYNC_ENABLED !== 'false';

// ─── DPDP compliance (Step 4.5A) ──────────────────────────────────
// noticeVersion pins each consent to the notice text the user agreed to.
export const DPDP_NOTICE_VERSION = process.env.DPDP_NOTICE_VERSION
  || (IS_PRODUCTION ? required('DPDP_NOTICE_VERSION') : 'v1.0-2026-07');
export const DPDP_POLICY_URL = process.env.DPDP_POLICY_URL
  || (IS_PRODUCTION ? required('DPDP_POLICY_URL') : '/legal/privacy');
export const DPDP_GRIEVANCE_OFFICER_EMAIL = process.env.DPDP_GRIEVANCE_OFFICER_EMAIL
  || (IS_PRODUCTION ? required('DPDP_GRIEVANCE_OFFICER_EMAIL') : 'privacy@jobmesh.in');
// Reflects our use of Google AI Studio (cross-border processing).
export const DPDP_CROSS_BORDER_ENABLED = (process.env.DPDP_CROSS_BORDER_ENABLED ?? 'true') !== 'false';

// ─── Gemma JD extraction (Step 4.6) ───────────────────────────────
// Comma-separated API keys, ideally from DIFFERENT GCP projects (separate quota
// buckets, R2). All three have safe defaults so the server boots without them —
// extraction is simply disabled when no keys are configured.
export const GEMMA_API_KEYS = process.env.GEMMA_API_KEYS || '';
// Scraper JD extraction pool (batch). If empty, scraper falls back to GEMMA_API_KEYS.
export const GEMMA_SCRAPER_API_KEYS = process.env.GEMMA_SCRAPER_API_KEYS || '';
export const GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it';
export const GEMMA_BASE_URL = process.env.GEMMA_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

// ─── AI per-operation switches ─────────────────────────────────────
// Each operation can be disabled independently without touching keys. Only the
// scraper defaults OFF — it is the bursty, lowest-value consumer of quota, so
// it must be opted into. Everything else defaults ON (backward compat).
export const SCRAPER_JD_EXTRACTION_ENABLED = process.env.SCRAPER_JD_EXTRACTION_ENABLED === 'false';
export const EMPLOYER_JD_EXTRACTION_ENABLED = process.env.EMPLOYER_JD_EXTRACTION_ENABLED !== 'false';
export const EMPLOYER_SCORING_ENABLED = process.env.EMPLOYER_SCORING_ENABLED !== 'false';
export const SEEKER_AI_ENABLED = process.env.SEEKER_AI_ENABLED !== 'false';

// ─── AI model cascades (comma-separated, first = preferred) ────────
// Reorder or add models from .env with no code change. Employer work gets the
// strongest models; seeker and scraper lead with the high-quota Gemma tiers.
export const EMPLOYER_AI_MODELS = process.env.EMPLOYER_AI_MODELS
  || 'gemini-3.6-flash,gemini-3.5-flash,gemini-3-flash,gemini-2.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemma-4-31b,gemma-4-26b-a4b-it';
export const SEEKER_AI_MODELS = process.env.SEEKER_AI_MODELS
  || 'gemma-4-26b-a4b-it,gemma-4-31b,gemini-3.1-flash-lite,gemini-3.5-flash-lite';
export const SCRAPER_AI_MODELS = process.env.SCRAPER_AI_MODELS
  || 'gemma-4-26b-a4b-it,gemma-4-31b,gemini-3.1-flash-lite,gemini-3.5-flash-lite';

// Stop at this fraction of a model's published limit, leaving headroom for
// clock skew and requests already in flight.
export const AI_SAFETY_MARGIN = Number(process.env.AI_SAFETY_MARGIN) || 0.85;

// ─── Admin analytics (PostHog Query API) ──────────────────────────
// Server-only. The personal key (phx_) is NEVER exposed to the client. All three are
// optional at boot: when POSTHOG_PERSONAL_API_KEY is absent the admin analytics
// endpoints return 503 and the rest of the app runs unaffected (do not crash).
export const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com';
export const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '';
export const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY || '';
export const ANALYTICS_CACHE_TTL_MS = parseInt(process.env.ANALYTICS_CACHE_TTL_MS, 10) || 300000;

// ─── Transactional email (Resend) ─────────────────────────────────
// All optional at boot. An empty RESEND_API_KEY simply disables outbound email —
// sendTransactionalEmail() returns { sent: false } instead of throwing, so the
// server boots and every caller's flow survives without email configured.
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// Verified sender identity. Defaults are our real production identity, so a
// missing var can never produce a malformed or unverified From header.
export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'hello@jobmesh.in';
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'JobMesh';
// Empty means "omit replyTo entirely" — replies then go to the From address,
// which is always a safe default.
export const EMAIL_REPLY_TO_ADDRESS = process.env.EMAIL_REPLY_TO_ADDRESS || '';
// Master switch, same contract as SYNC_ENABLED: anything other than the literal
// 'false' keeps email on, so an unset var never silently disables sending.
export const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';
// Gates the 24h interview-reminder sweep. Same contract: only the literal
// 'false' disables it, so an unset var keeps reminders working.
export const INTERVIEW_REMINDERS_ENABLED = process.env.INTERVIEW_REMINDERS_ENABLED !== 'false';


// GitHub's GraphQL API needs a token even for entirely public data: unauthenticated
// REST is capped at 60 requests/hour per IP, which one busy applicant list would
// exhaust. A fine-grained PAT with NO scopes is enough — the token buys rate limit,
// not access. Server-side only; it must never reach the frontend.
//
// Optional by design, and NOT via required(): a missing token disables the GitHub
// panels and leaves the rest of the app running, which is the right failure for a
// nice-to-have integration.
export const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN || '';
export const GITHUB_ENABLED = GITHUB_API_TOKEN !== '';
