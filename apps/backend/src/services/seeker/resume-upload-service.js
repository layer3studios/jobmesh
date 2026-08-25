// FILE: src/services/seeker/resume-upload-service.js
// Enqueues a resume for async parsing (F1). SHA-256 dedup stays synchronous and
// cheap: an unchanged hash short-circuits to the stored profile with no queue work
// ({ jobId: null }). Otherwise the PDF buffer is written to a short-lived temp file
// (text is kept inline) and a queued job is inserted — the endpoint returns a jobId
// in <500ms and the worker (resume-parse-worker.js) does the 30-40s parse off-band.

import crypto from 'crypto';
import { getProfileForUser, getResumeHashForUser } from '../../models/seeker/seeker-profile-helpers.js';
import { insertResumeParseJob } from '../../models/seeker/resume-parse-job-model.js';
import { writeTmpPdf } from './resume-tmp-storage.js';
import { storeSeekerResume, deleteSeekerResume } from './seeker-resume-storage.js';
import { setSeekerResumeFile } from '../../models/seeker/seeker-resume-file-model.js';

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/** Fast-path dedup: return the stored profile when the hash is unchanged, else null. */
async function dedupProfile(userId, hash) {
  const previousHash = await getResumeHashForUser(userId);
  if (previousHash && previousHash === hash) {
    return { profile: await getProfileForUser(userId), isUnchanged: true, jobId: null };
  }
  return null;
}

/**
 * Store this upload as the seeker's current resume and unlink the one it replaced.
 * Never throws — retention is a convenience for the public profile, not a
 * precondition for parsing.
 */
async function retainResumePdf(userId, buffer) {
  try {
    const previous = await setSeekerResumeFile(userId, storeSeekerResume(buffer));
    if (previous?.storagePath) deleteSeekerResume(previous.storagePath);
  } catch (error) {
    console.warn('[seeker-resume] could not retain PDF:', error.message);
  }
}

/** Enqueue a PDF resume for parsing. Returns { jobId, status } or a dedup fast path. */
export async function processResumeUpload(userId, buffer) {
  const hash = sha256(buffer);
  const unchanged = await dedupProfile(userId, hash);
  if (unchanged) return unchanged;

  // Retain the PDF itself so the shareable public profile can serve it (the parse
  // pipeline's temp copy is deleted the moment the worker finishes). Best-effort:
  // an unwritable disk must not block a resume from being parsed.
  await retainResumePdf(userId, buffer);

  const tmpPath = writeTmpPdf(buffer);
  const job = await insertResumeParseJob({ userId, source: 'pdf', tmpPath, fileHash: hash });
  return { jobId: job._id.toString(), status: 'queued' };
}

/** Enqueue pasted resume text for parsing. Returns { jobId, status } or a dedup fast path. */
export async function processResumeText(userId, text) {
  const hash = sha256(Buffer.from(text, 'utf8'));
  const unchanged = await dedupProfile(userId, hash);
  if (unchanged) return unchanged;

  const job = await insertResumeParseJob({ userId, source: 'text', resumeText: text, fileHash: hash });
  return { jobId: job._id.toString(), status: 'queued' };
}

export default processResumeUpload;
