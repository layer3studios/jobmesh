// FILE: src/api/employer/company-patch-builder.js
// Validates + normalizes a PATCH /api/employer/company body. Split out of
// employer-company-routes.js, which was over the 200-line cap.
//
// The allowlist is the security boundary: any key not named in PATCHABLE_FIELDS is
// REJECTED rather than dropped, so a forged companyId or slug fails loudly instead
// of being silently ignored. Keeping the list beside the per-field validators is
// what makes that boundary reviewable in one place.

import { HttpError } from '../../middleware/error-handler-middleware.js';
import {
  validateName, validateTagline, validateAbout, validateSocialLinks, validateOptionalUrl,
  validateRetentionDays, validateDpoEmail, validateAutoArchiveStaleDays, validateRejectionTemplates,
} from '../../services/employer/company-validators.js';
import { validateCultureSection } from '../../services/employer/culture-validators.js';

export const PATCHABLE_FIELDS = [
  'name', 'tagline', 'about', 'socialLinks', 'website', 'retentionDays',
  'privacyPolicyUrl', 'dpoEmail', 'logoUrl', 'rejectionEmailTemplates',
  'autoArchiveStaleDays', 'cultureSection',
];

export function buildCompanyPatch(body) {
  for (const key of Object.keys(body)) {
    if (!PATCHABLE_FIELDS.includes(key)) {
      throw new HttpError(400, `Unknown field: ${key}`, 'UNKNOWN_FIELD');
    }
  }
  const patch = {};
  if ('name' in body) patch.name = validateName(body.name);
  if ('tagline' in body) patch.tagline = validateTagline(body.tagline);
  if ('about' in body) patch.about = validateAbout(body.about);
  if ('socialLinks' in body) patch.socialLinks = validateSocialLinks(body.socialLinks);
  if ('rejectionEmailTemplates' in body) {
    patch.rejectionEmailTemplates = validateRejectionTemplates(body.rejectionEmailTemplates);
  }
  // Clear-only. Accepting an arbitrary string here would let any Owner point the
  // careers-page <img> at a URL of their choosing; a real logo can only be set by
  // uploading bytes to POST /logo below.
  if ('logoUrl' in body) {
    if (body.logoUrl != null) {
      throw new HttpError(400, 'logoUrl can only be cleared. Upload a file to set it.', 'INVALID_LOGO_URL');
    }
    patch.logoUrl = null;
    patch.logoStoragePath = null;
  }
  if ('website' in body) patch.website = validateOptionalUrl(body.website, 'INVALID_WEBSITE');
  if ('retentionDays' in body) patch.retentionDays = validateRetentionDays(body.retentionDays);
  if ('privacyPolicyUrl' in body) {
    patch.privacyPolicyUrl = validateOptionalUrl(body.privacyPolicyUrl, 'INVALID_PRIVACY_POLICY_URL');
  }
  if ('dpoEmail' in body) patch.dpoEmail = validateDpoEmail(body.dpoEmail);
  if ('autoArchiveStaleDays' in body) {
    patch.autoArchiveStaleDays = validateAutoArchiveStaleDays(body.autoArchiveStaleDays);
  }
  // The editor always sends the WHOLE section, so an omitted benefit means the
  // employer removed it. null legitimately means "clear the section entirely".
  if ('cultureSection' in body) patch.cultureSection = validateCultureSection(body.cultureSection);
  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, 'No valid fields to update', 'EMPTY_PATCH');
  }
  return patch;
}
