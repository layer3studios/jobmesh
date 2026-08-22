// FILE: src/components/apply/assignment-draft.ts
// Local draft persistence for the take-home submission fields. Pure module — no
// React, no network — so the TTL and version rules are unit-testable on their own.
//
// PII WARNING. A draft contains the candidate's email, phone and free-text notes,
// sitting in localStorage on a possibly shared machine. It is therefore cleared
// on a successful submit and on "Start over" (see ApplyFormClient). Nothing else
// may widen what is stored here without revisiting that.
//
// FAIL-SOFT CONTRACT (rule 8). Private browsing, exhausted quota and some embedded
// webviews throw on getItem/setItem — not return null, THROW. Every access below is
// wrapped: reads degrade to "no draft", writes silently no-op. The form must behave
// identically when storage is unavailable, and must never surface a storage error.

/**
 * Drafts live 7 days. This MUST equal STAGING_TTL_MS in the backend's
 * src/services/public/assignment-storage-service.js — that file carries the mirror
 * of this comment. If you change one number, change the other.
 *
 * WHY THERE IS NO RESTORE-TIME FILE VALIDATION.
 * Because the two TTLs are equal, a draft young enough to restore mathematically
 * implies its staged files are young enough to still exist on the backend. The only
 * surviving window is a submit that lands exactly on the 7-day boundary, and the
 * backend's STAGED_FILES_EXPIRED response — which names the dead files — covers
 * precisely that case. There is no validation endpoint to call, and building one for
 * that window would be over-engineering. Do NOT add a round-trip here.
 */
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Bump the suffix to invalidate every draft in the wild when the shape changes. */
const DRAFT_KEY_PREFIX = 'jm_apply_draft_v1_';

export interface DraftFileEntry {
  fileId: string;
  /**
   * Kept so a restore can say WHICH files expired by name. A fileId is an opaque
   * signed token — showing one to a candidate is useless.
   */
  originalName: string;
}

export interface DraftFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coverNote: string;
  links: string[];
  github: string;
  linkedin: string;
  notes: string;
}

export interface DraftPayload {
  savedAt: number;
  /**
   * The assignment the draft was written AGAINST. An employer can swap the task on
   * a live posting, and links/files/notes written for the old one are answers to a
   * question that no longer exists — restoring them silently would hand the
   * candidate a submission that reads as wrong work. The restore path compares this
   * and drops the submission half on a mismatch (contact details survive).
   */
  assignmentId: string;
  fields: DraftFields;
  files: DraftFileEntry[];
}

/** Draft key for one posting. Versioned and per-posting — drafts never cross jobs. */
export function draftKey(jobId: string): string {
  return `${DRAFT_KEY_PREFIX}${jobId}`;
}

function isDraftPayload(value: unknown): value is DraftPayload {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<DraftPayload>;
  // assignmentId is REQUIRED, so a draft written before it existed is treated as
  // unreadable rather than restored with an unknown provenance. Nothing has shipped
  // under the v1 key yet, so this discards nothing real.
  return typeof draft.savedAt === 'number'
    && typeof draft.assignmentId === 'string'
    && !!draft.fields && typeof draft.fields === 'object'
    && Array.isArray(draft.files);
}

/**
 * Read the draft for a posting. Returns null when absent, unreadable, unparseable,
 * the wrong shape, or older than DRAFT_TTL_MS. Never throws.
 */
export function readDraft(jobId: string, now: number = Date.now()): DraftPayload | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(draftKey(jobId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isDraftPayload(parsed)) return null;
    if (now - parsed.savedAt > DRAFT_TTL_MS) {
      // Expired drafts are dropped eagerly — they are PII we no longer have a
      // reason to hold, and the staged files behind them are gone too.
      clearDraft(jobId);
      return null;
    }
    return {
      savedAt: parsed.savedAt,
      assignmentId: parsed.assignmentId,
      fields: parsed.fields,
      files: parsed.files.filter(
        (file) => file && typeof file.fileId === 'string' && typeof file.originalName === 'string',
      ),
    };
  } catch {
    return null; // storage unavailable or corrupt — behave as "no draft"
  }
}

/** Persist a draft. Silently no-ops when storage is unavailable or full. */
export function writeDraft(
  jobId: string,
  payload: Omit<DraftPayload, 'savedAt'>,
  now: number = Date.now(),
): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(draftKey(jobId), JSON.stringify({ savedAt: now, ...payload }));
  } catch {
    // Quota exhausted or storage blocked. Losing a draft is acceptable; showing the
    // candidate a storage error mid-application is not.
  }
}

/** Remove the draft (successful submit, or "Start over"). Never throws. */
export function clearDraft(jobId: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(draftKey(jobId));
  } catch {
    // nothing to do — the draft either never existed or is unreachable
  }
}
