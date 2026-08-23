// FILE: src/services/public/referral-attribution-service.js
// Resolves a `?ref=` token from a public apply submission into the attribution
// fields an application carries. Kept out of apply-service because both apply
// paths (plain and transactional) need it and neither should grow another branch.
//
// EVERY FAILURE IS SILENT. An unknown, deactivated, tampered or cross-company
// token yields "no referral" and the application proceeds as a normal apply-page
// submission. A candidate must never be blocked from applying because the link
// someone sent them had gone stale — the attribution is our bookkeeping, not a
// condition of their application.

import { findReferralLinkByToken } from '../../models/employer/referral-link-model.js';

/** What an unattributed application carries. Also the shape returned on any miss. */
const NO_REFERRAL = Object.freeze({
  source: 'apply_page', sourceDetail: null, referralLinkId: null, referralLink: null,
});

/**
 * Resolve a token to attribution fields, scoped to the company that owns the
 * posting. The companyId check is the security boundary: without it, a token
 * minted at company A would attribute an application at company B, leaking one
 * tenant's employee name onto another tenant's candidate record.
 *
 * @param token      Raw `ref` value from the form or query string.
 * @param companyId  ObjectId of the company that owns the posting being applied to.
 * @param utmSource  The form's "How did you hear about us?" answer, used as the
 *                   sourceDetail when there is no referral.
 */
export async function resolveReferralAttribution(token, companyId, utmSource = null) {
  const fallback = { ...NO_REFERRAL, sourceDetail: utmSource ?? null };
  if (typeof token !== 'string' || token.trim() === '') return fallback;

  let link;
  try {
    link = await findReferralLinkByToken(token.trim());
  } catch (err) {
    // A referral lookup must never take an application down with it.
    console.warn('[referral] token lookup failed:', err.message);
    return fallback;
  }

  if (!link || link.isActive === false) return fallback;
  if (String(link.companyId) !== String(companyId)) {
    console.warn('[referral] token presented for a company that does not own it');
    return fallback;
  }

  return {
    source: 'referral',
    // The referrer's name, so the employer reads "Referral · Priya Shah" rather
    // than an opaque id. Falls back to the generic label when the name is missing.
    sourceDetail: link.referrerName ?? 'Referral',
    referralLinkId: link._id,
    referralLink: link,
  };
}
