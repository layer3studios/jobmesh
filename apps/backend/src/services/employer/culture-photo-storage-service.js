// FILE: src/services/employer/culture-photo-storage-service.js
// Local-disk storage for careers-page culture photos, mirroring
// logo-storage-service.js: bytes land in {backendRoot}/data/culture-photos/{uuid}.{ext}
// under a random filename and the DB stores the relative path only.
//
// Unlike a logo there can be several per company, so the stored VALUE is a pair —
// the public read URL the careers page renders, and the disk path we delete by.
// Keeping both means removing a photo never has to guess which file it owned.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { HttpError } from '../../middleware/error-handler-middleware.js';

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PHOTO_DIR = path.join(BACKEND_ROOT, 'data', 'culture-photos');
const PHOTO_REL = path.posix.join('data', 'culture-photos');

export const MAXIMUM_CULTURE_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAXIMUM_CULTURE_PHOTOS = 4;

// Extension comes from the mime type, never the uploaded filename — that is
// attacker-controlled and is not stored at all.
const EXTENSION_BY_MIME = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
});

export const ALLOWED_CULTURE_PHOTO_MIME_TYPES = Object.freeze(Object.keys(EXTENSION_BY_MIME));

const MIME_BY_EXTENSION = Object.freeze({ png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' });

/**
 * The PUBLIC read URL for one photo. Keyed by the file's own uuid rather than by
 * company: the careers page is unauthenticated and has no session to resolve a
 * company from, and a per-file key means reordering or removing one photo never
 * changes another's URL (so browser caches stay valid).
 */
export function publicCulturePhotoUrlFor(fileName) {
  return `/api/public/culture-photo/${encodeURIComponent(fileName)}`;
}

/** Create data/culture-photos/ if missing. Called on boot and before every write. */
export function ensureCulturePhotoDirectory() {
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
}

/**
 * Validate then write one photo. Validation runs BEFORE any disk write so a
 * rejected upload never leaves bytes behind. Throws HttpError with a stable code.
 */
export function storeCulturePhotoFile(buffer, mimeType) {
  if (!buffer || buffer.length === 0) {
    throw new HttpError(400, 'A photo file is required.', 'NO_FILE');
  }
  const extension = EXTENSION_BY_MIME[mimeType];
  if (!extension) {
    throw new HttpError(400, 'Photos must be PNG, JPG or WebP.', 'INVALID_FILE_TYPE');
  }
  if (buffer.length > MAXIMUM_CULTURE_PHOTO_BYTES) {
    throw new HttpError(400, 'Each photo must be 5MB or smaller.', 'FILE_TOO_LARGE');
  }

  ensureCulturePhotoDirectory();
  const fileName = `${crypto.randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(PHOTO_DIR, fileName), buffer);
  return {
    fileName,
    url: publicCulturePhotoUrlFor(fileName),
    storagePath: path.posix.join(PHOTO_REL, fileName),
    sizeBytes: buffer.length,
  };
}

/**
 * True when a name is a plain stored filename. The read route takes this from the
 * URL, so it is the containment check that stops `../../.env` from turning a photo
 * route into an arbitrary-file reader.
 */
export function isValidCulturePhotoName(fileName) {
  return typeof fileName === 'string' && /^[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(fileName);
}

/** Content-Type for a stored photo name, or null when the extension is unknown. */
export function contentTypeForCulturePhoto(fileName) {
  const extension = path.extname(String(fileName ?? '')).replace('.', '').toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? null;
}

/** Read one photo's bytes. Returns null when missing or out of bounds. */
export function readCulturePhotoFile(fileName) {
  if (!isValidCulturePhotoName(fileName)) return null;
  try {
    return fs.readFileSync(path.join(PHOTO_DIR, fileName));
  } catch {
    return null; // deleted by hand — the careers page simply skips the image
  }
}

/** Best-effort delete, used when a photo is removed from the culture section. */
export function deleteCulturePhotoFile(fileName) {
  if (!isValidCulturePhotoName(fileName)) return;
  try {
    fs.unlinkSync(path.join(PHOTO_DIR, fileName));
  } catch { /* already gone — nothing to clean up */ }
}

/** The stored filename inside a public culture-photo URL, or null. */
export function fileNameFromPublicUrl(url) {
  const match = /\/api\/public\/culture-photo\/([^/?#]+)$/.exec(String(url ?? ''));
  if (!match) return null;
  const fileName = decodeURIComponent(match[1]);
  return isValidCulturePhotoName(fileName) ? fileName : null;
}
