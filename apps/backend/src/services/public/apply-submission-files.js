// FILE: src/services/public/apply-submission-files.js
// Resolving a candidate's STAGED assignment uploads into committed file entries,
// plus the multipart array normaliser that feeds it. Split out of apply-service.js
// (section 2, 'split by operation').
//
// The expiry behaviour is unchanged and load-bearing: expired ids are collected
// and reported TOGETHER, naming each one, so the form can tell the candidate which
// uploads aged out instead of making them redo all of them.

import { HttpError } from '../../middleware/error-handler-middleware.js';
import { verifyStagedFileToken } from '../employer/assignment-signed-url-service.js';
import { stagedPathFor } from './assignment-storage-service.js';

const MAX_SUBMISSION_FILES = 5;

const SUBMISSION_REL = 'data/assignment-submissions';

/** Normalize a repeated multipart field or JSON array into a plain array. */
function asArray(value) {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return [value];
  }
  return [value];
}

/**
 * Resolve the seeker's staged fileIds into committed file entries.
 *
 * Expired ids are collected and reported TOGETHER, naming each one, so the form can
 * tell the candidate exactly which uploads aged out instead of making them redo all
 * of them. The storagePath written is the FINAL location — deterministic from
 * uuid+ext — even though the bytes are still in staging until after commit.
 */
function resolveStagedFiles(fileIds, now) {
  if (fileIds.length > MAX_SUBMISSION_FILES) {
    throw new HttpError(400, `You can attach at most ${MAX_SUBMISSION_FILES} files.`, 'TOO_MANY_FILES');
  }
  const files = [];
  const expiredFiles = [];

  for (const fileId of fileIds) {
    let staged;
    try {
      staged = verifyStagedFileToken(String(fileId));
    } catch (err) {
      if (err.code === 'STAGED_FILE_EXPIRED') {
        expiredFiles.push({ fileId: String(fileId), originalName: null });
        continue;
      }
      throw err; // INVALID_FILE_ID — a tampered id, not a recoverable situation
    }
    files.push({
      fileId: staged.uuid,
      originalName: staged.originalName,
      storagePath: `${SUBMISSION_REL}/${staged.uuid}.${staged.ext}`,
      stagingPath: stagedPathFor(staged.uuid, staged.ext),
      sizeBytes: staged.sizeBytes,
      mimeType: staged.mimeType,
      uploadedAt: now,
    });
  }

  if (expiredFiles.length > 0) {
    const err = new HttpError(
      400, 'Some of your uploaded files have expired. Please upload them again.', 'STAGED_FILES_EXPIRED',
    );
    err.expiredFiles = expiredFiles;
    throw err;
  }
  return files;
}

export { MAX_SUBMISSION_FILES, SUBMISSION_REL, asArray, resolveStagedFiles };
