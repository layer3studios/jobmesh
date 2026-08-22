'use client';
// FILE: src/components/apply/ApplyProgress.tsx
// The slim completion bar pinned to the top of the apply form card.
//
// INFORMATIONAL ONLY. Nothing here gates submit — `canSubmit` in ApplyFormClient
// is the sole authority on that, and it does not read this component's state.
// A progress indicator that can disagree with the submit button is worse than no
// indicator at all, so this one is deliberately incapable of blocking anything.
//
// The caller decides WHEN the numbers move (on blur/change, never per keystroke).
// This component just renders whatever it is handed.

/** The floor the bar is drawn at before a single section is complete. */
const ENDOWED_PROGRESS_PERCENT = 15;

export interface ApplySection {
  /** Used only as a React key / for debugging — the label is not rendered. */
  id: string;
  complete: boolean;
}

interface Props {
  sections: ApplySection[];
}

export default function ApplyProgress({ sections }: Props) {
  const total = sections.length;
  const complete = sections.filter((section) => section.complete).length;

  // Never "0 of 4". An empty bar reads as "you have done nothing and there is a
  // lot left"; a bar already off the floor reads as "you have started" — the
  // endowed progress effect. Arriving at a form is itself the first step, so the
  // bar is drawn at 15% and the count is withheld until there is a count worth
  // showing. The ARIA value stays truthful at 0 regardless: we are allowed to
  // frame the visual, not to lie to a screen reader about the real number.
  const started = complete >= 1;
  const percent = started ? Math.round((complete / total) * 100) : ENDOWED_PROGRESS_PERCENT;
  const label = started ? `${complete} of ${total} sections complete` : 'Just getting started';

  return (
    <div>
      <div
        className="apply-progress-track"
        role="progressbar"
        aria-valuenow={complete}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Application progress"
      >
        <div className="apply-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      {/* polite, not assertive: this updates while the candidate is moving
          between fields, and an assertive region would interrupt them. */}
      <p className="apply-progress-label" aria-live="polite">{label}</p>
    </div>
  );
}
