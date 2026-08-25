// FILE: src/services/seeker/seeker-resume-storage.js
// Durable storage for a seeker's OWN resume PDF, at {backendRoot}/data/seeker-resumes/.
//
// WHY THIS EXISTS. Until now the seeker upload path deliberately kept no PDF —
// resume-tmp-storage writes a temp file, the worker parses it and deletes it, and
// only the parsed JSON survives. That was right when the PDF had no reader. The
// shareable public profile gives it one: "View resume" on /u/{slug} has to serve
// the actual document, and re-deriving a PDF from parsed JSON would hand a
// recruiter a worse copy of a document the candidate already formatted.
//
// It is retained ONE PER SEEKER: a new upload replaces the previous file on disk,
// so this never grows past one document per user, and deleting it is a single
// unlink. Bytes are never served statically — the only reader is the HMAC-signed
// public route, which additionally re-checks the profile's showResume flag.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const SEEKER_RESUME_DIR = path.join(BACKEND_ROOT, 'data', 'seeker-resumes');

/** Create data/seeker-resumes/ if missing. Called on boot. */
export function ensureSeekerResumeDirectory() {
  fs.mkdirSync(SEEKER_RESUME_DIR, { recursive: true });
}

/** Write a PDF buffer under a random filename. Returns the record stored on the user doc. */
export function storeSeekerResume(buffer, originalFilename = null) {
  ensureSeekerResumeDirectory();
  const filename = `${crypto.randomUUID()}.pdf`;
  fs.writeFileSync(path.join(SEEKER_RESUME_DIR, filename), buffer);
  return {
    storagePath: path.posix.join('data', 'seeker-resumes', filename),
    originalFilename: originalFilename || 'resume.pdf',
    sizeBytes: buffer.length,
    uploadedAt: new Date(),
  };
}

/**
 * Resolve a stored relative path to an absolute one, but ONLY when it stays inside
 * data/seeker-resumes/. Returns null otherwise, so a tampered or legacy path can
 * never walk out of the directory (mirrors resume-download-route's R5 check).
 */
export function resolveSeekerResumePath(storagePath) {
  if (typeof storagePath !== 'string' || !storagePath) return null;
  const absolute = path.resolve(BACKEND_ROOT, storagePath);
  const inside = absolute === SEEKER_RESUME_DIR || absolute.startsWith(SEEKER_RESUME_DIR + path.sep);
  return inside ? absolute : null;
}

/** Best-effort delete of a previous resume. Missing files are ignored. */
export function deleteSeekerResume(storagePath) {
  const absolute = resolveSeekerResumePath(storagePath);
  if (!absolute) return;
  try {
    fs.unlinkSync(absolute);
  } catch { /* already gone — nothing to clean up */ }
}
