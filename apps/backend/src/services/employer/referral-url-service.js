// FILE: src/services/employer/referral-url-service.js
// Builds the shareable referral URL. Kept out of the route file because the apply
// origin is an environment concern (§17): careers pages live on the APPLY host in
// production and under /apply on a single-host deploy, and only APPLY_URL knows
// which. Pure and synchronous, so it is trivially unit-testable.

import { APPLY_URL } from '../../env.js';

/** Query key carrying the referral token on a public apply URL. */
export const REFERRAL_QUERY_KEY = 'ref';

/**
 * `https://apply.jobmesh.in/acme/backend-engineer?ref=Xk29fLm1QpZa`
 *
 * Slugs are URL-encoded even though slugify already restricts them: this string is
 * pasted into email and chat clients that will happily follow whatever we hand
 * them, so encoding is the cheap guarantee rather than an assumption about slugs.
 */
export function buildReferralUrl(companySlug, postingSlug, token) {
  const origin = String(APPLY_URL).replace(/\/$/, '');
  const path = `${encodeURIComponent(companySlug)}/${encodeURIComponent(postingSlug)}`;
  return `${origin}/${path}?${REFERRAL_QUERY_KEY}=${encodeURIComponent(token)}`;
}
