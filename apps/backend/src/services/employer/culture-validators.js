// FILE: src/services/employer/culture-validators.js
// Validation for the careers-page culture section (headline, description,
// benefits, photos). Split out of company-validators.js, which was over the
// 200-line cap: this is one self-contained concern with its own limits, and the
// two files change for entirely different reasons.

import { HttpError } from '../../middleware/error-handler-middleware.js';

// ─── Careers-page culture section ─────────────────────────────────
const MAXIMUM_CULTURE_HEADLINE_LENGTH = 80;
const MAXIMUM_CULTURE_DESCRIPTION_LENGTH = 1000;
const MAXIMUM_BENEFITS = 8;
const MAXIMUM_BENEFIT_ICON_LENGTH = 30;
const MAXIMUM_BENEFIT_TITLE_LENGTH = 50;
const MAXIMUM_BENEFIT_DESCRIPTION_LENGTH = 150;
const MAXIMUM_CULTURE_PHOTOS = 4;

const invalidCulture = (message) => new HttpError(400, message, 'INVALID_CULTURE_SECTION');

/** Optional trimmed string with a cap. Blank collapses to null. */
function optionalText(value, maximumLength, label) {
  if (value == null) return null;
  if (typeof value !== 'string') throw invalidCulture(`${label} must be text`);
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (trimmed.length > maximumLength) {
    throw invalidCulture(`${label} must be ${maximumLength} characters or fewer`);
  }
  return trimmed;
}

/**
 * One benefit row. `title` is the only required part: an employer who types
 * "Health insurance" with no icon and no blurb has still said something useful,
 * and demanding the other two would push them to pad it with noise.
 */
function validateBenefit(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw invalidCulture('Each benefit must be an object');
  }
  const title = optionalText(raw.title, MAXIMUM_BENEFIT_TITLE_LENGTH, 'A benefit title');
  if (title == null) throw invalidCulture('Every benefit needs a title');
  return {
    icon: optionalText(raw.icon, MAXIMUM_BENEFIT_ICON_LENGTH, 'A benefit icon'),
    title,
    description: optionalText(raw.description, MAXIMUM_BENEFIT_DESCRIPTION_LENGTH, 'A benefit description'),
  };
}

/**
 * Photo URLs. These are only ever OUR OWN read URLs, minted by the upload
 * endpoint — an arbitrary URL is rejected rather than stored, so the careers page
 * can never be made to hotlink a third-party image (or a tracking pixel) by
 * PATCHing a crafted string.
 */
function validatePhotoUrls(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw invalidCulture('photoUrls must be a list');
  if (value.length > MAXIMUM_CULTURE_PHOTOS) {
    throw invalidCulture(`You can add up to ${MAXIMUM_CULTURE_PHOTOS} photos`);
  }
  return value.map((url) => {
    if (typeof url !== 'string' || !/^\/api\/public\/culture-photo\/[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(url)) {
      throw invalidCulture('Photos must be uploaded through the photo endpoint');
    }
    return url;
  });
}

/**
 * The whole culture section. Returns null when every part is empty, so the careers
 * page tests one value instead of four — "partially filled in" renders whatever
 * exists, but "filled in with nothing" is the same as never having set it.
 */
export function validateCultureSection(value) {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw invalidCulture('cultureSection must be an object');
  }

  const benefitsInput = value.benefits;
  if (benefitsInput != null && !Array.isArray(benefitsInput)) {
    throw invalidCulture('benefits must be a list');
  }
  if (Array.isArray(benefitsInput) && benefitsInput.length > MAXIMUM_BENEFITS) {
    throw invalidCulture(`You can add up to ${MAXIMUM_BENEFITS} benefits`);
  }

  const section = {
    headline: optionalText(value.headline, MAXIMUM_CULTURE_HEADLINE_LENGTH, 'The headline'),
    description: optionalText(value.description, MAXIMUM_CULTURE_DESCRIPTION_LENGTH, 'The description'),
    benefits: (benefitsInput ?? []).map(validateBenefit),
    photoUrls: validatePhotoUrls(value.photoUrls),
  };

  const isEmpty = section.headline == null && section.description == null
    && section.benefits.length === 0 && section.photoUrls.length === 0;
  return isEmpty ? null : section;
}
