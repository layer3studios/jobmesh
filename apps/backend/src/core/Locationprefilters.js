// FILE: src/core/Locationprefilters.js
// Location gating for the scraper, plus ATS field normalizers.
//
// The country lists themselves live in core/target-countries.js — one entry
// per country, one switch to enable it. This file used to hold two hardcoded
// India arrays, and four ATS configs held their own copies besides; adding a
// country meant editing all of them and remembering which was which.
import { isTargetLocation, countryOf } from './target-countries.js';

export { isTargetLocation, countryOf };

/**
 * True if the string names an enabled country.
 *
 * Kept under its original name because four ATS configs import it, but it is
 * no longer India-specific — it follows TARGET_COUNTRIES. Prefer
 * isTargetLocation in new code; this is the compatibility shim.
 *
 * Two behaviours changed, both deliberately:
 *   • Matching is whole-word. The old substring test let "IN" match
 *     "Indianapolis", which is how US cities reached an India-only board.
 *   • "Remote" and "Work from home" are matched as country-agnostic rather
 *     than as Indian locations, which is what they were listed as before.
 */
export function isIndiaString(location) {
  return isTargetLocation(location);
}

/** Normalize workplace-type strings to: Remote / Hybrid / On-site / null. */
export function normalizeWorkplaceType(raw) {
  if (!raw) return null;
  const lower = String(raw).toLowerCase().trim();
  if (['remote', 'fully remote', 'work from home'].includes(lower)) return 'Remote';
  if (['hybrid', 'hybrid job'].includes(lower)) return 'Hybrid';
  if (['on-site', 'onsite', 'on_site', 'office'].includes(lower)) return 'On-site';
  return null;
}

/** Normalize employment-type strings to a small JobMesh taxonomy. */
export function normalizeEmploymentType(raw) {
  if (!raw) return null;
  const lower = String(raw).toLowerCase().trim();
  if (['full-time', 'fulltime', 'full_time', 'permanent'].includes(lower)) return 'Full-time';
  if (['part-time', 'parttime', 'part_time'].includes(lower)) return 'Part-time';
  if (['internship', 'intern'].includes(lower)) return 'Internship';
  if (['contract', 'temporary', 'temp'].includes(lower)) return 'Contract';
  if (lower === 'freelance') return 'Freelance';
  return raw;
}

/**
 * True if the job should be kept based on its location fields.
 * Missing / empty location → keep (defensive default).
 */
export function universalLocationPreFilter(job, options = {}) {
  const fields = options.locationFields || ['location', 'Location', 'city', 'office'];
  let text = null;
  for (const field of fields) {
    if (job[field]) { text = String(job[field]); break; }
    if (field.includes('.')) {
      let value = job;
      for (const part of field.split('.')) {
        value = value?.[part];
        if (!value) break;
      }
      if (value) { text = String(value); break; }
    }
  }
  if (!text || text.trim() === '') return true;
  return isTargetLocation(text);
}

export function createLocationPreFilter(options = {}) {
  return (job) => universalLocationPreFilter(job, options);
}
