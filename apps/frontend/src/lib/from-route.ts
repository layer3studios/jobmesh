// FILE: src/lib/from-route.ts
// Client-only helper for the `fromRoute` analytics property. Returns the in-app path
// the visitor came from when the referrer is same-origin, a coarse '(external)' when
// it is a different origin (never the external URL — avoids leaking third-party
// context), and '(direct)' when there is no referrer. Safe to call during SSR (returns
// '(direct)' when document is unavailable).
export function getFromRoute(): string {
  if (typeof document === 'undefined') return '(direct)';
  const referrer = document.referrer;
  if (!referrer) return '(direct)';
  try {
    const url = new URL(referrer);
    if (url.origin === window.location.origin) return url.pathname;
    return '(external)';
  } catch {
    return '(direct)';
  }
}
