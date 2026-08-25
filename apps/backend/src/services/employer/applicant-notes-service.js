// FILE: src/services/employer/applicant-notes-service.js
// Employer notes on an applicant (C3). Append-only: create + list, no edit or delete.
// Notes are plain text (R3) — control characters are stripped and "<script" is refused
// outright, matching validatePostingDescription.
//
// AUTHOR NAME: STORED, BUT DISPLAYED LIVE. The name and email are still snapshot onto
// the note at write time (D7/R2) and the stored row is never rewritten — the document
// remains immutable history. What changed is the READ: listing resolves the author's
// current name from employer_users and prefers it, falling back to the snapshot when
// that user is gone from the roster.
//
// The reason is that the snapshot was solving the wrong problem. "Immutable history"
// protects what was SAID; a display name is not a fact about the note, it is a pointer
// to a person, and a teammate who married or fixed a typo in their name had every note
// they ever wrote attributed to a name nobody recognises. The id was always stored, so
// the live name is the accurate one; the snapshot is the fallback for authors who have
// left, which is the only case where history genuinely is the best we have.
//
// companyId always arrives from req.employerCompanyId, never from input (§6.5). The
// application is re-fetched company-scoped here as defence-in-depth: the route already
// tenant-verifies it via requireEmployerApplicant, but the service refuses to trust that.

import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getApplicationForCompany } from '../../models/public/application-model.js';
import { getEmployerUserById, mapEmployerUsersById } from '../../models/employer/employer-user-model.js';
import {
  createApplicantNote, listApplicantNotesForApplication, toPublicApplicantNote,
} from '../../models/public/applicant-note-model.js';
import { resolveMentionedMemberIds, notifyMentionedMembers } from './note-mention-service.js';

const MINIMUM_BODY_LENGTH = 1;
const MAXIMUM_BODY_LENGTH = 4000;
const SCRIPT_PATTERN = /<script/i;
// Control chars except tab (\t = \x09) and newline (\n = \x0A) — same set as posting-validators.
const CONTROL_CHARACTERS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Note body: plain text, 1-4000 chars. Control chars are stripped BEFORE the length
 * check so an invisible-padded body cannot buy extra length, then trimmed. One stable
 * code for every failure (D6) — the message carries the human-readable reason.
 */
export function validateApplicantNoteBody(value) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Note body is required', 'INVALID_NOTE_BODY');
  }
  const cleaned = value.replace(CONTROL_CHARACTERS, '').trim();
  if (cleaned.length < MINIMUM_BODY_LENGTH) {
    throw new HttpError(400, 'Note cannot be empty', 'INVALID_NOTE_BODY');
  }
  if (cleaned.length > MAXIMUM_BODY_LENGTH) {
    throw new HttpError(400, 'Note must be 4000 characters or fewer', 'INVALID_NOTE_BODY');
  }
  if (SCRIPT_PATTERN.test(cleaned)) {
    throw new HttpError(400, 'Note must be plain text', 'INVALID_NOTE_BODY');
  }
  return cleaned;
}

/** The application, or 404 — cross-tenant ids are indistinguishable from missing (§6.5). */
async function requireApplicationForCompany(companyId, applicationId) {
  const application = await getApplicationForCompany(companyId, applicationId);
  if (!application) throw new HttpError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
  // Defence-in-depth (C6): the model already filtered on companyId — assert it held.
  if (application.companyId?.toString() !== companyId?.toString()) {
    throw new HttpError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
  }
  return application;
}

/**
 * Append one note to an application. The author snapshot is mandatory: a note whose
 * employer user cannot be loaded (soft-deleted, stale cookie) is refused with 401
 * rather than written with null author fields (D7).
 */
export async function createApplicantNoteForApplicant(
  companyId, applicationId, authorEmployerUserId, body, mentionedUserIds = [],
) {
  const cleanBody = validateApplicantNoteBody(body);
  const application = await requireApplicationForCompany(companyId, applicationId);

  const author = await getEmployerUserById(authorEmployerUserId);
  if (!author) throw new HttpError(401, 'Author not found', 'AUTHOR_NOT_FOUND');

  // Re-derived from the roster, never trusted from the request (see note-mention-service).
  const mentions = await resolveMentionedMemberIds(companyId, mentionedUserIds, author._id);

  const note = await createApplicantNote({
    companyId,
    applicationId: application._id,
    authorEmployerUserId: author._id,
    authorName: author.name ?? null,
    authorEmail: author.email,
    body: cleanBody,
    mentionedUserIds: mentions,
  });

  // Fire-and-forget: the note is already durable, and an email provider outage must
  // never turn a saved note into a 500. The .catch is belt-and-braces over a
  // function that already contracts never to reject.
  void notifyMentionedMembers({
    companyId,
    application,
    mentionedUserIds: mentions,
    authorName: author.name ?? author.email,
    notePreviewSource: cleanBody,
  }).catch((error) => console.warn(`[notes] mention notify failed: ${error.message}`));

  return toPublicApplicantNote(note);
}

/**
 * Overlay each note's CURRENT author name, in one batched read.
 *
 * Shared with the candidate timeline so both surfaces agree — a note showing one
 * name in the notes card and another in the timeline would be worse than a stale
 * name in both. Notes whose author has left the roster keep their snapshot, and a
 * snapshot-less legacy note still falls through to authorEmail in the UI.
 *
 * Takes and returns the CLIENT shape, so nothing here can write to the stored doc.
 */
export async function withLiveAuthorNames(publicNotes) {
  if (publicNotes.length === 0) return publicNotes;
  const authorById = await mapEmployerUsersById(
    publicNotes.map((note) => note.authorEmployerUserId),
  );
  return publicNotes.map((note) => {
    const author = authorById.get(note.authorEmployerUserId?.toString());
    // `?? note.authorName` and not `||`: an author whose name is an empty string
    // should fall back, but one who genuinely has no name field should not
    // resurrect a stale snapshot either — both land on the email in the UI.
    return author ? { ...note, authorName: author.name ?? note.authorName } : note;
  });
}

/** An application's notes, newest first, in the client shape. */
export async function listApplicantNotesForApplicant(companyId, applicationId) {
  const notes = await listApplicantNotesForApplication(companyId, applicationId);
  return withLiveAuthorNames(notes.map(toPublicApplicantNote));
}
