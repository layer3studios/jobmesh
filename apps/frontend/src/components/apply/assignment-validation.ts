// FILE: src/components/apply/assignment-validation.ts
// Client-side validation for the assignment submission fields.
//
// EVERY RULE HERE MIRRORS src/services/public/assignment-submission-validators.js
// in the backend repo. That file is the authority: it re-validates everything on an
// unauthenticated endpoint and nothing here is a security control. These exist only
// so the candidate learns about a bad URL before spending a submit on it. If a rule
// changes there, change it here — a client that is STRICTER than the backend is the
// worse failure, because it blocks input the server would have accepted.

const MAX_LINK_LENGTH = 2048;
const MAX_PROFILE_URL_LENGTH = 255;

export const MAX_SUBMISSION_LINKS = 5;
export const MAX_SUBMISSION_FILES = 5;
export const MAX_NOTES_LENGTH = 5000;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

function parseUrl(value: string): URL | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

/**
 * A submission link. https ONLY — that one check rejects `javascript:`, `data:` and
 * plain `http:` together, rather than blacklisting the schemes we happened to think
 * of. Mirrors validateSubmissionLinks.
 */
export function validateSubmissionLink(value: string): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null; // empty rows are ignored, not errors
  if (raw.length > MAX_LINK_LENGTH) return 'That link is too long.';
  const url = parseUrl(raw);
  if (!url || url.protocol !== 'https:') return 'Links must be full https:// URLs.';
  return null;
}

/** Hosts whose links are commonly private-by-default and silently unreviewable. */
const PRIVATE_BY_DEFAULT_HOSTS = ['github.com', 'gitlab.com', 'drive.google.com', 'notion.so', 'figma.com'];

/** True when a link points at a host whose default sharing setting is private. */
export function isPrivateByDefaultHost(value: string): boolean {
  const url = parseUrl(value ?? '');
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  return PRIVATE_BY_DEFAULT_HOSTS.some((known) => host === known || host.endsWith(`.${known}`));
}

export interface ProfileValidation {
  error: string | null;
  hint: string | null;
}

/**
 * Optional GitHub profile URL. Mirrors validateGithubProfileUrl.
 *
 * A two-segment path (github.com/user/repo) is a REPOSITORY, not a profile — and it
 * is ACCEPTED, returning a `hint` rather than an `error`. The backend stores it
 * happily. Hard-rejecting a working link someone pasted into an OPTIONAL field, over
 * a formatting opinion, is hostile and costs real candidates. Do not "fix" this into
 * a rejection.
 */
export function validateGithubProfile(value: string): ProfileValidation {
  const raw = (value ?? '').trim();
  if (!raw) return { error: null, hint: null };
  const invalid = { error: 'Enter a valid GitHub URL, or leave it blank.', hint: null };

  const url = parseUrl(raw);
  if (raw.length > MAX_PROFILE_URL_LENGTH || !url || url.protocol !== 'https:') return invalid;
  const host = url.hostname.toLowerCase();
  if (host !== 'github.com' && !host.endsWith('.github.com')) return invalid;

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length < 1) return invalid; // bare github.com is not a profile
  if (segments.length >= 2) {
    return {
      error: null,
      hint: 'That looks like a repository. Repos belong in your submission links above — this field is for your profile.',
    };
  }
  return { error: null, hint: null };
}

// Paths that are demonstrably not a person's profile. Mirrors the backend list.
const LINKEDIN_NON_PROFILE_PATHS = ['/company/', '/school/', '/posts/', '/jobs/'];

/**
 * Optional LinkedIn profile URL. Mirrors validateLinkedinProfileUrl.
 *
 * The hostname check is ENDS-WITH 'linkedin.com', NOT equality with
 * 'www.linkedin.com'. LinkedIn serves country subdomains — in.linkedin.com,
 * uk.linkedin.com, sg.linkedin.com — and Indian candidates very often copy their URL
 * from the in. regional site. Anchoring on 'www.' would reject a large share of our
 * actual applicant base on their own valid profile link.
 *
 * lnkd.in is refused: it is LinkedIn's shortener, an opaque redirect we cannot
 * verify points at a profile at all.
 */
export function validateLinkedinProfile(value: string): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const invalid = 'Enter a valid LinkedIn profile URL, or leave it blank.';

  const url = parseUrl(raw);
  if (raw.length > MAX_PROFILE_URL_LENGTH || !url || url.protocol !== 'https:') return invalid;
  const host = url.hostname.toLowerCase();
  if (host === 'lnkd.in' || host.endsWith('.lnkd.in')) return invalid;
  if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return invalid;

  const pathname = url.pathname.toLowerCase();
  if (!pathname.includes('/in/')) return invalid;
  if (LINKEDIN_NON_PROFILE_PATHS.some((segment) => pathname.includes(segment))) return invalid;
  return null;
}
