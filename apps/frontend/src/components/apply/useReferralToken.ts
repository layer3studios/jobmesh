'use client';
// FILE: src/components/apply/useReferralToken.ts
// Owns the `?ref=` lifecycle on the public apply page: read it from the URL, keep
// it for the length of the visit, and resolve the referrer's name for the banner.
//
// WHY sessionStorage. Filling this form takes minutes, and a refresh, a
// back-navigation from the privacy notice, or a bounce through the assignment
// preview would otherwise drop the token and silently lose the attribution the
// referrer earned. sessionStorage — not localStorage — because attribution belongs
// to THIS visit: a candidate returning next week through a direct link is not
// still being referred, and a shared browser must not carry one person's referral
// into another person's application.

import { useEffect, useState } from 'react';
import { fetchReferrerName } from '@/api/public-api';

/** Query key the referral URL carries. Mirrors REFERRAL_QUERY_KEY on the backend. */
export const REFERRAL_QUERY_KEY = 'ref';

/** Scoped per posting so two tabs on different roles cannot cross-attribute. */
const storageKeyFor = (jobSlug: string) => `jm_referral_${jobSlug}`;

/** sessionStorage throws in private modes and sandboxed frames — never let it break the form. */
function readStoredToken(jobSlug: string): string | null {
  try {
    return window.sessionStorage.getItem(storageKeyFor(jobSlug));
  } catch {
    return null;
  }
}

function storeToken(jobSlug: string, token: string): void {
  try {
    window.sessionStorage.setItem(storageKeyFor(jobSlug), token);
  } catch {
    // A visit that cannot persist the token still attributes correctly as long as
    // the candidate does not reload — better than failing the page.
  }
}

export interface ReferralState {
  /** Submitted with the application; null when there is no live referral. */
  token: string | null;
  /** Drives the banner. Null until resolved, or when the token is not live. */
  referrerName: string | null;
}

/**
 * @param jobSlug   Scopes the stored token to this posting.
 * @param urlToken  The `ref` value from the current URL, or null.
 */
export function useReferralToken(jobSlug: string, urlToken: string | null): ReferralState {
  const [token, setToken] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // The URL wins over storage: a candidate who opens a second person's link is
  // now referred by that second person.
  useEffect(() => {
    const resolved = urlToken?.trim() || readStoredToken(jobSlug);
    if (!resolved) return;
    if (urlToken?.trim()) storeToken(jobSlug, resolved);
    setToken(resolved);
  }, [jobSlug, urlToken]);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;
    fetchReferrerName(token)
      .then((name) => { if (isCurrent) setReferrerName(name); })
      // A failed lookup costs the banner, never the application: the token is
      // still submitted and the backend re-validates it at apply time.
      .catch(() => { if (isCurrent) setReferrerName(null); });
    return () => { isCurrent = false; };
  }, [token]);

  return { token, referrerName };
}
