// FILE: src/components/employer/jobs/parts/assignment-section-helpers.ts
// Pure logic for the posting form's assignment section: when a confirm is owed,
// and exactly what it says. Kept separate from the components so the rules are
// unit-testable and so the copy lives in one place rather than inline in JSX.

export interface ConfirmContext {
  /** False on the create form, where there is no posting and no applicants yet. */
  isEdit: boolean;
  applicationCount: number;
  /** The assignment currently attached, or null. */
  currentId: string | null;
  /** What the employer just chose. null means detach. */
  nextId: string | null;
}

/**
 * Whether changing the attachment owes the employer a confirm.
 *
 * A dialog is only worth the interruption when there is something to protect —
 * people who have already applied. Everything else applies straight away:
 *
 *   create        no posting exists yet, so nobody can have applied to it
 *   0 applicants  nothing to disturb; a dialog here is noise that teaches people
 *                 to dismiss dialogs without reading them
 *   unchanged     re-picking the same assignment is not a change at all
 */
export function needsConfirm({ isEdit, applicationCount, currentId, nextId }: ConfirmContext): boolean {
  if (!isEdit) return false;
  if (applicationCount <= 0) return false;
  if (currentId === nextId) return false;
  // Reaching here means an edit, with applicants, that genuinely changes the task:
  // a swap (both ids set), a first attach, or a detach (nextId null).
  return true;
}

/** "1 person has applied" / "7 people have applied" — subject AND verb agree. */
export function applicantPhrase(count: number): string {
  return count === 1 ? '1 person has applied' : `${count} people have applied`;
}

export interface ConfirmCopy {
  title: string;
  body: string;
  confirmLabel: string;
}

/**
 * Swap copy. Names both tasks and the count, because a generic "Are you sure?"
 * gives the employer nothing to decide with — the whole question is *which* task
 * and *how many people* are affected.
 *
 * It also states the outcome plainly: existing submissions keep the task they were
 * written against. That is true (the snapshot is taken at apply time) and it is the
 * single fact that turns this from a scary decision into an ordinary one.
 */
export function buildSwapCopy({ currentTitle, nextTitle, applicationCount }: {
  currentTitle: string;
  nextTitle: string;
  applicationCount: number;
}): ConfirmCopy {
  return {
    title: 'Change the assignment on this posting?',
    body: `${applicantPhrase(applicationCount)} with “${currentTitle}”. Their submissions keep that task `
      + `and stay reviewable. New applicants will see “${nextTitle}”.`,
    // The button says the ACTION. "Confirm" makes the reader re-read the title to
    // find out what they are agreeing to.
    confirmLabel: 'Change assignment',
  };
}

/**
 * Detach copy. Detaching is NOT destructive and the words have to carry that:
 * submissions live on the applications themselves, so past candidates stay
 * reviewable forever. An employer who thinks this deletes work will avoid a
 * reversible action they should feel free to take.
 */
export function buildDetachCopy({ currentTitle, applicationCount }: {
  currentTitle: string;
  applicationCount: number;
}): ConfirmCopy {
  return {
    title: 'Remove the assignment from this posting?',
    body: `${applicantPhrase(applicationCount)} with “${currentTitle}”. Existing submissions stay reviewable. `
      + 'New applicants will see the plain apply form.',
    confirmLabel: 'Remove assignment',
  };
}

/** Pick the right copy for the pending change. */
export function buildConfirmCopy({ currentTitle, nextTitle, applicationCount }: {
  currentTitle: string;
  nextTitle: string | null;
  applicationCount: number;
}): ConfirmCopy {
  return nextTitle === null
    ? buildDetachCopy({ currentTitle, applicationCount })
    : buildSwapCopy({ currentTitle, nextTitle, applicationCount });
}
