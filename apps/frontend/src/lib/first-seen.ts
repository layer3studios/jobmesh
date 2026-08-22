// FILE: src/lib/first-seen.ts
// Client-only "first seen on this browser" helper. The auth API does not expose an
// isNewUser flag (D1/D2), so signup-vs-login is inferred here: the FIRST time a given
// stable id is seen in this browser we treat it as a signup, every time after as a
// login. Best-effort — a cleared localStorage or a second device re-counts as signup,
// which is acceptable for funnel analytics. Never stores personal data (ids only).
const STORAGE_PREFIX = 'jm_seen_';

// Returns true the first time (namespace, id) is seen on this browser, false after.
// Marks it seen as a side effect.
export function isFirstSeen(namespace: string, id: string): boolean {
  if (typeof window === 'undefined' || !id) return false;
  const key = `${STORAGE_PREFIX}${namespace}_${id}`;
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, '1');
    return true;
  } catch {
    // Storage blocked — cannot distinguish; default to NOT-first so we never
    // over-count signups.
    return false;
  }
}
