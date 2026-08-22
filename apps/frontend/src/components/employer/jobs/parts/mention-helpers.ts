// FILE: src/components/employer/jobs/parts/mention-helpers.ts
// Pure text mechanics behind @mentions in applicant notes. No React, no I/O.
//
// THE BODY IS THE SOURCE OF TRUTH. A note stores plain text plus a list of user ids,
// and the two are kept honest by re-deriving the ids from the text after every edit
// (pruneMentions). That is why deleting "@Priya" from the draft also un-mentions
// her: nothing tracks a mention as a separate object that could drift from what the
// author can actually see.
//
// Mentions are written as "@Full Name" — the same string a human would type — so a
// note read anywhere else (an export, an email, a DB dump) still reads correctly.

/** A teammate as far as mentions are concerned: an id and the name that spells it. */
export interface MentionCandidate {
  employerUserId: string;
  name: string;
}

export interface ActiveMentionQuery {
  /** Index of the '@' that opened this query. */
  start: number;
  /** Text typed after the '@', up to the caret. */
  query: string;
}

// Long enough for "@Alexandra Fitzwilliam", short enough that an email address or a
// stray '@' in prose stops matching well before the dropdown gets silly.
const MAXIMUM_QUERY_LENGTH = 30;
const MAXIMUM_SUGGESTIONS = 5;

/**
 * The @query the caret currently sits inside, or null.
 *
 * Returns null when the '@' is glued to the end of a word (so "user@example.com"
 * never opens the picker), when a newline intervenes, or when the run is too long
 * to be a name.
 */
export function findActiveMentionQuery(text: string, caret: number): ActiveMentionQuery | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at === -1) return null;

  const preceding = at > 0 ? before[at - 1] : '';
  if (preceding && !/[\s(]/.test(preceding)) return null;

  const query = before.slice(at + 1);
  if (query.length > MAXIMUM_QUERY_LENGTH || /[\n@]/.test(query)) return null;
  return { start: at, query };
}

/** Up to 5 teammates whose name contains the query, case-insensitively. */
export function filterMentionCandidates(
  candidates: MentionCandidate[],
  query: string,
): MentionCandidate[] {
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? candidates.filter((candidate) => candidate.name.toLowerCase().includes(needle))
    : candidates;
  return matches.slice(0, MAXIMUM_SUGGESTIONS);
}

/**
 * Replace the in-progress "@que" with "@Full Name " and report where the caret
 * should land — after the trailing space, so the author keeps typing prose.
 */
export function insertMention(
  text: string, active: ActiveMentionQuery, candidate: MentionCandidate,
): { text: string; caret: number } {
  const head = text.slice(0, active.start);
  const tail = text.slice(active.start + 1 + active.query.length);
  const token = `@${candidate.name} `;
  return { text: `${head}${token}${tail}`, caret: head.length + token.length };
}

/** Does "@Name" appear in the body as a whole token (not as part of a longer name)? */
function bodyMentions(body: string, name: string): boolean {
  const index = body.indexOf(`@${name}`);
  if (index === -1) return false;
  const after = body[index + name.length + 1];
  // A following letter would mean we matched "@Sam" inside "@Samantha".
  return after === undefined || !/[\p{L}\p{N}]/u.test(after);
}

/**
 * Keep only the ids whose name is still written in the body. Called after every
 * keystroke, which is what makes "delete the text, lose the mention" work without
 * any special-cased backspace handling.
 */
export function pruneMentions(
  body: string, mentionedUserIds: string[], candidates: MentionCandidate[],
): string[] {
  const nameById = new Map(candidates.map((c) => [c.employerUserId, c.name]));
  return mentionedUserIds.filter((id) => {
    const name = nameById.get(id);
    return Boolean(name) && bodyMentions(body, name!);
  });
}

export interface NoteSegment {
  text: string;
  isMention: boolean;
}

/**
 * Split a saved note body into plain and mention runs for rendering.
 *
 * Only names in `candidates` highlight. A teammate removed from the company after
 * being mentioned is not in that list, so their "@Name" renders as ordinary text —
 * the note still reads exactly as written, it just stops pointing at a person who
 * is no longer there. Longest names first so "@Sam Ali" wins over "@Sam".
 */
export function splitNoteBody(body: string, candidates: MentionCandidate[]): NoteSegment[] {
  const names = candidates.map((c) => c.name).filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (names.length === 0) return [{ text: body, isMention: false }];

  const segments: NoteSegment[] = [];
  let cursor = 0;
  let plainStart = 0;

  while (cursor < body.length) {
    if (body[cursor] !== '@') { cursor += 1; continue; }
    const match = names.find((name) => bodyMentions(body.slice(cursor), name) && body.startsWith(`@${name}`, cursor));
    if (!match) { cursor += 1; continue; }
    if (cursor > plainStart) segments.push({ text: body.slice(plainStart, cursor), isMention: false });
    segments.push({ text: `@${match}`, isMention: true });
    cursor += match.length + 1;
    plainStart = cursor;
  }
  if (plainStart < body.length) segments.push({ text: body.slice(plainStart), isMention: false });
  return segments;
}
